import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Settings, ShieldAlert, Monitor, Smartphone, HelpCircle } from 'lucide-react';
import { AdsterraBanner } from '../components/AdsterraBanner.tsx';

export const DocsPage: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Manual</span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase">
          Documentation & Setup Guide
        </h1>
        <p className="text-sm text-neutral-400 font-sans">
          Complete guide to installing, configuring, and deploying OverWatch on your Windows workstation and mobile desk stand.
        </p>
      </div>

      {/* STEP 1: 1-Click Automated Setup */}
      <section className="space-y-4 font-mono text-xs">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <Terminal className="w-4 h-4 text-white" />
          Step 1: 1-Click Automated Workstation Setup
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4">
          <p className="text-neutral-300 font-sans">
            Clone the repository and run the automated setup script. It automatically checks prerequisites (Node.js 18+, npm, Git), generates environment configurations, compiles packages, registers Antigravity hooks, and launches the client.
          </p>

          <div className="p-3 rounded-xl bg-[#040406] border border-[#1e1e28] flex items-center justify-between text-neutral-200">
            <code>git clone https://github.com/adil-rahman-3063/OverWatch.git && cd OverWatch && .\setup.bat</code>
            <button
              onClick={() => copyText('git clone https://github.com/adil-rahman-3063/OverWatch.git && cd OverWatch && .\\setup.bat', 'setup')}
              aria-label="Copy automated workstation setup command"
              className="px-2.5 py-1 rounded bg-[#161622] hover:bg-neutral-800 text-neutral-300 flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {copiedCmd === 'setup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'setup' ? 'Copied' : 'Copy'}</span>
              <span className="sr-only" aria-live="polite">
                {copiedCmd === 'setup' ? 'Command copied to clipboard' : ''}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 font-sans">
            Or with PowerShell: <code>powershell -ExecutionPolicy Bypass -File .\setup.ps1</code>
          </p>
        </div>
      </section>

      {/* STEP 2: Configure Antigravity IDE (The Auto Preset) */}
      <section className="space-y-4 font-mono text-xs content-visibility-auto">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <Settings className="w-4 h-4 text-white" />
          Step 2: Antigravity IDE Configuration (Mobile Interlock Mode)
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4 font-sans text-xs">
          <p className="text-neutral-300">
            To make your mobile phone the exclusive hardware token so you never have to click review prompts on your computer monitor:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-neutral-300">
            <li>Open <strong>Antigravity IDE</strong>.</li>
            <li>Press <kbd className="px-1.5 py-0.5 rounded bg-[#14141c] border border-neutral-700 font-mono text-[10px]">Ctrl+,</kbd> and click the <strong>Antigravity Settings</strong> tab.</li>
            <li>
              Under <strong>General</strong> ➔ <strong>Global Permissions</strong>:
              <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-neutral-400">
                <li>Locate the <strong>Permission preset</strong> dropdown.</li>
                <li>Select <strong>Auto</strong>.</li>
                <li>In <strong>Auto</strong> mode, Antigravity delegates command approvals directly to OverWatch's PreToolUse lifecycle hook.</li>
              </ul>
            </li>
          </ol>

          <div className="p-4 rounded-xl bg-[#050508] border border-[#1c1c28] space-y-2">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Antigravity Settings &gt; General &gt; Global Permissions &gt; Permission preset: Auto
            </div>
            <div className="w-full rounded-lg overflow-hidden border border-neutral-800 bg-[#09090c] p-4 text-center">
              <span className="font-mono text-xs text-neutral-300 block mb-2">Permission preset ➔ [ Auto ▼ ]</span>
              <p className="text-[11px] text-neutral-500 font-sans">
                When Antigravity initiates a terminal tool execution, your phone rings with the full command. Tap <strong>Allow</strong> on mobile, and the command executes immediately—zero desktop popups!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3: Silent System Tray Companion */}
      <section className="space-y-4 font-mono text-xs content-visibility-auto">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <Monitor className="w-4 h-4 text-white" />
          Step 3: Background System Tray Companion
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4 text-xs font-sans">
          <p className="text-neutral-300">
            Run OverWatch quietly in the background without keeping a terminal window open on your desktop:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-neutral-400 font-mono text-[11px]">
            <li>Double-click <code>start-tray.bat</code> in the project root.</li>
            <li>The OverWatch monochrome icon appears in your Windows System Tray (notification overflow area <code>^</code>).</li>
            <li>Right-click the tray icon to view live logs, open the web deck, restart, or exit.</li>
            <li>
              To automatically launch on Windows boot:
              <div className="p-2 rounded bg-black border border-neutral-800 mt-1 flex items-center justify-between text-neutral-200">
                <code>powershell -ExecutionPolicy Bypass -File client/scripts/install-startup.ps1</code>
                <button
                  onClick={() => copyText('powershell -ExecutionPolicy Bypass -File client/scripts/install-startup.ps1', 'startup')}
                  aria-label="Copy startup installation command"
                  className="px-2 py-0.5 rounded bg-[#161622] hover:bg-neutral-800 text-neutral-300 flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {copiedCmd === 'startup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="sr-only" aria-live="polite">
                    {copiedCmd === 'startup' ? 'Startup command copied to clipboard' : ''}
                  </span>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* STEP 4: Mobile StandBy PWA Setup */}
      <section className="space-y-4 font-mono text-xs content-visibility-auto">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-white" />
          Step 4: Mobile StandBy Display Setup
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-3 font-sans text-xs text-neutral-300">
          <p>
            Open your web deck URL (e.g. <code>http://&lt;YOUR_PC_IP&gt;:5173</code>) on your mobile device:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-neutral-400">
            <li><strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> button ➔ select <strong>Add to Home Screen</strong>. Launch full-screen from your home screen.</li>
            <li><strong>Android (Chrome):</strong> Tap the three-dot menu ➔ select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
            <li>Rest your phone in landscape on your desk dock or MagSafe stand. The screen wake-lock keeps the display continuously active with zero battery waste.</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4 font-mono text-xs content-visibility-auto">
        <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-white" />
          Frequently Asked Questions
        </h2>
        <div className="p-6 rounded-2xl bg-[#08080a] border border-[#1b1b24] space-y-4 font-sans text-xs">
          <div className="space-y-1">
            <h4 className="font-mono font-bold text-white">How do I temporarily disable or uninstall the hook?</h4>
            <p className="text-neutral-400">
              Run <code>npx tsx src/cli/setupHooks.ts --remove</code> inside <code>client/</code>, or edit <code>~/.gemini/config/hooks.json</code> and set <code>"enabled": false</code>.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-[#14141c]">
            <h4 className="font-mono font-bold text-white">Why is git push beamed to the clipboard instead of auto-executed?</h4>
            <p className="text-neutral-400">
              Background daemons and agent sandboxes often lack SSH passphrase credentials or fail on file locks. Safe Push Beaming copies the exact push command to the host Windows clipboard and brings the terminal into focus so you can paste and execute safely.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-[#14141c]">
            <h4 className="font-mono font-bold text-white">What agents are supported?</h4>
            <p className="text-neutral-400">
              Google Antigravity is thoroughly tested and verified with live terminal hooks. Claude Code lifecycle hook scripts are included in <code>client/src/hooks/claudeHook.ts</code> as architectural references for developers.
            </p>
          </div>
        </div>
      </section>

      {/* Adsterra Sponsored Banner */}
      <AdsterraBanner />
    </div>
  );
};
