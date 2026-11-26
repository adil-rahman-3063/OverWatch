import React from 'react';
import { Smartphone, Monitor, BatteryCharging, Volume2, Sparkles, Sliders, ArrowUpRight } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

export const ShowcasePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Hardware & Aesthetics</span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase">
          Desk Showcase & Hardware Philosophy
        </h1>
        <p className="text-sm text-neutral-400 font-sans leading-relaxed">
          Why dedicate a power-hungry 32" second monitor to a terminal prompt? OverWatch transforms idle OLED smartphones into zero-distraction, dedicated desk cyberdecks.
        </p>
      </div>

      {/* 1. THE 0-WATT OLED PHILOSOPHY */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-white" />
          1. The Zero-Distraction StandBy Concept
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#08080a] border border-[#1a1a22] space-y-3">
            <h3 className="font-mono font-semibold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              Pure #000000 Pitch Black
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Unlike LCD displays that emit backlighting bleed, OLED screens completely power off individual black subpixels. In a dark room or ambient desk setup, OverWatch blends seamlessly into your desk perimeter.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#08080a] border border-[#1a1a22] space-y-3">
            <h3 className="font-mono font-semibold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Native Screen WakeLock + Silent Keep-Alive
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              OverWatch combines the HTML5 Screen Wake Lock API with a 1-pixel silent looping background video fallback. Your desk stand never dims or locks, keeping agent telemetry alive all day without changing system sleep policies.
            </p>
          </div>
        </div>
      </section>

      {/* 2. AUDIO SYNTHESIS */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-white" />
          2. Web Audio Mechanical Synthesis
        </h2>
        <div className="p-5 sm:p-6 rounded-2xl bg-[#08080a] border border-[#1a1a22] space-y-4">
          <p className="text-xs text-neutral-300 font-sans leading-relaxed">
            OverWatch doesn't rely on laggy external MP3 sound files that fail to load offline. Every sound effect is generated live via the browser's Web Audio API using mathematical oscillators and white-noise convolution:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-[#202028] space-y-1.5">
              <span className="text-white font-semibold">Plastic Leaf Slap (22ms)</span>
              <p className="text-neutral-500 text-[11px]">
                A 2600Hz Q=3.2 bandpass filtered Gaussian noise burst simulating the plastic flap hitting the stop bar.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-[#202028] space-y-1.5">
              <span className="text-white font-semibold">Body Cavity Thud (25ms)</span>
              <p className="text-neutral-500 text-[11px]">
                A 220Hz triangle wave rapidly decayed down to 50Hz, mimicking the mechanical chassis vibration.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (ctx.state === 'suspended') ctx.resume();
                  const t = ctx.currentTime;
                  const bufferSize = Math.floor(ctx.sampleRate * 0.022);
                  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                  const data = buffer.getChannelData(0);
                  for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
                  }
                  const noise = ctx.createBufferSource();
                  noise.buffer = buffer;
                  const filter = ctx.createBiquadFilter();
                  filter.type = 'bandpass';
                  filter.frequency.setValueAtTime(2600, t);
                  filter.Q.setValueAtTime(3.2, t);

                  const osc = ctx.createOscillator();
                  osc.type = 'triangle';
                  osc.frequency.setValueAtTime(220, t);
                  osc.frequency.exponentialRampToValueAtTime(50, t + 0.02);

                  const oscGain = ctx.createGain();
                  oscGain.gain.setValueAtTime(0.12, t);
                  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

                  const master = ctx.createGain();
                  master.gain.setValueAtTime(0.2, t);

                  noise.connect(filter);
                  filter.connect(master);
                  osc.connect(oscGain);
                  oscGain.connect(master);
                  master.connect(ctx.destination);

                  noise.start(t);
                  osc.start(t);
                  osc.stop(t + 0.025);
                } catch {}
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-mono font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md w-full sm:w-auto"
            >
              <Volume2 className="w-4 h-4" />
              <span>Tap to Test 2600Hz Web Audio Synthesis</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. HARDWARE RECOMMENDATIONS */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-white" />
          3. Recommended Desk Setups
        </h2>
        <div className="space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#09090c] border border-[#1c1c24] flex items-start gap-4">
            <span className="p-2 rounded-lg bg-[#14141c] text-white">01</span>
            <div className="space-y-1">
              <h4 className="text-white font-semibold">MagSafe Magnetic Floating Stand</h4>
              <p className="text-neutral-400 font-sans text-xs">
                Perfect for iPhone 12+ or Android phones with a MagSafe ring sticker. The phone snaps into landscape orientation instantly at 45 degrees directly below your primary monitor.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#09090c] border border-[#1c1c24] flex items-start gap-4">
            <span className="p-2 rounded-lg bg-[#14141c] text-white">02</span>
            <div className="space-y-1">
              <h4 className="text-white font-semibold">Angled Wireless Qi Charging Dock</h4>
              <p className="text-neutral-400 font-sans text-xs">
                Keeps the battery topped off at 80% with battery protection enabled. Zero cable clutter on your desktop.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#09090c] border border-[#1c1c24] flex items-start gap-4">
            <span className="p-2 rounded-lg bg-[#14141c] text-white">03</span>
            <div className="space-y-1">
              <h4 className="text-white font-semibold">90-Degree Right-Angle USB-C Cable</h4>
              <p className="text-neutral-400 font-sans text-xs">
                Routes cable cleanly beneath your keyboard mat without sticking awkwardly out from the side in landscape orientation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
