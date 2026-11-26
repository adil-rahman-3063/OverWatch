# OverWatch Client Daemon • Terms of Service

**Component:** Windows Background Client Daemon (`client/`)  
**Version:** 1.2.0  
**Effective Date:** November 26, 2026  
**License:** MIT License  
**Parent Document:** [Root Terms of Service](../TERMS.md)  
**Maintained by:** Adil Rahman ([adilrahman.cc](https://adilrahman.cc))

---

## 1. Acceptance & Scope

These Terms of Service govern the installation, compilation, execution, and operation of the **OverWatch Windows Client Daemon** (`overwatch-client`), including:
* The background Node.js service daemon (`client/src/index.ts`)
* PreToolUse hook execution handlers (`client/src/hooks/`)
* Native C# screen capture and clipboard binaries (`client/bin/screencap.exe`, `client/bin/ScreenCapture.cs`)
* PowerShell system tray and startup scripts (`tray.ps1`, `install-startup.ps1`, `silent-launch.vbs`)

By running `npm start`, `start-client.bat`, `start-tray.bat`, or running setup scripts, you agree to these Terms and the [Client Privacy Policy](PRIVACY.md).

---

## 2. Operator Responsibility for Agent Commands

1. **Host Privileges:** The OverWatch client daemon runs under your current Windows user account privileges. Any CLI command authorized by tapping "Allow" on your mobile device is executed on your local computer with your user rights.
2. **Duty to Review:** You are solely responsible for inspecting the command, working directory, and arguments displayed on your mobile device before authorizing execution. 
3. **No Automated Approvals:** OverWatch does not provide automated bypasses or automatic "always allow" flags for destructive commands. The operator retains sole liability for approving commands that result in file deletion, Git force-pushes, database drops, package installations, or OS modifications.

---

## 3. Native Screen Capture & Clipboard Usage

* **Screen Capture:** You authorize `screencap.exe` to take screenshots of your primary desktop monitor upon explicit request from your authenticated mobile device. You agree not to capture or stream proprietary, confidential, or sensitive personal data that you do not have permission to handle.
* **Clipboard Modification:** You authorize OverWatch to read and overwrite your Windows OS Clipboard when receiving beamed text or images. OverWatch is not liable for data lost due to clipboard overwrites.

---

## 4. Software Disclaimer & Limitation of Liability

THE CLIENT SOFTWARE AND BINARIES ARE PROVIDED "AS IS" UNDER THE MIT LICENSE. UNDER NO CIRCUMSTANCES SHALL ADIL RAHMAN OR CONTRIBUTORS BE LIABLE FOR ANY WORKSTATION DAMAGE, FILE LOSS, COMPILATION ERRORS, OS RESTART, OR NETWORK INTERRUPTIONS ARISING OUT OF THE CLIENT DAEMON'S EXECUTION.

---

## 5. Contact & Support

* **Creator:** Adil Rahman
* **Personal Site:** [https://adilrahman.cc](https://adilrahman.cc)
* **GitHub Repository:** [https://github.com/AdilR/OverWatch](https://github.com/AdilR/OverWatch)
