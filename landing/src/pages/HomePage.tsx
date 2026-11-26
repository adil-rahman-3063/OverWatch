import React, { useState } from 'react';
import { 
  Terminal, ShieldCheck, Copy, Check, ArrowRight, Bot, 
  Clock, Music, Zap, Lock, FolderGit2, UploadCloud, Radio 
} from 'lucide-react';
import { LiveDeckSimulator } from '../components/LiveDeckSimulator.tsx';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

interface HomePageProps {
  onTabChange: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onTabChange }) => {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const installCmd = 'git clone https://github.com/adil-rahman-3063/OverWatch.git && cd OverWatch && .\\setup.bat';

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-12">
      {/* 1. HERO SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
        {/* Editorial Eyebrow (No generic AI pill badge) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono text-[11px] sm:text-xs uppercase tracking-widest text-neutral-500 select-none">
          <span className="text-neutral-400">Hardware Interlock</span>
          <span className="text-neutral-700">/</span>
          <span className="text-neutral-400">OLED StandBy</span>
          <span className="text-neutral-700">/</span>
          <a 
            href="/changelog" 
            onClick={(e) => { e.preventDefault(); onTabChange('changelog'); }} 
            className="text-neutral-300 hover:text-white transition-colors"
            title="View Changelog"
          >
            v1.2.0
          </a>
        </div>

        {/* Massive Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tight text-white uppercase leading-[1.08]">
            The Physical <br className="hidden sm:inline" />
            <span className="text-neutral-400">AI Interlock</span> <br className="hidden sm:inline" />
            For Coding Agents
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 font-sans leading-relaxed">
            Turn an old smartphone on your desk into a dedicated OLED standby control deck. Catch dangerous terminal commands with strict fail-closed security, control music without tab confusion, and beam prompt instructions directly to your IDE.
          </p>
        </div>

        {/* 1-Click Terminal Quickstart */}
        <div className="max-w-xl mx-auto w-full px-2">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#09090c] border border-[#22222e] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 font-mono text-xs shadow-2xl">
            <div className="flex items-center gap-2 overflow-hidden truncate pl-1 sm:pl-2 py-1">
              <span className="text-neutral-500 select-none">$</span>
              <span className="text-white truncate text-[11px] sm:text-xs">{installCmd}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(installCmd);
                setCopiedInstall(true);
                setTimeout(() => setCopiedInstall(false), 2000);
              }}
              className="px-4 py-2 sm:py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold shrink-0 flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              {copiedInstall ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Quickstart</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-neutral-500 mt-2 text-center">
            Prerequisites: Windows 10/11 • Node.js 18+ • Git
          </p>
        </div>

        {/* Interactive Desk Deck Simulator */}
        <div className="pt-8">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-3">
            Interactive Hardware Deck Simulator • Click screens to explore
          </div>
          <LiveDeckSimulator />
        </div>
      </section>

      {/* Adsterra Banner 1 of 3 (Post-Hero) */}
      <AdsterraBanner />

      {/* 2. THE 4 STANDBY SCREENS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-[#181822] pt-16 space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">01 / The Operating System</span>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white uppercase">
              Four Dedicated Desk Screens
            </h2>
            <p className="text-sm text-neutral-400 font-sans">
              Glanceable, tactile, zero-clutter surfaces tuned specifically for OLED screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Screen 1: Mechanical Split-Flap Clock */}
            <div className="p-6 rounded-2xl bg-[#070709] border border-[#1a1a24] space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white" />
                  SCREEN 01 • MECHANICAL SPLIT-FLAP CLOCK
                </span>
                <span className="text-neutral-500">12H / 24H</span>
              </div>
              <p className="text-neutral-400 text-xs font-sans leading-relaxed">
                Physical 1960s departure-board nostalgia synthesized in code. Realistic downward leaf folding using CSS 3D perspectives, coupled with real-time Web Audio API synthesizing a 2600Hz plastic leaf slap and a 220Hz→50Hz chassis thud on every flip.
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Focus Sprint Timer</span>
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Zero Audio Latency</span>
              </div>
            </div>

            {/* Screen 2: AI Mission Control */}
            <div className="p-6 rounded-2xl bg-[#070709] border border-[#1a1a24] space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-white" />
                  SCREEN 02 • AI MISSION CONTROL & INTERLOCK
                </span>
                <span className="text-emerald-400">FAIL-CLOSED</span>
              </div>
              <p className="text-neutral-400 text-xs font-sans leading-relaxed">
                Connects directly to Antigravity's PreToolUse lifecycle hooks. Inspect live commands, step counts, model token usage, and project directories. Rings audibly on your phone when permission is needed—tap Allow from across the room.
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Multi-Session Routing</span>
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Safe Push Beam</span>
              </div>
            </div>

            {/* Screen 3: Media & Hardware Telemetry */}
            <div className="p-6 rounded-2xl bg-[#070709] border border-[#1a1a24] space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Music className="w-4 h-4 text-white" />
                  SCREEN 03 • WINRT MEDIA & TELEMETRY
                </span>
                <span className="text-neutral-500">GSMTC NATIVE</span>
              </div>
              <p className="text-neutral-400 text-xs font-sans leading-relaxed">
                Direct integration with Windows WinRT Global System Media Transport Controls. Scopes commands to exact session indices (Spotify, Chrome, Edge), completely preventing paused YouTube tutorial tabs from accidentally waking up.
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Multi-Player Carousel</span>
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Live CPU & RAM Gauges</span>
              </div>
            </div>

            {/* Screen 4: Workstation Deck */}
            <div className="p-6 rounded-2xl bg-[#070709] border border-[#1a1a24] space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  SCREEN 04 • WORKSTATION MACROS & CLIPBOARD
                </span>
                <span className="text-neutral-500">UNIVERSAL</span>
              </div>
              <p className="text-neutral-400 text-xs font-sans leading-relaxed">
                Bi-directional universal clipboard beam: beam URLs or snippets from your phone browser directly into the Windows PC clipboard, or fetch current PC text onto mobile with 1-tap. Includes developer action macros for quick git and lock triggers.
              </p>
              <div className="pt-2 font-mono text-[11px] text-neutral-500 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">Clipboard Sync</span>
                <span className="px-2 py-0.5 rounded bg-[#101015] border border-[#20202a] text-neutral-300">One-Tap PowerShell</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Adsterra Banner 2 of 3 (Mid-Page) */}
      <AdsterraBanner />

      {/* 3. STRICT FAIL-CLOSED SECURITY SPECIFICATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-[#181822] pt-16">
          <div className="p-8 rounded-2xl bg-[#09090c] border border-[#22222e] grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Security Architecture</span>
              <h3 className="text-2xl sm:text-3xl font-mono font-bold text-white uppercase">
                The Strict Fail-Closed Guarantee
              </h3>
              <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                In autonomous agent development, a security gate that falls back to "allow" or defaults to desktop dialogs is worse than useless. OverWatch enforces an unbreakable physical interlock law:
              </p>
              <ul className="space-y-2 font-mono text-xs text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-white">✓</span>
                  <span><strong>Phone explicitly taps Allow:</strong> Terminal command executes on laptop.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">✕</span>
                  <span><strong>Phone taps Deny or Skips:</strong> Command killed immediately with code 1.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">✕</span>
                  <span><strong>20s Timeout expires:</strong> Command denied. Agent halts safely.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">✕</span>
                  <span><strong>Daemon offline or phone disconnected:</strong> Strict block. Zero unauthorized execution.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-black border border-[#20202a] space-y-3 font-mono text-xs">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Hook Response</div>
              <div className="p-2.5 rounded bg-[#09090c] border border-neutral-800 text-[11px] text-neutral-300">
                <code>
                  {"{"}<br />
                  &nbsp;&nbsp;"decision": "deny",<br />
                  &nbsp;&nbsp;"reason": "OverWatch mobile approval not granted (timed out or offline)."<br />
                  {"}"}
                </code>
              </div>
              <a
                href="/architecture"
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange('architecture');
                }}
                className="w-full py-2 rounded bg-white text-black font-bold flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-colors"
              >
                <span>Read Full Security Spec</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Adsterra Banner 3 of 3 (Pre-Footer) */}
      <AdsterraBanner />
    </div>
  );
};
