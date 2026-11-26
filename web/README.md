# 📱 OverWatch Web (StandBy Desk Deck & Mobile PWA)

> **Mobile StandBy Cyberdeck for iPhone & Android**: 3D Split-Flap Clock, mechanical sprint timer, Windows GSMTC music controller, fail-closed AI agent terminal interlock, multi-image beam queue, and high-DPI desktop screen capture receiver.

- **Official Repository**: [https://github.com/adil-rahman-3063/OverWatch](https://github.com/adil-rahman-3063/OverWatch)
- **Canonical Website**: [https://overwatch.adilrahman.cc](https://overwatch.adilrahman.cc)
- **Author**: [Adil Rahman](https://adilrahman.cc)
- **License**: [MIT License](file:///c:/Users/adilr/Documents/open-source/OverWatch/web/TERMS.md)

---

## ⚡ Overview & Mobile StandBy Philosophy

The `web/` package provides the front-end user experience for OverWatch. Designed specifically for smartphones mounted in landscape on a MagSafe or Qi desk stand, it transforms an idle phone into an ambient, zero-light-pollution OLED companion deck (`#000000` True Black).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IPHONE / ANDROID STANDBY DECK                        │
│                                                                        │
│  [Screen 1] 🕰️ 3D Split-Flap Clock & Web Audio Sprint Timer            │
│  [Screen 2] 🎵 GSMTC Windows Media Controller & Hardware Telemetry     │
│  [Screen 3] 🛡️ Agent Terminal Interlock (Allow/Deny) & Mission Control │
│  [Screen 4] ⚡ Workstation Macros & Multi-Image Beam Carousel          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Supabase Realtime WSS (<100ms)
                                    ▼
                     ┌─────────────────────────────┐
                     │    Windows Client Daemon    │
                     │    (client/ port 49152)     │
                     └─────────────────────────────┘
```

---

## 🎨 Deck Features & Screens

### 1. 🕰️ Screen 1: Retro Flip Clock & Focus Timer
- **Mechanical Split-Flap Animation**: Realistic 3D card turnover with pure CSS perspective transforms.
- **Synthesized Web Audio**: Procedurally synthesizes retro mechanical leaf clicks (low-pass filtered white noise burst) without relying on external audio assets.
- **Sprint Timer**: Pomodoro-style focus sprints (+1m, +5m steppers, 15m/25m presets) with synthesized alarm chimes.

### 2. 🎵 Screen 2: Windows Music Controller & PC Telemetry
- **GSMTC Integration**: Real-time track artwork, song title, artist, album, and duration from Spotify, Chrome YouTube Music, SoundCloud, and Windows Media Player.
- **Playback Controls**: Instant Play/Pause, Skip Next, Previous, and isolated Seek Scrubber.
- **Hardware Telemetry**: Live CPU load gauges, RAM consumption, laptop battery percentage, active window title, and Gemini / Claude token quotas.

### 3. 🛡️ Screen 3: AI Mission Control & Terminal Interlock
- **PreToolUse Command Interlock**: Rings with an attention-demanding mechanical alarm when an agent (e.g. Google Antigravity or Claude Code) prepares a terminal command.
- **Command Preview & Inspection**: Review command arguments, working directory, and risk flags with 1-tap **Allow** or **Deny**.
- **Remote Git Push**: Reminds you when an agent leaves uncommitted changes and lets you 1-tap beam a native `git push` directly on the Windows host.

### 4. ⚡ Screen 4: Workstation Quick Actions & Multi-Image Beam
- **Multi-Image Beam Queue**: Select multiple photos from your mobile camera roll at once. View thumbnails in a scrollable reel (`#1`, `#2`, `#3` badge counters, individual remove buttons) and beam them sequentially one by one directly to Windows Clipboard (Ctrl+V ready).
- **Desktop Screen Capture Receiver**: Tap "Capture Screen" to take an instantaneous, high-DPI full-resolution screenshot of your PC monitor and view/save it on your phone.
- **iOS Safari PWA "Save to Camera Roll"**: Utilizes the native Web Share API (`navigator.share({ files: [...] })`) to present the native iOS Share Sheet, allowing users to save desktop captures directly to their iPhone Photos library even in standalone PWA mode.
- **Remote Windows Clipboard Reader**: Pull images currently residing on your PC clipboard directly down to your phone screen.

---

## 📲 StandBy Installation Guide (iOS & Android)

### On iPhone (Safari PWA):
1. Open your deployed URL (e.g. `https://overwatch.adilrahman.cc` or your local web deck) in **Safari**.
2. Tap the **Share** button (box with upward arrow) in the browser toolbar.
3. Scroll down and select **"Add to Home Screen"**.
4. Tap the new **OverWatch** icon on your home screen to launch in borderless, full-screen standalone mode.
5. Mount your iPhone horizontally on a MagSafe charger to enter StandBy mode.

### On Android (Chrome PWA):
1. Open the URL in **Google Chrome**.
2. Tap the three dots menu `⋮` and select **"Install App"** or **"Add to Home Screen"**.
3. Launch the full-screen web app and mount on your desk stand.

---

## 🔒 Privacy & Data Governance

OverWatch Web enforces strict user data minimization and zero external tracking:

> **Full Legal Policy**: Read the exhaustive [OverWatch Web Privacy Policy](file:///c:/Users/adilr/Documents/open-source/OverWatch/web/PRIVACY.md).

### Key Privacy Highlights:
1. **Zero Tracking & Analytics**: No Google Analytics, no Facebook Pixels, no Mixpanel, and no behavioral tracking scripts are included in the bundle.
2. **Ephemeral WebSockets**: Telemetry and control signals are transmitted across ephemeral Supabase Realtime channels. No messages, command strings, or media titles are written to persistent database tables.
3. **Client-Side Image Downsampling**: All photos beamed from mobile are downsampled locally in browser memory via HTML5 Canvas before transmission to remain under 150KB JPEG, keeping all processing on-device.
4. **Local Hardware Storage**: Screenshots and images received on mobile are saved directly into your device's native photo storage (iOS Photos / Android Gallery) via native browser APIs. No cloud image hosting is utilized.

---

## 📜 Terms of Service & License

The OverWatch Web Application is open source under the permissive **MIT License**.

> **Full Legal Terms**: Read the exhaustive [OverWatch Web Terms of Service & License Agreement](file:///c:/Users/adilr/Documents/open-source/OverWatch/web/TERMS.md).

### Summary Terms:
- **Free & Open Source**: You have complete freedom to modify, host your own instance, fork, and embed this deck in your workspace.
- **User Responsibility**: You are responsible for ensuring that terminal commands approved through the mobile interlock are safe and intentional.
- **Disclaimer of Liability**: Provided "AS IS" without warranty of any kind. Adil Rahman and project contributors are not liable for accidental command approvals or device battery wear from long-running display sessions.

---

## 🛠️ Development & Build

```bash
cd web
npm install
npm run dev     # Starts local development server on port 5173
npm run build   # Produces optimized production bundle in dist/
npm run preview # Preview production build locally
```

---

## 🌐 Community & Links

- **Documentation & Workstation Setup**: [https://overwatch.adilrahman.cc/docs](https://overwatch.adilrahman.cc/docs)
- **Live Showcase**: [https://overwatch.adilrahman.cc/showcase](https://overwatch.adilrahman.cc/showcase)
- **GitHub Repository**: [https://github.com/adil-rahman-3063/OverWatch](https://github.com/adil-rahman-3063/OverWatch)
- **Creator**: [Adil Rahman (adilrahman.cc)](https://adilrahman.cc)
