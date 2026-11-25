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
  FolderGit2,
  ClipboardCheck
} from 'lucide-react';
import { AgentSessionState } from '../types.ts';

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
  const [copied, setCopied] = useState(false);
  const [beamedPush, setBeamedPush] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diffX < -40) {
      handleNextSession();
    } else if (diffX > 40) {
      handlePrevSession();
    }
    touchStartXRef.current = null;
  };

  const isRunning = currentSession?.status === 'running';
  const isAwaiting = currentSession?.status === 'awaiting_approval';

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
        return <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'edit_file':
      case 'write_file':
        return <FileCode className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'read_file':
      case 'search_web':
        return <Search className="w-3 h-3 text-purple-400 shrink-0" />;
      default:
        return <Cpu className="w-3 h-3 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div 
      className="bg-[#08080a] border border-[#181822] rounded-2xl p-3 sm:p-4 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle background ambient pulse when running */}
      {isRunning && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      )}
      {isAwaiting && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-[#14141c]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#111118] border border-[#22222e] text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                <span>Antigravity</span>
                <span className="text-[10px] text-neutral-500 font-normal">SESSION</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
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

          {/* Live Status Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-medium ${statusColor}`}>
            <span className="relative flex h-2 w-2">
              {(isRunning || isAwaiting) && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
            </span>
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* WORKSPACE FILE PATH BAR (Shows which project is active & swipable) */}
        <div className="mt-2 p-2 rounded-xl bg-[#0a0a0f] border border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#14141e] text-cyan-400 shrink-0">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider truncate">
                  {currentSession?.workspaceName || currentSession?.workspace?.split(/\\|\//).pop() || 'Workspace'}
                </span>
                {totalSessions > 1 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {selectedIdx + 1} of {totalSessions}
                  </span>
                )}
              </div>
              <p className="text-[9px] font-mono text-neutral-400 truncate" title={currentSession?.workspace}>
                {currentSession?.workspace || 'Active Project Directory'}
              </p>
            </div>
          </div>

          {/* Left / Right Carousel Switchers if multiple sessions running */}
          {totalSessions > 1 && (
            <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-lg border border-neutral-800 shrink-0 ml-2">
              <button
                onClick={handlePrevSession}
                disabled={selectedIdx === 0}
                className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 active:scale-95 transition-all"
                title="Swipe left to previous session"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextSession}
                disabled={selectedIdx === totalSessions - 1}
                className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 active:scale-95 transition-all"
                title="Swipe right to next session"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Current User Task / Goal Quote */}
        <div className="mt-2 p-2 rounded-xl bg-[#0d0d12] border border-[#1a1a24] text-left">
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>CURRENT OBJECTIVE</span>
          </div>
          <p className="text-xs text-neutral-200 line-clamp-2 font-sans font-medium leading-relaxed">
            {currentSession?.currentTask || 'Idle — ready for next instruction.'}
          </p>
        </div>

        {/* Active Tool Execution Banner (if running or awaiting) */}
        {(isRunning || isAwaiting) && currentSession?.currentTool && (
          <div className="mt-2 p-2 rounded-lg bg-[#0e1217] border border-cyan-500/30 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-cyan-300 font-bold">{currentSession.currentTool}:</span>
              <span className="text-neutral-300 truncate">
                {currentSession.currentCommand || 'Executing...'}
              </span>
            </div>
          </div>
        )}

        {/* GitHub Push Reminder (Beams to Windows Clipboard - Does NOT auto-run) */}
        {currentSession?.gitStatus?.hasChanges && !isRunning && (
          <div className="mt-2 p-2 rounded-xl bg-[#0f141a] border border-amber-500/40 relative overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>TASK FINISHED • PUSH TO GITHUB</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentSession.gitStatus.uncommittedCount} modified
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#07090d] p-1.5 rounded-lg border border-[#1b222d] mb-1.5 font-mono text-[10px] text-neutral-300">
              <span className="truncate flex-1">{currentSession.gitStatus.suggestedPushCommand}</span>
              <button
                onClick={() => {
                  if (currentSession?.gitStatus?.suggestedPushCommand) {
                    navigator.clipboard.writeText(currentSession.gitStatus.suggestedPushCommand);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white shrink-0"
                title="Copy command"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <button
              onClick={() => {
                if (onGitPush && currentSession?.gitStatus?.suggestedPushCommand) {
                  onGitPush(currentSession.gitStatus.suggestedPushCommand, currentSession.workspace);
                  setBeamedPush(true);
                  setTimeout(() => setBeamedPush(false), 2500);
                }
              }}
              disabled={isPushing}
              className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {beamedPush ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5 text-black" />
                  <span>Beamed & Copied to Windows Clipboard!</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Beam Push Command to PC (Safe Copy)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Live Recent Action Stream */}
      <div className="my-2 flex-1 min-h-0 flex flex-col justify-end overflow-hidden">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1 block">
          Recent Activity Log
        </span>
        <div className="space-y-1 overflow-hidden">
          {currentSession?.recentActions && currentSession.recentActions.length > 0 ? (
            currentSession.recentActions.slice(0, 3).map((action, i) => (
              <div
                key={action.id || i}
                className="flex items-center justify-between text-[11px] font-mono bg-[#0b0b0f] px-2 py-1 rounded-lg border border-[#16161f]"
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
            <div className="text-[10px] font-mono text-neutral-600 py-1.5 text-center">
              No recent tool executions recorded
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="pt-2 border-t border-[#14141c] flex items-center justify-between text-[10px] font-mono text-neutral-500 shrink-0">
        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
          <span className="text-neutral-400">Target:</span>
          <span className="text-white truncate font-bold font-mono">
            {currentSession?.workspaceName || 'OverWatch'}
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

