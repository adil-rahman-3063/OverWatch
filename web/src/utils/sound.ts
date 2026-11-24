let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

// Global user interaction unlocker for mobile iOS Safari & Android Chrome
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

/**
 * High-audibility dual-pulse ringing alert for incoming agent command requests.
 * Uses C6 + E6 + G6 harmonics with rapid attack and ringing decay.
 */
export function playAlertRingtone() {
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    const ringPulse = (startTime: number, freq1: number, freq2: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq2, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.42, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    // Double-pulse incoming alert ring: "Ring-Ring!"
    // Pulse 1: 1046 Hz (C6) + 1318 Hz (E6)
    ringPulse(t, 1046.5, 1318.5, 0.18);
    // Pulse 2: 1318 Hz (E6) + 1567 Hz (G6)
    ringPulse(t + 0.22, 1318.5, 1567.9, 0.32);

    // Haptic vibration alert for mobile phones
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180, 60, 200, 60, 250]);
    }
  } catch (err) {
    console.warn('[Audio] Could not play alert ringtone:', err);
  }
}
