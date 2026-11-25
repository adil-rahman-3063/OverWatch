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
import { WidgetDeck, WidgetItem } from './components/WidgetDeck.tsx';
import { Lock, Clock, Music, Bot, Zap, Activity, MessageSquare, Clipboard, Timer } from 'lucide-react';
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
  const [leftWidgetIndex, setLeftWidgetIndex] = useState(0);
  const [rightWidgetIndex, setRightWidgetIndex] = useState(0);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('');
  const [media, setMedia] = useState<MediaState>({
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
  });
  const [stats, setStats] = useState<SystemStats | undefined>();
  const [agentSession, setAgentSession] = useState<AgentSessionState | null>(null);
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [quota, setQuota] = useState<QuotaData>({});
  const [pcClipboardText, setPcClipboardText] = useState<string>('');

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

    channel.on('broadcast', { event: 'client:heartbeat' }, () => {
      setLastSeenPc(Date.now());
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
        if (payload.session.workspace) {
          setActiveWorkspace((prev) => prev || payload.session.workspace);
        }
      }
    });

    channel.on('broadcast', { event: 'git:push_status' }, ({ payload }) => {
      setIsPushingGit(false);
      if (payload?.success) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
        alert(payload.message || 'Pushed to GitHub successfully!');
      } else {
        alert('Git Push error: ' + (payload?.message || 'Check PC logs'));
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
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'agent:git_push',
        payload: {
          command: commandOrMessage && commandOrMessage.startsWith('git ') ? commandOrMessage : undefined,
          commitMessage: commandOrMessage && !commandOrMessage.startsWith('git ') ? commandOrMessage : 'feat: updates from OverWatch mobile deck',
          workspace: targetWs,
        },
      });
    }
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

  const leftWidgetItems: WidgetItem[] = [
    {
      id: 'clock',
      title: 'Split-Flap Clock',
      shortLabel: 'Retro Clock',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      component: (
        <div className="h-full w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden">
          <FlipClock isActive={leftWidgetIndex === 0} />
        </div>
      ),
    },
    {
      id: 'media',
      title: 'Windows Media',
      shortLabel: 'Media Player',
      icon: <Music className="w-3.5 h-3.5 text-emerald-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <MediaCard media={media} onAction={handleMediaAction} />
        </div>
      ),
    },
    {
      id: 'agent-session',
      title: 'Antigravity Session',
      shortLabel: 'AI Session',
      icon: <Bot className="w-3.5 h-3.5 text-cyan-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <AgentSessionCard
            session={agentSession}
            onSelectSession={(sess) => {
              if (sess?.workspace) {
                setActiveWorkspace(sess.workspace);
              }
            }}
            onGitPush={(customCmd) => handleRemoteGitPush(customCmd, activeWorkspace)}
            isPushing={isPushingGit}
          />
        </div>
      ),
    },
    {
      id: 'macros',
      title: 'Workstation Macros',
      shortLabel: 'Quick Macros',
      icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <MacroDeck onMacro={handleMacroAction} />
        </div>
      ),
    },
  ];

  const rightWidgetItems: WidgetItem[] = [
    {
      id: 'telemetry',
      title: 'Hardware & Quota',
      shortLabel: 'Telemetry & Quota',
      icon: <Activity className="w-3.5 h-3.5 text-blue-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <HardwareTelemetry stats={stats} quota={quota} />
        </div>
      ),
    },
    {
      id: 'agent-prompts',
      title: 'Prompt Commands',
      shortLabel: 'Prompt Deck',
      icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <AgentPromptDeck
            onSendPrompt={(prompt, autoSend) =>
              handleSendAgentPrompt(prompt, autoSend, activeWorkspace)
            }
          />
        </div>
      ),
    },
    {
      id: 'clipboard',
      title: 'Universal Clipboard',
      shortLabel: 'Clipboard Beam',
      icon: <Clipboard className="w-3.5 h-3.5 text-purple-400" />,
      component: (
        <div className="h-full w-full overflow-hidden">
          <ClipboardBeam
            onBeamText={handleBeamText}
            onFetchClipboard={handleFetchClipboard}
            pcClipboardText={pcClipboardText}
          />
        </div>
      ),
    },
    {
      id: 'sprint-timer',
      title: 'Focus Sprint Timer',
      shortLabel: 'Sprint Timer',
      icon: <Timer className="w-3.5 h-3.5 text-rose-400" />,
      component: (
        <div className="h-full w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden">
          <FlipClock isActive={rightWidgetIndex === 3} />
        </div>
      ),
    },
  ];

  const presetModes = [
    { id: 'clock', label: 'Clock', icon: <Clock className="w-3 h-3" />, left: 0, right: 0 },
    { id: 'media', label: 'Music & Stats', icon: <Music className="w-3 h-3" />, left: 1, right: 0 },
    { id: 'ai', label: 'AI Mission Control', icon: <Bot className="w-3 h-3" />, left: 2, right: 1 },
    { id: 'workstation', label: 'Workstation', icon: <Zap className="w-3 h-3" />, left: 3, right: 2 },
  ];

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

      {/* StandBy Dual Widget Stage (Fixed in Viewport - Webpage does NOT scroll) */}
      <main className="flex-1 min-h-0 w-full p-2 sm:p-3 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-6xl h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-4 items-stretch overflow-hidden">
          {/* Left Swipable Widget Slot */}
          <div className="h-full min-h-0 rounded-2xl overflow-hidden border border-[#1b1b24] bg-[#070709] shadow-2xl flex flex-col">
            <WidgetDeck
              items={leftWidgetItems}
              currentIndex={leftWidgetIndex}
              onIndexChange={setLeftWidgetIndex}
            />
          </div>

          {/* Right Swipable Widget Slot */}
          <div className="h-full min-h-0 rounded-2xl overflow-hidden border border-[#1b1b24] bg-[#070709] shadow-2xl flex flex-col">
            <WidgetDeck
              items={rightWidgetItems}
              currentIndex={rightWidgetIndex}
              onIndexChange={setRightWidgetIndex}
            />
          </div>
        </div>
      </main>

      {/* StandBy Quick Mode Selector (Bottom Bar) */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-black z-30 shrink-0 border-t border-[#121216] overflow-x-auto no-scrollbar">
        {presetModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              setLeftWidgetIndex(mode.left);
              setRightWidgetIndex(mode.right);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono transition-all duration-150 shrink-0 ${
              leftWidgetIndex === mode.left && rightWidgetIndex === mode.right
                ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                : 'bg-[#0f0f13] text-neutral-400 hover:text-white border border-[#202028]'
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
