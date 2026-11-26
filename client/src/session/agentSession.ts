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
  workspaceName?: string;
  sessions?: AgentSessionState[];
  activeSessionIndex?: number;
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
   * Discovers active Antigravity conversation directories in ~/.gemini/antigravity/brain
   */
  private findActiveConversationDirs(limit: number = 6): { dirPath: string; id: string; mtime: number }[] {
    try {
      const brainDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
      if (!fs.existsSync(brainDir)) return [];

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

      if (dirsWithLogs.length === 0) return [];
      dirsWithLogs.sort((a, b) => b.mtime - a.mtime);
      return dirsWithLogs.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Parses an individual conversation transcript to extract its session state
   */
  private async parseConversation(conv: { dirPath: string; id: string; mtime: number }): Promise<AgentSessionState | null> {
    const logPath = path.join(conv.dirPath, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(logPath)) return null;

    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length === 0) return null;

      let lastModel = 'gemini-3.8-flash-high';
      let lastStepIndex = lines.length;
      let lastUserPrompt = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheTokens = 0;
      let lastEntryTime = 0;
      let discoveredWorkspace = '';

      const actionsFromLog: AgentSessionAction[] = [];

      // Check early lines for workspace definition
      for (const line of lines.slice(0, 25)) {
        if (!discoveredWorkspace) {
          const wsMatch = line.match(/(?:Command Working Directory|Active Workspaces:[\s\S]*?-)\s*([a-zA-Z]:[\\/][^\r\n"<>,|]+)/i);
          if (wsMatch) {
            discoveredWorkspace = wsMatch[1].trim().replace(/[\\/]+$/, '');
          }
        }
      }

      // Scan backwards through the last 30 lines for activity
      const sample = lines.slice(-30);
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

          if (entry.type === 'USER_INPUT' && entry.content) {
            const rawContent = String(entry.content);
            const match = rawContent.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
            lastUserPrompt = match ? match[1].trim() : rawContent.slice(0, 150).trim();
          }

          if (!discoveredWorkspace && entry.tool_calls) {
            for (const call of entry.tool_calls) {
              const pathArg = call.args?.Path || call.args?.CommandLine;
              if (pathArg && typeof pathArg === 'string') {
                const match = pathArg.match(/([a-zA-Z]:\\[^"'\r\n]+)/);
                if (match) {
                  const p = match[1];
                  try {
                    discoveredWorkspace = fs.existsSync(p) && fs.statSync(p).isDirectory() ? p : path.dirname(p);
                  } catch {
                    discoveredWorkspace = path.dirname(p);
                  }
                }
              }
            }
          }

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

      const isCurrentHook = this.lastHookAction?.conversationId === conv.id;
      const activeWorkspace = discoveredWorkspace || (isCurrentHook ? this.lastHookAction?.cwd : null) || process.cwd();
      const baseName = path.basename(activeWorkspace);
      const workspaceName = (baseName && baseName !== path.parse(activeWorkspace).root && baseName.toLowerCase() !== 'workspace')
        ? baseName
        : 'OverWatch';

      const timeSinceAction = Date.now() - Math.max(lastEntryTime, isCurrentHook ? this.lastHookAction?.timestamp || 0 : 0);

      let status: 'idle' | 'running' | 'awaiting_approval' = 'idle';
      if (this.pendingApproval && isCurrentHook) {
        status = 'awaiting_approval';
      } else if (timeSinceAction < 25000) {
        status = 'running';
      }

      const gitStatus = await this.checkGitStatus(activeWorkspace, lastUserPrompt);
      const hookActions = isCurrentHook ? this.recentHookActions : [];
      const combinedActions = [...hookActions, ...actionsFromLog].slice(0, 8);

      return {
        agent: 'antigravity',
        conversationId: conv.id,
        status,
        model: lastModel,
        stepCount: lastStepIndex,
        currentTask: lastUserPrompt || 'Working on codebase tasks...',
        currentTool: isCurrentHook ? this.lastHookAction?.tool : undefined,
        currentCommand: isCurrentHook ? this.lastHookAction?.command : undefined,
        workspace: activeWorkspace,
        workspaceName,
        inputTokens,
        outputTokens,
        cacheTokens,
        lastActive: new Date(Math.max(lastEntryTime, isCurrentHook ? this.lastHookAction?.timestamp || 0 : conv.mtime)).toISOString(),
        recentActions: combinedActions,
        gitStatus,
      };
    } catch {
      return null;
    }
  }

  /**
   * Scans active conversations to extract all live sessions
   */
  async getSessionState(): Promise<AgentSessionState> {
    const convDirs = this.findActiveConversationDirs(6);
    const sessions: AgentSessionState[] = [];

    for (const conv of convDirs) {
      const parsed = await this.parseConversation(conv);
      if (parsed) {
        sessions.push(parsed);
      }
    }

    if (sessions.length === 0) {
      return {
        agent: 'antigravity',
        conversationId: this.lastHookAction?.conversationId || 'idle',
        status: this.pendingApproval ? 'awaiting_approval' : 'idle',
        model: 'gemini-3.8-flash-high',
        stepCount: 0,
        currentTask: 'Waiting for agent task...',
        workspace: this.lastHookAction?.cwd || process.cwd(),
        workspaceName: path.basename(this.lastHookAction?.cwd || process.cwd()),
        lastActive: new Date().toISOString(),
        recentActions: this.recentHookActions,
        sessions: [],
      };
    }

    const primary = sessions[0];
    return {
      ...primary,
      sessions,
      activeSessionIndex: 0,
    };
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
