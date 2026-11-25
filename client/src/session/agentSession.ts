import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface AgentSessionAction {
  id: string;
  tool: string;
  detail: string;
  status: 'running' | 'completed' | 'denied';
  timestamp: string;
}

export interface AgentSessionState {
  agent: string;
  conversationId: string;
  status: 'idle' | 'running' | 'awaiting_approval';
  model: string;
  stepCount: number;
  currentTask: string;
  currentTool?: string;
  currentCommand?: string;
  workspace?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheTokens?: number;
  lastActive: string;
  recentActions: AgentSessionAction[];
  gitStatus?: {
    hasChanges: boolean;
    uncommittedCount: number;
    unpushedCommitsCount: number;
    suggestedPushCommand: string;
    branch?: string;
  };
}

export class AgentSessionMonitor {
  private lastHookAction: {
    tool: string;
    command: string;
    cwd: string;
    conversationId?: string;
    timestamp: number;
  } | null = null;
  private pendingApproval: boolean = false;
  private recentHookActions: AgentSessionAction[] = [];

  constructor() {}

  /**
   * Called by IPC localServer when a hook request is initiated
   */
  recordHookStart(data: { tool: string; command: string; cwd: string; conversationId?: string }) {
    this.lastHookAction = {
      ...data,
      timestamp: Date.now(),
    };
    this.pendingApproval = true;

    const action: AgentSessionAction = {
      id: Math.random().toString(36).substring(2, 9),
      tool: data.tool,
      detail: data.command || data.cwd,
      status: 'running',
      timestamp: new Date().toISOString(),
    };

    this.recentHookActions = [action, ...this.recentHookActions.slice(0, 9)];
  }

  /**
   * Called when a permission decision is made
   */
  recordHookDecision(decision: 'allow' | 'deny') {
    this.pendingApproval = false;
    if (this.recentHookActions.length > 0) {
      this.recentHookActions[0].status = decision === 'allow' ? 'completed' : 'denied';
    }
  }

  /**
   * Discovers the active/newest Antigravity conversation directory in ~/.gemini/antigravity/brain
   */
  private findLatestConversationDir(): { dirPath: string; id: string } | null {
    try {
      const brainDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
      if (!fs.existsSync(brainDir)) return null;

      const entries = fs.readdirSync(brainDir, { withFileTypes: true });
      const dirsWithLogs = entries
        .filter((e) => e.isDirectory() && e.name !== 'tempmediaStorage' && !e.name.startsWith('.'))
        .map((e) => {
          const logFile = path.join(brainDir, e.name, '.system_generated', 'logs', 'transcript.jsonl');
          if (fs.existsSync(logFile)) {
            try {
              const stat = fs.statSync(logFile);
              return { id: e.name, dirPath: path.join(brainDir, e.name), mtime: stat.mtimeMs };
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter(Boolean) as { id: string; dirPath: string; mtime: number }[];

      if (dirsWithLogs.length === 0) return null;

      dirsWithLogs.sort((a, b) => b.mtime - a.mtime);
      return dirsWithLogs[0];
    } catch {
      return null;
    }
  }

  /**
   * Scans the latest conversation transcript to extract live telemetry
   */
  async getSessionState(): Promise<AgentSessionState> {
    const latestConv = this.findLatestConversationDir();
    const now = Date.now();

    const fallback: AgentSessionState = {
      agent: 'antigravity',
      conversationId: this.lastHookAction?.conversationId || latestConv?.id || 'idle',
      status: this.pendingApproval ? 'awaiting_approval' : 'idle',
      model: 'gemini-3.8-flash-high',
      stepCount: 0,
      currentTask: 'Waiting for agent task...',
      workspace: this.lastHookAction?.cwd || process.cwd(),
      lastActive: new Date().toISOString(),
      recentActions: this.recentHookActions,
    };

    if (!latestConv) return fallback;

    const logPath = path.join(latestConv.dirPath, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(logPath)) return fallback;

    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length === 0) return fallback;

      let lastModel = 'gemini-3.8-flash-high';
      let lastStepIndex = lines.length;
      let lastUserPrompt = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheTokens = 0;
      let lastEntryTime = 0;

      const actionsFromLog: AgentSessionAction[] = [];

      // Scan backwards through the last 40 lines for context
      const sample = lines.slice(-40);
      for (const line of sample) {
        try {
          const entry = JSON.parse(line);
          if (entry.step_index) lastStepIndex = Math.max(lastStepIndex, entry.step_index);
          if (entry.model) lastModel = entry.model;
          if (entry.input_tokens) inputTokens = entry.input_tokens;
          if (entry.output_tokens) outputTokens = entry.output_tokens;
          if (entry.cache_read_tokens) cacheTokens = entry.cache_read_tokens;
          if (entry.created_at) {
            const t = new Date(entry.created_at).getTime();
            if (t > lastEntryTime) lastEntryTime = t;
          }

          // Extract user prompt
          if (entry.type === 'USER_INPUT' && entry.content) {
            const rawContent = String(entry.content);
            const match = rawContent.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
            lastUserPrompt = match ? match[1].trim() : rawContent.slice(0, 150).trim();
          }

          // Extract tool calls
          if (Array.isArray(entry.tool_calls)) {
            for (const call of entry.tool_calls) {
              const detail =
                call.args?.CommandLine ||
                call.args?.Path ||
                call.args?.query ||
                call.args?.focus ||
                JSON.stringify(call.args || {}).slice(0, 80);

              actionsFromLog.unshift({
                id: Math.random().toString(36).substring(2, 9),
                tool: call.name,
                detail: String(detail).replace(/^"|"$/g, ''),
                status: 'completed',
                timestamp: entry.created_at || new Date().toISOString(),
              });
            }
          }
        } catch {}
      }

      // Determine running status
      const timeSinceLastAction = now - Math.max(lastEntryTime, this.lastHookAction?.timestamp || 0);
      let status: 'idle' | 'running' | 'awaiting_approval' = 'idle';

      if (this.pendingApproval) {
        status = 'awaiting_approval';
      } else if (timeSinceLastAction < 20000) {
        // Active within last 20 seconds
        status = 'running';
      }

      // Combine hook actions and transcript actions
      const combinedActions = [...this.recentHookActions, ...actionsFromLog].slice(0, 8);
      const activeWorkspace = this.lastHookAction?.cwd || process.cwd();
      const gitStatus = await this.checkGitStatus(activeWorkspace, lastUserPrompt);

      return {
        agent: 'antigravity',
        conversationId: latestConv.id,
        status,
        model: lastModel,
        stepCount: lastStepIndex,
        currentTask: lastUserPrompt || 'Working on codebase tasks...',
        currentTool: this.lastHookAction?.tool,
        currentCommand: this.lastHookAction?.command,
        workspace: activeWorkspace,
        inputTokens,
        outputTokens,
        cacheTokens,
        lastActive: new Date(Math.max(lastEntryTime, this.lastHookAction?.timestamp || now)).toISOString(),
        recentActions: combinedActions,
        gitStatus,
      };
    } catch (err: any) {
      console.warn('[AgentSession] Error parsing transcript:', err.message);
      return fallback;
    }
  }

  private async checkGitStatus(workspace: string, lastTask: string) {
    try {
      const { stdout: statusOut } = await execPromise('git status --porcelain', { cwd: workspace, timeout: 3000 });
      const changedLines = statusOut.trim().split('\n').filter(Boolean);
      const hasChanges = changedLines.length > 0;

      let branch = 'main';
      try {
        const { stdout: branchOut } = await execPromise('git branch --show-current', { cwd: workspace, timeout: 2000 });
        branch = branchOut.trim() || 'main';
      } catch {}

      let unpushedCount = 0;
      try {
        const { stdout: logOut } = await execPromise('git log @{u}..HEAD --oneline', { cwd: workspace, timeout: 2000 });
        unpushedCount = logOut.trim().split('\n').filter(Boolean).length;
      } catch {}

      const cleanMsg = (lastTask || 'feat: updates from OverWatch')
        .replace(/["`\\]/g, '')
        .slice(0, 48)
        .trim();

      return {
        hasChanges: hasChanges || unpushedCount > 0,
        uncommittedCount: changedLines.length,
        unpushedCommitsCount: unpushedCount,
        suggestedPushCommand: `git add -A; git commit -m "${cleanMsg}"; git push origin ${branch}`,
        branch,
      };
    } catch {
      return {
        hasChanges: false,
        uncommittedCount: 0,
        unpushedCommitsCount: 0,
        suggestedPushCommand: 'git push origin main',
        branch: 'main',
      };
    }
  }
}

export const agentSessionMonitor = new AgentSessionMonitor();
