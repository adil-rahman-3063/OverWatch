import { useEffect, useState, useRef } from 'react';
import { supabase, deviceId } from './supabase.ts';
import { Header } from './components/Header.tsx';
import { MediaCard } from './components/MediaCard.tsx';
import { ApprovalDeck } from './components/ApprovalDeck.tsx';
import { QuotaCard } from './components/QuotaCard.tsx';
import { MediaState, PermissionRequest, QuotaData } from './types.ts';

// Web Audio API chime generator for incoming permission alerts
function playAlertChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);

    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch {}
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [media, setMedia] = useState<MediaState>({
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
  });
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [quota, setQuota] = useState<QuotaData>({});

  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Initial data fetch from Supabase tables
    async function loadInitialData() {
      try {
        // Load latest media
        const { data: mediaData } = await supabase
          .from('media_state')
          .select('*')
          .eq('device_id', deviceId)
          .single();
        if (mediaData) {
          setMedia({
            title: mediaData.title || '',
            artist: mediaData.artist || '',
            album: mediaData.album || '',
            playbackStatus: mediaData.playback_status || 'Stopped',
            updatedAt: mediaData.updated_at,
          });
        }

        // Load latest quota
        const { data: quotaData } = await supabase
          .from('quota_snapshots')
          .select('*')
          .eq('device_id', deviceId)
          .single();
        if (quotaData?.antigravity) {
          setQuota({ antigravity: quotaData.antigravity });
        }

        // Load pending permission requests
        const { data: reqData } = await supabase
          .from('permission_requests')
          .select('*')
          .eq('device_id', deviceId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (reqData) {
          setRequests(
            reqData.map((r: any) => ({
              id: r.id,
              agent: r.agent,
              tool: r.tool,
              command: r.command,
              cwd: r.cwd,
              status: r.status,
              createdAt: r.created_at,
              expiresAt: r.expires_at,
            }))
          );
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }

    loadInitialData();

    // 2. Setup Supabase Realtime Channel
    const channelName = `overwatch:${deviceId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channelRef.current = channel;

    // Listen for live media state
    channel.on('broadcast', { event: 'media:state' }, ({ payload }) => {
      if (payload) {
        setMedia({
          title: payload.title || '',
          artist: payload.artist || '',
          album: payload.album || '',
          playbackStatus: payload.playbackStatus || 'Stopped',
          updatedAt: payload.updatedAt,
        });
      }
    });

    // Listen for live quota updates
    channel.on('broadcast', { event: 'quota:state' }, ({ payload }) => {
      if (payload?.antigravity) {
        setQuota({ antigravity: payload.antigravity });
      }
    });

    // Listen for incoming permission requests
    channel.on('broadcast', { event: 'permission:request' }, ({ payload }) => {
      if (payload?.id) {
        playAlertChime();
        setRequests((prev) => [
          {
            id: payload.id,
            agent: payload.agent || 'Agent',
            tool: payload.tool || 'tool',
            command: payload.command || '',
            cwd: payload.cwd || '',
            status: 'pending',
            createdAt: payload.createdAt || new Date().toISOString(),
          },
          ...prev.filter((r) => r.id !== payload.id),
        ]);
      }
    });

    // Listen for permission decisions
    channel.on('broadcast', { event: 'permission:decision' }, ({ payload }) => {
      if (payload?.requestId) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === payload.requestId
              ? { ...r, status: payload.decision === 'allow' ? 'allowed' : 'denied' }
              : r
          )
        );
      }
    });

    // Database changes fallback
    const dbSub = supabase
      .channel('web-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'permission_requests' },
        (payload) => {
          const newReq = payload.new as any;
          if (newReq && newReq.device_id === deviceId && newReq.status === 'pending') {
            playAlertChime();
            setRequests((prev) => [
              {
                id: newReq.id,
                agent: newReq.agent,
                tool: newReq.tool,
                command: newReq.command,
                cwd: newReq.cwd,
                status: newReq.status,
                createdAt: newReq.created_at,
              },
              ...prev.filter((r) => r.id !== newReq.id),
            ]);
          }
        }
      )
      .subscribe();

    channel.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED');
    });

    return () => {
      channel.unsubscribe();
      dbSub.unsubscribe();
    };
  }, []);

  // Send media action (play/pause, next, prev, volume)
  const handleMediaAction = async (action: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'media:action',
        payload: { action },
      });
    }
  };

  // Allow or Deny command execution
  const handleDecision = async (requestId: string, decision: 'allow' | 'deny') => {
    // 1. Optimistically update local UI
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: decision === 'allow' ? 'allowed' : 'denied' } : r))
    );

    // 2. Broadcast instant decision to Windows client
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'permission:decision',
        payload: { requestId, decision },
      });
    }

    // 3. Update Supabase DB table
    try {
      await supabase
        .from('permission_requests')
        .update({ status: decision === 'allow' ? 'allowed' : 'denied' })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Error updating request status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-deck-950 text-slate-100 flex flex-col max-w-md mx-auto relative pb-8">
      <Header connected={connected} deviceId={deviceId} />

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* 1. Command Approval Deck */}
        <ApprovalDeck requests={requests} onDecision={handleDecision} />

        {/* 2. Windows Media Controller */}
        <MediaCard media={media} onAction={handleMediaAction} />

        {/* 3. Antigravity Quota & Limits */}
        <QuotaCard quota={quota} />
      </main>
    </div>
  );
}
