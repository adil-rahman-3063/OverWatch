import React, { useState } from 'react';
import { Lock, VolumeX, Moon, Terminal, Code2, Camera, Check } from 'lucide-react';

interface MacroDeckProps {
  onMacro: (action: string) => void;
}

export const MacroDeck: React.FC<MacroDeckProps> = ({ onMacro }) => {
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  const handleTrigger = (action: string) => {
    onMacro(action);
    setLastExecuted(action);
    setTimeout(() => setLastExecuted(null), 1200);
  };

  const macros = [
    { id: 'lock_pc', label: 'Lock PC', icon: Lock },
    { id: 'screenshot_clipboard', label: 'Screen to Clip', icon: Camera },
    { id: 'turn_off_screens', label: 'Sleep screens', icon: Moon },
    { id: 'volume_mute', label: 'Mute master', icon: VolumeX },
    { id: 'open_terminal', label: 'Terminal', icon: Terminal },
    { id: 'open_ide', label: 'Editor', icon: Code2 },
  ];

  return (
    <div className="deck-panel rounded-xl p-3 sm:p-4 h-full flex flex-col justify-between overflow-hidden">
      <div>
        <div className="pb-2 mb-2 border-b border-[#1e1e24] flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Quick macros
          </span>
          <span className="text-[9px] font-mono text-neutral-500">
            One-tap
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {macros.map((m) => {
            const isJustExecuted = lastExecuted === m.id;
            const Icon = m.icon;

            return (
              <button
                key={m.id}
                onClick={() => handleTrigger(m.id)}
                className={`deck-button p-2.5 rounded-lg text-left flex items-center gap-2 group transition-all ${
                  isJustExecuted ? 'border-emerald-500/60 bg-[#141d18]' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                  isJustExecuted 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                    : 'bg-[#121217] border-[#22222a] text-neutral-400 group-hover:text-white'
                }`}>
                  {isJustExecuted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <h4 className="text-[11px] font-mono font-medium text-white truncate">
                  {m.label}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-[9px] font-mono text-neutral-500">
        <span>Instant Execution</span>
        <span>PC Daemon</span>
      </div>
    </div>
  );
};
