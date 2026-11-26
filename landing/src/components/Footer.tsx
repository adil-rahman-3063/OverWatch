import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onTabChange: (tab: string) => void;
}

const GithubIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Footer: React.FC<FooterProps> = ({ onTabChange }) => {
  return (
    <footer className="border-t border-[#161620] bg-black py-12 mt-auto text-neutral-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#101015] border border-neutral-800 p-1 flex items-center justify-center">
                <img src="/icon.svg" alt="OverWatch Logo" width="24" height="24" className="w-full h-full object-contain invert" />
              </div>
              <span className="font-bold text-white tracking-wider uppercase">OVERWATCH</span>
            </div>
            <p className="text-neutral-500 font-sans text-xs leading-relaxed">
              Open-source physical hardware interlock & OLED StandBy companion for autonomous coding agents.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Tested on Google Antigravity IDE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-white font-medium uppercase tracking-wider text-[11px]">Pages</h4>
            <ul className="space-y-1.5">
              <li>
                <a 
                  href="/" 
                  onClick={(e) => { e.preventDefault(); onTabChange('home'); }} 
                  className="hover:text-white transition-colors"
                >
                  Overview
                </a>
              </li>
              <li>
                <a 
                  href="/architecture" 
                  onClick={(e) => { e.preventDefault(); onTabChange('architecture'); }} 
                  className="hover:text-white transition-colors"
                >
                  System Architecture
                </a>
              </li>
              <li>
                <a 
                  href="/changelog" 
                  onClick={(e) => { e.preventDefault(); onTabChange('changelog'); }} 
                  className="hover:text-white transition-colors"
                >
                  Release Changelog
                </a>
              </li>
              <li>
                <a 
                  href="/docs" 
                  onClick={(e) => { e.preventDefault(); onTabChange('docs'); }} 
                  className="hover:text-white transition-colors"
                >
                  Documentation & Setup
                </a>
              </li>
              <li>
                <a 
                  href="/showcase" 
                  onClick={(e) => { e.preventDefault(); onTabChange('showcase'); }} 
                  className="hover:text-white transition-colors"
                >
                  Desk StandBy Showcase
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  onClick={(e) => { e.preventDefault(); onTabChange('privacy'); }} 
                  className="hover:text-white transition-colors text-emerald-400/90 hover:text-emerald-300"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  onClick={(e) => { e.preventDefault(); onTabChange('terms'); }} 
                  className="hover:text-white transition-colors text-cyan-400/90 hover:text-cyan-300"
                >
                  Terms & Licensing
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Specs */}
          <div className="space-y-2">
            <h4 className="text-white font-medium uppercase tracking-wider text-[11px]">Architecture</h4>
            <ul className="space-y-1.5 text-neutral-500">
              <li>IPC Port: 49152 (127.0.0.1)</li>
              <li>Fail-Closed: Strict PreToolUse</li>
              <li>Web Audio: 2600Hz synthesized</li>
              <li>Protocol: Supabase Realtime</li>
              <li>Display: OLED #000000 True Black</li>
            </ul>
          </div>

          {/* Open-Source License & Community */}
          <div className="space-y-2">
            <h4 className="text-white font-medium uppercase tracking-wider text-[11px]">Open Source</h4>
            <p className="text-neutral-500 text-xs font-sans">
              Released under the permissive MIT License. Created by <a href="https://adilrahman.cc" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Adil Rahman</a>.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/adil-rahman-3063/OverWatch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white hover:underline"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>github.com/adil-rahman-3063/OverWatch</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-500" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#14141a] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-600 text-[11px]">
          <div>
            © {new Date().getFullYear()} OverWatch by <a href="https://adilrahman.cc" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">Adil Rahman</a>. Built for autonomous development workflows.
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/privacy" 
              onClick={(e) => { e.preventDefault(); onTabChange('privacy'); }}
              className="hover:text-neutral-400"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms" 
              onClick={(e) => { e.preventDefault(); onTabChange('terms'); }}
              className="hover:text-neutral-400"
            >
              Terms of Service
            </a>
            <span>•</span>
            <a href="https://github.com/adil-rahman-3063/OverWatch/issues" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400">
              Report an Issue
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
