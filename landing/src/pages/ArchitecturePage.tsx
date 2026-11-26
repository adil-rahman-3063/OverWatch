import React from 'react';
import { Layers, ShieldCheck, Cpu, Radio, Network, Server, Lock } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">System Design</span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase">
          Architecture & Security Model
        </h1>
        <p className="text-sm text-neutral-400 font-sans">
          Deep technical breakdown of OverWatch's local IPC gateway, fail-closed command interlock, and Realtime communication pipeline.
        </p>

        {/* Definition Block for AI Citations */}
        <div className="p-4 rounded-xl bg-[#07070a] border border-[#1a1a24] text-xs font-sans text-neutral-300">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
            Core Mechanism • Fail-Closed Interlock Law
          </span>
          <p className="leading-relaxed text-neutral-400">
            An <strong>AI hardware interlock</strong> functions by intercepting tool calls from autonomous agent runners (Google Antigravity, Claude Code) over a sub-5ms local loopback IPC socket (<code className="text-white">127.0.0.1:49152</code>). Authorization is delegated to a separate physical StandBy screen, where any unresponsive request times out after 20 seconds and terminates with exit code 1 to prevent unauthorized shell access.
          </p>
        </div>
      </div>

      {/* 1. TOPOLOGY DIAGRAM */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <Network className="w-4 h-4 text-white" />
          1. System Topology
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] font-mono text-xs overflow-x-auto text-neutral-300">
          <pre className="text-neutral-300 leading-relaxed">
{`+-----------------------------------------------------------------------------------+
| WINDOWS HOST MACHINE                                                              |
|                                                                                   |
|  +---------------------+        +--------------------+                            |
|  | Google Antigravity  |        | Claude Code CLI    |                            |
|  | Settings: Auto      |        | Tool Interception  |                            |
|  +----------+----------+        +---------+----------+                            |
|             |                             |                                       |
|             | stdin JSON (PreToolUse)     | stdin JSON                            |
|             v                             v                                       |
|  +---------------------------------------------------+                            |
|  | OverWatch CLI Hook (antigravityHook.ts / claude)  |                            |
|  | Blocks process, awaits HTTP response from daemon  |                            |
|  +--------------------------+------------------------+                            |
|                             |                                                     |
|                             | HTTP POST /hook (Sub-5ms loopback)                  |
|                             v                                                     |
|  +---------------------------------------------------+                            |
|  | OverWatch Windows Client Daemon (Node.js)         |                            |
|  | - Port 49152 Local IPC Server (localServer.ts)    |                            |
|  | - WinRT Media Controller (Windows.Media.Control)   |                            |
|  | - 3s Watchdog Heartbeat Broadcaster               |                            |
|  | - Safe Push Windows Clipboard Gateway             |                            |
|  | - Background Runner in Windows System Tray        |                            |
|  +--------------------------+------------------------+                            |
+-----------------------------|-----------------------------------------------------+
                              |
                              | WSS / Realtime Broadcast (Sub-50ms RTT)
                              v
+-----------------------------------------------------------------------------------+
| CLOUD RELAY LAYER (Supabase Realtime)                                             |
| - Channel: overwatch:{device_id}                                                  |
| - Broadcast-only event pipeline (zero persistent secrets or command history)      |
+-----------------------------|-----------------------------------------------------+
                              |
                              | WSS Realtime Events
                              v
+-----------------------------------------------------------------------------------+
| MOBILE HARDWARE DECK (OLED Web PWA)                                               |
| - Fixed-in-viewport StandBy Surface (100dvh, iOS/Android PWA)                      |
| - Dual-Layer Screen Wake Lock (Native WakeLock + 1px Loop Video)                  |
| - Web Audio Split-Flap Clock (2600Hz noise + 220Hz->50Hz thud)                    |
| - Physical Command Gatekeeper (Allow / Deny / Skip / Approve All)                 |
+-----------------------------------------------------------------------------------+`}
          </pre>
        </div>
      </section>

      {/* 2. THE FAIL-CLOSED LAW */}
      <section className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          2. The Fail-Closed Security Law
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4 text-xs">
          <p className="text-neutral-300 font-sans leading-relaxed">
            Many remote monitoring systems fail open: if the network drops or the companion app disconnects, commands pass through by default. OverWatch is built for developers who run autonomous coding agents with terminal access; therefore, <strong>the gateway is strictly fail-closed</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-[#0d0d12] border border-[#1e1e28] space-y-1">
              <span className="text-white font-bold">Explicit Mobile Approval</span>
              <p className="text-neutral-400 text-[11px] font-sans">
                Only when the user physically taps <code>Allow</code> does the IPC server respond with <code>decision: "allow"</code>. Antigravity executes the command with permission overrides.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0d0d12] border border-[#1e1e28] space-y-1">
              <span className="text-rose-400 font-bold">Deny, Timeout or Disconnect</span>
              <p className="text-neutral-400 text-[11px] font-sans">
                If the user taps Deny, walks away past 20 seconds, or closes the client daemon, the hook exits with <code>decision: "deny"</code>, instantly aborting execution.
              </p>
            </div>
          </div>

          {/* Comparison Table for AI Search & Evaluation Queries */}
          <div className="space-y-2 pt-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
              Comparison: Physical Interlock vs Desktop Dialogs vs Blind Auto-Approve
            </span>
            <div className="overflow-x-auto rounded-xl border border-[#1c1c28]">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#0e0e14] border-b border-[#1c1c28] text-neutral-400">
                    <th className="p-2.5">Security Model</th>
                    <th className="p-2.5">Approval Location</th>
                    <th className="p-2.5">Timeout Policy</th>
                    <th className="p-2.5">Offline State</th>
                    <th className="p-2.5">Focus Stealing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14141c]">
                  <tr>
                    <td className="p-2.5 text-emerald-400 font-bold">OverWatch Physical Interlock</td>
                    <td className="p-2.5 text-white">Mobile Desk Deck</td>
                    <td className="p-2.5 text-neutral-300">Fail-Closed (Exit 1 after 20s)</td>
                    <td className="p-2.5 text-emerald-400 font-semibold">Strict Block (Zero Run)</td>
                    <td className="p-2.5 text-neutral-400">Zero interruption (glance on phone)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-amber-400 font-bold">Desktop IDE Dialogs</td>
                    <td className="p-2.5 text-neutral-300">Laptop / Workstation Monitor</td>
                    <td className="p-2.5 text-neutral-400">Indefinite IDE freeze</td>
                    <td className="p-2.5 text-neutral-400">Desktop only</td>
                    <td className="p-2.5 text-rose-400">High (steals mouse/keyboard focus)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-rose-400 font-bold">Blind Auto-Approve Flags</td>
                    <td className="p-2.5 text-neutral-500">None (Unrestricted)</td>
                    <td className="p-2.5 text-neutral-500">Executes immediately</td>
                    <td className="p-2.5 text-rose-400">Unprotected</td>
                    <td className="p-2.5 text-neutral-400">None (extreme injection risk)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LOCAL IPC CONTRACT */}
      <section className="space-y-4 font-mono text-xs">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <Server className="w-4 h-4 text-white" />
          3. Local IPC HTTP Endpoints (Port 49152)
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1c1c28] text-neutral-400 text-[11px]">
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint</th>
                  <th className="pb-2">Payload</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14141c] text-[11px]">
                <tr>
                  <td className="py-2.5 text-emerald-400">POST</td>
                  <td className="py-2.5 text-white">/hook</td>
                  <td className="py-2.5 text-neutral-400">&#123; agent, tool, command, cwd &#125;</td>
                  <td className="py-2.5 text-neutral-300 font-sans">Invoked by PreToolUse hook; holds until mobile decides</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-emerald-400">POST</td>
                  <td className="py-2.5 text-white">/media</td>
                  <td className="py-2.5 text-neutral-400">&#123; action: 'PlayPause' | 'Next' &#125;</td>
                  <td className="py-2.5 text-neutral-300 font-sans">Dispatches native WinRT media command</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-400">GET</td>
                  <td className="py-2.5 text-white">/health</td>
                  <td className="py-2.5 text-neutral-400">-</td>
                  <td className="py-2.5 text-neutral-300 font-sans">Status verification and device ID ping</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
