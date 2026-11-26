import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { ChangelogPage } from './pages/ChangelogPage.tsx';
import { DocsPage } from './pages/DocsPage.tsx';
import { ShowcasePage } from './pages/ShowcasePage.tsx';
import { DeveloperPage } from './pages/DeveloperPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';

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
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy',
  '/terms': 'terms',
  '/terms-of-service': 'terms',
  '/license': 'terms',
};

const TAB_TO_PATH: Record<string, string> = {
  home: '/',
  architecture: '/architecture',
  changelog: '/changelog',
  docs: '/docs',
  showcase: '/showcase',
  developer: '/developer',
  privacy: '/privacy',
  terms: '/terms',
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
  privacy: {
    title: 'Privacy Policy & Zero-Telemetry Data Governance • OverWatch',
    description: 'Zero telemetry, local-first privacy policy and data governance for OverWatch.',
  },
  terms: {
    title: 'Terms of Service & MIT Open-Source License • OverWatch',
    description: 'Terms of service, open-source MIT license, and user agreement for OverWatch.',
  },
};

const PAGE_NAMES: Record<string, string> = {
  home: 'Home',
  architecture: 'Architecture & Security',
  changelog: 'Changelog',
  docs: 'Documentation & Setup',
  showcase: 'Desk Showcase',
  developer: 'Developer Profile',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
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
    if (['home', 'architecture', 'changelog', 'docs', 'showcase', 'developer', 'privacy', 'terms'].includes(hash)) {
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

    const cleanPath = TAB_TO_PATH[tab] || '/';
    const canonicalUrl = `${BASE_DOMAIN}${cleanPath}`;

    // Update canonical link to overwatch.adilrahman.cc
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Sync Open Graph & Twitter metadata for social previews and link expanders
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute('content', value);
      }
    };

    setMetaTag('meta[property="og:title"]', 'content', meta.title);
    setMetaTag('meta[property="og:description"]', 'content', meta.description);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', meta.title);
    setMetaTag('meta[name="twitter:description"]', 'content', meta.description);
    setMetaTag('meta[name="twitter:url"]', 'content', canonicalUrl);

    // Dynamic JSON-LD BreadcrumbList structured data schema
    let breadcrumbScript = document.getElementById('breadcrumb-schema') as HTMLScriptElement | null;
    let faqScript = document.getElementById('faq-schema') as HTMLScriptElement | null;
    let howtoScript = document.getElementById('howto-schema') as HTMLScriptElement | null;
    let profileScript = document.getElementById('profile-schema') as HTMLScriptElement | null;

    if (tab === 'home') {
      if (breadcrumbScript) breadcrumbScript.remove();
      
      // Inject FAQPage schema on home tab for Google AI Overviews & Perplexity snippet synthesis
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.id = 'faq-schema';
        faqScript.type = 'application/ld+json';
        document.head.appendChild(faqScript);
      }
      const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What happens if my phone battery dies or Wi-Fi drops?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'OverWatch operates on a strict fail-closed security law. If the companion phone is offline, disconnected, or unanswered for 20 seconds, the local IPC hook immediately responds with decision: deny, safely terminating terminal execution.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does OverWatch send my source code or terminal commands to cloud databases?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. OverWatch uses an ephemeral, broadcast-only Supabase Realtime WebSocket channel (overwatch:{device_id}). Payloads exist in volatile memory only during the active approval window and are purged immediately upon decision. Zero code is logged to disk in the cloud.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can an autonomous agent bypass the OverWatch interlock?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. The PreToolUse hook is registered directly inside the agent execution harness prior to process spawning. Without an explicit allow signal returned from local port 49152, the shell command is blocked by the IDE.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Which AI coding agents and CLI tools are supported?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Native support is provided for Google Antigravity (via Auto mode permissions) and Claude Code CLI. Any autonomous agent supporting stdin/stdout JSON lifecycle hooks can integrate directly with the local IPC server.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How much power does the StandBy OLED companion consume?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'On OLED displays, pure black pixels (#000000) power off completely and consume 0 watts. The device stays awake permanently on a desk MagSafe mount with minimal battery draw (<5% per hour).',
            },
          },
        ],
      };
      faqScript.textContent = JSON.stringify(faqData);
    } else {
      if (faqScript) faqScript.remove();
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.id = 'breadcrumb-schema';
        breadcrumbScript.type = 'application/ld+json';
        document.head.appendChild(breadcrumbScript);
      }
      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${BASE_DOMAIN}/`,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': PAGE_NAMES[tab] || meta.title,
            'item': canonicalUrl,
          },
        ],
      };
      breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
    }

    // Google HowTo Schema on /docs
    if (tab === 'docs') {
      if (!howtoScript) {
        howtoScript = document.createElement('script');
        howtoScript.id = 'howto-schema';
        howtoScript.type = 'application/ld+json';
        document.head.appendChild(howtoScript);
      }
      const howtoData = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to Set Up OverWatch on Windows and Antigravity IDE',
        'description': 'Step-by-step setup guide for the OverWatch Windows daemon, Antigravity Auto mode interlock, and mobile StandBy desk deck.',
        'step': [
          {
            '@type': 'HowToStep',
            'name': 'Automated Workstation Setup',
            'text': 'Clone the repository and run setup.bat to check Node.js prerequisites, compile packages, and start the client daemon.',
            'url': `${BASE_DOMAIN}/docs#step-1`,
          },
          {
            '@type': 'HowToStep',
            'name': 'Configure Antigravity IDE Permissions',
            'text': 'Open Antigravity Settings > General > Global Permissions and select the Auto preset to delegate tool approvals to OverWatch.',
            'url': `${BASE_DOMAIN}/docs#step-2`,
          },
          {
            '@type': 'HowToStep',
            'name': 'Connect Mobile Desk StandBy Deck',
            'text': 'Open the PWA on an idle phone in landscape mode and pair it with your workstation device channel.',
            'url': `${BASE_DOMAIN}/docs#step-3`,
          },
        ],
      };
      howtoScript.textContent = JSON.stringify(howtoData);
    } else {
      if (howtoScript) howtoScript.remove();
    }

    // Google ProfilePage & Person Schema on /developer
    if (tab === 'developer') {
      if (!profileScript) {
        profileScript = document.createElement('script');
        profileScript.id = 'profile-schema';
        profileScript.type = 'application/ld+json';
        document.head.appendChild(profileScript);
      }
      const profileData = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'mainEntity': {
          '@type': 'Person',
          'name': 'Adil Rahman',
          'url': 'https://adilrahman.cc',
          'sameAs': [
            'https://github.com/adil-rahman-3063',
            'https://adilrahman.cc',
          ],
          'jobTitle': 'Software Engineer & System Architect',
        },
      };
      profileScript.textContent = JSON.stringify(profileData);
    } else {
      if (profileScript) profileScript.remove();
    }
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
        {currentTab === 'privacy' && <PrivacyPage onTabChange={handleTabChange} />}
        {currentTab === 'terms' && <TermsPage onTabChange={handleTabChange} />}
      </main>

      {/* Footer */}
      <Footer onTabChange={handleTabChange} />
    </div>
  );
}
