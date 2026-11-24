import React from 'react';
import { Shield, Radio, Laptop } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  deviceId: string;
  activeTab: 'all' | 'media' | 'commands' | 'quota';
  onTabChange: (tab: 'all' | 'media' | 'commands' | 'quota') => void;
}

export const Header: React.FC<HeaderProps> = ({ connected, deviceId, activeTab, onTabChange }) => {
  return (
    <header className="flex flex-col border-b border-neutral-900 bg-black sticky top-0 z-50 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-black border border-neutral-800 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black tracking-widest uppercase font-mono text-white">
                OVERWATCH
              </h1>
              <span className="text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.2 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                PITCH DECK
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center text-[10px] text-neutral-500 font-mono gap-1">
            <Laptop className="w-3 h-3 text-neutral-500" />
            <span>{deviceId}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
            connected 
              ? 'bg-black text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
              : 'bg-black text-rose-500 border-rose-500/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <Radio className="w-2.5 h-2.5" />
            <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Sideways Deck View Switcher (for small screens) */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-950 lg:hidden overflow-x-auto no-scrollbar">
        <button
          onClick={() => onTabChange('all')}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
            activeTab === 'all'
              ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
              : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          Side-by-Side (All)
        </button>
        <button
          onClick={() => onTabChange('media')}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
            activeTab === 'media'
              ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          Media Deck
        </button>
        <button
          onClick={() => onTabChange('commands')}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
            activeTab === 'commands'
              ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          Command Gate
        </button>
        <button
          onClick={() => onTabChange('quota')}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${
            activeTab === 'quota'
              ? 'bg-indigo-400 text-black border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
              : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          Quota Gauges
        </button>
      </div>
    </header>
  );
};
