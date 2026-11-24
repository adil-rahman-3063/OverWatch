import React from 'react';
import { Shield, Radio, Laptop } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  deviceId: string;
}

export const Header: React.FC<HeaderProps> = ({ connected, deviceId }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-deck-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-indigo-300 to-white bg-clip-text text-transparent">
            OverWatch
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
            <Laptop className="w-2.5 h-2.5" />
            {deviceId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          connected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <Radio className="w-3 h-3" />
          <span>{connected ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>
    </header>
  );
};
