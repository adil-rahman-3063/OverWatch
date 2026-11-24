import React from 'react';
import { 
  Check, 
  X, 
  Terminal, 
  Folder, 
  ShieldCheck,
  ShieldAlert
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
      <div className="deck-panel rounded-xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#1e1e24] text-neutral-400 flex items-center justify-center mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <h3 className="text-xs font-mono font-medium text-neutral-300">
          Command gate standing by
        </h3>
        <p className="text-[11px] text-neutral-500 font-mono mt-1 max-w-[220px]">
          Tool execution requests from Antigravity & Claude Code will pause here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="deck-panel rounded-xl p-4 flex flex-col justify-between h-full min-h-[300px] border-amber-500/40">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e24]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono font-medium text-amber-300">
              Command approval ({pendingRequests.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Awaiting tap
          </span>
        </div>

        {pendingRequests.map((req) => (
          <div key={req.id} className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300 font-medium">
                {req.agent || 'Agent'}
              </span>
              <span className="text-[11px] text-neutral-400 px-1.5 py-0.5 rounded bg-[#16161c] border border-neutral-800">
                {req.tool}
              </span>
            </div>

            {req.cwd && (
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono truncate bg-[#050507] p-2 rounded border border-[#1a1a20]">
                <Folder className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                <span className="truncate">{req.cwd}</span>
              </div>
            )}

            <div className="bg-[#050507] rounded-lg p-2.5 border border-[#1e1e24] font-mono text-xs text-neutral-200 break-all max-h-36 overflow-y-auto">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 mb-1">
                <Terminal className="w-2.5 h-2.5 text-neutral-500" />
                <span>Command</span>
              </div>
              <code className="text-emerald-400">{req.command || '(no arguments)'}</code>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => onDecision(req.id, 'deny')}
                className="h-11 rounded-lg bg-[#0e0e12] border border-rose-500/30 hover:border-rose-500 text-rose-400 font-mono text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Deny</span>
              </button>

              <button
                onClick={() => onDecision(req.id, 'allow')}
                className="h-11 rounded-lg bg-[#0e0e12] border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 font-mono text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Allow</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
