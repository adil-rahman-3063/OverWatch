# OverWatch • Privacy Policy

**Effective Date:** November 26, 2026  
**Last Updated:** November 26, 2026  
**Version:** 1.2.0  
**Repository:** [github.com/AdilR/OverWatch](https://github.com/AdilR/OverWatch)  
**Maintained by:** Adil Rahman ([adilrahman.cc](https://adilrahman.cc?utm_source=overwatch_privacy))

---

## 1. Executive Summary & Privacy-by-Design Philosophy

OverWatch is an open-source, local-first physical hardware companion and terminal approval interlock designed for autonomous coding agents (including Google Antigravity and Claude Code). 

We believe that personal computing, developer workflows, and agent execution logs must remain strictly confidential and sovereign to the user. **OverWatch is built on a zero-commercialization, zero-telemetry-selling, and zero-cloud-persistence foundation.** 

* **We do not track you.**
* **We do not collect, sell, or rent your personal data, terminal transcripts, prompt entries, or source code.**
* **We do not employ third-party analytics trackers, advertising SDKs, behavioral fingerprinting, or profiling cookies.**
* **All communication channels are peer-to-peer or authenticated end-to-end through private user-controlled keys.**

---

## 2. Information Handled Across System Sub-Packages

OverWatch operates across three primary components: the **Windows Daemon (`client/`)**, the **Mobile WebDeck (`web/`)**, and the **Showcase Portal (`landing/`)**. Below is an exhaustive breakdown of the data handled within each tier:

### A. Terminal Interlock & Permission Payloads
* **Data Type:** Tool call name (e.g., `run_command`), requested CLI execution string, working directory (`cwd`), and unique execution UUID.
* **Origin:** Local `PreToolUse` hooks registered in the developer workstation's agent configuration (`~/.gemini/config/hooks.json`).
* **Processing:** Handled entirely in memory by the local HTTP daemon (`http://127.0.0.1:49152/hook`).
* **Transmission:** Broadcasted via encrypted WebSocket directly to the developer's paired phone.
* **Storage:** Ephemeral. Permission requests are kept in memory for the duration of the approval window (20 seconds) and purged immediately upon decision resolution (`allowed`, `denied`, or `expired`).

### B. Desktop Screen Captures & Image Beaming
* **Data Type:** Visual desktop snips and user-selected device camera/gallery images.
* **Local Storage on PC:** Full-resolution screen snips requested by the mobile user are saved locally to the user's personal storage at `c:\Users\<Username>\Pictures\OverWatch\Screenshots\snip_*.png`. Images beamed from mobile to PC are saved to `c:\Users\<Username>\Pictures\OverWatch\beam_*.png` and placed directly on the Windows OS Clipboard (`Ctrl+V` ready).
* **Network Beaming:**
  * **Wi-Fi Direct (Local LAN):** When phone and PC share the same network, images stream point-to-point over local HTTP (`http://<LAN_IP>:49152/image/*`) with zero internet transit.
  * **Encrypted Cloud Broadcast Fallback:** When on separate subnets or cellular data, images are downscaled using client-side canvas to max 1280px (<150KB JPEG) to transmit across the authenticated Supabase Realtime WebSocket channel.
* **Cloud Retention:** Exactly zero seconds. Payloads are broadcast-only (`broadcast: { self: false }`) and are never written to persistent database tables or external file storage buckets.

### C. Hardware Telemetry & Media State
* **Data Type:**
  * Windows Hardware: CPU overall utilization percentage, physical RAM usage (GB used / total), and GPU model name.
  * Windows Media: Active track title, artist name, playback status (`Playing`, `Paused`), and source player ID via Windows GSMTC (`Windows.Media.Control`).
  * Agent Quota: Rolling Antigravity Gemini Flash and Pro token consumption counters and window reset timestamps calculated locally from configuration files.
* **Transmission:** Emitted every 3 to 5 seconds across the local pairing channel to drive the StandBy hardware gauges.
* **Storage:** Ephemeral. No historical hardware telemetry logs are uploaded or persisted.

### D. Device Pairing & Identity Keys
* **Data Type:** Anonymous Device ID UUID and pairing cryptographic secret.
* **Storage:** Stored locally in browser `localStorage` on the mobile device (`overwatch_device_id`) and in the local workstation configuration file (`client/.env`).
* **Access:** Controlled exclusively by the developer.

---

## 3. Storage, Logging & Data Retention Policies

1. **Local Workstation Logs:** The Windows daemon writes operational status to a local file (`daemon.log`) solely for debugging startup errors, port conflicts, and hook events. This file never leaves your machine.
2. **Database Persistence:** OverWatch does not require or utilize external database row insertions for regular operation. When Supabase is utilized as a real-time signaling relay, communication occurs strictly through in-memory broadcast channels without database persistence.
3. **No Third-Party Analytics:** Neither the mobile deck (`web/`) nor the showcase landing page (`landing/`) incorporates Google Analytics, Mixpanel, Segment, Hotjar, Facebook Pixels, or equivalent telemetry tracking libraries.

---

## 4. Mobile Device Permissions & Hardware Access

The mobile WebDeck (`web/`) requires specific browser capabilities to function as a tactile desk companion:

| Capability | Purpose | Data Handling |
| :--- | :--- | :--- |
| **Camera Access** | Captures photos to beam directly to the Windows Clipboard | Captured images stay local and stream directly to your PC. Zero server storage. |
| **Photo Library** | Allows selecting multiple photos for sequential beaming | Images are loaded into in-memory canvas, compressed, and beamed. |
| **Screen Wake Lock** | Keeps the phone display awake in landscape StandBy mode | Utilizes `navigator.wakeLock` and an inaudible loop. No sensory data accessed. |
| **Web Audio API** | Synthesizes physical mechanical flip sounds & approval chimes | Synthesized 100% locally using oscillator and noise math. Zero microphone access. |
| **Web Share API** | Triggers native iOS/Android "Save to Photos" / Camera Roll | Handled by native OS dialogs. OverWatch cannot inspect your external file system. |
| **Haptic Vibration** | Vibrates the phone upon incoming approval requests | Physical tactile feedback only (`navigator.vibrate`). |

---

## 5. Security & Fail-Closed Safeguards

OverWatch implements strict **Fail-Closed Security Architecture**:
* If the mobile phone loses battery or network connectivity, terminal commands are **blocked automatically**.
* If a permission request is ignored for longer than 20 seconds, the terminal command is **instantly terminated**.
* If an unauthorized payload arrives, the daemon refuses to execute and reports a security violation.
* All local IPC requests on port 49152 require origin verification to prevent unauthorized localhost probing by hostile websites.

---

## 6. Open Source Verification & Auditability

The entire OverWatch source code is published publicly under the MIT License at [github.com/AdilR/OverWatch](https://github.com/AdilR/OverWatch). Users and enterprise security teams are encouraged to inspect, audit, fork, and self-host all components, including:
* Native C# screen capture sources: `client/bin/ScreenCapture.cs`
* Local IPC server and hook handlers: `client/src/ipc/localServer.ts`
* Supabase Realtime synchronization: `client/src/supabase.ts` and `web/src/App.tsx`

---

## 7. Contact & Inquiries

For questions, security vulnerability disclosures, or inquiries regarding this Privacy Policy:
* **Creator & Maintainer:** Adil Rahman
* **Website:** [https://adilrahman.cc](https://adilrahman.cc?utm_source=overwatch_privacy)
* **GitHub Repository:** [https://github.com/AdilR/OverWatch](https://github.com/AdilR/OverWatch)
* **Issue Tracker:** [https://github.com/AdilR/OverWatch/issues](https://github.com/AdilR/OverWatch/issues)
