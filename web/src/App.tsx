import { useEffect, useState, useRef } from 'react';
import { supabase, deviceId } from './supabase.ts';
import { FlipClock } from './components/FlipClock.tsx';
import { MediaCard } from './components/MediaCard.tsx';
import { HardwareTelemetry } from './components/HardwareTelemetry.tsx';
import { MacroDeck } from './components/MacroDeck.tsx';
import { ClipboardBeam } from './components/ClipboardBeam.tsx';
import { AgentSessionCard } from './components/AgentSessionCard.tsx';
import { AgentPromptDeck } from './components/AgentPromptDeck.tsx';
import { ApprovalOverlay } from './components/ApprovalOverlay.tsx';
import { PinLock } from './components/PinLock.tsx';
import { Lock } from 'lucide-react';
import { AgentSessionState, MediaState, PermissionRequest, QuotaData, SystemStats } from './types.ts';
import { playAlertRingtone } from './utils/sound.ts';

// 1-pixel silent base64 MP4 video for iOS/Android keep-awake fallback
const SILENT_VIDEO_B64 =
  'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAAAAG21kYXRhAAAC/AYF//+43UAAAAAABHB1cnAAAAALbXZoZAAAAAB3iJ1bd4idWwAAAPoAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const EXPECTED_PIN = import.meta.env.VITE_ACCESS_PIN || '123456';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('overwatch_auth_token') === 'true' ||
      sessionStorage.getItem('overwatch_auth_token') === 'true'
    );
  });
  const [connected, setConnected] = useState(false);
  const [lastSeenPc, setLastSeenPc] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeWorkspace, setActiveWorkspace] = useState<string>(() => {
    return localStorage.getItem('overwatch_last_workspace_path') || 'c:\\Users\\adilr\\Documents\\open-source\\OverWatch';
  });
  const [media, setMedia] = useState<MediaState>({
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
  });
  const [stats, setStats] = useState<SystemStats | undefined>();
  const [agentSession, setAgentSession] = useState<AgentSessionState | null>(() => {
    try {
      const cached = localStorage.getItem('overwatch_cached_session');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      agent: 'Antigravity',
      conversationId: '',
      status: 'idle',
      model: 'gemini-flash',
      stepCount: 0,
      currentTask: 'Idle — waiting for next instruction.',
      workspace: 'c:\\Users\\adilr\\Documents\\open-source\\OverWatch',
      workspaceName: 'OverWatch',
      lastActive: new Date().toISOString(),
      recentActions: [],
    };
  });
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [quota, setQuota] = useState<QuotaData>({});
  const [pcClipboardText, setPcClipboardText] = useState<string>('');
  const [lanIp, setLanIp] = useState<string>('127.0.0.1');
  const [localPort, setLocalPort] = useState<number>(49152);

  const channelRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // =========================================================================
  // 1. Bulletproof Screen Wake Lock (Native API + Silent Video Keep-Alive)
  // Keeps StandBy display strictly awake without changing OS settings!
  // =========================================================================
  useEffect(() => {
    let wakeLock: any = null;

    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}

      // Start silent video loop for iOS/Android power-saving browsers
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }

    // Try immediately on load
    acquireWakeLock();

    // Re-acquire on user interaction (touch/click/pointer) as required by mobile policies
    const handleUserInteraction = () => {
      acquireWakeLock();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        acquireWakeLock();
      }
    };

    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('click', handleUserInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Watchdog ticker for PC daemon live status
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // =========================================================================
  // 2. Supabase Realtime Setup
  // =========================================================================
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

    channel.on('broadcast', { event: 'client:heartbeat' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (payload?.lanIp) setLanIp(payload.lanIp);
      if (payload?.localPort) setLocalPort(payload.localPort);
    });

    channel.on('broadcast', { event: 'media:state' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (payload) {
        setMedia({
          title: payload.title || '',
          artist: payload.artist || '',
          album: payload.album || '',
          playbackStatus: payload.playbackStatus || 'Stopped',
          sourceAppId: payload.sourceAppId,
          sessions: payload.sessions || [],
          activeSessionIndex: payload.activeSessionIndex || 0,
          updatedAt: payload.updatedAt,
        });
      }
    });

    channel.on('broadcast', { event: 'telemetry:state' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (payload?.stats) {
        setStats(payload.stats);
      }
    });

    channel.on('broadcast', { event: 'quota:state' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (payload?.antigravity) {
        setQuota({ antigravity: payload.antigravity });
      }
    });

    channel.on('broadcast', { event: 'clipboard:state' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (typeof payload?.text === 'string') {
        setPcClipboardText(payload.text);
      }
    });

    channel.on('broadcast', { event: 'session:state' }, ({ payload }) => {
      setLastSeenPc(Date.now());
      if (payload?.session) {
        setAgentSession(payload.session);
        try {
          localStorage.setItem('overwatch_cached_session', JSON.stringify(payload.session));
          if (payload.session.workspace) {
            localStorage.setItem('overwatch_last_workspace_path', payload.session.workspace);
          }
          if (payload.session.workspaceName) {
            localStorage.setItem('overwatch_last_workspace_name', payload.session.workspaceName);
          }
        } catch {}
        if (payload.session.workspace) {
          setActiveWorkspace((prev) => prev || payload.session.workspace);
        }
      }
    });

    channel.on('broadcast', { event: 'git:push_status' }, ({ payload }) => {
      setIsPushingGit(false);
      if (payload?.success) {
        if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
      }
    });

    channel.on('broadcast', { event: 'permission:request' }, ({ payload }) => {
      if (payload?.id) {
        playAlertRingtone();
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
              ? { ...r, status: payload.decision === 'allow' ? 'allowed' : payload.decision === 'deny' ? 'denied' : 'expired' }
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
            playAlertRingtone();
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
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'client:ping',
          payload: { timestamp: Date.now() },
        }).catch(() => {});
      }
    });

    return () => {
      channel.unsubscribe();
      dbSub.unsubscribe();
    };
  }, []);

  const handleMediaAction = async (action: string, sessionIndex?: number) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'media:action',
        payload: { action, sessionIndex },
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

  const handleBeamImage = async (imageBase64: string): Promise<{ success: boolean; mode?: string }> => {
    // 1. Try Local Wi-Fi Direct first (instant, full resolution)
    if (lanIp && lanIp !== '127.0.0.1') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`http://${lanIp}:${localPort}/image/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64 }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return { success: true, mode: 'wifi-direct' };
        }
      } catch (e) {
        console.warn('[ImageBeam] Wi-Fi direct unreachable, falling back to Supabase broadcast');
      }
    }

    // 2. Cellular / Cloud Fallback via Supabase Realtime broadcast
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'image:beam',
        payload: { imageBase64, timestamp: Date.now() },
      });
      return { success: true, mode: 'cellular-fallback' };
    }

    return { success: false };
  };

  const handleFetchPcClipboardImage = async (): Promise<{ hasImage: boolean; base64?: string }> => {
    // 1. Try Wi-Fi Direct
    if (lanIp && lanIp !== '127.0.0.1') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`http://${lanIp}:${localPort}/image/clipboard`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    // 2. Fallback via Supabase broadcast
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'image:request_clipboard',
        payload: {},
      });
    }
    return { hasImage: false };
  };

  const handleCapturePcScreen = async (): Promise<{ success: boolean; base64?: string }> => {
    // 1. Try Wi-Fi Direct
    if (lanIp && lanIp !== '127.0.0.1') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(`http://${lanIp}:${localPort}/image/screenshot`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    // 2. Fallback via Supabase broadcast
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'image:request_screen',
        payload: {},
      });
    }
    return { success: false };
  };

  const handleSendAgentPrompt = async (prompt: string, autoSend: boolean, workspaceOverride?: string) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'agent:prompt',
        payload: { prompt, autoSend, workspace: workspaceOverride || activeWorkspace },
      });
    }
  };

  const handleRemoteGitPush = async (commandOrMessage?: string, workspaceOverride?: string) => {
    setIsPushingGit(true);
    const targetWs = workspaceOverride || activeWorkspace;
    const pushCmd = commandOrMessage && commandOrMessage.startsWith('git ')
      ? commandOrMessage
      : 'git push origin main';

    // 1. Copy immediately to local device clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pushCmd);
      }
    } catch {}

    // 2. Beam directly to Windows clipboard via safe clipboard handler
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'clipboard:set',
        payload: { text: pushCmd },
      });

      await channelRef.current.send({
        type: 'broadcast',
        event: 'agent:git_push',
        payload: {
          command: pushCmd,
          workspace: targetWs,
        },
      });
    }

    setTimeout(() => {
      setIsPushingGit(false);
    }, 1500);
  };

  const handleDecision = async (requestId: string, decision: 'allow' | 'deny' | 'skip') => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: decision === 'allow' ? 'allowed' : decision === 'deny' ? 'denied' : 'expired' }
          : r
      )
    );

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'permission:decision',
        payload: { requestId, decision },
      });
    }

    if (decision !== 'skip') {
      try {
        await supabase
          .from('permission_requests')
          .update({ status: decision === 'allow' ? 'allowed' : 'denied' })
          .eq('id', requestId);
      } catch {}
    }
  };

  if (!isAuthenticated) {
    return (
      <PinLock
        expectedPin={EXPECTED_PIN}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swipe left -> Next page
        setActivePageIndex((prev) => {
          const next = Math.min(3, prev + 1);
          if (next !== prev && navigator.vibrate) navigator.vibrate(20);
          return next;
        });
      } else {
        // Swipe right -> Previous page
        setActivePageIndex((prev) => {
          const next = Math.max(0, prev - 1);
          if (next !== prev && navigator.vibrate) navigator.vibrate(20);
          return next;
        });
      }
    }
  };

  // Keyboard navigation for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActivePageIndex((p) => Math.min(3, p + 1));
      } else if (e.key === 'ArrowLeft') {
        setActivePageIndex((p) => Math.max(0, p - 1));
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        setActivePageIndex(parseInt(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isPcOnline = connected && lastSeenPc > 0 && (now - lastSeenPc < 7500);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-black text-[#f4f4f5] flex flex-col overflow-hidden font-sans antialiased select-none">
      {/* Invisible silent keep-awake video tag for mobile browsers */}
      <video
        ref={videoRef}
        src={SILENT_VIDEO_B64}
        playsInline
        webkit-playsinline="true"
        loop
        muted
        autoPlay
        className="hidden pointer-events-none opacity-0 w-0 h-0"
      />

      {/* Floating Permission Interlock Modal with 10s auto-minimize & Skip */}
      <ApprovalOverlay requests={requests} onDecision={handleDecision} />

      {/* Top minimal status bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 sm:py-2 bg-black z-30 shrink-0 border-b border-[#141418]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-neutral-500 font-medium tracking-wider">
            STANDBY • {deviceId}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                isPcOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connected
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'bg-neutral-600'
              }`}
            />
            <span className={isPcOnline ? 'text-neutral-200 font-medium' : 'text-neutral-500'}>
              {isPcOnline ? 'PC Live' : connected ? 'PC Offline' : 'Offline'}
            </span>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('overwatch_auth_token');
              sessionStorage.removeItem('overwatch_auth_token');
              setIsAuthenticated(false);
            }}
            className="text-neutral-600 hover:text-neutral-400 p-0.5 transition-colors"
            title="Lock device"
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* StandBy 4-Page Sliding Stage (Fixed in Viewport - Webpage does NOT scroll) */}
      <main
        className="flex-1 min-h-0 w-full relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activePageIndex * 100}%)` }}
        >
          {/* ========================================================================= */}
          {/* PAGE 1: Retro Split-Flap Clock                                            */}
          {/* ========================================================================= */}
          <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="w-full max-w-4xl h-full flex items-center justify-center">
              <FlipClock isActive={activePageIndex === 0} />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAGE 2: AI Sessions & Prompt Deck (Swipable UP/DOWN for command inspection)*/}
          {/* ========================================================================= */}
          <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="w-full max-w-6xl h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-4 items-stretch overflow-hidden">
              <div className="h-full min-h-0 overflow-hidden">
                <AgentSessionCard
                  session={agentSession}
                  onSelectSession={(sess) => {
                    if (sess?.workspace) setActiveWorkspace(sess.workspace);
                  }}
                  onGitPush={(customCmd) => handleRemoteGitPush(customCmd, activeWorkspace)}
                  isPushing={isPushingGit}
                />
              </div>
              <div className="h-full min-h-0 overflow-hidden">
                <AgentPromptDeck
                  onSendPrompt={(prompt, autoSend) =>
                    handleSendAgentPrompt(prompt, autoSend, activeWorkspace)
                  }
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAGE 3: Media Deck (50%) + PC Telemetry & Quota (50%)                     */}
          {/* ========================================================================= */}
          <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="w-full max-w-6xl h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-4 items-stretch overflow-hidden">
              <div className="h-full min-h-0 overflow-hidden">
                <MediaCard media={media} onAction={handleMediaAction} />
              </div>
              <div className="h-full min-h-0 overflow-hidden">
                <HardwareTelemetry stats={stats} quota={quota} />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAGE 4: Workstation Macros (50%) + Clipboard Beam (50%)                   */}
          {/* ========================================================================= */}
          <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="w-full max-w-6xl h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-4 items-stretch overflow-hidden">
              <div className="h-full min-h-0 overflow-hidden">
                <MacroDeck onMacro={handleMacroAction} />
              </div>
              <div className="h-full min-h-0 overflow-hidden">
                <ClipboardBeam
                  onBeamText={handleBeamText}
                  onFetchClipboard={handleFetchClipboard}
                  pcClipboardText={pcClipboardText}
                  lanIp={lanIp}
                  localPort={localPort}
                  onBeamImage={handleBeamImage}
                  onFetchPcClipboardImage={handleFetchPcClipboardImage}
                  onCapturePcScreen={handleCapturePcScreen}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist StandBy Indicator Dots (Zero clutter, maximum viewport height) */}
      <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2 z-30 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#1c1c26]">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePageIndex(idx);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              className={`transition-all duration-200 rounded-full ${
                activePageIndex === idx
                  ? 'w-4 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                  : 'w-1.5 h-1.5 bg-neutral-700 hover:bg-neutral-400'
              }`}
              title={idx === 0 ? 'Clock' : idx === 1 ? 'AI Mission' : idx === 2 ? 'Music & Stats' : 'Workstation'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
