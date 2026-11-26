# 📋 OverWatch Landing • Indexing Checklist & SEO Sitemap TODO

This document tracks all canonical web pages, indexing URLs, search crawler metadata, and sitemap endpoints for **[overwatch.adilrahman.cc](https://overwatch.adilrahman.cc)**.

---

## 🌐 XML Sitemap & Crawler Endpoints

| Resource | Canonical Production URL | Purpose |
|:---|:---|:---|
| **Primary XML Sitemap** | `https://overwatch.adilrahman.cc/sitemap.xml` | Machine-readable index submitted to Google Search Console & Bing Webmaster |
| **Robots Directives** | `https://overwatch.adilrahman.cc/robots.txt` | Instructions allowing full crawl access and pointing to `sitemap.xml` |
| **Favicon / Web Clip** | `https://overwatch.adilrahman.cc/icon.svg` | StandBy icon & Google SERP snippet icon |

---

## 📑 Complete List of Pages to Index

All pages are cleanly routed via HTML5 History API (`window.history.pushState`) with distinct page titles, meta descriptions, and `<link rel="canonical">` tags configured in [landing/src/App.tsx](file:///c:/Users/adilr/Documents/open-source/OverWatch/landing/src/App.tsx).

### 1. Overview (Home / Cyberdeck Hub)
- **URL**: `https://overwatch.adilrahman.cc/`
- **Clean Path**: `/`
- **Priority**: `1.0`
- **Changefreq**: `daily`
- **Title**: `OverWatch • Physical AI Interlock & StandBy Desk Deck`
- **Description**: Turn an idle smartphone into a dedicated OLED hardware interlock and StandBy deck for autonomous coding agents with fail-closed security.
- **Index Status**: [ ] Submit to Google Search Console

---

### 2. System Architecture & Fail-Closed Security
- **URL**: `https://overwatch.adilrahman.cc/architecture`
- **Clean Path**: `/architecture`
- **Priority**: `0.9`
- **Changefreq**: `weekly`
- **Title**: `System Architecture & Fail-Closed Security • OverWatch`
- **Description**: Technical breakdown of OverWatch local IPC gateway (port 49152), PreToolUse fail-closed interlock, and Supabase Realtime pipeline.
- **Index Status**: [ ] Submit to Google Search Console

---

### 3. Documentation & Workstation Setup Guide
- **URL**: `https://overwatch.adilrahman.cc/docs`
- **Clean Path**: `/docs`
- **Priority**: `0.9`
- **Changefreq**: `weekly`
- **Title**: `Documentation & Workstation Setup Guide • OverWatch`
- **Description**: Complete setup guide for OverWatch Windows daemon, Antigravity Auto mode, system tray service, and mobile PWA deck.
- **Index Status**: [ ] Submit to Google Search Console

---

### 4. Release Changelog & Version History
- **URL**: `https://overwatch.adilrahman.cc/changelog`
- **Clean Path**: `/changelog`
- **Priority**: `0.8`
- **Changefreq**: `weekly`
- **Title**: `Release Notes & Changelog (v1.2.0) • OverWatch`
- **Description**: Version history, patch notes, multi-session transcript discovery, and watchdog heartbeat updates for OverWatch.
- **Index Status**: [ ] Submit to Google Search Console

---

### 5. Desk StandBy Showcase & Hardware Philosophy
- **URL**: `https://overwatch.adilrahman.cc/showcase`
- **Clean Path**: `/showcase`
- **Priority**: `0.8`
- **Changefreq**: `monthly`
- **Title**: `Desk Showcase & Hardware Philosophy • OverWatch`
- **Description**: The zero-watt OLED standby philosophy, MagSafe desk mounting ergonomics, and Web Audio mechanical synthesis.
- **Index Status**: [ ] Submit to Google Search Console

---

### 6. Creator Profile & Engineering Background
- **URL**: `https://overwatch.adilrahman.cc/developer`
- **Clean Path**: `/developer` (also aliases `/dev` and `/about`)
- **Priority**: `0.7`
- **Changefreq**: `monthly`
- **Title**: `Adil Rahman • Creator of OverWatch (adilrahman.cc)`
- **Description**: About Adil Rahman (adilrahman.cc), software engineer and builder of OverWatch. Dedicated to autonomous agent tooling and physical cyberdecks.
- **Index Status**: [ ] Submit to Google Search Console

---

### 7. Privacy Policy & Zero-Telemetry Data Governance
- **URL**: `https://overwatch.adilrahman.cc/privacy`
- **Clean Path**: `/privacy` (also alias `/privacy-policy`)
- **Priority**: `0.6`
- **Changefreq**: `monthly`
- **Title**: `Privacy Policy • OverWatch`
- **Description**: Zero telemetry, local-first privacy policy and data governance for OverWatch.
- **Index Status**: [ ] Submit to Google Search Console

---

### 8. Terms of Service & MIT Open-Source Licensing
- **URL**: `https://overwatch.adilrahman.cc/terms`
- **Clean Path**: `/terms` (also aliases `/terms-of-service` and `/license`)
- **Priority**: `0.6`
- **Changefreq**: `monthly`
- **Title**: `Terms of Service & License • OverWatch`
- **Description**: Terms of service, open-source MIT license, and user agreement for OverWatch.
- **Index Status**: [ ] Submit to Google Search Console

---

## 🛠️ Search Engine Submission Action Items

- [x] **Update `sitemap.xml`**: Replace placeholder domains with `https://overwatch.adilrahman.cc` and add `/developer`, `/privacy`, and `/terms`.
- [x] **Update `robots.txt`**: Point `Sitemap:` directive to `https://overwatch.adilrahman.cc/sitemap.xml`.
- [ ] **Google Search Console**:
  1. Add property `https://overwatch.adilrahman.cc` (URL prefix or DNS domain verification).
  2. Under **Sitemaps**, submit `https://overwatch.adilrahman.cc/sitemap.xml`.
  3. Use **URL Inspection** on `/` and request initial crawl indexing.
- [ ] **Bing Webmaster Tools**:
  1. Import site from Google Search Console or add domain directly.
  2. Verify `https://overwatch.adilrahman.cc/sitemap.xml` status shows *Success*.
- [ ] **Social Graph & OpenGraph Validation**:
  - Test URL preview cards on [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and [Twitter/X Card Validator](https://cards-dev.twitter.com/validator).
