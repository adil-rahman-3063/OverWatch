import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { config } from './config.js';
import { mediaController, MediaInfo } from './media/windowsMedia.js';
import { AntigravityQuotaData } from './quota/antigravityQuota.js';
import { SystemStats, executeMacro } from './system/pcStats.js';

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

    // 1. Listen for remote media actions
    this.channel.on('broadcast', { event: 'media:action' }, async ({ payload }) => {
      console.log(`[Supabase] Received media action:`, payload);
      const action = payload?.action;
      if (action) {
        await mediaController.sendMediaCommand(action);
        setTimeout(async () => {
          const updated = await mediaController.getCurrentMedia();
          await this.publishMediaState(updated);
        }, 300);
      }
    });

    // 2. Listen for Quick Macro actions
    this.channel.on('broadcast', { event: 'macro:action' }, async ({ payload }) => {
      console.log(`[Supabase] Received macro action:`, payload);
      const action = payload?.action;
      if (action) {
        await executeMacro(action, payload?.workspaceDir);
      }
    });

    // 3. Listen for remote permission decisions
    this.channel.on('broadcast', { event: 'permission:decision' }, async ({ payload }) => {
      console.log(`[Supabase] Received permission decision via broadcast:`, payload);
      this.resolveDecision(payload?.requestId, payload?.decision);
    });

    // 4. Database changes fallback for permission_requests
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

    await this.channel.subscribe((status) => {
      console.log(`[Supabase] Realtime channel status: ${status}`);
    });
  }

  private resolveDecision(requestId: string, decision: 'allow' | 'deny'): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(requestId);
      pending.resolve(decision);
      console.log(`[Supabase] Successfully resolved request ${requestId} with decision: ${decision}`);
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
