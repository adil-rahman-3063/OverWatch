import React from 'react';
import { GitCommit, Tag, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

export const ChangelogPage: React.FC = () => {
  const releases = [
    {
      version: 'v1.2.0',
      date: 'November 25, 2026',
      badge: 'Current Release',
      title: 'Viewport-Locked Approval Overlay, Multi-Session Discovery & Watchdog Heartbeat',
      changes: [
        {
          type: 'feature',
          title: 'Viewport-Locked Approval Overlay (Landscape Safe)',
          desc: 'Re-architected ApprovalOverlay with a flex-column layout (max-h-[96dvh]), pinned top header, scrollable terminal command box, and permanently pinned bottom action bar. The "Approve All" and Allow/Deny buttons are 100% visible and touchable across all screen ratios.',
        },
        {
          type: 'feature',
          title: 'Multi-Session Agent Discovery & Dynamic Workspace Routing',
          desc: 'AgentSessionMonitor scans ~/.gemini/antigravity/brain, extracting all active session transcripts. In AgentSessionCard, users can swipe horizontally across multiple workspaces (e.g. OverWatch <-> portfolio) with path badges displayed; prompt commands and push beams target the selected workspace window via AppActivate.',
        },
        {
          type: 'feature',
          title: 'True Watchdog Heartbeat Pulse',
          desc: 'The Windows client broadcasts client:heartbeat every 3 seconds. The web deck runs a 1-second watchdog ticker; if no heartbeat is received within 7.5 seconds, the status flips from "PC Live" to "PC Offline" (amber). Added client:ping probe on connect.',
        },
        {
          type: 'fix',
          title: 'Resilient Local IPC Port Handling (EADDRINUSE)',
          desc: 'Added EADDRINUSE error handler to localServer.ts, allowing companion instances to continue safely without crashing when another OverWatch background process is active.',
        },
      ],
    },
    {
      version: 'v1.1.0',
      date: 'November 25, 2026',
      badge: 'Major Update',
      title: 'Safe Git Push Beaming & Landscape PIN Armor',
      changes: [
        {
          type: 'security',
          title: 'Safe Git Push Beaming (Zero Auto-Run)',
          desc: 'Replaced hazardous background shell git push with Safe Push Beaming. Tapping "Push" on mobile copies the exact git push command directly to the Windows clipboard via PowerShell and broadcasts confirmation back to mobile, eliminating sandbox permission errors.',
        },
        {
          type: 'feature',
          title: 'Landscape-Optimized PIN Lock Shield',
          desc: 'Updated PinLock with landscape:flex-row side-by-side layout, making the PIN pad comfortable and accessible when phones rest horizontally on desk MagSafe docks.',
        },
        {
          type: 'feature',
          title: 'Targeted Window AppActivate Focus',
          desc: 'Uses WScript.Shell AppActivate(workspaceName) to automatically bring the target IDE or terminal window into foreground focus before injecting beamed quick prompts.',
        },
      ],
    },
    {
      version: 'v1.0.0',
      date: 'November 24, 2026',
      badge: 'Public Launch',
      title: 'Initial Open-Source Release — StandBy Companion & AI Interlock',
      changes: [
        {
          type: 'feature',
          title: 'Fail-Closed PreToolUse Hook Gateway',
          desc: 'Native Node.js hook intercepting Antigravity terminal tool calls via local HTTP IPC (127.0.0.1:49152). Halts command execution and beams permission request to mobile over Supabase Realtime.',
        },
        {
          type: 'feature',
          title: 'WinRT GSMTC Media Controller',
          desc: 'Native Windows Media Control session manager via PowerShell. Controls Spotify, Chrome, and Edge playback with per-session target index routing, avoiding rogue paused YouTube tab collisions.',
        },
        {
          type: 'feature',
          title: '3D Split-Flap Mechanical Clock',
          desc: 'CSS 3D perspective folding clock with Web Audio API synthesizing mechanical plastic leaf slap (2600Hz noise burst) and chassis resonance (220Hz→50Hz thud).',
        },
        {
          type: 'feature',
          title: 'OLED #000000 Dark Theme & Silent Video Wake-Lock',
          desc: 'Pure black StandBy PWA styling with dual-layer screen wake-lock (navigator.wakeLock + silent 1px looping MP4 video) keeping desk displays alive without altering OS sleep timers.',
        },
      ],
    },
    {
      version: 'v0.9.0',
      date: 'November 23, 2026',
      badge: 'Beta',
      title: 'Core Engine Architecture & Realtime Schema',
      changes: [
        {
          type: 'feature',
          title: 'Local IPC Server & Realtime Broadcast Pipeline',
          desc: 'Engineered the local HTTP daemon on port 49152 and Supabase Realtime schema for zero-delay hardware telemetry, quota snapshots, and permission interlocks.',
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Chronicle</span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase">
          Release Changelog
        </h1>
        <p className="text-sm text-neutral-400 font-sans">
          Complete engineering chronicle of OverWatch updates, architectural improvements, and security patches.
        </p>
      </div>

      {/* Release List */}
      <div className="space-y-12 font-mono">
        {releases.map((rel) => (
          <div key={rel.version} className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-6">
            {/* Version Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#14141c]">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white tracking-wider">{rel.version}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14141e] text-neutral-300 border border-[#222230]">
                  {rel.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Tag className="w-3.5 h-3.5" />
                <span>{rel.date}</span>
              </div>
            </div>

            <h2 className="text-base text-neutral-200 font-sans font-semibold">
              {rel.title}
            </h2>

            {/* Changes list */}
            <div className="space-y-4">
              {rel.changes.map((change, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      change.type === 'security' 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' 
                        : change.type === 'fix' 
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' 
                        : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {change.type}
                    </span>
                    <span className="text-white font-medium">{change.title}</span>
                  </div>
                  <p className="text-neutral-400 font-sans text-xs leading-relaxed pl-1">
                    {change.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
