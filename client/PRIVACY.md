# OverWatch Client Daemon • Privacy Policy

**Component:** Windows Background Client Daemon (`client/`)  
**Version:** 1.2.0  
**Effective Date:** November 26, 2026  
**Parent Document:** [Root Privacy Policy](../PRIVACY.md)  
**Maintained by:** Adil Rahman ([adilrahman.cc](https://adilrahman.cc))

---

## 1. Local-First Processing Architecture

The OverWatch Windows Daemon (`client/`) runs exclusively on your local workstation. It operates as a background service that coordinates between your AI coding agents (such as Google Antigravity and Claude Code), your Windows operating system, and your mobile companion device.

* **Local Port Binding:** The daemon starts a lightweight HTTP server on `0.0.0.0:49152` (and `127.0.0.1:49152`). This port is utilized solely for local hook delivery from Antigravity/Claude Code and for local Wi-Fi Direct image streaming.
* **No Remote Administration:** Port 49152 does not accept arbitrary shell commands or remote execution requests. It only accepts structured permission responses (`allow` or `deny`) matching a cryptographically generated execution UUID initiated by your own machine.
* **Zero Telemetry Upload:** The daemon does not collect, record, or upload operating system usage metrics, browsing history, files, or user keystrokes to any third-party server.

---

## 2. Specific Data Handled by the Windows Client

### A. Terminal Command Interceptions (`PreToolUse` Hook)
When an agent attempts to execute a terminal command:
* The hook script (`client/dist/hooks/antigravityHook.js`) intercepts the proposed command string, working directory path (`cwd`), and tool name.
* This payload is delivered to `http://127.0.0.1:49152/hook` via local IPC.
* The daemon holds this payload in memory for a maximum timeout of 20 seconds.
* If approved on mobile, the daemon unblocks the process and returns `{ decision: "allow" }`.
* If rejected or timed out, the daemon immediately blocks the process with `{ decision: "deny" }`.
* **Data Retention:** The payload is discarded from memory immediately after resolution. It is never persisted to database records.

### B. Image Beaming & Windows Clipboard Integration
* **Beaming to Windows:** Images beamed from mobile to PC are written to your local user directory at `c:\Users\<Username>\Pictures\OverWatch\beam_<timestamp>_<id>.png`. The image is placed directly on the Windows OS Clipboard as a bitmap using native Win32/GDI+ APIs (`screencap.exe -set <path>`), ready for immediate `Ctrl+V` pasting.
* **Beaming from Windows:** When requested by your paired phone:
  * **Clipboard Image:** Reads existing bitmap data from the Windows Clipboard using GDI+, compresses it to high-quality JPEG in memory, and beams it directly to your phone.
  * **Desktop Screen Capture:** Invokes native C# binary `client/bin/screencap.exe` to capture the primary desktop monitor with 100% DPI accuracy. The full-resolution PNG is saved locally to `c:\Users\<Username>\Pictures\OverWatch\Screenshots\snip_<timestamp>.png` for your records, and a compressed JPEG is streamed to your phone.

### C. Hardware Telemetry & Media Monitoring
* **Windows GSMTC:** Queries Windows WinRT `GlobalSystemMediaTransportControlsSessionManager` to read the active playing track name, artist, and playback status. Audio data is never recorded, intercepted, or streamed.
* **System Hardware:** Reads CPU load percentage, RAM usage (GB used / total), and GPU model name via standard Windows management interfaces.
* **Token Quota:** Parses your local agent workspace configuration to compute Gemini Flash and Pro rolling window limits.

---

## 3. Storage & Files on Your Machine

The client daemon creates and maintains only the following files on your PC:
* `c:\Users\<Username>\Pictures\OverWatch\`: Beamed mobile images.
* `c:\Users\<Username>\Pictures\OverWatch\Screenshots\`: Desktop screen captures.
* `client/daemon.log`: Local runtime diagnostic log (errors, port binding, and status).
* `client/.env`: Local configuration storing your private Supabase signaling keys.

You can delete any or all of these files at any time without impacting system stability.

---

## 4. Contact & Auditing

The complete source code of the Windows client daemon is fully open-source and auditable at [github.com/AdilR/OverWatch/tree/main/client](https://github.com/AdilR/OverWatch/tree/main/client).

For questions or security reports:  
**Adil Rahman** • [https://adilrahman.cc](https://adilrahman.cc) • [GitHub Issues](https://github.com/AdilR/OverWatch/issues)
