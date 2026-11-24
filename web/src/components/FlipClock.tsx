import React, { useState, useEffect } from 'react';
import { Timer, RotateCcw, Play, Pause } from 'lucide-react';

interface FlipCardProps {
  value: string;
  label?: string;
}

// Split-flap retro mechanical card with horizontal crease
const FlipCard: React.FC<FlipCardProps> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 sm:w-32 md:w-40 h-28 sm:h-36 md:h-44 bg-[#0a0a0c] rounded-xl border border-[#1f1f26] flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Horizontal split crease line */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#000000] z-20 shadow-[0_1px_0_rgba(255,255,255,0.08)]" />

        {/* Top flap subtle highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* Large Mechanical Typography */}
        <span className="font-mono text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums z-10 select-none">
          {value}
        </span>
      </div>
      {label && (
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-2">
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

  // Regular clock values
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  // Sprint timer values
  const sprintMin = Math.floor(sprintSeconds / 60).toString().padStart(2, '0');
  const sprintSec = (sprintSeconds % 60).toString().padStart(2, '0');

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 sm:p-8 select-none">
      {/* Top Header Mode Switcher */}
      <div className="flex items-center justify-between w-full max-w-xl pb-2">
        <span className="text-xs font-mono text-neutral-400 tracking-wider">
          {isSprintMode ? 'FOCUS SPRINT' : dateString}
        </span>
        <button
          onClick={() => {
            setIsSprintMode(!isSprintMode);
            setSprintRunning(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-[#0e0e12] border border-[#23232b] text-neutral-300 hover:text-white transition-colors"
        >
          <Timer className="w-3.5 h-3.5 text-neutral-400" />
          <span>{isSprintMode ? 'Show Clock' : 'Focus Timer'}</span>
        </button>
      </div>

      {/* Flip Clock Display */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 my-auto">
        {!isSprintMode ? (
          <>
            <FlipCard value={hours} label="Hours" />
            <span className="font-mono text-4xl sm:text-6xl text-neutral-600 font-bold -mt-4">:</span>
            <FlipCard value={minutes} label="Minutes" />
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-16 sm:w-20 h-28 sm:h-36 md:h-44 bg-[#08080a] rounded-xl border border-[#1a1a20] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black z-20" />
                <span className="font-mono text-3xl sm:text-4xl font-bold text-neutral-400 tabular-nums">
                  {seconds}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-2">
                Sec
              </span>
            </div>
          </>
        ) : (
          <>
            <FlipCard value={sprintMin} label="Min" />
            <span className="font-mono text-4xl sm:text-6xl text-neutral-600 font-bold -mt-4">:</span>
            <FlipCard value={sprintSec} label="Sec" />
          </>
        )}
      </div>

      {/* Bottom Sprint Controls (if sprint mode active) */}
      {isSprintMode ? (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setSprintRunning(!sprintRunning)}
            className="px-5 py-2 rounded-lg bg-white text-black font-mono font-medium text-xs flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            {sprintRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{sprintRunning ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={() => {
              setSprintSeconds(25 * 60);
              setSprintRunning(false);
            }}
            className="p-2 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white"
            title="Reset to 25m"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSprintSeconds(50 * 60);
              setSprintRunning(false);
            }}
            className="px-3 py-2 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white font-mono text-xs"
          >
            50m
          </button>
        </div>
      ) : (
        <div className="text-[11px] font-mono text-neutral-600 tracking-wider">
          StandBy active • Swipe left for Media
        </div>
      )}
    </div>
  );
};
