import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { exec } from 'child_process';
import util from 'util';
import { config } from './config.js';
import { mediaController, MediaInfo } from './media/windowsMedia.js';
import { AntigravityQuotaData } from './quota/antigravityQuota.js';
import { SystemStats, executeMacro } from './system/pcStats.js';
import { AgentSessionState, agentSessionMonitor } from './session/agentSession.js';
import { setWindowsClipboard, getWindowsClipboard } from './system/clipboard.js';

export interface PendingRequest {
  id: string;
  agent: string;
  tool: string;
  command: string;
  cwd: string;
  resolve: (decision: 'allow' | 'deny' | 'ask') => void;
  timer: NodeJS.Timeout;
}

export class SupabaseService {
  private client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  async init(): Promise<void> {
    const channelName = `overwatch:${config.deviceId}`;
    console.log(`[Supabase] Connecting to channel: ${channelName}`);

    this.channel = this.client.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    // 1. Media Actions (targeted per session or global)
    this.channel.on('broadcast', { event: 'media:action' }, async ({ payload }) => {
      const action = payload?.action;
      const sessionIndex = typeof payload?.sessionIndex === 'number' ? payload.sessionIndex : -1;
      if (action) {
        console.log(`[Supabase] Received media:action: ${action} (sessionIndex: ${sessionIndex})`);
        await mediaController.sendMediaCommand(action, sessionIndex);
        setTimeout(async () => {
          const updated = await mediaController.getCurrentMedia();
          await this.publishMediaState(updated);
        }, 350);
      }
    });

    // 2. Macro Actions
    this.channel.on('broadcast', { event: 'macro:action' }, async ({ payload }) => {
      const action = payload?.action;
      if (action) {
        await executeMacro(action, payload?.workspaceDir);
      }
    });

    // 3. Clipboard Beam: Set PC Clipboard from Phone
    this.channel.on('broadcast', { event: 'clipboard:set' }, async ({ payload }) => {
      const text = payload?.text;
      if (typeof text === 'string') {
        const success = await setWindowsClipboard(text);
        if (success && this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'clipboard:synced',
            payload: { text, success: true, timestamp: new Date().toISOString() },
          });
        }
      }
    });

    // 4. Clipboard Beam: Fetch PC Clipboard to Phone
    this.channel.on('broadcast', { event: 'clipboard:get' }, async () => {
      const text = await getWindowsClipboard();
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'clipboard:state',
          payload: { text, timestamp: new Date().toISOString() },
        });
      }
    });

    // 5. Permission Decisions
    this.channel.on('broadcast', { event: 'permission:decision' }, async ({ payload }) => {
      this.resolveDecision(payload?.requestId, payload?.decision);
    });

    // 6. Beaming Quick Prompts from Mobile into Antigravity
    this.channel.on('broadcast', { event: 'agent:prompt' }, async ({ payload }) => {
      const text = payload?.prompt;
      if (typeof text === 'string' && text.trim().length > 0) {
        console.log(`[AgentPrompt] Received mobile prompt: "${text.slice(0, 60)}"`);
        await setWindowsClipboard(text);

        if (payload?.autoSend) {
          try {
            const execPromise = util.promisify(exec);
            const psScript = `
              $wshell = New-Object -ComObject wscript.shell;
              $activated = $wshell.AppActivate('Antigravity');
              if (-not $activated) { $wshell.AppActivate('Visual Studio Code'); }
              Start-Sleep -Milliseconds 120;
              $wshell.SendKeys('^v');
              Start-Sleep -Milliseconds 60;
              $wshell.SendKeys('{ENTER}');
            `;
            const base64 = Buffer.from(psScript, 'utf-8').toString('base64');
            await execPromise(`powershell -NoProfile -NonInteractive -EncodedCommand ${base64}`);
            console.log(`[AgentPrompt] Successfully pasted and submitted prompt to active editor.`);
          } catch (err: any) {
            console.warn('[AgentPrompt] SendKeys automated entry failed:', err.message);
          }
        }
      }
    });

    // 7. Remote Host Git Push (Executes on Windows Host PC outside the Sandbox)
    this.channel.on('broadcast', { event: 'agent:git_push' }, async ({ payload }) => {
      const workspace = payload?.workspace || process.cwd();
      const customCmd = payload?.command;
      const message = payload?.commitMessage || 'feat: updates from OverWatch mobile deck';
      console.log(`[GitPush] Received remote push trigger for: ${workspace}`);

      try {
        const execPromise = util.promisify(exec);
        let psCmd: string;
        if (customCmd && typeof customCmd === 'string') {
          psCmd = `powershell -NoProfile -Command "${customCmd.replace(/"/g, '`"')}"`;
        } else {
          const cleanMsg = message.replace(/["`$]/g, '');
          psCmd = `powershell -NoProfile -Command "git add -A; git commit -m '${cleanMsg}'; git push origin main"`;
        }
        console.log(`[GitPush] Executing: ${psCmd}`);
        const { stdout, stderr } = await execPromise(psCmd, { cwd: workspace, timeout: 45000 });
        console.log('[GitPush] Success:\n', stdout);

        if (this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'git:push_status',
            payload: {
              success: true,
              message: 'Successfully committed & pushed to GitHub main branch!',
              output: stdout || stderr,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (err: any) {
        console.error('[GitPush] Push failed:', err.message);
        if (this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'git:push_status',
            payload: {
              success: false,
              message: err.message,
              output: err.stdout || err.stderr || err.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    });

    // 8. DB changes fallback for permission_requests
    this.client
      .channel('db-permission-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'permission_requests',
          filter: `device_id=eq.${config.deviceId}`,
        },
        (payload) => {
          const req = payload.new as any;
          if (req && (req.status === 'allowed' || req.status === 'denied')) {
            const decision = req.status === 'allowed' ? 'allow' : 'deny';
            this.resolveDecision(req.id, decision);
          }
        }
      )
      .subscribe();

    this.channel.subscribe((status) => {
      console.log(`[Supabase] Realtime channel status: ${status}`);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[Supabase] Re-subscribing in 2.5s due to ${status}...`);
        setTimeout(() => {
          this.channel?.subscribe();
        }, 2500);
      }
    });
  }

  private resolveDecision(requestId: string, decision: 'allow' | 'deny' | 'skip'): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(requestId);
      // Strict fail-closed: Only explicit 'allow' approves. Any denial or skip denies.
      const hookDecision = decision === 'allow' ? 'allow' : 'deny';
      agentSessionMonitor.recordHookDecision(hookDecision);
      pending.resolve(hookDecision);
      console.log(`[Supabase] Resolved request [${requestId}] with decision: ${hookDecision}`);
    }
  }

  async publishMediaState(media: MediaInfo): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'media:state',
          payload: {
            deviceId: config.deviceId,
            ...media,
          },
        });
      }

      await this.client.from('media_state').upsert({
        device_id: config.deviceId,
        title: media.title,
        artist: media.artist,
        album: media.album,
        playback_status: media.playbackStatus,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }

  async publishQuotaState(quota: AntigravityQuotaData): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'quota:state',
          payload: {
            deviceId: config.deviceId,
            antigravity: quota,
            updatedAt: quota.fetchedAt,
          },
        });
      }

      await this.client.from('quota_snapshots').upsert({
        device_id: config.deviceId,
        antigravity: quota,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }

  async publishSystemStats(stats: SystemStats): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'telemetry:state',
          payload: {
            deviceId: config.deviceId,
            stats,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch {}
  }

  async publishSessionState(session: AgentSessionState): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'session:state',
          payload: {
            deviceId: config.deviceId,
            session,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch {}
  }

  async requestPermission(data: {
    id: string;
    agent: string;
    tool: string;
    command: string;
    cwd: string;
  }): Promise<'allow' | 'deny' | 'ask'> {
    console.log(`[Supabase] Creating permission request [${data.id}] for ${data.agent}: ${data.tool}`);

    try {
      await this.client.from('permission_requests').insert({
        id: data.id,
        device_id: config.deviceId,
        agent: data.agent,
        tool: data.tool,
        command: data.command,
        cwd: data.cwd,
        status: 'pending',
        expires_at: new Date(Date.now() + config.permissionTimeoutMs).toISOString(),
      });
    } catch {}

    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'permission:request',
        payload: {
          id: data.id,
          deviceId: config.deviceId,
          agent: data.agent,
          tool: data.tool,
          command: data.command,
          cwd: data.cwd,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return new Promise<'allow' | 'deny' | 'ask'>((resolve) => {
      const timer = setTimeout(async () => {
        this.pendingRequests.delete(data.id);
        try {
          await this.client
            .from('permission_requests')
            .update({ status: 'expired' })
            .eq('id', data.id);
        } catch {}
        resolve(config.fallbackDecision);
      }, config.permissionTimeoutMs);

      this.pendingRequests.set(data.id, {
        ...data,
        resolve,
        timer,
      });
    });
  }
}

export const supabaseService = new SupabaseService();
