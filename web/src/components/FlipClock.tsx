import React, { useState, useEffect } from 'react';
import { Timer, RotateCcw, Play, Pause } from 'lucide-react';

interface FlipCardProps {
  value: string;
  label?: string;
}

const FlipCard: React.FC<FlipCardProps> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 sm:w-28 md:w-36 h-24 sm:h-32 md:h-40 bg-[#0a0a0c] rounded-xl border border-[#1f1f26] flex items-center justify-center overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#000000] z-20 shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums z-10 select-none">
          {value}
        </span>
      </div>
      {label && (
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mt-1">
          {label}
        </span>
      )}
    </div>
  );
};

export const FlipClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isSprintMode, setIsSprintMode] = useState(false);
  const [sprintSeconds, setSprintSeconds] = useState(25 * 60);
  const [sprintRunning, setSprintRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isSprintMode && sprintRunning && sprintSeconds > 0) {
      interval = setInterval(() => setSprintSeconds((prev) => prev - 1), 1000);
    } else if (sprintSeconds === 0) {
      setSprintRunning(false);
    }
    return () => clearInterval(interval);
  }, [isSprintMode, sprintRunning, sprintSeconds]);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const sprintMin = Math.floor(sprintSeconds / 60).toString().padStart(2, '0');
  const sprintSec = (sprintSeconds % 60).toString().padStart(2, '0');

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-1 sm:py-2 select-none overflow-hidden">
      {/* Top Header Mode Switcher */}
      <div className="flex items-center justify-between w-full max-w-lg px-2">
        <span className="text-[11px] font-mono text-neutral-400 tracking-wider">
          {isSprintMode ? 'FOCUS SPRINT' : dateString}
        </span>
        <button
          onClick={() => {
            setIsSprintMode(!isSprintMode);
            setSprintRunning(false);
          }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-[#0e0e12] border border-[#23232b] text-neutral-300 hover:text-white transition-colors"
        >
          <Timer className="w-3 h-3 text-neutral-400" />
          <span>{isSprintMode ? 'Clock' : 'Timer'}</span>
        </button>
      </div>

      {/* Flip Clock Display */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-auto">
        {!isSprintMode ? (
          <>
            <FlipCard value={hours} label="Hours" />
            <span className="font-mono text-3xl sm:text-5xl text-neutral-600 font-bold -mt-3">:</span>
            <FlipCard value={minutes} label="Minutes" />
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-14 sm:w-16 h-24 sm:h-32 md:h-40 bg-[#08080a] rounded-xl border border-[#1a1a20] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black z-20" />
                <span className="font-mono text-2xl sm:text-3xl font-bold text-neutral-400 tabular-nums">
                  {seconds}
                </span>
              </div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mt-1">
                Sec
              </span>
            </div>
          </>
        ) : (
          <>
            <FlipCard value={sprintMin} label="Min" />
            <span className="font-mono text-3xl sm:text-5xl text-neutral-600 font-bold -mt-3">:</span>
            <FlipCard value={sprintSec} label="Sec" />
          </>
        )}
      </div>

      {/* Bottom Sprint Controls */}
      {isSprintMode ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSprintRunning(!sprintRunning)}
            className="px-4 py-1.5 rounded-lg bg-white text-black font-mono font-medium text-xs flex items-center gap-1 active:scale-95 transition-transform"
          >
            {sprintRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{sprintRunning ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={() => {
              setSprintSeconds(25 * 60);
              setSprintRunning(false);
            }}
            className="p-1.5 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white"
            title="Reset to 25m"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="text-[10px] font-mono text-neutral-600 tracking-wider">
          StandBy active • Swipe left for Controls
        </div>
      )}
    </div>
  );
};
