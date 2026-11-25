import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Clock, Music, Zap, ShieldAlert, Volume2, VolumeX, Lock, Sparkles 
} from 'lucide-react';
import { FlipClock } from './deck/FlipClock.tsx';
import { AgentSessionCard } from './deck/AgentSessionCard.tsx';
import { AgentPromptDeck } from './deck/AgentPromptDeck.tsx';
import { MediaCard } from './deck/MediaCard.tsx';
import { HardwareTelemetry } from './deck/HardwareTelemetry.tsx';
import { MacroDeck } from './deck/MacroDeck.tsx';
import { ClipboardBeam } from './deck/ClipboardBeam.tsx';
import { ApprovalOverlay } from './deck/ApprovalOverlay.tsx';
import { AgentSessionState, MediaState, PermissionRequest, QuotaData, SystemStats } from './deck/types.ts';
import { playAlertRingtone } from './deck/sound.ts';

export const LiveDeckSimulator: React.FC = () => {
  const [activePageIndex, setActivePageIndex] = useState<number>(1); // Default to AI Mission Control
  const [activeWorkspace, setActiveWorkspace] = useState<string>('c:\\Users\\adilr\\Documents\\open-source\\OverWatch');
  const [isPushingGit, setIsPushingGit] = useState<boolean>(false);
  const [pcClipboardText, setPcClipboardText] = useState<string>('git push origin main');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // 1. Interactive Permission Requests (Gatekeeper Interlock)
  const [requests, setRequests] = useState<PermissionRequest[]>([
    {
      id: 'demo-req-1',
      agent: 'Antigravity Architect',
      tool: 'run_command',
      command: 'powershell -NoProfile -Command "npm --prefix landing run build"',
      cwd: 'c:\\Users\\adilr\\Documents\\open-source\\OverWatch',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ]);

  // 2. Interactive Media State with Multi-App Sessions (YouTube Music + Spotify)
  const [media, setMedia] = useState<MediaState>({
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    playbackStatus: 'Playing',
    sourceAppId: 'YouTube Music',
    sessions: [
      {
        index: 0,
        title: 'Midnight City',
        artist: 'M83',
        album: "Hurry Up, We're Dreaming",
        playbackStatus: 'Playing',
        sourceAppId: 'YouTube Music',
      },
      {
        index: 1,
        title: 'Resonance',
        artist: 'HOME',
        album: 'Odyssey',
        playbackStatus: 'Paused',
        sourceAppId: 'Spotify',
      },
    ],
    activeSessionIndex: 0,
  });

  // 3. Interactive Multi-Session AI State with dedicated workspaces
  const [session, setSession] = useState<AgentSessionState>({
    agent: 'Antigravity Assistant',
    conversationId: 'conv-overwatch-main',
    status: 'running',
    model: 'gemini-3.8-flash',
    stepCount: 8,
    currentTask: 'Recreate web deck inside landing simulator with responsive layout and touch swipe gestures',
    currentTool: 'run_command',
    currentCommand: 'powershell -NoProfile -Command "npm --prefix landing run build"',
    workspace: 'c:\\Users\\adilr\\Documents\\open-source\\OverWatch',
    workspaceName: 'OverWatch',
    lastActive: new Date().toISOString(),
    cacheTokens: 48500,
    gitStatus: {
      hasChanges: true,
      uncommittedCount: 3,
      unpushedCommitsCount: 1,
      suggestedPushCommand: 'git push origin main',
      branch: 'main',
    },
    recentActions: [
      {
        id: 'act-1',
        tool: 'run_command',
        detail: 'powershell -NoProfile -Command "npm --prefix landing run build"',
        status: 'running',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act-2',
        tool: 'write_file',
        detail: 'landing/src/components/LiveDeckSimulator.tsx',
        status: 'completed',
        timestamp: new Date(Date.now() - 30000).toISOString(),
      },
      {
        id: 'act-3',
        tool: 'write_file',
        detail: 'landing/src/components/deck/AgentSessionCard.tsx',
        status: 'completed',
        timestamp: new Date(Date.now() - 75000).toISOString(),
      },
      {
        id: 'act-4',
        tool: 'edit_file',
        detail: 'landing/src/index.css',
        status: 'completed',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
    ],
    sessions: [
      {
        agent: 'Antigravity Assistant',
        conversationId: 'conv-overwatch-main',
        status: 'running',
        model: 'gemini-3.8-flash',
        stepCount: 8,
        currentTask: 'Recreate web deck inside landing simulator with responsive layout and touch swipe gestures',
        currentTool: 'run_command',
        currentCommand: 'powershell -NoProfile -Command "npm --prefix landing run build"',
        workspace: 'c:\\Users\\adilr\\Documents\\open-source\\OverWatch',
        workspaceName: 'OverWatch',
        lastActive: new Date().toISOString(),
        cacheTokens: 48500,
        gitStatus: {
          hasChanges: true,
          uncommittedCount: 3,
          unpushedCommitsCount: 1,
          suggestedPushCommand: 'git push origin main',
          branch: 'main',
        },
        recentActions: [
          {
            id: 'act-1',
            tool: 'run_command',
            detail: 'powershell -NoProfile -Command "npm --prefix landing run build"',
            status: 'running',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'act-2',
            tool: 'write_file',
            detail: 'landing/src/components/LiveDeckSimulator.tsx',
            status: 'completed',
            timestamp: new Date(Date.now() - 30000).toISOString(),
          },
        ],
      },
      {
        agent: 'Antigravity Assistant',
        conversationId: 'conv-portfolio-deploy',
        status: 'idle',
        model: 'gemini-3.1-pro',
        stepCount: 14,
        currentTask: 'Deploy updated portfolio showcase at adilrahman.cc with OverWatch integration',
        currentTool: 'run_command',
        currentCommand: 'pnpm run build && pnpm run deploy',
        workspace: 'c:\\Users\\adilr\\Documents\\open-source\\portfolio',
        workspaceName: 'Portfolio',
        lastActive: new Date(Date.now() - 600000).toISOString(),
        cacheTokens: 32000,
        gitStatus: {
          hasChanges: false,
          uncommittedCount: 0,
          unpushedCommitsCount: 0,
          suggestedPushCommand: 'git push origin main',
          branch: 'main',
        },
        recentActions: [
          {
            id: 'act-p1',
            tool: 'run_command',
            detail: 'pnpm run deploy',
            status: 'completed',
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: 'act-p2',
            tool: 'edit_file',
            detail: 'src/pages/Projects.tsx',
            status: 'completed',
            timestamp: new Date(Date.now() - 800000).toISOString(),
          },
        ],
      },
    ],
  });

  // 4. Real-time Telemetry & Quotas
  const [stats] = useState<SystemStats>({
    cpuUsagePercent: 14,
    totalRamGb: 32,
    usedRamGb: 11.5,
    ramUsagePercent: 36,
    uptimeHours: 42,
    hostname: 'DESK-RIG-01',
  });

  const [quota] = useState<QuotaData>({
    antigravity: {
      fetchedAt: new Date().toISOString(),
      groups: [
        {
          name: 'Gemini Quota Group',
          description: 'Antigravity Developer Quota',
          buckets: [
            {
              id: 'bucket-flash',
              name: 'Gemini 2.5 Flash (5-Hour)',
              window: '5 hour',
              remaining_fraction: 0.78,
              reset_time: new Date(Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
            },
            {
              id: 'bucket-pro',
              name: 'Gemini 2.5 Pro (Weekly)',
              window: 'week',
              remaining_fraction: 0.92,
              reset_time: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 18 * 3600 * 1000).toISOString(),
            },
          ],
        },
      ],
    },
  });

  // Interactive Media Action Handler
  const handleMediaAction = (action: string, sessionIndex?: number) => {
    setMedia((prev) => {
      const sessions = prev.sessions ? [...prev.sessions] : [];
      const targetIdx = sessionIndex !== undefined ? sessionIndex : prev.activeSessionIndex || 0;
      const target = sessions[targetIdx];

      if (action === 'play_pause' && target) {
        target.playbackStatus = target.playbackStatus === 'Playing' ? 'Paused' : 'Playing';
      } else if (action === 'next' && target) {
        target.title = target.title === 'Midnight City' ? 'Outro' : 'Midnight City';
      } else if (action === 'prev' && target) {
        target.title = target.title === 'Outro' ? 'Midnight City' : 'Wait';
      }

      return {
        ...prev,
        playbackStatus: sessions[0]?.playbackStatus || prev.playbackStatus,
        sessions,
      };
    });
  };

  // Safe Remote Git Push (Beams directly to local & simulated PC clipboard)
  const handleRemoteGitPush = async (commandOrMessage?: string, workspaceOverride?: string) => {
    setIsPushingGit(true);
    const pushCmd = commandOrMessage && commandOrMessage.startsWith('git ')
      ? commandOrMessage
      : 'git push origin main';

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pushCmd);
      }
    } catch {}

    setPcClipboardText(pushCmd);

    setTimeout(() => {
      setIsPushingGit(false);
    }, 1500);
  };

  // Beam text to PC clipboard
  const handleBeamText = (text: string) => {
    setPcClipboardText(text);
  };

  // Quick prompt submission
  const handleSendPrompt = (prompt: string, autoSend: boolean) => {
    const newAction = {
      id: `act-${Date.now()}`,
      tool: 'user_prompt',
      detail: prompt,
      status: 'completed' as const,
      timestamp: new Date().toISOString(),
    };

    setSession((prev) => ({
      ...prev,
      stepCount: prev.stepCount + 1,
      currentTask: prompt,
      recentActions: [newAction, ...prev.recentActions.slice(0, 5)],
    }));
  };

  // Permission Interlock Decision
  const handleDecision = (requestId: string, decision: 'allow' | 'deny' | 'skip') => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: decision === 'allow' ? 'allowed' : decision === 'deny' ? 'denied' : 'expired' }
          : r
      )
    );
  };

  // Manual Trigger for Interlock Alert Sound & Dialog
  const triggerSimulatedInterlock = () => {
    if (!isSoundMuted) {
      try {
        playAlertRingtone();
      } catch {}
    }

    setRequests([
      {
        id: `req-${Date.now()}`,
        agent: 'Antigravity Autonomous Core',
        tool: 'run_command',
        command: 'powershell -NoProfile -Command "git push origin main"',
        cwd: activeWorkspace,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Stage Swipe Gesture Handlers (Left/Right to switch 4 StandBy pages)
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
        setActivePageIndex((prev) => Math.min(3, prev + 1));
      } else {
        setActivePageIndex((prev) => Math.max(0, prev - 1));
      }
    }
  };

  // Keyboard Navigation (ArrowLeft, ArrowRight, 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
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

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center select-none">
      {/* Top Interactive Screen Selector Tabs */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#09090c] border border-[#1b1b24] font-mono text-xs overflow-x-auto no-scrollbar">
          {[
            { id: 0, label: '01. Clock', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 1, label: '02. AI Mission Control', icon: <Bot className="w-3.5 h-3.5" /> },
            { id: 2, label: '03. Music & Stats', icon: <Music className="w-3.5 h-3.5" /> },
            { id: 3, label: '04. Workstation', icon: <Zap className="w-3.5 h-3.5" /> },
          ].map((screen) => (
            <button
              key={screen.id}
              onClick={() => {
                setActivePageIndex(screen.id);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                activePageIndex === screen.id
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-[#14141c]'
              }`}
            >
              <span>{screen.icon}</span>
              <span className="whitespace-nowrap">{screen.label}</span>
            </button>
          ))}
        </div>

        {/* Test Security Interlock Action Button */}
        <button
          onClick={triggerSimulatedInterlock}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-medium transition-all active:scale-95 shrink-0 ml-2"
          title="Simulate an agent command requiring approval"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Simulate Gatekeeper</span>
        </button>
      </div>

      {/* OLED Smartphone Frame (Fluid Height on mobile, Aspect 16:9 on desktop) */}
      <div className="relative w-full min-h-[480px] sm:min-h-[420px] md:min-h-0 md:aspect-[16/9] max-w-4xl rounded-2xl sm:rounded-[2.5rem] bg-[#000000] border-2 sm:border-4 border-[#20202c] shadow-[0_0_80px_rgba(255,255,255,0.03)] p-2 sm:p-3 flex flex-col overflow-hidden">
        {/* Subtle OLED Gloss Highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none rounded-[1.8rem] sm:rounded-[2.2rem]" />

        {/* Floating Permission Gatekeeper Interlock Modal */}
        <ApprovalOverlay requests={requests} onDecision={handleDecision} />

        {/* Top Minimal Status Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-black border-b border-[#14141c] shrink-0 font-mono text-[10px] tabular-nums z-20">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium tracking-wider">STANDBY • DESK-01</span>
            <span className="text-neutral-700 hidden sm:inline">•</span>
            <span className="text-neutral-400 hidden sm:inline">120Hz OLED</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-neutral-200 font-medium">PC Live</span>
            </div>
            <span className="text-neutral-500 hidden sm:inline">sub-50ms</span>

            {/* Mute/Sound Toggle */}
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="text-neutral-500 hover:text-white p-0.5"
              title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isSoundMuted ? <VolumeX className="w-3 h-3 text-neutral-600" /> : <Volume2 className="w-3 h-3 text-amber-400" />}
            </button>

            <span className="text-neutral-600 hover:text-neutral-400 p-0.5" title="Simulated Lock">
              <Lock className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* StandBy 4-Page Sliding Stage */}
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
                <FlipClock isActive={activePageIndex === 0 && !isSoundMuted} />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PAGE 2: AI Sessions & Prompt Deck (Swipable UP/DOWN for command inspection)*/}
            {/* ========================================================================= */}
            <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
              <div className="w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-3 items-stretch overflow-hidden">
                <div className="h-full min-h-0 overflow-hidden">
                  <AgentSessionCard
                    session={session}
                    onSelectSession={(sess) => {
                      if (sess?.workspace) setActiveWorkspace(sess.workspace);
                    }}
                    onGitPush={(customCmd) => handleRemoteGitPush(customCmd, activeWorkspace)}
                    isPushing={isPushingGit}
                  />
                </div>
                <div className="h-full min-h-0 overflow-hidden">
                  <AgentPromptDeck
                    onSendPrompt={(prompt, autoSend) => handleSendPrompt(prompt, autoSend)}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PAGE 3: Media Deck (50%) + PC Telemetry & Quota (50%)                     */}
            {/* ========================================================================= */}
            <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
              <div className="w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-3 items-stretch overflow-hidden">
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
            <div className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
              <div className="w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-3 items-stretch overflow-hidden">
                <div className="h-full min-h-0 overflow-hidden">
                  <MacroDeck onMacro={() => {}} />
                </div>
                <div className="h-full min-h-0 overflow-hidden">
                  <ClipboardBeam
                    onBeamText={handleBeamText}
                    onFetchClipboard={() => {}}
                    pcClipboardText={pcClipboardText}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Minimalist StandBy Indicator Dots (Zero clutter, maximum viewport height) */}
        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2 z-30 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#1c1c26]">
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
    </div>
  );
};
