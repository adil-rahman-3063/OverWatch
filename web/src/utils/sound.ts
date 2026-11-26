let sharedAudioCtx: AudioContext | null = null;
let keepAliveTimer: any = null;
let fallbackAudio: HTMLAudioElement | null = null;
let chimeUrl: string | null = null;

/**
 * Synthesizes an in-memory 16-bit PCM WAV chime (C6 + E6 + G6 dual-pulse)
 * as an Object URL. This gives us a 100% native HTML5 audio fallback
 * that bypasses Web Audio API suspension on iOS Safari and Android Chrome.
 */
function getChimeWavUrl(): string {
  if (chimeUrl) return chimeUrl;

  try {
    const sampleRate = 22050;
    const duration = 0.58;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Int16Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Pulse 1: 0.00s to 0.20s (1046.5Hz + 1318.5Hz)
      if (t < 0.20) {
        const env = Math.exp(-t * 12);
        sample += (Math.sin(2 * Math.PI * 1046.5 * t) + 0.7 * Math.sin(2 * Math.PI * 1318.5 * t)) * env;
      }
      // Pulse 2: 0.22s to 0.55s (1318.5Hz + 1567.9Hz)
      else if (t >= 0.22) {
        const t2 = t - 0.22;
        const env = Math.exp(-t2 * 8);
        sample += (Math.sin(2 * Math.PI * 1318.5 * t2) + 0.7 * Math.sin(2 * Math.PI * 1567.9 * t2)) * env;
      }

      buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(sample * 14000)));
    }

    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const dataByteLength = numSamples * 2;

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataByteLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // 1 channel (mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); // 16-bit
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataByteLength, true);

    const blob = new Blob([header, buffer], { type: 'audio/wav' });
    chimeUrl = URL.createObjectURL(blob);
    return chimeUrl;
  } catch (err) {
    return '';
  }
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Starts a 15-second inaudible keep-alive pulse that prevents mobile OS
 * power managers (iOS Safari & Android Chrome) from putting the AudioContext
 * into permanent sleep while sitting idle on a StandBy dock.
 */
function startKeepAlive() {
  if (keepAliveTimer || typeof window === 'undefined') return;

  keepAliveTimer = setInterval(() => {
    try {
      if (sharedAudioCtx && sharedAudioCtx.state === 'running') {
        const osc = sharedAudioCtx.createOscillator();
        const gain = sharedAudioCtx.createGain();
        gain.gain.value = 0.00001; // Completely inaudible
        osc.connect(gain);
        gain.connect(sharedAudioCtx.destination);
        osc.start();
        osc.stop(sharedAudioCtx.currentTime + 0.04);
      }
    } catch {}
  }, 15000);
}

/**
 * Pre-unlocks both Web Audio API and HTML5 Audio on user interaction.
 * Crucial for mobile browser autoplay policies.
 */
export function unlockAudio() {
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    startKeepAlive();

    // Pre-arm HTML5 audio element
    if (!fallbackAudio) {
      const url = getChimeWavUrl();
      if (url) {
        fallbackAudio = new Audio(url);
        fallbackAudio.preload = 'auto';
        // Play and immediately pause to establish user gesture permission
        fallbackAudio.volume = 0.001;
        fallbackAudio.play().then(() => {
          if (fallbackAudio) {
            fallbackAudio.pause();
            fallbackAudio.currentTime = 0;
            fallbackAudio.volume = 0.85;
          }
        }).catch(() => {});
      }
    }
  } catch {}
}

// Global user interaction listeners for mobile browsers
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

/**
 * Bulletproof alert ringtone:
 * 1. Plays harmonic double-pulse chime via Web Audio API.
 * 2. Simultaneously triggers pre-armed HTML5 Audio element as fallback
 *    if the Web Audio context was suspended by mobile background throttling.
 * 3. Fires haptic vibration pulse.
 */
export function playAlertRingtone() {
  let webAudioSucceeded = false;

  // 1. Primary: Web Audio API Synthesizer (Zero-latency C6/E6/G6 chime)
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (ctx.state !== 'closed') {
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
        gain.gain.linearRampToValueAtTime(0.48, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      ringPulse(t, 1046.5, 1318.5, 0.18);
      ringPulse(t + 0.22, 1318.5, 1567.9, 0.32);
      webAudioSucceeded = true;
    }
  } catch (err) {
    console.warn('[Audio] WebAudio playback deferred to fallback:', err);
  }

  // 2. Parallel / Fallback: HTML5 Audio Element
  try {
    if (!fallbackAudio) {
      const url = getChimeWavUrl();
      if (url) {
        fallbackAudio = new Audio(url);
        fallbackAudio.preload = 'auto';
        fallbackAudio.volume = 0.85;
      }
    }

    if (fallbackAudio) {
      fallbackAudio.currentTime = 0;
      fallbackAudio.volume = 0.85;
      fallbackAudio.play().catch(() => {
        // If both failed due to strict browser lock, attempt to recreate context
        if (!webAudioSucceeded) {
          sharedAudioCtx = null;
        }
      });
    }
  } catch {}

  // 3. Haptic vibration alert for mobile devices
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([180, 60, 200, 60, 250]);
    } catch {}
  }
}
