import React, { useState, useEffect } from 'react';
import { Timer, RotateCcw, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { playAlertRingtone } from '../utils/sound.ts';

let audioCtx: AudioContext | null = null;

function playMechanicalFlipSound(isActive: boolean = true) {
  if (!isActive) return;
  if (typeof document !== 'undefined' && document.hidden) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;

    // 1. Crisp Plastic Leaf Slap (synthesized noise impulse)
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.022); // 22ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.Q.setValueAtTime(3.2, t);

    // 2. Mechanical Housing Body Thud
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.02);

    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.12, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.18, t);

    noise.connect(filter);
    filter.connect(masterGain);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    noise.start(t);
    osc.start(t);
    osc.stop(t + 0.025);
  } catch {}
}

interface SplitFlapDigitProps {
  current: string;
  previous: string;
  soundEnabled: boolean;
}

const SplitFlapDigit: React.FC<SplitFlapDigitProps> = ({ current, previous, soundEnabled }) => {
  const [displayPrevious, setDisplayPrevious] = useState(previous);
  const [displayCurrent, setDisplayCurrent] = useState(current);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (current !== displayCurrent) {
      setDisplayPrevious(displayCurrent);
      setDisplayCurrent(current);
      setIsFlipping(true);

      if (soundEnabled) {
        playMechanicalFlipSound(soundEnabled);
      }

      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 280);

      return () => clearTimeout(timer);
    }
  }, [current, displayCurrent, soundEnabled]);

  return (
    <div className="relative w-10 sm:w-14 md:w-18 h-20 sm:h-28 md:h-36 bg-[#08080a] rounded-lg md:rounded-xl border border-[#1a1a22] shadow-2xl perspective-800 select-none overflow-hidden flex flex-col">
      {/* Horizontal Split Crease Line */}
      <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-[#000000] z-30 shadow-[0_1px_0_rgba(255,255,255,0.06)] pointer-events-none" />

      {/* Static Top Half (Shows New Incoming Digit) */}
      <div className="relative w-full h-1/2 overflow-hidden bg-[#0d0d10] border-b border-black">
        <div className="absolute inset-x-0 top-0 h-20 sm:h-28 md:h-36 flex items-center justify-center">
          <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
            {displayCurrent}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
      </div>

      {/* Static Bottom Half (Shows Old Leaving Digit until flip completes) */}
      <div className="relative w-full h-1/2 overflow-hidden bg-[#09090b]">
        <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 md:h-36 flex items-center justify-center">
          <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
            {isFlipping ? displayPrevious : displayCurrent}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Flipping Leaf: Top Flap Folding Down */}
      {isFlipping && (
        <div className="absolute top-0 inset-x-0 h-1/2 overflow-hidden bg-[#0d0d10] border-b border-black z-20 animate-flap-top backface-hidden">
          <div className="absolute inset-x-0 top-0 h-20 sm:h-28 md:h-36 flex items-center justify-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
              {displayPrevious}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
        </div>
      )}

      {/* Flipping Leaf: Bottom Flap Unfolding Down */}
      {isFlipping && (
        <div className="absolute bottom-0 inset-x-0 h-1/2 overflow-hidden bg-[#09090b] z-20 animate-flap-bottom backface-hidden">
          <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 md:h-36 flex items-center justify-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
              {displayCurrent}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/30 pointer-events-none" />
        </div>
      )}
    </div>
  );
};

interface TwoDigitFlipGroupProps {
  value: string;
  previous: string;
  label?: string;
  soundEnabled: boolean;
  extraBadge?: string;
}

const TwoDigitFlipGroup: React.FC<TwoDigitFlipGroupProps> = ({
  value,
  previous,
  label,
  soundEnabled,
  extraBadge,
}) => {
  const d1 = value.slice(0, 1) || '0';
  const d2 = value.slice(1, 2) || '0';
  const p1 = previous.slice(0, 1) || d1;
  const p2 = previous.slice(1, 2) || d2;

  return (
    <div className="flex flex-col items-center relative">
      <div className="flex items-center gap-1 sm:gap-1.5 relative">
        <SplitFlapDigit current={d1} previous={p1} soundEnabled={soundEnabled} />
        <SplitFlapDigit current={d2} previous={p2} soundEnabled={soundEnabled} />

        {extraBadge && (
          <span className="absolute -top-3.5 right-0 text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
            {extraBadge}
          </span>
        )}
      </div>

      {label && (
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mt-1.5">
          {label}
        </span>
      )}
    </div>
  );
};

interface FlipClockProps {
  isActive?: boolean;
}

export const FlipClock: React.FC<FlipClockProps> = ({ isActive = true }) => {
  const [time, setTime] = useState(new Date());
  const [prevTime, setPrevTime] = useState(new Date());
  const [isSprintMode, setIsSprintMode] = useState(false);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(25);
  const [sprintSeconds, setSprintSeconds] = useState(25 * 60);
  const [prevSprintSeconds, setPrevSprintSeconds] = useState(25 * 60);
  const [sprintRunning, setSprintRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mechanical sound plays only when sound is enabled AND clock screen is active
  const effectiveSound = soundEnabled && isActive;

  // Set sprint duration in minutes
  const setDuration = (mins: number) => {
    const clamped = Math.max(1, Math.min(99, mins));
    setTargetDurationMinutes(clamped);
    setPrevSprintSeconds(sprintSeconds);
    setSprintSeconds(clamped * 60);
    setSprintRunning(false);
    if (effectiveSound) {
      playMechanicalFlipSound(effectiveSound);
    }
  };

  // Increment or decrement sprint minutes
  const adjustMinutes = (delta: number) => {
    const currentMins = Math.floor(sprintSeconds / 60);
    const newMins = Math.max(1, Math.min(99, currentMins + delta));
    setDuration(newMins);
  };

  // Suspend AudioContext when clock page is not active or hidden to ensure absolute silence
  useEffect(() => {
    if (!effectiveSound && audioCtx && audioCtx.state === 'running') {
      try {
        audioCtx.suspend();
      } catch {}
    }
  }, [effectiveSound]);

  // Clock 1-second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((curr) => {
        setPrevTime(curr);
        return new Date();
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus Sprint timer ticker
  useEffect(() => {
    let interval: any = null;
    if (isSprintMode && sprintRunning && sprintSeconds > 0) {
      interval = setInterval(() => {
        setSprintSeconds((curr) => {
          setPrevSprintSeconds(curr);
          return curr - 1;
        });
      }, 1000);
    } else if (sprintSeconds === 0 && sprintRunning) {
      setSprintRunning(false);
      try {
        playAlertRingtone();
      } catch {}
    }
    return () => clearInterval(interval);
  }, [isSprintMode, sprintRunning, sprintSeconds]);

  // 12-Hour format calculation
  const rawHours = time.getHours();
  const hours12 = rawHours % 12 || 12;
  const hoursStr = hours12.toString().padStart(2, '0');
  const amPm = rawHours >= 12 ? 'PM' : 'AM';

  const prevRawHours = prevTime.getHours();
  const prevHours12 = prevRawHours % 12 || 12;
  const prevHoursStr = prevHours12.toString().padStart(2, '0');

  const minutesStr = time.getMinutes().toString().padStart(2, '0');
  const prevMinutesStr = prevTime.getMinutes().toString().padStart(2, '0');

  const secondsStr = time.getSeconds().toString().padStart(2, '0');
  const prevSecondsStr = prevTime.getSeconds().toString().padStart(2, '0');

  // Focus sprint timer strings
  const sprintMin = Math.floor(sprintSeconds / 60).toString().padStart(2, '0');
  const sprintSec = (sprintSeconds % 60).toString().padStart(2, '0');
  const prevSprintMin = Math.floor(prevSprintSeconds / 60).toString().padStart(2, '0');
  const prevSprintSec = (prevSprintSeconds % 60).toString().padStart(2, '0');

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-1 sm:py-2 select-none overflow-hidden">
      {/* Top Header Mode & Sound Switcher */}
      <div className="flex items-center justify-between w-full max-w-xl px-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-neutral-400 tracking-wider">
            {isSprintMode ? 'FOCUS SPRINT' : `${dateString} • 12H`}
          </span>
          {!isSprintMode && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-400">
              {amPm}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mechanical Sound Toggle */}
          <button
            onClick={() => {
              if (!soundEnabled) {
                playMechanicalFlipSound();
              }
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
              soundEnabled
                ? 'bg-[#111117] border-amber-500/30 text-amber-400'
                : 'bg-[#0a0a0d] border-neutral-800 text-neutral-600'
            }`}
            title={soundEnabled ? 'Mute flip sound' : 'Unmute mechanical flip sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Mode Switcher: Clock <-> Sprint Timer */}
          <button
            onClick={() => {
              setIsSprintMode(!isSprintMode);
              setSprintRunning(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#0e0e12] border border-[#23232b] text-neutral-300 hover:text-white transition-colors"
          >
            <Timer className="w-3 h-3 text-neutral-400" />
            <span>{isSprintMode ? 'Clock' : 'Timer'}</span>
          </button>
        </div>
      </div>

      {/* 3D Split-Flap Clock / Timer Display */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 my-auto">
        {!isSprintMode ? (
          <>
            {/* Hours (12-hour format with AM/PM pill) */}
            <TwoDigitFlipGroup
              value={hoursStr}
              previous={prevHoursStr}
              label="Hours"
              soundEnabled={effectiveSound}
            />

            <span className="font-mono text-2xl sm:text-4xl text-neutral-600 font-bold -mt-4">:</span>

            {/* Minutes */}
            <TwoDigitFlipGroup
              value={minutesStr}
              previous={prevMinutesStr}
              label="Minutes"
              soundEnabled={effectiveSound}
            />

            {/* Seconds (Hidden on very tiny mobile, visible sm+) */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <span className="font-mono text-2xl sm:text-4xl text-neutral-600 font-bold -mt-4">:</span>
              <TwoDigitFlipGroup
                value={secondsStr}
                previous={prevSecondsStr}
                label="Seconds"
                soundEnabled={effectiveSound}
              />
            </div>
          </>
        ) : (
          <>
            {/* Sprint Timer: Minutes (with interactive steppers when not running) */}
            <div className="relative group flex flex-col items-center">
              {!sprintRunning && (
                <div className="absolute -top-7 inset-x-0 flex items-center justify-center gap-1 z-20">
                  <button
                    onClick={() => adjustMinutes(1)}
                    className="p-1 rounded bg-[#121217] border border-[#262632] text-neutral-400 hover:text-amber-400 active:scale-90 transition-transform"
                    title="Add 1 minute"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustMinutes(5)}
                    className="px-1.5 py-0.5 rounded bg-[#121217] border border-[#262632] text-[9px] font-mono text-neutral-400 hover:text-amber-400 active:scale-90 transition-transform"
                    title="Add 5 minutes"
                  >
                    +5m
                  </button>
                </div>
              )}

              <div
                onClick={() => {
                  if (!sprintRunning) adjustMinutes(5);
                }}
                className={!sprintRunning ? 'cursor-pointer hover:opacity-95 active:scale-[0.98] transition-transform' : ''}
                title={!sprintRunning ? 'Tap to add 5 minutes' : ''}
              >
                <TwoDigitFlipGroup
                  value={sprintMin}
                  previous={prevSprintMin}
                  label="Minutes"
                  soundEnabled={effectiveSound}
                />
              </div>

              {!sprintRunning && (
                <div className="absolute -bottom-7 inset-x-0 flex items-center justify-center gap-1 z-20">
                  <button
                    onClick={() => adjustMinutes(-1)}
                    className="p-1 rounded bg-[#121217] border border-[#262632] text-neutral-400 hover:text-amber-400 active:scale-90 transition-transform"
                    title="Subtract 1 minute"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustMinutes(-5)}
                    className="px-1.5 py-0.5 rounded bg-[#121217] border border-[#262632] text-[9px] font-mono text-neutral-400 hover:text-amber-400 active:scale-90 transition-transform"
                    title="Subtract 5 minutes"
                  >
                    -5m
                  </button>
                </div>
              )}
            </div>

            <span className="font-mono text-2xl sm:text-4xl text-neutral-600 font-bold -mt-4">:</span>

            {/* Sprint Timer: Seconds */}
            <TwoDigitFlipGroup
              value={sprintSec}
              previous={prevSprintSec}
              label="Seconds"
              soundEnabled={effectiveSound}
            />
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {isSprintMode ? (
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          {/* Preset Duration Selector Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
            {[5, 10, 15, 25, 30, 45, 60].map((mins) => {
              const isSelected = targetDurationMinutes === mins && !sprintRunning;
              return (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  disabled={sprintRunning}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-medium transition-all active:scale-95 disabled:pointer-events-none ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-[#0d0d12] border border-[#1f1f28] text-neutral-400 hover:text-white disabled:opacity-30'
                  }`}
                  title={`Set timer to ${mins} minutes`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Play/Pause and Reset */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSprintRunning(!sprintRunning)}
              className="px-5 py-1.5 rounded-lg bg-white text-black font-mono font-medium text-xs flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-white/10"
            >
              {sprintRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              <span>{sprintRunning ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={() => {
                setPrevSprintSeconds(sprintSeconds);
                setSprintSeconds(targetDurationMinutes * 60);
                setSprintRunning(false);
                if (effectiveSound) {
                  playMechanicalFlipSound(effectiveSound);
                }
              }}
              className="p-1.5 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white active:scale-95 transition-transform"
              title={`Reset to ${targetDurationMinutes}m`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[10px] font-mono text-neutral-600 tracking-wider">
          Split-flap mechanical • Swipe left for Controls
        </div>
      )}
    </div>
  );
};
