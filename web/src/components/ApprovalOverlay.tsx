import React from 'react';
import { ShieldAlert, Check, X, Terminal, Folder, Bot } from 'lucide-react';
import { PermissionRequest } from '../types.ts';

interface ApprovalOverlayProps {
  requests: PermissionRequest[];
  onDecision: (requestId: string, decision: 'allow' | 'deny') => void;
}

export const ApprovalOverlay: React.FC<ApprovalOverlayProps> = ({ requests, onDecision }) => {
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (pendingRequests.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#09090b] border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e1e24]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wider">
              Agent command interlock ({pendingRequests.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            Action required
          </span>
        </div>

        {/* First Pending Request */}
        {pendingRequests.slice(0, 1).map((req) => (
          <div key={req.id} className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-neutral-200 font-medium">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                {req.agent || 'Agent'}
              </span>
              <span className="text-[11px] text-neutral-400 px-2 py-0.5 rounded bg-[#16161c] border border-neutral-800">
                {req.tool}
              </span>
            </div>

            {req.cwd && (
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono truncate bg-[#050507] p-2 rounded-lg border border-[#1a1a20]">
                <Folder className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                <span className="truncate">{req.cwd}</span>
              </div>
            )}

            <div className="bg-[#050507] rounded-xl p-3 border border-[#1e1e24] font-mono text-xs text-neutral-200 break-all max-h-48 overflow-y-auto">
              <div className="flex items-center gap-1 text-[9px] text-neutral-500 mb-1">
                <Terminal className="w-2.5 h-2.5 text-neutral-500" />
                <span>Command execution</span>
              </div>
              <code className="text-emerald-400">{req.command || '(no arguments)'}</code>
            </div>

            {/* Giant Tactile Touch Pads */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onDecision(req.id, 'deny')}
                className="h-14 rounded-xl bg-[#0e0e12] border border-rose-500/40 hover:border-rose-500 text-rose-400 font-mono text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
                <span>Deny command</span>
              </button>

              <button
                onClick={() => onDecision(req.id, 'allow')}
                className="h-14 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Allow execution</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
