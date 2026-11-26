import React from 'react';
import { ExternalLink, Terminal, ShieldCheck, Code2, Globe, Cpu, Sparkles } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const DeveloperPage: React.FC = () => {
  const portfolioUrl = 'https://adilrahman.cc?utm_source=overwatch&utm_medium=referral&utm_campaign=creator_link';
  const githubUrl = 'https://github.com/adil-rahman-3063';
  const repoUrl = 'https://github.com/adil-rahman-3063/OverWatch';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          Creator & Architect
        </span>
        <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white uppercase tracking-tight">
          Adil Rahman
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans leading-relaxed max-w-2xl">
          Software engineer, system builder, and creator of OverWatch. Dedicated to building high-craft developer tooling, autonomous agent architectures, and physical desk cyberdecks.
        </p>
      </div>

      {/* 1. CREATOR PROFILE & PORTFOLIO CARD */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#14141c]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-lg">Adil Rahman</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Builder
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">
              Personal Portfolio: <span className="text-neutral-200">adilrahman.cc</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold transition-all shadow-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visit adilrahman.cc</span>
              <ExternalLink className="w-3 h-3 text-neutral-600" />
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0e0e14] hover:bg-[#181822] border border-[#242432] text-neutral-300 hover:text-white transition-all active:scale-95"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>@adil-rahman-3063</span>
            </a>
          </div>
        </div>

        {/* Bio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#040406] border border-[#181822] space-y-1.5">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Focus Areas</span>
            <span className="text-white font-medium block">Autonomous Agent Systems</span>
            <p className="text-neutral-400 font-sans text-xs">
              Developing physical-digital control layers for LLM coding harnesses and CLI tools.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#040406] border border-[#181822] space-y-1.5">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Open-Source</span>
            <span className="text-white font-medium block">OverWatch Desk Deck</span>
            <p className="text-neutral-400 font-sans text-xs">
              Zero-clutter OLED companion for Windows workstations and remote command interlocks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#040406] border border-[#181822] space-y-1.5">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] block">Location & Web</span>
            <span className="text-white font-medium block">overwatch.adilrahman.cc</span>
            <p className="text-neutral-400 font-sans text-xs">
              Distributed open-source project hosted under the personal domain ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Adsterra Sponsored Banner 1 */}
      <AdsterraBanner />

      {/* 2. THE ORIGIN STORY: WHY OVERWATCH WAS BORN */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <Terminal className="w-4 h-4 text-white" />
          The Origin of OverWatch
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4 text-xs font-sans text-neutral-300 leading-relaxed">
          <p>
            When autonomous coding agents like Google Antigravity and Claude Code started driving multi-step software development, an irritating friction emerged: <em>the window-switching fatigue</em>.
          </p>
          <p>
            You are in full flow in your code editor or reviewing a design document, and every two minutes an agent halts, demanding terminal approval for a bash command or a file modification. You have to Alt-Tab, locate the hidden terminal window, inspect the command line, approve it, and Alt-Tab back.
          </p>
          <p>
            Second monitors are power-hungry and cause visual fatigue. An old smartphone lying idle in a desk drawer was the obvious answer: a dedicated, OLED true-black hardware cyberdeck that sits at 45 degrees below your monitor on a MagSafe stand.
          </p>
          <div className="p-4 rounded-xl bg-[#0d0d12] border border-[#20202a] font-mono text-xs space-y-1">
            <span className="text-white font-bold">The Core Thesis:</span>
            <p className="text-neutral-400 text-[11px] font-sans">
              "Never let software run unsupervised, but never let supervision interrupt your flow."
            </p>
          </div>
        </div>
      </section>

      {/* Adsterra Sponsored Banner 2 */}
      <AdsterraBanner />

      {/* 3. ENGINEERING ETHOS */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white" />
          Architectural Principles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-2">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Strict Fail-Closed Security
            </span>
            <p className="text-neutral-400 font-sans text-xs leading-relaxed">
              Security tools that fall back to "allow" on network drops are hazardous. OverWatch always fails closed: if the client disconnects, timeouts expire, or user denies, execution is terminated immediately.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-2">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Zero Battery & CPU Bloat
            </span>
            <p className="text-neutral-400 font-sans text-xs leading-relaxed">
              Pure #000000 true black background shuts off OLED subpixels. Web Audio API synthesizes realistic split-flap mechanical clicks live without streaming audio files.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FOOTER PORTFOLIO CALLOUT */}
      <section className="p-8 rounded-2xl bg-[#070709] border border-[#22222e] text-center space-y-4">
        <h3 className="font-mono font-bold text-white text-lg uppercase">
          Explore the Ecosystem
        </h3>
        <p className="text-xs text-neutral-400 font-sans max-w-lg mx-auto">
          Visit Adil Rahman's portfolio to see more open-source experiments, developer tools, and engineering essays.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold flex items-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Globe className="w-4 h-4" />
            <span>adilrahman.cc</span>
            <ExternalLink className="w-3 h-3 text-neutral-600" />
          </a>

          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#0d0d12] hover:bg-[#161620] border border-[#22222e] text-neutral-300 hover:text-white flex items-center gap-2 transition-all active:scale-95"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
        </div>
      </section>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
