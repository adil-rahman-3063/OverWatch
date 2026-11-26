import React from 'react';
import { Shield, Lock, EyeOff, Server, HardDrive, Smartphone, FileText, ArrowLeft } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

interface PrivacyPageProps {
  onTabChange?: (tab: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onTabChange }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      {/* Header */}
      <div className="space-y-3">
        {onTabChange && (
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('home');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Live Deck</span>
          </a>
        )}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
            Legal & Trust
          </span>
          <span className="font-mono text-xs text-neutral-500">v1.2.0 • Updated Nov 26, 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          How OverWatch protects your terminal commands, desktop screen captures, hardware telemetry, and developer data with a strict zero-telemetry, local-first architecture.
        </p>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <EyeOff className="w-4 h-4" />
            <span className="font-bold">Zero Telemetry</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            No analytics SDKs, no behavioral tracking cookies, and zero user profiling.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lock className="w-4 h-4" />
            <span className="font-bold">Ephemeral Transit</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            Terminal execution payloads are purged from memory immediately upon decision.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400">
            <HardDrive className="w-4 h-4" />
            <span className="font-bold">Local-First Storage</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            Beamed images and screen captures are saved strictly on your local PC.
          </p>
        </div>
      </div>

      {/* Adsterra Sponsored Banner 1 */}
      <AdsterraBanner />

      {/* Content Sections */}
      <div className="space-y-10 text-sm text-neutral-300 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            1. Core Privacy-by-Design Philosophy
          </h2>
          <p>
            OverWatch is an open-source, physical hardware companion and terminal approval interlock designed for autonomous coding agents (including Google Antigravity and Claude Code). We believe that personal computing, developer workflows, and agent execution logs must remain strictly confidential and sovereign to the user.
          </p>
          <p>
            OverWatch is built on a <strong>zero-commercialization, zero-telemetry-selling, and zero-cloud-persistence foundation</strong>. We do not collect, sell, or rent your personal information, prompt instructions, terminal transcripts, or codebase contents.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            2. Scope of Data Handled Across Tiers
          </h2>
          <div className="p-5 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-4">
            <div className="space-y-1">
              <h3 className="font-mono font-bold text-white text-xs uppercase text-emerald-400">
                A. Terminal Interlock & Permission Payloads
              </h3>
              <p className="text-xs text-neutral-400">
                When an autonomous coding agent invokes a CLI tool (e.g. <code>run_command</code>), local <code>PreToolUse</code> hooks intercept the proposed command, working directory, and tool name. This payload is stored ephemerally in RAM on your local machine for up to 20 seconds. It is broadcasted over an encrypted WebSocket channel to your paired mobile device and purged immediately upon approval, rejection, or timeout.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-bold text-white text-xs uppercase text-blue-400">
                B. Desktop Screen Captures & Clipboard Beaming
              </h3>
              <p className="text-xs text-neutral-400">
                Photos beamed from mobile to PC are stored on your local disk at <code>c:\Users\&lt;User&gt;\Pictures\OverWatch\beam_*.png</code> and placed on your Windows OS Clipboard (<code>Ctrl+V</code> ready). Desktop screenshots requested by your phone are archived locally at <code>c:\Users\&lt;User&gt;\Pictures\OverWatch\Screenshots\snip_*.png</code>. Transferred images are never written to external cloud storage buckets.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-bold text-white text-xs uppercase text-amber-400">
                C. Hardware Telemetry & Media State
              </h3>
              <p className="text-xs text-neutral-400">
                Windows CPU, RAM, GPU utilization, active media session titles (via Windows GSMTC), and rolling Antigravity token quota counters are sampled every 3–5 seconds to drive the mobile StandBy gauges. Telemetry data is in-transit only; no historical time-series logs are uploaded or tracked.
              </p>
            </div>
          </div>
        </section>

        {/* Adsterra Sponsored Banner 2 */}
        <AdsterraBanner />

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            3. Mobile Browser & Hardware Permissions
          </h2>
          <p>
            When utilizing the mobile WebDeck (<code>web/</code>) on iOS Safari or Android Chrome, the application utilizes specific HTML5 capabilities:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-400">
            <li><strong>Camera & Photo Library:</strong> Used only when explicitly capturing snaps or selecting photos to beam to your PC.</li>
            <li><strong>Web Share API:</strong> Triggers the native operating system share sheet so you can save received desktop captures directly to Apple Photos or Android Downloads.</li>
            <li><strong>Web Audio API:</strong> Synthesizes split-flap click sounds and approval chimes in real-time using mathematical oscillators. Microphone access is never requested.</li>
            <li><strong>Screen Wake Lock:</strong> Keeps your display illuminated in landscape StandBy mode on your desk stand.</li>
            <li><strong>LocalStorage:</strong> Stores your anonymous Device ID UUID and cached workspace names entirely within your browser sandbox.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
            4. Open-Source Verification & Auditing
          </h2>
          <p>
            OverWatch is 100% open source under the MIT License. Enterprise security teams, security researchers, and developers can inspect every line of source code, including the native C# screen capture binary (<code>client/bin/ScreenCapture.cs</code>) and local IPC server (<code>client/src/ipc/localServer.ts</code>).
          </p>
          <div className="pt-2">
            <a
              href="https://github.com/adil-rahman-3063/OverWatch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141c] hover:bg-[#1a1a24] text-white border border-[#232330] font-mono text-xs transition-colors"
            >
              <span>Audit Source Code on GitHub</span>
              <span>↗</span>
            </a>
          </div>
        </section>

        {/* Section 5: Creator Contact */}
        <section className="pt-6 border-t border-[#181822] space-y-2 text-xs text-neutral-500 font-mono">
          <p>
            Maintained by <a href="https://adilrahman.cc?utm_source=overwatch_privacy" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white underline">Adil Rahman</a>.
          </p>
          <p>
            For privacy inquiries or security reports, visit <a href="https://github.com/adil-rahman-3063/OverWatch/issues" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white underline">GitHub Issues</a>.
          </p>
        </section>
      </div>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
