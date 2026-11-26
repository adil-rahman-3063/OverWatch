# 🖥️ OverWatch Client (Windows Host Daemon)

> **Local Workstation Daemon for Windows**: System Tray background service, local IPC gateway (`127.0.0.1:49152`), Global System Media Transport Controls (GSMTC), native C# DPI-aware screen capture engine, and Supabase Realtime communication relay.

- **Official Repository**: [https://github.com/adil-rahman-3063/OverWatch](https://github.com/adil-rahman-3063/OverWatch)
- **Canonical Website**: [https://overwatch.adilrahman.cc](https://overwatch.adilrahman.cc)
- **Author**: [Adil Rahman](https://adilrahman.cc)
- **License**: [MIT License](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/TERMS.md)

---

## ⚡ Overview & Role in OverWatch Suite

The `client/` package hosts the native Windows engine that runs quietly in your PC workstation's background. It acts as the bridge between autonomous AI agents (such as **Google Antigravity** and Claude Code), Windows operating system APIs, and your mobile StandBy desk deck.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WINDOWS WORKSTATION HOST                        │
│                                                                        │
│   ┌─────────────────────┐                  ┌──────────────────────┐    │
│   │ Google Antigravity  │                  │ Windows OS Subsystem │    │
│   │ PreToolUse Hook     │                  │ (GSMTC / Clipboard)  │    │
│   └──────────┬──────────┘                  └──────────┬───────────┘    │
│              │ (Local HTTP POST)                      │                │
│              ▼                                        ▼                │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │              OverWatch Daemon (client/src/)                   │    │
│   │  • Local IPC Server (127.0.0.1:49152)                         │    │
│   │  • Native C# Screencap Engine (screencap.exe)                 │    │
│   │  • System Tray Service (SysTray / Icon)                       │    │
│   │  • Hardware Telemetry Poller (CPU, RAM, Battery)              │    │
│   └───────────────────────────────┬───────────────────────────────┘    │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Supabase Realtime (WSS)
                                    ▼
                     ┌─────────────────────────────┐
                     │   Mobile StandBy Deck       │
                     │   (web/ PWA on Phone)       │
                     └─────────────────────────────┘
```

---

## 🔧 Core Components & Architecture

### 1. Local IPC Server (`127.0.0.1:49152`)
The daemon hosts an isolated, loopback-only HTTP server on port `49152`. AI agent lifecycle hooks send JSON payloads to this server whenever a command needs review. The local server holds the agent execution until a cryptographic decision is relayed from your phone.

### 2. Native C# Screen Capture & Clipboard Engine (`bin/screencap.exe`)
To eliminate PowerShell AMSI (`ScriptContainedMaliciousContent`) antivirus false positives and avoid PowerShell startup overhead, OverWatch compiles a standalone C# utility using native Windows .NET Framework (`csc.exe`):
- **High-DPI Aware**: Calls `SetProcessDPIAware()` to capture 100% of the primary display at true native resolution (fixing quadrant cropping on 125%/150%/200% Windows scaling).
- **Sub-30ms Execution**: Instant screen grab, lossless PNG disk archive to `Pictures/OverWatch/Screenshots/`, and 75% quality JPEG base64 stdout output for instant Realtime transmission.
- **Direct Clipboard Bitmap**: Sets and reads Windows Clipboard image streams without touching temporary PowerShell scripts.
- **HUD Toast Notifications**: Spawns an OLED dark-themed non-stealing HUD toast above the Windows taskbar with audio chime when mobile beams images.

### 3. Media Telemetry Poller (GSMTC)
Reads active media sessions across Windows (Spotify, Chrome YouTube Music, Tidal, Podcasts) and exposes Play/Pause, Skip, Previous, and Track Scrubber controls.

### 4. System Tray Background Service
Runs silently in the Windows Notification Area (`^`) without occupying taskbar space. Right-click options allow viewing logs, restarting, or shutting down the daemon cleanly.

---

## 🚀 Setup & Execution

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- Node.js v18.0.0 or higher
- .NET Framework 4.0+ (pre-installed on all modern Windows versions)

### 1. Configuration
Create a `.env` file in `client/` containing your Supabase Realtime credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
OVERWATCH_CHANNEL=overwatch:default
PORT=49152
```

### 2. Install & Build
```bash
cd client
npm install
npm run build
```

### 3. Start Daemon
```bash
# Foreground interactive mode
npm start

# Or run silently in Windows System Tray
npm run tray
```

---

## 🔒 Privacy & Data Governance

OverWatch client enforces an uncompromising, local-first privacy architecture:

> **Full Legal Policy**: Read the exhaustive [OverWatch Client Privacy Policy](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/PRIVACY.md).

### Key Privacy Guarantees:
1. **Local Loopback Isolation**: The local IPC server binds exclusively to `127.0.0.1:49152`. No external internet traffic or LAN interface can probe, query, or execute commands through this endpoint.
2. **Zero Telemetry & Tracking**: The client contains zero third-party telemetry, analytics, user trackers, error reporting daemons (e.g. Sentry), or metric collectors.
3. **No Terminal Logging to Cloud**: Command prompts and terminal executions reviewed via the interlock are never stored in any database or cloud server. They are broadcast ephemerally over encrypted WebSockets directly to your paired mobile device.
4. **Local Image Archiving**: Images beamed to or captured from your PC are stored strictly in your local Windows user directory (`C:\Users\<User>\Pictures\OverWatch`). They are never uploaded to cloud buckets or public CDNs.
5. **No Keylogging or Screen Snooping**: The screen capture engine only triggers when explicitly commanded by the authenticated mobile user via the manual "Capture Screen" button. Background periodic screen recording does not exist.

---

## 📜 Terms of Service & License

The OverWatch Windows Client is free, open-source software licensed under the permissive **MIT License**.

> **Full Legal Terms**: Read the exhaustive [OverWatch Client Terms of Service & License Agreement](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/TERMS.md).

### Summary Terms:
- **Permission & Rights**: You are free to inspect, run, modify, fork, compile, and distribute this software for personal or commercial development workflows.
- **Fail-Closed Security**: The client acts as a security interlock for AI agents. By running this software, you understand that agent command execution relies on pairing integrity. If the daemon is unlinked, it fails closed to protect your host workstation.
- **Disclaimer of Warranty**: The software is provided "AS IS", without warranty of any kind. The author (Adil Rahman) and contributors assume no liability for uncommitted git states, command denials, or filesystem actions taken by AI agents running on your machine.

---

## 🌐 Community & Links

- **Documentation & Setup**: [https://overwatch.adilrahman.cc/docs](https://overwatch.adilrahman.cc/docs)
- **System Architecture**: [https://overwatch.adilrahman.cc/architecture](https://overwatch.adilrahman.cc/architecture)
- **GitHub Issues**: [https://github.com/adil-rahman-3063/OverWatch/issues](https://github.com/adil-rahman-3063/OverWatch/issues)
- **Creator**: [Adil Rahman (adilrahman.cc)](https://adilrahman.cc)
