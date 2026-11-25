import React, { useState } from 'react';
import { Plus, Trash2, Zap, Check, X, CornerDownLeft } from 'lucide-react';

interface PromptPreset {
  id: string;
  label: string;
  prompt: string;
  category?: 'flow' | 'debug' | 'git' | 'explain';
  isCustom?: boolean;
}

const DEFAULT_PRESETS: PromptPreset[] = [
  { id: 'continue', label: 'Continue', prompt: 'Continue with the next step in the plan.', category: 'flow' },
  { id: 'find-bug', label: 'Find the Bug', prompt: 'Analyze the codebase and find the root cause of this issue.', category: 'debug' },
  { id: 'fix-tests', label: 'Fix All Tests', prompt: 'Run the test suite and fix any failing tests until they pass.', category: 'debug' },
  { id: 'explain', label: 'Explain Changes', prompt: 'Explain in detail what you just changed and why.', category: 'explain' },
  { id: 'commit-push', label: 'Commit & Push', prompt: 'Stage all modified files, commit with a concise message, and push to git.', category: 'git' },
  { id: 'summarize', label: 'Summarize Status', prompt: 'Summarize the current progress, completed steps, and remaining tasks.', category: 'explain' },
];

interface AgentPromptDeckProps {
  onSendPrompt: (prompt: string, autoSend: boolean) => void;
}

export const AgentPromptDeck: React.FC<AgentPromptDeckProps> = ({ onSendPrompt }) => {
  const [prompts, setPrompts] = useState<PromptPreset[]>(() => {
    try {
      const saved = localStorage.getItem('overwatch_custom_prompts');
      if (saved) {
        const custom = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...custom];
      }
    } catch {}
    return DEFAULT_PRESETS;
  });

  const [autoSend, setAutoSend] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newPromptText, setNewPromptText] = useState<string>('');
  const [activeBeamedId, setActiveBeamedId] = useState<string | null>(null);

  const saveCustomPrompts = (all: PromptPreset[]) => {
    const customOnly = all.filter((p) => p.isCustom);
    try {
      localStorage.setItem('overwatch_custom_prompts', JSON.stringify(customOnly));
    } catch {}
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newPromptText.trim()) return;

    const newPreset: PromptPreset = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      prompt: newPromptText.trim(),
      isCustom: true,
    };

    const updated = [...prompts, newPreset];
    setPrompts(updated);
    saveCustomPrompts(updated);

    setNewLabel('');
    setNewPromptText('');
    setShowAddModal(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = prompts.filter((p) => p.id !== id);
    setPrompts(updated);
    saveCustomPrompts(updated);
  };

  const handleTrigger = (preset: PromptPreset) => {
    setActiveBeamedId(preset.id);
    onSendPrompt(preset.prompt, autoSend);

    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 60]);
    }

    setTimeout(() => {
      setActiveBeamedId(null);
    }, 1400);
  };

  return (
    <div className="bg-[#08080a] border border-[#181822] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-full shadow-2xl relative select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#14141c]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#111118] border border-[#22222e] text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                <span>Prompt Commands</span>
              </h2>
              <p className="text-[10px] font-mono text-neutral-500">1-Tap Beams into Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Submit Switch */}
            <button
              onClick={() => setAutoSend(!autoSend)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono transition-colors ${
                autoSend
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-[#0e0e12] border-neutral-800 text-neutral-500'
              }`}
              title={autoSend ? 'Auto-submits (Enter)' : 'Copies to clipboard only'}
            >
              <CornerDownLeft className="w-3 h-3" />
              <span>{autoSend ? 'Auto-Enter' : 'Copy Only'}</span>
            </button>

            {/* Add Custom Prompt Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 rounded-lg bg-[#111118] border border-[#22222e] text-neutral-400 hover:text-white active:scale-95 transition-all"
              title="Add custom command"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtitle instructions */}
        <p className="text-[10px] font-mono text-neutral-500 mt-2 mb-2">
          Tap any command to beam it instantly into the agent prompt:
        </p>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-2 gap-2 my-auto overflow-y-auto max-h-[220px] sm:max-h-[280px] no-scrollbar py-1">
        {prompts.map((preset) => {
          const isBeamed = activeBeamedId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleTrigger(preset)}
              className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 group overflow-hidden ${
                isBeamed
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-[#0d0d12] border-[#1b1b26] hover:border-amber-500/40 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-xs font-bold truncate flex items-center gap-1">
                  {preset.label}
                </span>
                {preset.isCustom && (
                  <button
                    onClick={(e) => handleDeleteCustom(preset.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition-opacity"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 line-clamp-1 font-sans">
                {preset.prompt}
              </p>

              {/* Success Feedback Overlay */}
              {isBeamed && (
                <div className="absolute inset-0 bg-emerald-950/90 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold text-emerald-300 animate-in fade-in zoom-in-95 duration-150">
                  <Check className="w-3.5 h-3.5" />
                  <span>Beamed!</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-2.5 border-t border-[#14141c] flex items-center justify-between text-[10px] font-mono text-neutral-500">
        <span>PRELOADED COMMANDS</span>
        <span className="text-neutral-400">{prompts.length} Ready</span>
      </div>

      {/* Add Custom Prompt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0c0c12] border border-[#232332] rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c28]">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Quick Command</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPrompt} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Button Label (e.g. "Check Lint")
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Find Memory Leaks"
                  maxLength={24}
                  className="w-full bg-[#14141c] border border-[#252535] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/70"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Full Prompt Text sent to Chat
                </label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Search the codebase for memory leaks, unclosed streams, and report findings."
                  rows={3}
                  className="w-full bg-[#14141c] border border-[#252535] rounded-lg px-2.5 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-amber-500/70 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#252535] text-neutral-400 font-mono text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-mono font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all"
                >
                  Add Command
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
