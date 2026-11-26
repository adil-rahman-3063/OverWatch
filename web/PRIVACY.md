# OverWatch Web Deck • Privacy Policy

**Component:** Mobile StandBy WebDeck (`web/`)  
**Version:** 1.2.0  
**Effective Date:** November 26, 2026  
**Parent Document:** [Root Privacy Policy](../PRIVACY.md)  
**Maintained by:** Adil Rahman ([adilrahman.cc](https://adilrahman.cc))

---

## 1. Local-First Mobile StandBy Privacy

The OverWatch WebDeck (`web/`) is a lightweight, responsive client designed to run in landscape mode on smartphones (iOS Safari, Android Chrome, or Standalone Home Screen PWA).

We treat your mobile device as an air-gapped physical hardware interlock. **The web application does not run third-party tracking scripts, does not collect analytics, and does not retain your images or command logs.**

---

## 2. Browser Capabilities & Sensory Data Handling

The WebDeck utilizes modern HTML5 web capabilities to deliver a desk companion experience:

| Feature / API | How It Works | Privacy Protection |
| :--- | :--- | :--- |
| **Camera & Photo Picker** | Allows taking snaps or selecting multiple photos to beam to Windows | Selected images are processed in-memory via HTML5 canvas, downscaled, and beamed directly to your PC. Images are never uploaded to cloud buckets or retained in browser storage. |
| **Web Share API (`navigator.share`)** | Enables saving PC screen captures directly to Apple Photos or Android Downloads | Uses native operating system share sheets. OverWatch cannot read or inspect other files in your gallery. |
| **Web Audio API** | Synthesizes mechanical split-flap clock clicks and permission alert ringtones | 100% mathematical synthesis in browser memory using Web Audio oscillators. No microphone permission is ever requested or used. |
| **Screen Wake Lock** | Prevents the phone display from sleeping while on a desk stand | Uses standard `navigator.wakeLock` and an inaudible silent video loop. Zero tracking data is collected. |
| **Vibration API** | Haptic pulse feedback upon incoming approval requests or beam completions | Physical vibration only (`navigator.vibrate`). |
| **LocalStorage** | Remembers your Device ID, PIN setting, and active workspace name | Stored entirely within your device's browser sandbox. Never synced to third-party advertisers. |

---

## 3. Communication Protocols

1. **Local Wi-Fi Direct:** If your phone and PC share the same Wi-Fi network, the WebDeck attempts direct point-to-point HTTP communication (`http://<LAN_IP>:49152/`). Image data stays entirely on your local router.
2. **Encrypted Cloud Fallback:** When outside your home network or on cellular data, communication relays through authenticated Supabase Realtime broadcast channels using your personal Supabase project credentials. Broadcast payloads are ephemeral and expire instantly without database table logging.

---

## 4. Open-Source Transparency

The complete source code of the web application is publicly viewable at [github.com/AdilR/OverWatch/tree/main/web](https://github.com/AdilR/OverWatch/tree/main/web).

For inquiries or security questions:  
**Adil Rahman** • [https://adilrahman.cc](https://adilrahman.cc) • [GitHub Issues](https://github.com/AdilR/OverWatch/issues)
