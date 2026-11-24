import { useEffect, useState, useRef } from 'react';
import { supabase, deviceId } from './supabase.ts';
import { FlipClock } from './components/FlipClock.tsx';
import { MediaCard } from './components/MediaCard.tsx';
import { HardwareTelemetry } from './components/HardwareTelemetry.tsx';
import { MacroDeck } from './components/MacroDeck.tsx';
import { ClipboardBeam } from './components/ClipboardBeam.tsx';
import { ApprovalOverlay } from './components/ApprovalOverlay.tsx';
import { MediaState, PermissionRequest, QuotaData, SystemStats } from './types.ts';

function playAlertChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
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
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [media, setMedia] = useState<MediaState>({
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
  });
  const [stats, setStats] = useState<SystemStats | undefined>();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [quota, setQuota] = useState<QuotaData>({});
  const [pcClipboardText, setPcClipboardText] = useState<string>('');

  const channelRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Screen Wake Lock (Keeps StandBy display awake on desk stand)
  useEffect(() => {
    let wakeLock: any = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    }
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // 2. Supabase Realtime Setup
  useEffect(() => {
    async function loadInitialData() {
      try {
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

        const { data: quotaData } = await supabase
          .from('quota_snapshots')
          .select('*')
          .eq('device_id', deviceId)
          .single();
        if (quotaData?.antigravity) {
          setQuota({ antigravity: quotaData.antigravity });
        }

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

    const channelName = `overwatch:${deviceId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channelRef.current = channel;

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

    channel.on('broadcast', { event: 'telemetry:state' }, ({ payload }) => {
      if (payload?.stats) {
        setStats(payload.stats);
      }
    });

    channel.on('broadcast', { event: 'quota:state' }, ({ payload }) => {
      if (payload?.antigravity) {
        setQuota({ antigravity: payload.antigravity });
      }
    });

    channel.on('broadcast', { event: 'clipboard:state' }, ({ payload }) => {
      if (typeof payload?.text === 'string') {
        setPcClipboardText(payload.text);
      }
    });

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

  const handleMediaAction = async (action: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'media:action',
        payload: { action },
      });
    }
  };

  const handleMacroAction = async (action: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'macro:action',
        payload: { action },
      });
    }
  };

  const handleBeamText = async (text: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'clipboard:set',
        payload: { text },
      });
    }
  };

  const handleFetchClipboard = async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'clipboard:get',
        payload: {},
      });
    }
  };

  const handleDecision = async (requestId: string, decision: 'allow' | 'deny') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: decision === 'allow' ? 'allowed' : 'denied' } : r))
    );

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'permission:decision',
        payload: { requestId, decision },
      });
    }

    try {
      await supabase
        .from('permission_requests')
        .update({ status: decision === 'allow' ? 'allowed' : 'denied' })
        .eq('id', requestId);
    } catch {}
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActivePageIndex(index);
    }
  };

  const scrollToPage = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: index * scrollContainerRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-[#f4f4f5] flex flex-col overflow-hidden relative font-sans antialiased select-none">
      {/* Floating Permission Interlock Modal */}
      <ApprovalOverlay requests={requests} onDecision={handleDecision} />

      {/* Top minimal status bar */}
      <div className="flex items-center justify-between px-5 py-2 bg-black z-30 shrink-0 border-b border-[#141418]">
        <span className="text-[11px] font-mono text-neutral-500 font-medium tracking-wider">
          STANDBY • {deviceId}
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
          <span className={connected ? 'text-neutral-300' : 'text-neutral-500'}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* StandBy Horizontal Paginated Swipe Carousel */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full"
      >
        {/* ========================================================================= */}
        {/* SCREEN 1 (1 Big Card): Full-screen B&W Retro Split-Flap Clock             */}
        {/* ========================================================================= */}
        <div className="w-screen h-full shrink-0 snap-center p-3 sm:p-5 flex items-center justify-center">
          <div className="w-full max-w-4xl h-full flex items-center justify-center">
            <FlipClock />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 2 (2 Cards Half & Half): Media Controller (50%) + Telemetry (50%) */}
        {/* ========================================================================= */}
        <div className="w-screen h-full shrink-0 snap-center p-3 sm:p-5 flex items-center justify-center">
          <div className="w-full max-w-6xl h-full grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            {/* Left Card: Media Deck (50%) */}
            <div className="h-full">
              <MediaCard media={media} onAction={handleMediaAction} />
            </div>

            {/* Right Card: PC Telemetry & Model Quotas (50%) */}
            <div className="h-full">
              <HardwareTelemetry stats={stats} quota={quota} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 3 (2 Cards Half & Half): Quick Macros (50%) + Clipboard Beam (50%) */}
        {/* ========================================================================= */}
        <div className="w-screen h-full shrink-0 snap-center p-3 sm:p-5 flex items-center justify-center">
          <div className="w-full max-w-6xl h-full grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            {/* Left Card: Quick Action Macros (50%) */}
            <div className="h-full">
              <MacroDeck onMacro={handleMacroAction} />
            </div>

            {/* Right Card: Universal Clipboard Beam (50%) */}
            <div className="h-full">
              <ClipboardBeam
                onBeamText={handleBeamText}
                onFetchClipboard={handleFetchClipboard}
                pcClipboardText={pcClipboardText}
              />
            </div>
          </div>
        </div>
      </main>

      {/* StandBy Pagination Dots (3 Screens) */}
      <div className="flex items-center justify-center gap-2 py-2.5 bg-black z-30 shrink-0">
        {[0, 1, 2].map((page) => (
          <button
            key={page}
            onClick={() => scrollToPage(page)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              activePageIndex === page
                ? 'w-6 bg-white'
                : 'w-1.5 bg-[#26262e] hover:bg-[#383844]'
            }`}
            title={`Screen ${page + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
