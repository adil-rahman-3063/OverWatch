# OverWatch Engineering Journal 📓
*The Chronicle of Building an OLED Desk Companion & Autonomous AI Interlock*

---

## Log Entry: Project Genesis — The Pitch-Black Vision
**Date:** November 2026  
**Mood:** Ambitious, minimalist, caffeinated  

Most desk setups are cluttered with second monitors displaying oversized browser tabs or neon bloatware apps that drain laptop batteries and leak telemetry to third-party clouds. I wanted something completely different:

1. **A dedicated StandBy Desk Deck**: An old smartphone resting in landscape on a MagSafe stand, glowing with pure OLED `#000000`, running a high-tactile split-flap clock, Windows hardware telemetry, and instant music control.
2. **A Real-Life Physical AI Interlock**: As coding agents like Antigravity and Claude Code become more autonomous in the terminal, trusting them blindly is terrifying, but sitting at the desk clicking *"Allow"* popups every 30 seconds kills developer flow. I wanted my phone on my desk to ring, show the proposed terminal command, let me tap **Allow** from across the room, and hard-block anything I don't explicitly authorize.

No Electron apps on the phone. No bloated app store wrappers. A lightning-fast web client (React, Vite, Tailwind, TypeScript) communicating with a lightweight background Windows daemon (Node.js + WinRT + Supabase Realtime).

---

## Log Entry: The Battle of Windows Media Sessions
**Topic:** Windows GSMTC vs. Rogue YouTube Tabs  

Controlling music from another device sounds trivial until you actually try to build it on Windows.

Initially, global keyboard emulation (`keybd_event 0xB3` for play/pause) seemed like the easiest path. But it was a disaster in practice: if you were listening to Spotify or YouTube Music and paused a YouTube tutorial video in Chrome 20 minutes ago, hitting play/pause would simultaneously unpause the tutorial video and blast overlapping audio!

We tore out the global keyboard hooks and dug into Windows WinRT via PowerShell:
- Built `get-media.ps1` and `send-media.ps1` leveraging `Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager`.
- Queried every active session (`GetSessions()`) and exposed a list of media sources: Spotify, Chrome (YouTube Music), Edge, etc.
- Scoped command execution directly to the indexed session target:
  ```powershell
  $targetSession = $sessions[$SessionIndex]
  $targetSession.TryTogglePlayPauseAsync()
  ```
Now, skipping tracks or toggling play/pause on YouTube Music never wakes up paused browser video tabs.

### The Mobile Touch Conflict
On the phone's touch screen, swiping left or right to switch StandBy screens was accidentally triggering the media track carousel, and dragging the track scrubber was swiping away the entire page. 
We isolated touch gestures strictly to the track tile using `e.stopPropagation()` and `touch-action: none`. The inner song slider now glides effortlessly while the outer StandBy screen stays anchored like granite.

---

## Log Entry: The Physicality of Time — 3D Split-Flap Clock
**Topic:** Mechanical Soul in a Digital Screen  

A standard digital clock on a desk looks sterile. I wanted the tactile nostalgia of a 1960s mechanical split-flap railway departure board.

We built `<FlipClock />` from scratch using CSS 3D perspectives (`perspective-800`, `rotateX` folds):
- Top leaf folds downwards with an incoming shadow gradient (`animate-flap-top`).
- Bottom leaf catches the fold and settles with momentum (`animate-flap-bottom`).
- 12-Hour format with an AM/PM pill indicator and a Focus Sprint Mode toggle.

### The Sound of Flipping Plastic
A silent split-flap clock has no soul. But loading MP3 sound files over the network introduced latency and audio clipping. Instead, we synthesized the sound in real time using the **Web Audio API**:
1. A **22ms bandpass noise burst** ($2600\text{ Hz}$, $Q=3.2$) simulating the snap of a physical plastic leaf slapping against the catch.
2. A simultaneous **triangle wave thud** dropping from $220\text{ Hz} \to 50\text{ Hz}$ in 20ms, simulating the acoustic resonance of the clock's housing.

### The Scoping Dilemma
The clock ticker runs every second. When users swiped to Screen 2 (Music / Telemetry) or Screen 3 (Macros / Clipboard), the clock was still ticking in the background!
We resolved this with a dual-layer guard:
- Wrapped Screen 1 in an `IntersectionObserver` (`threshold: 0.4`).
- Passed `isActive={isClockVisible && activePageIndex === 0}` into `<FlipClock />`.
- When inactive, `audioCtx.suspend()` is invoked immediately, ensuring complete silence on all other screens.

---

## Log Entry: The Mobile Gatekeeper — Strict Fail-Closed Security
**Topic:** Intercepting Antigravity and Claude Code  

This was the crown jewel of OverWatch: turning the phone into an authorized hardware token for agent commands.

We wrote native `PreToolUse` hooks for Antigravity (`client/src/hooks/antigravityHook.ts`) and configured `~/.gemini/config/hooks.json`. Whenever Antigravity wants to execute a terminal command (`run_command`), the hook halts execution on the PC and posts a permission payload to the OverWatch daemon via local IPC (`http://127.0.0.1:49152/hook`).

The daemon beams this request over Supabase Realtime to the mobile device.

### The "Fail-Closed" Milestone
A loose security gate that falls back to *"allow"* or pops up desktop prompts defeats the entire purpose. We established a strict **Fail-Closed Law**:
- **Allowed on mobile?** ➔ Command executes with code 0 on the laptop.
- **Denied on mobile?** ➔ Hard kill. Agent receives `tool call denied by pre-tool hook`.
- **User walks away / 20s timeout expires?** ➔ Hard kill.
- **User dismisses / skips on mobile?** ➔ Hard kill.
- **Daemon offline or phone disconnected?** ➔ Hard kill.

We verified this live when Antigravity attempted an unauthorized terminal command while the daemon was paused — it was instantly blocked with:
> `Encountered error in tool execution: tool call denied by pre-tool hook: OverWatch mobile approval not granted (timed out or offline). Command blocked.`

Zero clicks needed on the PC. The phone is the sole master key.

---

## Log Entry: Piercing the Mobile Browser Audio Wall
**Topic:** Beating iOS Safari & Chrome Autoplay Restrictions  

When an agent wants permission, the phone must ring immediately, even if it's resting on a desk across the room.

However, mobile browsers aggressively suspend the `AudioContext` if sound is triggered from an asynchronous background WebSocket callback without a direct touch gesture. Sometimes the alert chime would silently fail.

We built a dedicated audio engine in `web/src/utils/sound.ts`:
1. **Global Interaction Primer**: Attached passive `touchstart`, `pointerdown`, and `click` listeners that automatically resume and unlock the `AudioContext` on any touch (unlocking PIN, swiping screens).
2. **Dual-Pulse Ringing Chime ("Ring-Ring!")**: Replaced the short beep with a metallic dual-pulse bell harmonic:
   - Pulse 1 ($1046.5\text{ Hz} + 1318.5\text{ Hz}$ [C6/E6])
   - Pulse 2 ($1318.5\text{ Hz} + 1567.9\text{ Hz}$ [E6/G6])
3. **Multi-Pulse Haptic Vibration**: Added an unmistakable 5-stage phone vibration pattern: `[180ms, 60ms pause, 200ms, 60ms pause, 250ms]`.
4. **20-Second Countdown Overlay**: Extended the auto-minimize countdown from 10s to 20s with an animated progress bar that tucks into a docked floating badge if unattended.

---

## Log Entry: Desk Armor — PIN Lock & Wake Lock
**Topic:** Never Sleep, Never Expose  

Leaving a live remote control on a desk invites accidents or unauthorized clicks from passersby.

- **6-Digit PIN Screen (`PinLock.tsx`)**: Built a tactile keypad with haptic feedback, red shake animation on error, and `localStorage` persistence ("Remember this device").
- **Zero-Sleep Engine**: Mobile OS power managers love turning screens off after 30 seconds. We implemented a dual keep-awake strategy:
  1. `navigator.wakeLock.request('screen')` re-acquired on visibility change.
  2. An invisible $1\times 1$ silent looping base64 MP4 video tag fallback that prevents iOS Safari and Android Chrome from sleeping without changing device-level OS settings.

---

## Log Entry: The Flexible Sprint — Mastering Focus Intervals
**Date:** November 25, 2026  
**Topic:** Tactical Customization of the Split-Flap Timer  

The 3D split-flap mechanical clock looked stunning, but the Focus Sprint Timer was initially hardcoded to 25 minutes. A developer's rhythm isn't fixed: a quick bug fix needs a 10-minute sprint, while an architectural redesign needs 45 or 60 minutes.

We overhauled `<FlipClock />` to make time completely fluid while preserving the physical mechanical feel:
- **Duration Preset Bar**: Added clean pill selectors right above the controls: `[5m]`, `[10m]`, `[15m]`, `[25m]`, `[30m]`, `[45m]`, `[60m]`. The active duration glows in warm amber with retro split-flap mechanical feedback on selection.
- **Bi-Directional Steppers (`+` / `-`)**: Subtly nestled above and below the Minutes flap (`+1m`, `+5m`, `-1m`, `-5m`), allowing the user to dial in *any* custom minute count from 1 to 99.
- **Direct Tap-to-Increment**: Tapping directly on the Minutes split-flap card increments by +5m with physical flap animation and sound.
- **Adaptive Memory Reset**: The Reset button now smartly remembers the user's selected duration (e.g. 45m or 15m), rather than blindly resetting to 25m.
- **Sprint Completion Alarm**: When the countdown reaches `0:00`, it rings the dual-harmonic bell chime and triggers a 5-pulse mobile vibration.

---

## Log Entry: AI Mission Control — Telemetry & Reverse Prompts
**Date:** November 25, 2026  
**Topic:** Real-Time Agent Session Inspection & 1-Tap Command Beaming  

Our mobile desk deck already had media control, PC hardware health, and security interlocks. But as developers, what we stare at most is the AI agent itself. We asked: *Can the phone show me what Antigravity is doing in real-time, and let me direct it with one tap?*

We engineered the **AI Mission Control Screen** (Screen 3 in the StandBy carousel), split 50/50:

### 1. Left Half (50%): The Live Ongoing Session Widget (`AgentSessionCard.tsx`)
- **Real-Time Status Pulsing**: A glowing dot indicates `RUNNING` 🟢 (agent thinking or tool executing), `AWAITING APPROVAL` 🟠 (held by our mobile gatekeeper), or `IDLE` ⚪.
- **Brain Transcript Scanner**: The background daemon monitors `.gemini/antigravity/brain` in real time, extracting the active conversation ID, active model (`Gemini 3.8 Flash High`, `Claude 3.7`), and step counter (`Step #1295`).
- **Objective Quote Box**: Pulls the current user goal and displays it front and center.
- **Active Tool Banner**: When running, highlights the active tool (`run_command`, `edit_file`) with the exact command or file path.
- **Live Action Stream**: A chronological feed of recent agent actions with status checkmarks and tool icons.

### 2. Right Half (50%): The Preloaded Command Deck (`AgentPromptDeck.tsx`)
Typing long instructions on a phone touchscreen is frustrating. We created a high-tactile command deck:
- **Preloaded 1-Tap Prompts**:
  - ⏩ **Continue**: *"Continue with the next step in the plan."*
  - 🐛 **Find the Bug**: *"Analyze the codebase and find the root cause of this issue."*
  - 🧪 **Fix All Tests**: *"Run the test suite and fix any failing tests until they pass."*
  - 💡 **Explain Changes**: *"Explain what you just changed and the reasoning."*
  - 🚀 **Commit & Push**: *"Stage all modified files, commit with a concise message, and push to git."*
  - 📋 **Summarize Status**: *"Summarize current progress and what remains to be done."*
- **Mobile Custom Command Creator**: Users can tap **`[+]`** to create and name custom prompts directly on their phone, persisted locally in `localStorage`.
- **Auto-Submit Engine**: When a prompt is beamed, the Windows daemon receives the `agent:prompt` broadcast, places the text on the Windows clipboard, brings the Antigravity/VS Code window to focus, and automatically presses `Ctrl+V` and `{ENTER}`.

---

## Log Entry: Ghost in the Shell — The Windows System Tray Companion
**Date:** November 25, 2026  
**Topic:** Eliminating the Persistent Terminal Console  

Running the daemon in a black command prompt window cluttering the Windows desktop felt like an unfinished developer prototype. Background services belong in the background.

We built a native Windows System Tray companion ([tray.ps1](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/scripts/tray.ps1) & [start-tray.bat](file:///c:/Users/adilr/Documents/open-source/OverWatch/start-tray.bat)):
1. **Custom OverWatch Icon**: Generated a crisp multi-layer vector `.ico` file ([overwatch.ico](file:///c:/Users/adilr/Documents/open-source/OverWatch/client/assets/overwatch.ico)) rendered with `System.Drawing`.
2. **Hidden Execution**: Spawns the Node process with `WindowStyle = Hidden` and `CreateNoWindow = $true`.
3. **Windows System Tray (`System.Windows.Forms.NotifyIcon`)**: Sits cleanly in the Windows notification overflow area (`^`), next to Slack and Google Drive.
4. **Rich Context Menu**: Right-clicking the tray icon gives instant access to:
   - Live status indicator
   - Open Web App dashboard
   - View live logs (`daemon.log` opened in Notepad)
   - One-click Restart Daemon
   - Clean Exit
5. **Windows Startup Registration**: `install-startup.ps1` creates an autostart shortcut in the Windows Startup folder so OverWatch quietly boots into the tray upon login.

---

## Log Entry: Breaking the Sandbox Wall — The Beam-to-Windows Git Push Engine
**Date:** November 25, 2026  
**Topic:** AI Agent Sandboxes vs. Host Git Authentication  

One subtle reality of modern agentic coding is the strict security boundary enforced by AI sandboxes:
1. Sandboxed agent environments intentionally block unsanctioned external network access. Running `git push` inside the sandbox fails with SSL certificate handshake failures (`schannel: SEC_E_UNTRUSTED_ROOT`) or permission locks on `.git/index.lock`.
2. When an agent finishes writing code, running tests, and updating documentation, the developer is often away from the desk or outside. Without an automatic reminder, work remains stranded locally on the laptop without being pushed to GitHub.

We solved this with a two-fold solution in OverWatch:

### 1. Ambient Mobile Finish Reminder
The `AgentSessionMonitor` continuously inspects git status via `git status --porcelain` and `git log @{u}..HEAD --oneline`. Whenever the agent transitions from active work to `IDLE` with uncommitted changes or unpushed commits:
- An amber reminder card instantly illuminates in the mobile session widget:  
  **`TASK FINISHED • PUSH TO GITHUB`**
- Shows exact count of modified files and unpushed commits.
- Generates the exact suggested command with a 1-tap copy button:  
  `git add -A; git commit -m "feat: updates"; git push origin main`

### 2. "Beam & Push via Windows" Execution Gateway
Instead of requiring the user to rush back to their PC to open a terminal:
- Tapping **"Beam & Push via Windows"** on mobile sends an authenticated `agent:git_push` broadcast over Supabase Realtime.
- The OverWatch Windows Daemon (running natively on the host PC in the system tray, completely outside the agent sandbox) catches the event.
- The daemon executes the git commit and push using the host's native SSH/HTTPS credentials.
- It broadcasts back a `git:push_status` event, delivering a tactile haptic vibration and confirmation to the mobile phone.

---

## Log Entry: 1-Click Windows Setup — Frictionless Open-Source Deployment
**Date:** November 25, 2026  
**Topic:** Zero-Friction Onboarding for the Community  

To make OverWatch truly open-source ready for anyone cloning the repo:
- Created [`setup.bat`](file:///c:/Users/adilr/Documents/open-source/OverWatch/setup.bat) and [`setup.ps1`](file:///c:/Users/adilr/Documents/open-source/OverWatch/setup.ps1).
- Automatically checks prerequisites (Node.js 18+, npm, Git), generates `.env` files from `.env.example`, installs dependencies in parallel, compiles client and web builds, creates the custom vector system tray icon, registers Antigravity hooks, configures Windows startup, and starts the tray daemon.

---

## Log Entry: Agent Compatibility Notice — Antigravity Proven First
**Date:** November 25, 2026  
**Topic:** Real-World Validation vs. Experimental Templates  

While OverWatch includes lifecycle hook templates for multiple coding assistants (including Claude Code), we have placed a strict advisory in the documentation:
- **Google Antigravity** is currently the sole thoroughly tested and verified agent in live developer environments. Every fail-closed timeout, terminal command interception, reverse prompt beam, and session telemetry extraction has been battle-tested against real Antigravity workflows.
- Other agent hooks (such as Claude Code) are provided as architectural references. Community contributors are explicitly advised to test and verify permission blocking and timeout handling in isolated test directories before relying on them in critical production repos.

---

## Log Entry: Zero-Slop Repository Scrubbing
**Date:** November 25, 2026  
**Topic:** Eliminating Dead Code Before the Initial Public Push  

Before opening the repository to the public, we audited every single file:
- Purged legacy unused components: `ApprovalDeck.tsx`, `Header.tsx`, and `QuotaCard.tsx` (fully superseded by the 4-screen carousel components).
- Removed orphaned artifacts: `download.svg` and prototype VBScript runners.
- Verified all credentials strictly reside in `.env`, guarded by `.gitignore`.
- Every active line of code in the client and web bundles compiles with zero errors under strict TypeScript checks.

---

## Log Entry: Viewport-Locked Widget Decks & Multi-Session Agent Targeting
**Date:** November 25, 2026  
**Topic:** Hardware Desk Deck Ergonomics & Multi-Project Routing  

As developers often run multiple concurrent agent sessions (e.g. `OverWatch` and `portfolio`), we upgraded OverWatch's hardware UI and routing engine:

### 1. Viewport Lock & Internal Touch Decks
- The mobile webpage is locked strictly to `fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none`. The webpage itself never scrolls or bounces.
- Horizontal navigation is encapsulated within internal `WidgetDeck` touch containers (`touch-action: pan-y; e.stopPropagation()`) with smooth rubberband resistance and tactile haptics.

### 2. Multi-Session Discovery & Workspace Routing
- `AgentSessionMonitor` scans `~/.gemini/antigravity/brain`, discovering all active conversation transcripts within the last 6 sessions.
- In `AgentSessionCard`, users can swipe left/right across active agent sessions, inspecting each workspace directory path and live git status.
- Swiping dynamically switches the active workspace target: prompt commands from the Prompt Deck and push beams are routed precisely to the active workspace in view.

### 3. Safe Git Push Beaming (Zero Auto-Run)
- Git push operations frequently fail when auto-executed via background daemons due to SSH keys, passphrases, or lockfiles.
- OverWatch adopts **Safe Push Beaming**: clicking "Push" on mobile beams the exact `git add -A; git commit -m "..."; git push origin main` command directly to the Windows clipboard, and activates the workspace terminal window so the developer can paste and run safely.

### 4. True Watchdog Heartbeat & Daemon Resilience
- **Watchdog Heartbeat**: Replaced simple Supabase channel connection status (which falsely displayed "Live" even when the Windows PC was turned off) with a real 3-second heartbeat pulse (`client:heartbeat`). If the PC daemon stops, the mobile deck flips to **`PC Offline`** after 7.5 seconds.
- **Port Resilience**: `localServer.ts` catches `EADDRINUSE` gracefully, running in companion mode if another tray instance is active.
- **Strict Typing**: Fixed syntax and interface typing in `agentSession.ts`, ensuring clean builds across client and web.

---

## Log Entry: Current State of the Art
**Date:** November 25, 2026 — 21:55 IST  
**Status:** Feature-Complete. Verified. Open Source Ready.  

```text
OverWatch System Architecture:
[Windows PC] <----> [System Tray Daemon] <----> [Supabase Realtime] <----> [Mobile OLED Desk Deck]
     |                     |                                                    |
Antigravity Hooks     Hidden Process Runner                               Dual Swipable WidgetDecks
Terminal Gatekeeper   Watchdog Heartbeat Pulse (3s)                       Real-time PC Live/Offline Indicator
Multi-Session Scan    Safe Push Beam to Clipboard                         3D Split-Flap Clock & Timer
Targeted AppActivate  WinRT Media & Telemetry                             Multi-Session Agent Deck
Startup Autostart     Companion Port Handshake                            Universal Clipboard & Macros
```

All running quietly from the Windows System Tray, completely open source with zero hardcoded credentials.

Onward. 🛠️

---

## Log Entry: StandBy Minimalist Evolution & The Public Landing Simulator
**Date:** November 25, 2026 — 23:05 IST  
**Topic:** Gesture Scoping, Token Countdown Telemetry, and the 1:1 Live Simulator

As OverWatch matured into a daily desk driver, we conducted an intensive round of ergonomic refinements and launched the public landing experience:

### 1. Minimalist Indicator Dots — Reclaiming the Viewport
In landscape mode on smartphones, vertical screen real estate is precious. The previous bottom bar with large labeled buttons (`Clock`, `Music & Stats`, etc.) took up ~15% of the screen. We removed the buttons completely and restored the minimalist floating indicator pill (`[●] [○] [○] [○]`). Now, 100% of the screen is dedicated to data and tactile controls, with subtle glowing dots providing position feedback.

### 2. Multi-Dimensional Gesture Scoping Architecture
With multi-session agent tracking, terminal command inspection, and 4 StandBy pages all sharing a touchscreen, gestures initially conflicted. We implemented a clean multi-dimensional gesture architecture:
- **Horizontal Path Box Swipe**: Swiping left/right *only* on the File Path Box (`FolderGit2`) switches active project sessions (`OverWatch` ⇄ `Portfolio`). Event propagation is stopped (`e.stopPropagation()`), preventing page slides.
- **Vertical Card Swipe**: Swiping up/down on the card body toggles between **Overview (0)**, **Running Command (1)**, and **Activity Logs (2)**.
- **Auto-Flip on Execution**: When an agent begins executing a command, the card automatically flips to the Running Command inspector view.
- **Outer Stage Horizontal Swipe**: Swipes across the rest of the display slide smoothly across the 4 StandBy pages (`translateX(-${activePageIndex * 100}%)`).

### 3. Model Token Next Reset Time Countdown
Antigravity token quotas (Gemini 2.5 Flash and Pro) reset on rolling 5-hour and weekly windows. A simple percentage without reset timing leaves developers guessing. We enriched `antigravityQuota.ts` and `HardwareTelemetry.tsx` to calculate and render live countdown timers (`2h 15m`, `4d 18h`) right next to percentage gauges with clock icons.

### 4. Safe Push Beaming & Zero-Alert Policy
Attempting to run `git push` directly in background PowerShell shells led to command-line quoting issues on commit messages containing spaces or backticks, resulting in browser `alert()` popups. We established a strict **Zero-Alert Policy**:
- Removed all browser `alert()` dialogs.
- `handleRemoteGitPush` beams the command directly to the local device clipboard and to the Windows clipboard via `clipboard:set`.
- The developer safely pastes (`Ctrl+V`) and enters on their PC terminal with zero accidental commits.

### 5. OverWatch Public Landing & Live Deck Simulator (`overwatch.adilrahman.cc`)
We engineered a public showcase landing page (`landing/`) deployed at `https://overwatch.adilrahman.cc`:
- **1:1 Live Deck Simulator**: Ported the exact `web` deck components into `landing/src/components/deck/` so visitors can interact with a live, tactile simulator featuring all 4 screens, mechanical flip audio, multi-session switching, and an interactive Gatekeeper interlock test.
- **Any Screen Ratio & Mobile-First**: Built fluid container scaling so the deck fits comfortably on mobile phones (portrait and landscape), tablets, and ultrawide monitors.
- **Crawlable HTML5 Endpoints & SEO**: Dedicated paths (`/`, `/architecture`, `/changelog`, `/docs`, `/showcase`, `/developer`) with XML sitemap, `robots.txt`, OpenGraph, and JSON-LD structured schema.
- **Creator Attribution**: Dedicated `/developer` endpoint detailing Adil Rahman (`@AdilR`) and linking to `https://adilrahman.cc?utm_source=overwatch`.

---

## Log Entry: StandBy Viewport Hardening & Windows Tray Daemon Watchdog
**Date:** November 26, 2026 — 11:05 IST  
**Topic:** Mobile Landscape Ergonomics, Zero-Clipping, and Silent System Tray Daemon Architecture

Following real-world testing on mobile devices in landscape StandBy orientation and Windows system setup, we implemented several critical hardening updates:

### 1. StandBy Mobile Landscape Workspace Viewport Hardening
- **Anti-Clipping Geometry**: In landscape mode on smartphones, viewport height is tight. The left session card previously had slight vertical overflow where the `WORKSPACE` tag was clipped at the top edge. We re-engineered `AgentSessionCard.tsx` in both `web/` and `landing/`:
  - Enforced `shrink-0` on the Workspace File Path Box so it can never be compressed, squeezed, or pushed off-screen.
  - Re-aligned the card header: placed `Antigravity` and the status badge (`[● IDLE]`) side-by-side on the left, and view navigator pills (`[Overview | Command | Logs]`) on the right, eliminating text wrapping.
  - Removed the redundant bottom button (`Swipe ↑ up to inspect running command`) in View 0, saving ~36px of vertical height and giving ample room for all cards.
  - Implemented automatic local caching of active workspace paths and names (`localStorage.overwatch_last_workspace_name` and `overwatch_last_workspace_path`) so reconnects instantly render `'OverWatch'` without generic fallback placeholders.

### 2. Windows System Tray Daemon Companion Architecture (`tray.ps1`)
- **Single-Threaded Apartment (`-STA`)**: Required by Windows Forms and `NotifyIcon` for 100% reliable Shell notification area integration. Updated `start-tray.bat`, `setup.ps1`, and startup shortcut creation to pass `-STA`.
- **Stream Redirection & Lock Prevention**: Eliminated exclusive file locking on `daemon.log`, preventing `IOException` sharing violations during high-frequency child process output piping.
- **Port 49152 Conflict Resolution**: Auto-detects and terminates stale processes listening on port 49152 before launching a new instance, preventing `EADDRINUSE` errors.
- **Auto-Revive Watchdog**: Added a lightweight 5-second health check timer inside the tray loop that automatically restarts the Node daemon if terminated unexpectedly.
- **Windows 11 Terminal Interception & Zero-Window VBS Launcher**: On Windows 11, when Windows Terminal is the default terminal emulator, running `powershell.exe -WindowStyle Hidden` leaves an empty, blank Windows Terminal window on screen. Created `client/scripts/silent-launch.vbs` which runs via GUI subsystem `wscript.exe` with window mode `0` (`SW_HIDE`), completely bypassing Windows Terminal so OverWatch runs 100% silently with zero windows.
- **Graceful PreToolUse Hook Pass-Through**: If OverWatch is uninstalled, disabled in `hooks.json`, or the daemon is temporarily offline, the hook exits transparently with code 0 instead of blocking IDE operations.

---

## Log Entry: Bidirectional Image Beaming & PowerShell UTF-16LE EncodedCommand Fix
**Date:** November 26, 2026 — 11:35 IST  
**Topic:** Mobile ⇄ Windows Image Beaming (Wi-Fi Direct + Cellular Fallback) & PowerShell Character Encoding

### 1. Bidirectional Image Beaming (Mobile ⇄ Windows)
- **Wi-Fi Direct Local Transfer**: OverWatch daemon listens on `0.0.0.0:49152` and advertises its LAN IPv4 via Supabase heartbeats. Transfers between phone and PC on the same network stream directly via HTTP POST/GET for full resolution, zero compression, and sub-second speed.
- **Automatic Cellular Fallback**: If Wi-Fi direct is unreachable, images fall back automatically to compressed WebP beamed across the Supabase Realtime broadcast channel.
- **Mobile → Windows Handling**: Incoming images are set onto the Windows Clipboard as a bitmap (Ctrl+V ready for IDE/chat) AND saved to `c:\Users\<user>\Pictures\OverWatch\beam_*.png`.
- **Windows → Mobile Handling**:
  - `Fetch PC Clipboard Image`: Pulls whatever image was copied on Windows (<kbd>Win</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> or browser copy) directly to mobile.
  - `Capture PC Screen`: 1-tap captures the primary desktop monitor and renders a preview on mobile with a save/download button and fullscreen lightbox.
- **Mobile UI**: Re-engineered `ClipboardBeam.tsx` into a dual-mode `[ Text | Image ]` card with camera snap (`capture="environment"`), file picker, and desktop capture preview. Mirrored in `landing/` showcase deck.

### 2. PowerShell `-EncodedCommand` UTF-16LE Encoding Fix
- **Root Cause**: PowerShell's `-EncodedCommand` parameter strictly expects base64-encoded UTF-16LE (Unicode) byte streams. When encoded as UTF-8 in Node.js (`Buffer.from(script, 'utf-8').toString('base64')`), PowerShell decodes byte pairs as corrupted Unicode characters (`++++++??????????4...`), throwing `CommandNotFoundException` during automated prompt entry (`SendKeys`) and script execution.
- **Resolution**: Updated all `-EncodedCommand` script builders across `supabase.ts` and `imageClipboard.ts` to use `Buffer.from(script, 'utf16le').toString('base64')`, ensuring 100% reliable automated keystroke injection and screen capture.

### 3. Mobile Audio Suspension Keep-Alive & Native WAV Fallback
- **Root Cause**: Mobile operating systems (iOS Safari and Android Chrome) automatically suspend browser `AudioContext` engines when sitting idle in StandBy mode to conserve battery. When asynchronous approval requests arrive from the network, mobile browser autoplay policies block `ctx.resume()` without an active user gesture, resulting in complete silence.
- **Resolution**: Implemented a 15-second inaudible keep-alive heartbeat (`gain = 0.00001`), paired with an in-memory 16-bit PCM WAV chime (dual-pulse C6/E6/G6) pre-armed on an HTML5 `<audio>` element during PIN authentication. The alert tone and haptic vibration now ring reliably even after hours of idling.

---

## Log Entry: Repository Hygiene, Strict .gitignore & Clone-Ready Cleanliness
**Date:** November 26, 2026 — 11:45 IST  
**Topic:** Open-Source Release Readiness, Artifact Removal & Comprehensive Ignore Policy

To ensure that anyone cloning the repository has an effortless, 1-click setup experience without repository bloat or secrets leakage:
1. **Removed Dead Code & Deprecated Components**: Deleted unreferenced prototype component `web/src/components/WidgetDeck.tsx`.
2. **Hardened `.gitignore`**:
   - Explicitly ignores all environment secrets (`.env`, `.env.local`, `*.env`) while whitelisting `.env.example` templates for instant setup.
   - Ignores all build artifacts across sub-packages (`dist/`, `build/`, `out/`, `*.tsbuildinfo`).
   - Ignores runtime and daemon logs (`daemon.log`, `tray-error.log`, `*.log`).
   - Ignores OS and IDE clutter (`.DS_Store`, `Thumbs.db`, `Desktop.ini`, `.vscode/`, `.idea/`, `*.swp`).
   - Ignores runtime bypass flags (`.overwatch_disabled`).
3. **Verified Clean Build Pipeline**: Verified that `client/`, `web/`, and `landing/` build from scratch with zero errors (`tsc && vite build`).

---

## Log Entry: DPI-Aware Screen Capture, Dark HUD Toast, Browser Auto-Downloads & Sequential Multi-Image Beaming
**Date:** November 26, 2026 — 12:10 IST  
**Topic:** High-DPI Desktop Capture Resolution, Windows HUD Toast Chime, Mobile File Downloads & Multi-Image Beaming

### 1. High-DPI Display Scaling Fix for Screen Capture
- **Root Cause**: PowerShell runs in DPI-unaware mode by default. On Windows 10/11 displays configured with display scaling (125%, 150%, 200%), `[System.Windows.Forms.Screen]::PrimaryScreen.Bounds` reported virtual scaled dimensions (e.g. 1280 x 800) rather than native physical resolution (1920 x 1200). As a result, `CopyFromScreen` copied only the top-left quadrant of the screen.
- **Resolution**: Added P/Invoke `[Win32.DpiFix]::SetProcessDPIAware()` from `user32.dll` prior to capturing screen bounds. The primary monitor resolution is now read accurately at full unscaled resolution (1920 x 1200), capturing the entire desktop screen flawlessly. Full-res PNG is archived to `Pictures/OverWatch/Screenshots/snip_*.png`, and a 75% quality JPEG (<150KB) is beamed to mobile.

### 2. Windows Visual Toast HUD & Notification Chime
- **Root Cause**: Modern Windows 11 updates restrict raw WinRT `ToastNotificationManager.CreateToastNotifier()` calls from unpackaged Win32 processes, failing with error `0x80073D54: The process has no package identity`. Additionally, temporary `NotifyIcon` instances disposed without an active message pump (`Application.DoEvents()`) are suppressed by Windows 11 Action Center.
- **Resolution**: Built an in-process, non-focus-stealing dark HUD toast banner (`Form.ShowWithoutActivation`) styled with OverWatch's OLED dark aesthetic (`#121216` background, `#14F195` emerald title) positioned at the bottom right above the taskbar, paired with native audio chime `[System.Media.SystemSounds]::Asterisk.Play()` and tray balloon notification.

### 3. Mobile Browser Automatic Image Downloads
- When the mobile user triggers **PC Clipboard** or **Capture Screen**:
  - Added Promise-based broadcast resolvers in `web/src/App.tsx` that await the incoming `image:clipboard_state` or `image:screen_state` payloads over Supabase Realtime when Wi-Fi Direct is blocked by HTTPS Mixed Content.
  - In `ClipboardBeam.tsx` (both `web/` and `landing/`), receiving the image automatically initiates a browser file download (`pc_clipboard_<timestamp>.jpg` / `pc_screenshot_<timestamp>.jpg`) directly to the phone's gallery/downloads folder, while keeping the preview and lightbox accessible.

### 4. Multiple Image Selection & One-by-One Sequential Beaming
- **Multi-Image Selection**: Added `multiple` support to the file picker, allowing users to select several gallery photos at once.
- **Queued Thumbnail Reel**: Displays a horizontal scrolling carousel of queued images with `#1`, `#2`, `#3` badge counters, individual `(x)` remove buttons, and an inline `[+ Add]` button to append more photos or snaps to the queue.
- **Sequential One-by-One Beaming**: Beams images sequentially with animated progress (`Beaming 2 of 4...`) and a brief 500ms settling interval between transmissions. Each image is assigned a unique millisecond timestamp on disk (`beam_YYYY-MM-DDTHH-mm-ss_ms_rand.png`), avoiding file overwrites and leaving the Windows Clipboard primed with the final image.
- **Payload Compression Guard**: Added client-side HTML5 canvas compression in `web/src/App.tsx` ensuring high-res mobile photos (often 5-15MB) are downsampled to max 1280px / 0.75 JPEG, effortlessly remaining below Supabase Realtime's 256KB WebSocket ceiling.

