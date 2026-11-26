import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { config } from './config.js';
import { mediaController, MediaInfo } from './media/windowsMedia.js';
import { AntigravityQuotaData } from './quota/antigravityQuota.js';
import { SystemStats, executeMacro } from './system/pcStats.js';
import { AgentSessionState, agentSessionMonitor } from './session/agentSession.js';
import { setWindowsClipboard, getWindowsClipboard } from './system/clipboard.js';
import {
  getPrimaryLanIp,
  saveImageAndSetClipboard,
  getWindowsClipboardImage,
  capturePrimaryScreen,
} from './system/imageClipboard.js';

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
      const workspace = payload?.workspace;
      const workspaceName = workspace ? path.basename(workspace) : '';

      if (typeof text === 'string' && text.trim().length > 0) {
        console.log(`[AgentPrompt] Received mobile prompt for [${workspaceName || 'active session'}]: "${text.slice(0, 60)}"`);
        await setWindowsClipboard(text);

        if (payload?.autoSend) {
          try {
            const execPromise = util.promisify(exec);
            const targetName = workspaceName ? workspaceName.replace(/["`$]/g, '') : 'Antigravity';
            const psScript = `
              $wshell = New-Object -ComObject wscript.shell;
              $activated = $wshell.AppActivate('${targetName}');
              if (-not $activated) { $activated = $wshell.AppActivate('Antigravity'); }
              if (-not $activated) { $wshell.AppActivate('Visual Studio Code'); }
              Start-Sleep -Milliseconds 120;
              $wshell.SendKeys('^v');
              Start-Sleep -Milliseconds 60;
              $wshell.SendKeys('{ENTER}');
            `;
            const base64 = Buffer.from(psScript, 'utf-8').toString('base64');
            await execPromise(`powershell -NoProfile -NonInteractive -EncodedCommand ${base64}`);
            console.log(`[AgentPrompt] Successfully pasted and submitted prompt.`);
          } catch (err: any) {
            console.warn('[AgentPrompt] SendKeys automated entry failed:', err.message);
          }
        }
      }
    });

    // 7. Beaming Git Push Command to Windows Clipboard (Safe: Beams & Copies, does NOT run)
    this.channel.on('broadcast', { event: 'agent:git_push' }, async ({ payload }) => {
      const workspace = payload?.workspace || process.cwd();
      const customCmd = payload?.command;
      const message = payload?.commitMessage || 'feat: updates from OverWatch mobile deck';
      const cleanMsg = message.replace(/["`$]/g, '');
      const pushCommand = customCmd && typeof customCmd === 'string'
        ? customCmd
        : `git add -A; git commit -m "${cleanMsg}"; git push origin main`;

      console.log(`[GitPush] Beaming push command to Windows clipboard for: ${workspace}`);

      try {
        await setWindowsClipboard(pushCommand);
        console.log('[GitPush] Copied to Windows clipboard:', pushCommand);

        if (this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'git:push_status',
            payload: {
              success: true,
              message: 'Push command beamed to Windows clipboard! Paste in your host terminal to push.',
              command: pushCommand,
              workspace,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (err: any) {
        console.error('[GitPush] Clipboard copy failed:', err.message);
        if (this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'git:push_status',
            payload: {
              success: false,
              message: 'Failed to copy to clipboard: ' + err.message,
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

    // 8. Client Ping from Mobile (Immediate Heartbeat Probe)
    this.channel.on('broadcast', { event: 'client:ping' }, async () => {
      await this.publishHeartbeat();
    });

    // 9. Image Beam: Mobile -> Windows (Cellular / Cloud Broadcast Fallback)
    this.channel.on('broadcast', { event: 'image:beam' }, async ({ payload }) => {
      let b64 = payload?.imageBase64 || payload?.image || '';
      if (typeof b64 === 'string' && b64.includes('base64,')) {
        b64 = b64.split('base64,')[1];
      }
      if (b64 && typeof b64 === 'string') {
        const buffer = Buffer.from(b64, 'base64');
        const res = await saveImageAndSetClipboard(buffer, payload?.name);
        if (this.channel) {
          await this.channel.send({
            type: 'broadcast',
            event: 'image:beamed_status',
            payload: {
              success: res.success,
              filePath: res.filePath,
              message: res.success
                ? 'Image beamed to Windows Clipboard and saved to Pictures/OverWatch'
                : 'Failed to save image: ' + res.error,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    });

    // 10. Image Beam: Mobile requests Windows Clipboard Image
    this.channel.on('broadcast', { event: 'image:request_clipboard' }, async () => {
      const clipResult = await getWindowsClipboardImage();
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'image:clipboard_state',
          payload: {
            hasImage: clipResult.hasImage,
            base64: clipResult.base64,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

    // 11. Image Beam: Mobile requests Screen Capture
    this.channel.on('broadcast', { event: 'image:request_screen' }, async () => {
      const screenResult = await capturePrimaryScreen();
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'image:screen_state',
          payload: {
            success: screenResult.success,
            base64: screenResult.base64,
            filePath: screenResult.filePath,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

    this.channel.subscribe((status) => {
      console.log(`[Supabase] Realtime channel status: ${status}`);
      if (status === 'SUBSCRIBED') {
        this.publishHeartbeat().catch(() => {});
      }
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

  async publishHeartbeat(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'client:heartbeat',
          payload: {
            deviceId: config.deviceId,
            lanIp: getPrimaryLanIp(),
            localPort: config.localIpcPort,
            timestamp: Date.now(),
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
