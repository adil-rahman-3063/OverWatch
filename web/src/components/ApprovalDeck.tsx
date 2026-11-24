import React from 'react';
import { 
  Check, 
  X, 
  Terminal, 
  Folder, 
  Bot, 
  ShieldCheck 
} from 'lucide-react';
import { PermissionRequest } from '../types.ts';

interface ApprovalDeckProps {
  requests: PermissionRequest[];
  onDecision: (requestId: string, decision: 'allow' | 'deny') => void;
}

export const ApprovalDeck: React.FC<ApprovalDeckProps> = ({ requests, onDecision }) => {
  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (pendingRequests.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-center border-dashed border-white/10">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          Agent Command Gate
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
          Standing by. Tool executions from Antigravity & Claude Code will appear here for one-tap approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Pending Approval ({pendingRequests.length})
          </h2>
        </div>
        <span className="text-[10px] text-amber-400/80 font-mono">Tap Allow / Deny</span>
      </div>

      {pendingRequests.map((req) => (
        <div 
          key={req.id} 
          className="glass-panel rounded-2xl p-4 border-amber-500/30 bg-gradient-to-b from-deck-900 to-deck-950 shadow-2xl shadow-amber-500/10 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Top agent and tool badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {req.agent || 'Agent'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              {req.tool}
            </span>
          </div>

          {/* Working directory */}
          {req.cwd && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mb-2 truncate">
              <Folder className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="truncate">{req.cwd}</span>
            </div>
          )}

          {/* Command preview box */}
          <div className="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-xs text-emerald-400 break-all my-2 relative max-h-36 overflow-y-auto">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
              <Terminal className="w-3 h-3 text-slate-400" />
              <span>COMMAND EXECUTION</span>
            </div>
            <code>{req.command || '(no command arguments)'}</code>
          </div>

          {/* Large Tactile Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3 pt-1">
            <button
              onClick={() => onDecision(req.id, 'deny')}
              className="h-12 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>DENY</span>
            </button>

            <button
              onClick={() => onDecision(req.id, 'allow')}
              className="h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>ALLOW</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
