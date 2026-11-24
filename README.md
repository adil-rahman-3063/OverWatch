# 🛡️ OverWatch

> **Remote Deck for Windows**: Music & Media Controls, Antigravity & Claude Code Command Approvals, and Real-Time Quota Gauges for your phone.

---

## ⚡ What is OverWatch?

**OverWatch** turns your phone (iPhone / Android) into an interactive companion deck for your PC:
1. 🎵 **Windows Music Control**: Real-time track detection (Title, Artist, Status) with instant Play/Pause, Next Track, Previous Track, and Volume buttons.
2. 🛡️ **Agent Command Approvals**: Intercepts `run_command` and tool execution requests from **Antigravity** and **Claude Code** via native lifecycle hooks. Review the command on your phone and tap **Allow** or **Deny** in real-time.
3. 📊 **Live Quota Dashboard**: Live meter for Antigravity's Gemini weekly & 5-hour limit remaining, reset timers, and Claude/GPT limits.
4. ⚡ **Zero Port Forwarding**: Powered by **Supabase Realtime**, working securely over cellular data or Wi-Fi with sub-100ms latency.

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

## 🚀 Quick Setup

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
To enable remote approval for Antigravity & Claude Code:
```bash
cd client
npm run setup:hooks
```
*(You can uninstall anytime with `npx tsx src/cli/setupHooks.ts --remove`)*

### 4. Web App (PWA) Setup
```bash
cd web
npm install
npm run dev
```
Open the web app URL on your iPhone Safari, tap **Share** -> **Add to Home Screen**, and launch full-screen!

---

## 🔒 Security
- **Fail-Safe / Fail-Closed**: If the OverWatch daemon is offline or a request times out, it gracefully falls back to local terminal prompts so your workflow is never locked out.
- **No Command Injection**: The phone can only send `allow` or `deny` responses for specific request IDs. It can never send arbitrary terminal commands to your PC.

---

## 📄 License
MIT © 2026 Adil Rahman
