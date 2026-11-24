import React, { useState } from 'react';
import { Lock, VolumeX, Moon, Terminal, Code2, Check } from 'lucide-react';

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
    {
      id: 'lock_pc',
      label: 'Lock workstation',
      desc: 'Lock Windows PC immediately',
      icon: Lock,
    },
    {
      id: 'turn_off_screens',
      label: 'Sleep displays',
      desc: 'Put monitors to sleep',
      icon: Moon,
    },
    {
      id: 'volume_mute',
      label: 'Mute master audio',
      desc: 'Toggle system volume mute',
      icon: VolumeX,
    },
    {
      id: 'open_terminal',
      label: 'Launch terminal',
      desc: 'Open PowerShell in workspace',
      icon: Terminal,
    },
    {
      id: 'open_ide',
      label: 'Launch editor',
      desc: 'Open Antigravity IDE / VS Code',
      icon: Code2,
    },
  ];

  return (
    <div className="deck-panel rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 mb-4 border-b border-[#1e1e24] flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Quick action macros
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            One-tap triggers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {macros.map((m) => {
            const isJustExecuted = lastExecuted === m.id;
            const Icon = m.icon;

            return (
              <button
                key={m.id}
                onClick={() => handleTrigger(m.id)}
                className={`deck-button p-3.5 rounded-lg text-left flex items-center justify-between group ${
                  isJustExecuted ? 'border-emerald-500/60 bg-[#141d18]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${
                    isJustExecuted 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                      : 'bg-[#121217] border-[#22222a] text-neutral-400 group-hover:text-white'
                  }`}>
                    {isJustExecuted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-medium text-white tracking-tight">
                      {m.label}
                    </h4>
                    <p className="text-[10px] font-mono text-neutral-500">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-[#1e1e24] text-[10px] font-mono text-neutral-500 text-center">
        Commands run natively on your Windows PC
      </div>
    </div>
  );
};
