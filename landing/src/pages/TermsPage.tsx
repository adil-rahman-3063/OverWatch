import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Cpu, ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onTabChange?: (tab: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onTabChange }) => {
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
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded">
            Legal & Licensing
          </span>
          <span className="font-mono text-xs text-neutral-500">v1.2.0 • Updated Nov 26, 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase tracking-tight">
          Terms of Service & License
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          The legal framework, user responsibilities, open-source MIT licensing, and operational guidelines governing the OverWatch software suite.
        </p>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">Permissive MIT</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            Free to use, modify, fork, inspect, distribute, and self-host.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">Human Authority</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            Operators retain ultimate responsibility for commands authorized on mobile.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-bold">Fail-Closed Safety</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-normal">
            Automatic command termination on timeout, disconnect, or offline state.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-10 text-sm text-neutral-300 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            1. Acceptance of Terms & Open-Source Scope
          </h2>
          <p>
            By downloading, running, compiling, or accessing any component of the OverWatch software suite—including the Windows client daemon (<code>client/</code>), the mobile web deck (<code>web/</code>), the showcase portal (<code>landing/</code>, hosted at <a href="https://overwatch.adilrahman.cc" className="text-white hover:underline">overwatch.adilrahman.cc</a>), or associated automation scripts—you agree to be bound by these Terms and Conditions and the associated <a href="/privacy" onClick={(e) => { e.preventDefault(); onTabChange?.('privacy'); }} className="text-emerald-400 hover:underline">Privacy Policy</a>.
          </p>
          <p>
            OverWatch is distributed under the permissive <strong>MIT License</strong>. In the event of any conflict between these Terms and the MIT License text, the MIT License shall govern with respect to copyright licensing and redistribution rights.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            2. Operator Responsibilities for Autonomous Agent Actions
          </h2>
          <div className="p-5 rounded-xl bg-[#08080a] border border-[#1b1b24] space-y-3">
            <p className="text-xs text-neutral-300">
              OverWatch acts as a physical authorization interlock and transport layer. It does not generate or alter terminal commands independently. 
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-neutral-400">
              <li>
                <strong>Execution Authority:</strong> When your autonomous coding agent (Google Antigravity or Claude Code) proposes a command, you are responsible for reviewing the full command string, arguments, and target directory before tapping <strong>"Allow"</strong> on your mobile device.
              </li>
              <li>
                <strong>Host User Privileges:</strong> Authorized commands execute with the active operating system user account privileges of your local workstation. You are solely responsible for actions that alter local codebases, perform Git pushes, execute database migrations, or install external dependencies.
              </li>
              <li>
                <strong>Fail-Closed Safe Rule:</strong> OverWatch automatically blocks and terminates any pending command if unreviewed after 20 seconds, or if the phone or daemon is disconnected.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            3. Desktop Screen Capture & Clipboard Usage
          </h2>
          <p>
            OverWatch allows you to capture your workstation screen and beam images directly into the Windows OS Clipboard:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-400">
            <li>You authorize the native C# screencap binary (<code>client/bin/screencap.exe</code>) to capture the primary desktop display upon your explicit tap in the mobile app.</li>
            <li>You agree not to stream proprietary, confidential, or sensitive personal data that you do not have permission to process.</li>
            <li>You acknowledge that beaming text or images to Windows updates your OS clipboard bitmap, and OverWatch is not liable for data displaced from your clipboard history.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            4. Disclaimer of Warranties & Limitation of Liability
          </h2>
          <div className="p-4 rounded-xl bg-[#0f090a] border border-[#2b171a] text-xs text-neutral-300 space-y-2 font-mono">
            <p className="font-bold text-red-400 uppercase">"AS IS" WARRANTY DISCLAIMER</p>
            <p className="font-sans leading-relaxed text-neutral-400">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="font-sans leading-relaxed text-neutral-400">
              IN NO EVENT SHALL ADIL RAHMAN OR PROJECT CONTRIBUTORS BE LIABLE FOR ANY DAMAGES, LOSS OF DATA, CORRUPTED CODEBASES, UNINTENDED GIT COMMITS, HARDWARE DEFECTS, OR BATTERY DEGRADATION ARISING OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OF THE SOFTWARE.
            </p>
          </div>
        </section>

        {/* Section 5: Creator Contact & Attribution */}
        <section className="pt-6 border-t border-[#181822] space-y-2 text-xs text-neutral-500 font-mono">
          <p>
            Created and maintained by <a href="https://adilrahman.cc?utm_source=overwatch_terms" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white underline">Adil Rahman</a>.
          </p>
          <p>
            Website: <a href="https://overwatch.adilrahman.cc" className="text-neutral-300 hover:text-white underline">overwatch.adilrahman.cc</a> • GitHub: <a href="https://github.com/adil-rahman-3063/OverWatch" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white underline">github.com/adil-rahman-3063/OverWatch</a>
          </p>
        </section>
      </div>
    </div>
  );
};
