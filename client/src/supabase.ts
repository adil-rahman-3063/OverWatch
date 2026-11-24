import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { config } from './config.js';
import { mediaController, MediaInfo } from './media/windowsMedia.js';
import { AntigravityQuotaData } from './quota/antigravityQuota.js';

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

    // 1. Listen for remote media actions from the mobile PWA
    this.channel.on('broadcast', { event: 'media:action' }, async ({ payload }) => {
      console.log(`[Supabase] Received remote media action:`, payload);
      const action = payload?.action;
      if (action) {
        await mediaController.sendMediaCommand(action);
        // Small delay to let media player update its state before polling
        setTimeout(async () => {
          const updated = await mediaController.getCurrentMedia();
          await this.publishMediaState(updated);
        }, 300);
      }
    });

    // 2. Listen for remote permission decisions from broadcast
    this.channel.on('broadcast', { event: 'permission:decision' }, async ({ payload }) => {
      console.log(`[Supabase] Received permission decision via broadcast:`, payload);
      this.resolveDecision(payload?.requestId, payload?.decision);
    });

    // 3. Also listen for database table updates on permission_requests
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
            console.log(`[Supabase] Permission request ${req.id} updated in DB: ${decision}`);
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

  /**
   * Publishes media state to both Realtime Broadcast and the media_state table.
   */
  async publishMediaState(media: MediaInfo): Promise<void> {
    try {
      // 1. Instant broadcast (no database latency)
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

      // 2. Persist in database
      await this.client.from('media_state').upsert({
        device_id: config.deviceId,
        title: media.title,
        artist: media.artist,
        album: media.album,
        playback_status: media.playbackStatus,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      // Non-fatal if DB table is still initializing
      console.warn(`[Supabase] Warning updating media_state:`, err.message || err);
    }
  }

  /**
   * Publishes quota state to both Realtime Broadcast and quota_snapshots table.
   */
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
    } catch (err: any) {
      console.warn(`[Supabase] Warning updating quota_snapshots:`, err.message || err);
    }
  }

  /**
   * Creates a permission request, broadcasts to phone, and awaits allow/deny.
   */
  async requestPermission(data: {
    id: string;
    agent: string;
    tool: string;
    command: string;
    cwd: string;
  }): Promise<'allow' | 'deny' | 'ask'> {
    console.log(`[Supabase] Creating permission request [${data.id}] for ${data.agent}: ${data.tool}`);

    // Insert into DB
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
    } catch (err: any) {
      console.warn(`[Supabase] Could not insert to permission_requests DB:`, err.message);
    }

    // Broadcast instant alert to phone
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

    // Await response or timeout
    return new Promise<'allow' | 'deny' | 'ask'>((resolve) => {
      const timer = setTimeout(async () => {
        console.warn(`[Supabase] Permission request [${data.id}] timed out after ${config.permissionTimeoutMs}ms`);
        this.pendingRequests.delete(data.id);
        
        // Update DB status to expired
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
