import React, { useState } from 'react';
import { Bot, Terminal, CheckCircle2, Cpu, Layers, ShieldAlert, Sparkles, FileCode, Search, GitBranch, UploadCloud, Copy, Check } from 'lucide-react';
import { AgentSessionState } from '../types.ts';

interface AgentSessionCardProps {
  session?: AgentSessionState | null;
  onGitPush?: (commitMessage?: string) => void;
  isPushing?: boolean;
}

export const AgentSessionCard: React.FC<AgentSessionCardProps> = ({ session, onGitPush, isPushing }) => {
  const [copied, setCopied] = useState(false);
  const isRunning = session?.status === 'running';
  const isAwaiting = session?.status === 'awaiting_approval';

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
    <div className="bg-[#08080a] border border-[#181822] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden select-none">
      {/* Subtle background ambient pulse when running */}
      {isRunning && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      )}
      {isAwaiting && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#14141c]">
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
                <span>{formatModel(session?.model)}</span>
                {session?.stepCount ? (
                  <>
                    <span>•</span>
                    <span className="text-neutral-500">Step #{session.stepCount}</span>
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

        {/* Current User Task / Goal Quote */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#0d0d12] border border-[#1a1a24] text-left">
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>CURRENT OBJECTIVE</span>
          </div>
          <p className="text-xs text-neutral-200 line-clamp-2 font-sans font-medium leading-relaxed">
            {session?.currentTask || 'Idle — ready for next instruction.'}
          </p>
        </div>

        {/* Active Tool Execution Banner (if running or awaiting) */}
        {(isRunning || isAwaiting) && session?.currentTool && (
          <div className="mt-2.5 p-2 rounded-lg bg-[#0e1217] border border-cyan-500/30 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-cyan-300 font-bold">{session.currentTool}:</span>
              <span className="text-neutral-300 truncate">
                {session.currentCommand || 'Executing...'}
              </span>
            </div>
          </div>
        )}

        {/* GitHub Push Reminder (When Agent finishes and changes are ready to push) */}
        {session?.gitStatus?.hasChanges && !isRunning && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-[#0f141a] border border-amber-500/40 relative overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>TASK FINISHED • PUSH TO GITHUB</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {session.gitStatus.uncommittedCount} modified
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#07090d] p-1.5 rounded-lg border border-[#1b222d] mb-2 font-mono text-[10px] text-neutral-300">
              <span className="truncate flex-1">{session.gitStatus.suggestedPushCommand}</span>
              <button
                onClick={() => {
                  if (session?.gitStatus?.suggestedPushCommand) {
                    navigator.clipboard.writeText(session.gitStatus.suggestedPushCommand);
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
                if (onGitPush && session?.gitStatus?.suggestedPushCommand) {
                  onGitPush(session.gitStatus.suggestedPushCommand);
                }
              }}
              disabled={isPushing}
              className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isPushing ? (
                <>
                  <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Pushing on Host PC...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Beam & Push via Windows</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Live Recent Action Stream */}
      <div className="my-3 flex-1 flex flex-col justify-end">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5 block">
          Recent Activity Log
        </span>
        <div className="space-y-1.5 overflow-hidden">
          {session?.recentActions && session.recentActions.length > 0 ? (
            session.recentActions.slice(0, 4).map((action, i) => (
              <div
                key={action.id || i}
                className="flex items-center justify-between text-[11px] font-mono bg-[#0b0b0f] px-2.5 py-1.5 rounded-lg border border-[#16161f]"
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
            <div className="text-[11px] font-mono text-neutral-600 py-3 text-center">
              No recent tool executions recorded
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="pt-2.5 border-t border-[#14141c] flex items-center justify-between text-[10px] font-mono text-neutral-500">
        <div className="flex items-center gap-2">
          <span>WORKSPACE</span>
          <span className="text-neutral-300 truncate max-w-[120px] sm:max-w-[180px]">
            {session?.workspace?.split(/\\|\//).pop() || 'OverWatch'}
          </span>
        </div>
        {session?.cacheTokens ? (
          <div className="flex items-center gap-1 text-neutral-400">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>~{Math.round(session.cacheTokens / 1000)}k ctx</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
