import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { ChangelogPage } from './pages/ChangelogPage.tsx';
import { DocsPage } from './pages/DocsPage.tsx';
import { ShowcasePage } from './pages/ShowcasePage.tsx';
import { DeveloperPage } from './pages/DeveloperPage.tsx';

// Mapping of clean URL paths to tab identifiers
const PATH_TO_TAB: Record<string, string> = {
  '/': 'home',
  '/home': 'home',
  '/architecture': 'architecture',
  '/changelog': 'changelog',
  '/docs': 'docs',
  '/documentation': 'docs',
  '/showcase': 'showcase',
  '/developer': 'developer',
  '/dev': 'developer',
  '/about': 'developer',
};

const TAB_TO_PATH: Record<string, string> = {
  home: '/',
  architecture: '/architecture',
  changelog: '/changelog',
  docs: '/docs',
  showcase: '/showcase',
  developer: '/developer',
};

// Base Canonical Domain
const BASE_DOMAIN = 'https://overwatch.adilrahman.cc';

// SEO metadata per page for search engines and indexing crawlers
const PAGE_META: Record<string, { title: string; description: string }> = {
  home: {
    title: 'OverWatch • Physical AI Interlock & StandBy Desk Deck',
    description: 'Turn an idle smartphone into a dedicated OLED hardware interlock and StandBy deck for autonomous coding agents with fail-closed security.',
  },
  architecture: {
    title: 'System Architecture & Fail-Closed Security • OverWatch',
    description: 'Technical breakdown of OverWatch local IPC gateway (port 49152), PreToolUse fail-closed interlock, and Supabase Realtime pipeline.',
  },
  changelog: {
    title: 'Release Notes & Changelog (v1.2.0) • OverWatch',
    description: 'Version history, patch notes, multi-session transcript discovery, and watchdog heartbeat updates for OverWatch.',
  },
  docs: {
    title: 'Documentation & Workstation Setup Guide • OverWatch',
    description: 'Complete setup guide for OverWatch Windows daemon, Antigravity Auto mode, system tray service, and mobile PWA deck.',
  },
  showcase: {
    title: 'Desk Showcase & Hardware Philosophy • OverWatch',
    description: 'The zero-watt OLED standby philosophy, MagSafe desk mounting ergonomics, and Web Audio mechanical synthesis.',
  },
  developer: {
    title: 'Adil Rahman • Creator of OverWatch (adilrahman.cc)',
    description: 'About Adil Rahman (adilrahman.cc), software engineer and builder of OverWatch. Dedicated to autonomous agent tooling and physical cyberdecks.',
  },
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    // 1. Check pathname first (e.g. /developer)
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (PATH_TO_TAB[path]) {
      return PATH_TO_TAB[path];
    }
    // 2. Fallback check for legacy hash (e.g. /#docs)
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['home', 'architecture', 'changelog', 'docs', 'showcase', 'developer'].includes(hash)) {
      return hash;
    }
    return 'home';
  });

  const updatePageMetadata = (tab: string) => {
    const meta = PAGE_META[tab] || PAGE_META.home;
    document.title = meta.title;
    
    // Update or create meta description for SEO crawlers
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', meta.description);

    // Update canonical link to overwatch.adilrahman.cc
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const cleanPath = TAB_TO_PATH[tab] || '/';
    canonical.setAttribute('href', `${BASE_DOMAIN}${cleanPath}`);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    const targetPath = TAB_TO_PATH[tab] || '/';

    // Push clean URL to browser history (enables indexing and browser back/forward)
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }

    updatePageMetadata(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync with browser back and forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const matchedTab = PATH_TO_TAB[path] || 'home';
      setCurrentTab(matchedTab);
      updatePageMetadata(matchedTab);
    };

    window.addEventListener('popstate', handlePopState);
    
    // If user arrived with a hash like /#docs, convert to clean path /docs
    if (window.location.hash) {
      const hashTab = window.location.hash.replace('#', '').toLowerCase();
      if (TAB_TO_PATH[hashTab]) {
        window.history.replaceState({ tab: hashTab }, '', TAB_TO_PATH[hashTab]);
      }
    } else {
      // Ensure initial URL is recorded in history state
      const initialPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const initialTab = PATH_TO_TAB[initialPath] || 'home';
      window.history.replaceState({ tab: initialTab }, '', TAB_TO_PATH[initialTab] || '/');
    }

    updatePageMetadata(currentTab);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Pinned Navigation Bar */}
      <Navbar currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Main Tab Content */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        {currentTab === 'home' && <HomePage onTabChange={handleTabChange} />}
        {currentTab === 'architecture' && <ArchitecturePage />}
        {currentTab === 'changelog' && <ChangelogPage />}
        {currentTab === 'docs' && <DocsPage />}
        {currentTab === 'showcase' && <ShowcasePage />}
        {currentTab === 'developer' && <DeveloperPage />}
      </main>

      {/* Footer */}
      <Footer onTabChange={handleTabChange} />
    </div>
  );
}
