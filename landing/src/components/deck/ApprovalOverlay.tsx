import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Check, X, Terminal, Folder, Bot, SkipForward, Minimize2, FileText } from 'lucide-react';
import { PermissionRequest } from './types.ts';
import { playAlertRingtone } from './sound.ts';

interface ApprovalOverlayProps {
  requests: PermissionRequest[];
  onDecision: (requestId: string, decision: 'allow' | 'deny' | 'skip') => void;
  onDismiss?: (requestId: string) => void;
}

export const ApprovalOverlay: React.FC<ApprovalOverlayProps> = ({ requests, onDecision }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // Filter only active pending requests (ignore anything older than 60s)
  const now = Date.now();
  const pendingRequests = requests.filter((r) => {
    if (r.status !== 'pending') return false;
    if (r.createdAt) {
      const age = now - new Date(r.createdAt).getTime();
      return age < 60000;
    }
    return true;
  });

  const activeRequest = pendingRequests[0];
  const totalPending = pendingRequests.length;

  // Reset 20s timer when a new request arrives
  useEffect(() => {
    if (totalPending > 0) {
      setSecondsRemaining(20);
      setIsPaused(false);
      try {
        playAlertRingtone();
      } catch {}
    }
  }, [activeRequest?.id, totalPending]);

  // 20-second countdown to auto-minimize to bottom right
  useEffect(() => {
    if (totalPending === 0) return;

    if (!isMinimized && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsMinimized(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMinimized, isPaused, totalPending]);

  if (totalPending === 0) return null;

  // =========================================================================
  // MINIMIZED STATE: Floating circle docked at bottom right
  // =========================================================================
  if (isMinimized) {
    return (
      <div className="absolute bottom-3 right-3 z-50 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
        <button
          onClick={() => {
            setIsMinimized(false);
            setSecondsRemaining(20);
          }}
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0a0a0f] border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] active:scale-95 transition-all text-amber-400 group"
          title="Open agent command approvals"
        >
          {/* Subtle pulsating outer ring */}
          <span className="absolute -inset-1 rounded-full bg-amber-500/20 animate-ping opacity-75" />
          
          <ShieldAlert className="w-5 h-5 text-amber-400 relative z-10" />

          {/* Badge count */}
          <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-black z-20">
            {totalPending}
          </span>
        </button>
      </div>
    );
  }

  // =========================================================================
  // EXPANDED STATE: Full Approval Overlay Card (Viewport-Locked & Touch-Safe)
  // =========================================================================
  return (
    <div
      className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150 pointer-events-auto"
      onPointerDown={() => setIsPaused(true)}
    >
      <div className="w-full max-w-lg max-h-[96%] bg-[#09090c] border border-amber-500/60 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Top 20-Second Countdown Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 overflow-hidden z-10">
          <div
            className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsRemaining / 20) * 100}%` }}
          />
        </div>

        {/* Header - Pinned at Top (shrink-0) */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 pt-3.5 pb-2.5 border-b border-[#1c1c24] shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <h3 className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wider">
              {activeRequest?.tool?.includes('file') ? 'File Access Interlock' : 'Agent Command Interlock'} ({totalPending})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400">
              {isPaused ? 'Timer paused' : `${secondsRemaining}s`}
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Minimize to bottom right"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Area: Details & Command/File Preview */}
        {activeRequest && (
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-5 py-2.5 space-y-2 sm:space-y-2.5 overscroll-contain">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-neutral-200 font-medium">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                {activeRequest.agent || 'Agent'}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded border ${
                activeRequest.tool?.includes('file')
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-medium'
                  : 'bg-[#16161c] border-neutral-800 text-neutral-400'
              }`}>
                {activeRequest.tool}
              </span>
            </div>

            {activeRequest.cwd && (
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono truncate bg-[#050507] p-2 rounded-lg border border-[#1a1a20]">
                <Folder className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                <span className="truncate">{activeRequest.cwd}</span>
              </div>
            )}

            <div className="bg-[#050507] rounded-xl p-2.5 sm:p-3 border border-[#1e1e24] font-mono text-xs text-neutral-200 break-all max-h-24 sm:max-h-36 overflow-y-auto">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 mb-1">
                {activeRequest.tool?.includes('file') ? (
                  <>
                    <FileText className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-amber-400/90 font-medium">
                      {activeRequest.tool === 'read_file'
                        ? 'External File Read'
                        : activeRequest.tool === 'write_file'
                        ? 'File Creation / Overwrite'
                        : 'File Modification'}
                    </span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-2.5 h-2.5 text-neutral-500" />
                    <span>Command execution</span>
                  </>
                )}
              </div>
              <code className={activeRequest.tool?.includes('file') ? 'text-amber-300 font-medium' : 'text-emerald-400 font-medium'}>
                {activeRequest.command || '(no target details)'}
              </code>
            </div>
          </div>
        )}

        {/* Pinned Action Controls - ALWAYS Visible and Touchable in Viewport (shrink-0) */}
        {activeRequest && (
          <div className="px-3.5 sm:px-5 pb-3 sm:pb-4 pt-2 border-t border-[#1c1c24] bg-[#09090c] shrink-0 space-y-2">
            {totalPending > 1 && (
              <button
                onClick={() => {
                  pendingRequests.forEach((req) => onDecision(req.id, 'allow'));
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20 active:scale-98 font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                <span>Approve All ({totalPending}) Pending Commands</span>
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <button
                onClick={() => onDecision(activeRequest.id, 'skip')}
                className="h-10 sm:h-11 rounded-xl bg-[#121217] border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-mono text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                title="Dismiss from phone (decide on laptop)"
              >
                <SkipForward className="w-3.5 h-3.5 text-neutral-400" />
                <span>Skip</span>
              </button>

              <button
                onClick={() => onDecision(activeRequest.id, 'deny')}
                className="h-10 sm:h-11 rounded-xl bg-[#140b0e] border border-rose-500/50 hover:border-rose-500 text-rose-400 font-mono text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
                <span>Deny</span>
              </button>

              <button
                onClick={() => onDecision(activeRequest.id, 'allow')}
                className="h-10 sm:h-11 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-white/10"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Allow</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
