import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  FileCode, 
  Search, 
  GitBranch, 
  UploadCloud, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FolderGit2,
  ClipboardCheck
} from 'lucide-react';
import { AgentSessionState } from './types.ts';

interface AgentSessionCardProps {
  session?: AgentSessionState | null;
  onGitPush?: (commitMessage?: string, workspace?: string) => void;
  onSelectSession?: (session: AgentSessionState) => void;
  isPushing?: boolean;
}

export const AgentSessionCard: React.FC<AgentSessionCardProps> = ({ 
  session, 
  onGitPush, 
  onSelectSession,
  isPushing 
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [viewIndex, setViewIndex] = useState<number>(0); // 0: Overview, 1: Running Command, 2: Activity Logs
  const [copied, setCopied] = useState(false);
  const [beamedPush, setBeamedPush] = useState(false);
  
  // Card vertical swipe tracker
  const cardTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  // File Path Box horizontal swipe tracker
  const pathTouchStartXRef = useRef<number | null>(null);
  const pathTouchStartYRef = useRef<number | null>(null);
  const [pathDragOffset, setPathDragOffset] = useState<number>(0);

  // Derive sessions list: use session.sessions if available, or fallback to single
  const sessionList: AgentSessionState[] = 
    session?.sessions && session.sessions.length > 0
      ? session.sessions
      : session
      ? [session]
      : [];

  const totalSessions = sessionList.length;

  useEffect(() => {
    if (selectedIdx >= totalSessions && totalSessions > 0) {
      setSelectedIdx(0);
    }
  }, [totalSessions, selectedIdx]);

  const currentSession = sessionList[selectedIdx] || session;

  const isRunning = currentSession?.status === 'running';
  const isAwaiting = currentSession?.status === 'awaiting_approval';

  // Automatically flip to Running Command view (1) when a command begins executing
  useEffect(() => {
    if (isRunning || isAwaiting) {
      setViewIndex(1);
    }
  }, [isRunning, isAwaiting]);

  const handlePrevSession = () => {
    if (selectedIdx > 0) {
      const newIdx = selectedIdx - 1;
      setSelectedIdx(newIdx);
      if (onSelectSession && sessionList[newIdx]) {
        onSelectSession(sessionList[newIdx]);
      }
      if (navigator.vibrate) navigator.vibrate(25);
    }
  };

  const handleNextSession = () => {
    if (selectedIdx < totalSessions - 1) {
      const newIdx = selectedIdx + 1;
      setSelectedIdx(newIdx);
      if (onSelectSession && sessionList[newIdx]) {
        onSelectSession(sessionList[newIdx]);
      }
      if (navigator.vibrate) navigator.vibrate(25);
    }
  };

  // =========================================================================
  // 1. FILE PATH BOX SWIPE (Horizontal ONLY for switching sessions)
  // =========================================================================
  const handlePathTouchStart = (e: React.TouchEvent) => {
    if (totalSessions > 1) {
      e.stopPropagation();
      pathTouchStartXRef.current = e.touches[0].clientX;
      pathTouchStartYRef.current = e.touches[0].clientY;
      setPathDragOffset(0);
    }
  };

  const handlePathTouchMove = (e: React.TouchEvent) => {
    if (totalSessions > 1 && pathTouchStartXRef.current !== null) {
      const diffX = e.touches[0].clientX - pathTouchStartXRef.current;
      const diffY = e.touches[0].clientY - (pathTouchStartYRef.current || 0);

      // If moving horizontally, stop propagation so nothing else scrolls
      if (Math.abs(diffX) > Math.abs(diffY)) {
        e.stopPropagation();
        // Rubberband resistance at ends
        let offset = diffX;
        if ((selectedIdx === 0 && diffX > 0) || (selectedIdx === totalSessions - 1 && diffX < 0)) {
          offset = diffX * 0.3;
        }
        setPathDragOffset(offset);
      }
    }
  };

  const handlePathTouchEnd = (e: React.TouchEvent) => {
    if (totalSessions > 1 && pathTouchStartXRef.current !== null) {
      e.stopPropagation();
      const diffX = e.changedTouches[0].clientX - pathTouchStartXRef.current;
      pathTouchStartXRef.current = null;
      pathTouchStartYRef.current = null;
      setPathDragOffset(0);

      if (Math.abs(diffX) > 35) {
        if (diffX < 0) {
          handleNextSession();
        } else {
          handlePrevSession();
        }
      }
    }
  };

  // =========================================================================
  // 2. CARD VERTICAL SWIPE (Up/Down to switch Overview <-> Command <-> Logs)
  // =========================================================================
  const handleCardTouchStart = (e: React.TouchEvent) => {
    cardTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (!cardTouchStartRef.current) return;
    const diffX = e.changedTouches[0].clientX - cardTouchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - cardTouchStartRef.current.y;
    cardTouchStartRef.current = null;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Only intercept VERTICAL swipe on the card body!
    if (absY > 30 && absY > absX * 1.1) {
      e.stopPropagation();
      if (diffY < 0) {
        // Swipe UP -> go to next view (Overview -> Command -> Logs)
        setViewIndex((prev) => {
          const next = Math.min(2, prev + 1);
          if (next !== prev && navigator.vibrate) navigator.vibrate(20);
          return next;
        });
      } else {
        // Swipe DOWN -> go to prev view (Logs -> Command -> Overview)
        setViewIndex((prev) => {
          const next = Math.max(0, prev - 1);
          if (next !== prev && navigator.vibrate) navigator.vibrate(20);
          return next;
        });
      }
      return;
    }

    // Horizontal swipes outside the File Path Box do NOT stopPropagation,
    // so they bubble up to App.tsx and slide the 4 StandBy pages!
  };

  const statusLabel = isAwaiting ? 'AWAITING APPROVAL' : isRunning ? 'RUNNING' : 'IDLE';
  const statusColor = isAwaiting
    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    : isRunning
    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    : 'text-neutral-500 border-neutral-800 bg-[#0c0c10]';

  const dotColor = isAwaiting ? 'bg-amber-400' : isRunning ? 'bg-emerald-400' : 'bg-neutral-600';

  const formatModel = (m?: string) => {
    if (!m) return 'Gemini Flash';
    if (m.includes('3.8-flash')) return 'Gemini 3.8 Flash';
    if (m.includes('pro')) return 'Gemini 3.1 Pro';
    if (m.includes('claude')) return 'Claude 3.7';
    return m;
  };

  const getToolIcon = (tool?: string) => {
    switch (tool) {
      case 'run_command':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'edit_file':
      case 'write_file':
        return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'read_file':
      case 'search_web':
        return <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
  };

  const activeCommandStr =
    currentSession?.currentCommand ||
    (currentSession?.recentActions && currentSession.recentActions.length > 0
      ? currentSession.recentActions[0].detail
      : '');

  const cachedName = typeof window !== 'undefined' ? localStorage.getItem('overwatch_last_workspace_name') : null;
  const cachedPath = typeof window !== 'undefined' ? localStorage.getItem('overwatch_last_workspace_path') : null;

  const displayWorkspaceName = 
    currentSession?.workspaceName || 
    (currentSession?.workspace ? currentSession.workspace.split(/[/\\]/).pop() : null) || 
    cachedName || 
    'OverWatch';

  const displayWorkspacePath = 
    currentSession?.workspace || 
    cachedPath || 
    'c:\\Users\\adilr\\Documents\\open-source\\OverWatch';

  return (
    <div 
      className="bg-[#08080a] border border-[#181822] rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden select-none"
      onTouchStart={handleCardTouchStart}
      onTouchEnd={handleCardTouchEnd}
    >
      {/* Subtle background ambient pulse when running */}
      {isRunning && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      )}
      {isAwaiting && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header - Pinned at top */}
      <div className="shrink-0 pb-1.5 sm:pb-2 border-b border-[#14141c]">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 rounded-lg bg-[#111118] border border-[#22222e] text-cyan-400 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-white tracking-wider uppercase">
                  Antigravity
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full border text-[8px] font-mono font-medium ${statusColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isRunning || isAwaiting ? 'animate-ping' : ''}`} />
                  <span>{statusLabel}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-400 truncate">
                <span>{formatModel(currentSession?.model)}</span>
                {currentSession?.stepCount ? (
                  <>
                    <span>•</span>
                    <span className="text-neutral-500">Step #{currentSession.stepCount}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Vertical View Navigator Pills */}
          <div className="flex items-center gap-0.5 bg-[#101015] p-0.5 rounded-lg border border-[#1e1e28] shrink-0">
            <button
              onClick={() => setViewIndex(0)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all ${
                viewIndex === 0 ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Mission Overview"
            >
              Overview
            </button>
            <button
              onClick={() => setViewIndex(1)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all flex items-center gap-0.5 ${
                viewIndex === 1 ? 'bg-cyan-400 text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Running Command"
            >
              {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
              Command
            </button>
            <button
              onClick={() => setViewIndex(2)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all ${
                viewIndex === 2 ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Activity Logs"
            >
              Logs
            </button>
          </div>
        </div>
      </div>

      {/* Vertical View Stages (Swipable UP and DOWN) */}
      <div className="flex-1 min-h-0 relative overflow-hidden py-1.5 select-text font-mono">
        {/* ========================================================================= */}
        {/* VIEW 0: MISSION OVERVIEW & SWIPABLE FILE PATH BOX                         */}
        {/* ========================================================================= */}
        {viewIndex === 0 && (
          <div className="h-full flex flex-col justify-start gap-1.5 sm:gap-2 animate-in fade-in duration-150 overflow-y-auto no-scrollbar">
            {/* WORKSPACE FILE PATH BOX (Strictly Swipable Left & Right for Multiple Sessions) */}
            <div 
              onTouchStart={handlePathTouchStart}
              onTouchMove={handlePathTouchMove}
              onTouchEnd={handlePathTouchEnd}
              style={{ transform: `translateX(${pathDragOffset}px)` }}
              className={`shrink-0 p-2 sm:p-2.5 rounded-xl bg-[#0a0a0f] border transition-transform duration-75 relative overflow-hidden cursor-grab active:cursor-grabbing ${
                totalSessions > 1 
                  ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.08)] ring-1 ring-cyan-500/20' 
                  : 'border-[#1c1c28]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#14141e] text-cyan-400 shrink-0">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-white uppercase tracking-wider truncate">
                        {displayWorkspaceName}
                      </span>
                      {totalSessions > 1 && (
                        <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shrink-0">
                          {selectedIdx + 1}/{totalSessions}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-neutral-400 truncate mt-0.5" title={displayWorkspacePath}>
                      {displayWorkspacePath}
                    </p>
                  </div>
                </div>

                {/* Left/Right Switch Controls for Multiple Sessions */}
                {totalSessions > 1 && (
                  <div className="flex items-center gap-1 bg-[#12121a] p-0.5 rounded-lg border border-neutral-800 shrink-0 ml-1.5">
                    <button
                      onClick={handlePrevSession}
                      disabled={selectedIdx === 0}
                      className="p-1 rounded hover:bg-neutral-800 disabled:opacity-25 text-neutral-300 active:scale-95 transition-all"
                      title="Previous workspace session"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[8.5px] font-mono text-neutral-500 px-0.5">
                      {selectedIdx + 1}/{totalSessions}
                    </span>
                    <button
                      onClick={handleNextSession}
                      disabled={selectedIdx === totalSessions - 1}
                      className="p-1 rounded hover:bg-neutral-800 disabled:opacity-25 text-neutral-300 active:scale-95 transition-all"
                      title="Next workspace session"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Swipe Cue Banner if multiple sessions */}
              {totalSessions > 1 && (
                <div className="mt-1.5 pt-1 border-t border-[#161622] flex items-center justify-between text-[8px] font-mono text-cyan-400/80">
                  <span className="flex items-center gap-1">
                    <ChevronLeft className="w-2.5 h-2.5 animate-pulse" />
                    Swipe box left/right to switch active session
                    <ChevronRight className="w-2.5 h-2.5 animate-pulse" />
                  </span>
                  <span className="text-neutral-500">commands beam to selected</span>
                </div>
              )}
            </div>

            {/* Current Objective */}
            <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-[#0d0d12] border border-[#1a1a24] text-left">
              <div className="flex items-center gap-1 text-[9.5px] font-mono text-neutral-500 mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>CURRENT OBJECTIVE</span>
              </div>
              <p className="text-[11px] text-neutral-200 line-clamp-2 font-sans font-medium leading-relaxed">
                {currentSession?.currentTask || 'Idle — waiting for next instruction.'}
              </p>
            </div>

            {/* Running Command Teaser (Tap or Swipe Up) */}
            <div 
              onClick={() => setViewIndex(1)}
              className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-[#05070a] border border-cyan-900/40 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="overflow-hidden truncate">
                  <span className="text-[9.5px] text-cyan-400 font-bold block">
                    {isRunning ? 'ACTIVE RUNNING COMMAND' : 'LATEST COMMAND'}
                  </span>
                  <span className="text-[9.5px] text-neutral-300 truncate font-mono block">
                    {activeCommandStr || 'No active terminal command'}
                  </span>
                </div>
              </div>
              <span className="text-[8.5px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-[#0d0d14] border border-[#202028] shrink-0 ml-1.5 flex items-center gap-0.5">
                <span>View</span>
                <ChevronUp className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: RUNNING COMMAND / FULL TERMINAL EXECUTION                          */}
        {/* ========================================================================= */}
        {viewIndex === 1 && (
          <div className="h-full flex flex-col justify-between space-y-2 animate-in fade-in duration-150">
            {/* Top Command Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRunning ? 'EXECUTING IN TERMINAL' : 'COMMAND INSPECTOR'}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500">
                <span>View 2 of 3</span>
              </div>
            </div>

            {/* Full Monospace Command Box */}
            <div className="flex-1 min-h-0 bg-[#020406] border border-cyan-950/80 rounded-xl p-2.5 overflow-y-auto space-y-2 select-text">
              <div className="flex items-center justify-between border-b border-[#0f1b26] pb-1 text-[10px] text-neutral-500">
                <span className="text-cyan-400 font-mono">
                  {currentSession?.currentTool || 'terminal'}
                </span>
                <button
                  onClick={() => {
                    if (activeCommandStr) {
                      navigator.clipboard.writeText(activeCommandStr);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }
                  }}
                  className="flex items-center gap-1 text-neutral-400 hover:text-white"
                  title="Copy command"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="font-mono text-xs text-emerald-400 break-all leading-relaxed whitespace-pre-wrap">
                <code>{activeCommandStr || 'No command currently executing. System idle.'}</code>
              </div>
            </div>

            {/* View Navigation Helpers */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setViewIndex(0)}
                className="flex-1 py-1 rounded-lg bg-[#0e0e14] border border-[#20202c] text-neutral-400 hover:text-white text-[10px] font-mono flex items-center justify-center gap-1"
              >
                <ChevronUp className="w-3 h-3 text-neutral-500" />
                <span>Swipe ↓ Overview</span>
              </button>
              <button
                onClick={() => setViewIndex(2)}
                className="flex-1 py-1 rounded-lg bg-[#0e0e14] border border-[#20202c] text-neutral-400 hover:text-white text-[10px] font-mono flex items-center justify-center gap-1"
              >
                <span>Swipe ↑ Logs</span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: RECENT TERMINAL ACTIVITY LOGS & GIT PUSH                           */}
        {/* ========================================================================= */}
        {viewIndex === 2 && (
          <div className="h-full flex flex-col justify-between space-y-2 animate-in fade-in duration-150">
            {/* GitHub Push Reminder (Beams to Windows Clipboard - Safe) */}
            {currentSession?.gitStatus?.hasChanges && !isRunning && (
              <div className="p-2 rounded-xl bg-[#0f141a] border border-amber-500/40 relative overflow-hidden space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300">
                    <GitBranch className="w-3 h-3 text-amber-400" />
                    <span>TASK FINISHED • PUSH TO GITHUB</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentSession.gitStatus.uncommittedCount} modified
                  </span>
                </div>

                {currentSession.gitStatus.commitMessage && (
                  <div className="text-[9.5px] font-mono text-neutral-300 bg-black/60 px-2 py-1 rounded border border-neutral-800 truncate">
                    <span className="text-amber-400 font-semibold">Commit: </span>
                    <span>"{currentSession.gitStatus.commitMessage}"</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (onGitPush && currentSession?.gitStatus?.suggestedPushCommand) {
                      onGitPush(currentSession.gitStatus.suggestedPushCommand, currentSession.workspace);
                      setBeamedPush(true);
                      setTimeout(() => setBeamedPush(false), 2500);
                    }
                  }}
                  disabled={isPushing}
                  className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-mono font-bold text-[10px] flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all disabled:opacity-50"
                >
                  {beamedPush ? (
                    <>
                      <ClipboardCheck className="w-3.5 h-3.5 text-black" />
                      <span>Beamed to Windows Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Beam Push Command to PC Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Scrollable Activity History List */}
            <div className="flex-1 min-h-0 bg-[#050507] border border-[#16161f] rounded-xl p-2 overflow-y-auto space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                Recent Terminal Activity Log
              </span>
              {currentSession?.recentActions && currentSession.recentActions.length > 0 ? (
                currentSession.recentActions.map((action, i) => (
                  <div
                    key={action.id || i}
                    className="flex items-center justify-between text-[10px] font-mono bg-[#0b0b0f] px-2 py-1.5 rounded-lg border border-[#14141c]"
                  >
                    <div className="flex items-center gap-2 overflow-hidden truncate">
                      {getToolIcon(action.tool)}
                      <span className="text-neutral-300 truncate text-[10px]">{action.detail}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-500 shrink-0 ml-2">
                      {action.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {action.status === 'running' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                      {action.status === 'denied' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-mono text-neutral-600 py-3 text-center">
                  No recent tool executions recorded
                </div>
              )}
            </div>

            {/* Swipe Down Navigation Prompt */}
            <button
              onClick={() => setViewIndex(1)}
              className="w-full py-1 rounded-lg bg-[#0e0e14] border border-[#20202c] text-neutral-400 hover:text-white text-[10px] font-mono flex items-center justify-center gap-1"
            >
              <ChevronUp className="w-3 h-3 text-cyan-400" />
              <span>Swipe ↓ to inspect running command</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="pt-2 border-t border-[#14141c] flex items-center justify-between text-[10px] font-mono text-neutral-500 shrink-0">
        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
          <span className="text-neutral-400">Target:</span>
          <span className="text-white truncate font-bold font-mono">
            {displayWorkspaceName}
          </span>
        </div>
        {currentSession?.cacheTokens ? (
          <div className="flex items-center gap-1 text-neutral-400">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>~{Math.round(currentSession.cacheTokens / 1000)}k ctx</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
