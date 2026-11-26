# 🛡️ OverWatch

> **Physical AI Interlock & Ambient StandBy Desk Deck for Windows**: Music & Media Controls, Antigravity AI Agent Command Approvals, and Real-Time Quota Gauges for your phone.

- **Canonical Website**: [https://overwatch.adilrahman.cc](https://overwatch.adilrahman.cc)
- **Official GitHub**: [https://github.com/adil-rahman-3063/OverWatch](https://github.com/adil-rahman-3063/OverWatch)
- **Author**: [Adil Rahman](https://adilrahman.cc)
- **License**: [MIT License](file:///c:/Users/adilr/Documents/open-source/OverWatch/TERMS.md)

> [!IMPORTANT]
> **Agent Support & Testing Notice**: Currently, **Google Antigravity** is the primary agent thoroughly tested and verified in live developer workflows. Hook templates for other agents (such as Claude Code) are provided as references; **please test and verify hook behavior in your specific environment before relying on it in critical workflows.**

---

## ⚡ What is OverWatch?

**OverWatch** turns your phone (iPhone / Android) into an interactive companion deck for your PC:
1. 🕰️ **3D Split-Flap Clock & Sprint Timer**: Nostalgic mechanical flip clock with synthesized Web Audio leaf clicks and customizable focus sprint timers (+1m/+5m steppers & presets).
2. 🎵 **Windows Music Control**: Real-time multi-session GSMTC detection (Spotify, Chrome YouTube Music, etc.) with Play/Pause, Next/Prev, and isolated track scrubber.
3. 🛡️ **Agent Command Approvals**: Strict fail-closed interceptor for `run_command` from **Antigravity** and **Claude Code**. Review command preview on your phone with audible alarm and 1-tap **Allow** / **Deny**.
4. 🤖 **AI Mission Control**: Live session telemetry (active model, step count, current objective, tool stream), 1-tap preloaded prompt deck (Continue, Find the Bug, Commit & Push), and mobile custom command creator.
5. 🚀 **Remote Git Push Engine**: Detects when an agent finishes outside the sandbox with uncommitted/unpushed changes, reminds you on mobile with exact command, and lets you 1-tap **Beam & Push via Windows** to run git push natively on the host PC!
6. 📊 **Hardware Telemetry & Quotas**: Live CPU, RAM, battery, active window, and Antigravity model quotas.
7. 👻 **Silent Windows System Tray**: Runs cleanly in the Windows notification area (`^`) with custom vector icon and context menu.
8. ⚡ **Zero Port Forwarding**: Powered by **Supabase Realtime**, working securely over cellular data or Wi-Fi with sub-100ms latency.

---

## 📸 Product Showcase & Preview

<div align="center">
  <img src="docs/screenshots/clock.png" alt="OverWatch Mobile StandBy Desk Deck" width="85%" />
  <p><em>Turn your phone into an ambient OLED companion deck for your PC workstation.</em></p>
</div>

| 🕰️ Screen 1: Retro Flip Clock & Timer | 🤖 Screen 2: AI Mission Control & Interlock |
|:---:|:---:|
| <img src="docs/screenshots/clock.png" width="440" alt="Screen 1: Clock & Timer" /> | <img src="docs/screenshots/ai%20%20sessions%20and%20prompt.png" width="440" alt="Screen 2: AI Mission Control" /> |

| 🎵 Screen 3: WinRT Music & PC Telemetry | ⚡ Screen 4: Workstation Macros & Beam Sync |
|:---:|:---:|
| <img src="docs/screenshots/music%20and%20telemetry.png" width="440" alt="Screen 3: Music & Telemetry" /> | <img src="docs/screenshots/macros%20and%20beam%20sync.png" width="440" alt="Screen 4: Macros & Beam Sync" /> |

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│         Windows Client          │           │       iPhone / Web App (PWA)    │
│  (OverWatch Node.js Daemon)     │           │       (Vite React / Tailwind)   │
└──────────────┬──────────────────┘           └────────────────┬────────────────┘
               │                                               │
               │         Supabase Realtime Channel             │
               │        (e.g., "overwatch:default")            │
               │                                               │
               ├─────── 1. Broadcast "media:state" ───────────►│ (Shows current song & artist)
               │◄────── 2. Broadcast "media:action" ───────────┤ (Tap Play/Pause/Next/Prev)
               │                                               │
               ├─────── 3. Broadcast "quota:state" ───────────►│ (Live Gemini/Claude gauges)
               │                                               │
               │ [Antigravity/Claude asks permission]          │
               ├─────── 4. Push "permission:request" ─────────►│ (Alerts phone: Command preview)
               │◄────── 5. Push "permission:decision" ─────────┤ (You tap [ALLOW] or [DENY])
               ▼                                               ▼
```

---

## 🚀 1-Click Windows Setup (Recommended)

Simply double-click **`setup.bat`** in the project root *(or run `.\setup.ps1` in PowerShell)*.

The script automatically handles everything:
1. **Verifies Prerequisites**: Checks Node.js (v18+) and npm.
2. **Configures Credentials**: Sets up `client/.env` and `web/.env` with your Supabase credentials.
3. **Installs Dependencies**: Runs `npm install` across both `client/` and `web/`.
4. **Builds Everything**: Compiles the client daemon and builds the web PWA.
5. **Generates Tray Icon**: Renders `overwatch.ico` for Windows notification area.
6. **Registers Agent Hooks**: Hooks into Antigravity (`~/.gemini/config/hooks.json`) and Claude Code.
7. **Windows Startup**: Optionally registers OverWatch in the Windows Startup folder.
8. **Launches**: Starts OverWatch silently in the Windows System Tray!

---

## 🛠️ Manual Step-by-Step Setup

### 1. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** -> **New Query**, copy the contents of [`supabase/schema.sql`](file:///c:/Users/adilr/Documents/open-source/OverWatch/supabase/schema.sql) and click **Run**.
3. Note your **Project URL** and **Anon Key** from *Project Settings -> API*.

### 2. Windows Client Setup
```bash
cd client
cp .env.example .env
# Edit .env and paste your SUPABASE_URL and SUPABASE_ANON_KEY

npm install
npm run build
npm start
```

### 3. Install Agent Hooks
To enable remote approval for Antigravity (and Claude Code):
```bash
cd client
npm run setup:hooks
```
*(You can uninstall anytime with `npx tsx src/cli/setupHooks.ts --remove`)*

> [!NOTE]
> Only **Antigravity** has been extensively tested with live terminal hooks. If using Claude Code or another coding agent, please run test commands first to confirm that permission blocking and timeouts behave as expected on your system.

#### ⚙️ Setting to Configure in Antigravity IDE (Mobile Interlock Mode)
To turn your phone into the exclusive hardware token so you don't have to click review prompts on your monitor:

1. Open **Antigravity IDE**.
2. Open **Settings** (or press `Ctrl+,`) and click the **Antigravity Settings** tab.
3. Under **General** ➔ **Global Permissions**:
   - Locate the **Permission preset** dropdown.
   - Select **Auto** (as shown in the screenshot below).
   - In **Auto** mode, Antigravity delegates command approvals directly to OverWatch's PreToolUse lifecycle hook.
   - When Antigravity prepares a terminal command, your phone rings with the command preview. You tap **Allow** on mobile, and the command executes immediately on your laptop — **zero clicks needed on your desktop!**

<div align="center">
  <img src="docs/screenshots/antigravity-auto-preset.png" alt="Antigravity Settings - Permission Preset Auto" width="90%" />
  <p><em>Antigravity Settings &gt; General &gt; Global Permissions &gt; Permission preset: Auto</em></p>
</div>

### 4. Web App (PWA) Setup
```bash
cd web
npm install
npm run dev
```
Open the web app URL on your iPhone Safari, tap **Share** -> **Add to Home Screen**, and launch full-screen!

### 5. Silent Background Mode (System Tray)
To run OverWatch without keeping a terminal window open on your desktop:
- Double-click **`start-tray.bat`** in the project root.
- The **OverWatch icon** will appear in your Windows System Tray (notification overflow area `^`).
- Right-click the tray icon to view live logs, open the web deck, restart, or exit.
- To automatically start in the system tray on Windows boot:
  ```powershell
  powershell -ExecutionPolicy Bypass -File client/scripts/install-startup.ps1
  ```

<div align="center">
  <img src="docs/screenshots/windows-tray-daemon.png" alt="Windows System Tray Notification Area" width="85%" />
  <p><em>OverWatch Client running silently in the Windows System Tray</em></p>
</div>

---

## 🔒 Privacy & Data Governance

OverWatch is built from the ground up on a strict **zero-telemetry, local-first** architecture. Your developer environment, agent terminal streams, and workstation telemetry are sacred.

> **Full Legal Policy**: Read the exhaustive, legal-grade [OverWatch Privacy Policy](file:///c:/Users/adilr/Documents/open-source/OverWatch/PRIVACY.md).
> Also see component-specific policies:
> - Client Daemon: [client/PRIVACY.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/PRIVACY.md)
> - Web Application: [web/PRIVACY.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/web/PRIVACY.md)
> - Landing Page: [landing/PRIVACY.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/landing/PRIVACY.md) (or live at [overwatch.adilrahman.cc/privacy](https://overwatch.adilrahman.cc/privacy))

### Core Privacy Guarantees:
- **Zero Third-Party Analytics**: No Google Analytics, no tracking pixels, no telemetry beacons, and zero telemetry SDKs anywhere in the code.
- **Local Loopback Isolation**: The local IPC interlock binds strictly to `127.0.0.1:49152`. It cannot be probed, triggered, or accessed from outside your workstation.
- **Ephemeral Realtime Relay**: Command approvals and telemetry broadcast over encrypted Supabase Realtime WebSockets. Nothing is persisted to database tables, message logs, or cloud storage.
- **Local Screen & Clipboard Storage**: Screen captures and beamed images are stored strictly on your local disk (`C:\Users\<User>\Pictures\OverWatch`). They are never uploaded to any cloud storage bucket.
- **Fail-Closed Security Boundary**: Terminal command approvals fail closed if pairing or network connection drops, ensuring unreviewed agent actions never execute silently.

---

## 📜 Terms of Service & Open-Source License

OverWatch is released as free, open-source software under the permissive **MIT License**.

> **Full Legal Terms**: Read the comprehensive [OverWatch Terms of Service & License](file:///c:/Users/adilr/Documents/open-source/OverWatch/TERMS.md).
> Also see component-specific terms:
> - Client Daemon: [client/TERMS.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/TERMS.md)
> - Web Application: [web/TERMS.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/web/TERMS.md)
> - Landing Page: [landing/TERMS.md](file:///c:/Users/adilr/Documents/open-source/OverWatch/landing/TERMS.md) (or live at [overwatch.adilrahman.cc/terms](https://overwatch.adilrahman.cc/terms))

### License Summary (MIT):
- **Freedom of Use**: You are free to run, study, fork, modify, self-host, and redistribute OverWatch in personal, commercial, or educational environments.
- **User Responsibility**: You retain sole responsibility for commands executed and approved via the physical interlock deck.
- **Warranty Disclaimer**: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL ADIL RAHMAN OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR DATA LOSS ARISING OUT OF THE USE OF THIS SOFTWARE.

---

## 👨‍💻 Creator & Community

- **Creator & Maintainer**: [Adil Rahman (adilrahman.cc)](https://adilrahman.cc)
- **Official Website**: [https://overwatch.adilrahman.cc](https://overwatch.adilrahman.cc)
- **GitHub Repository**: [https://github.com/adil-rahman-3063/OverWatch](https://github.com/adil-rahman-3063/OverWatch)
- **Bug Reports & Feature Requests**: [GitHub Issues](https://github.com/adil-rahman-3063/OverWatch/issues)

