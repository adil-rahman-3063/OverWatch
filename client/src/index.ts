import { config } from './config.js';
import { mediaController } from './media/windowsMedia.js';
import { quotaCollector } from './quota/antigravityQuota.js';
import { supabaseService } from './supabase.js';
import { localServer } from './ipc/localServer.js';
import { getSystemStats } from './system/pcStats.js';
import { agentSessionMonitor } from './session/agentSession.js';

async function bootstrap() {
  console.log(`
  ======================================================
     ____                   _       __      __       __  
    / __ \\ _   __ ___  ____| |     / /___ _/ /______/ /_ 
   / / / /| | / // _ \\/ ___/ | /| / / __ \`/ __/ ___/ __ \\
  / /_/ / | |/ //  __/ /   | |/ |/ / /_/ / /_/ /__/ / / /
  \\____/  |___/ \\___/_/    |__/|__/\\__,_/\\__/\\___/_/ /_/ 
                                                         
     Windows Client Daemon • Ready for Remote Control     
  ======================================================
  `);

  await localServer.start();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('[Error] SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env');
    process.exit(1);
  }
  await supabaseService.init();

  // 1. Media Poller
  let lastTrackSignature = '';
  async function pollMedia() {
    try {
      const media = await mediaController.getCurrentMedia();
      const signature = `${media.title}-${media.artist}-${media.playbackStatus}`;
      if (signature !== lastTrackSignature) {
        lastTrackSignature = signature;
        console.log(`[Media] Track update: "${media.title}" by ${media.artist} [${media.playbackStatus}]`);
        await supabaseService.publishMediaState(media);
      }
    } catch {}
  }
  await pollMedia();
  setInterval(pollMedia, config.mediaPollIntervalMs);

  // 2. Hardware Telemetry Poller (every 5 seconds)
  async function pollTelemetry() {
    try {
      const stats = await getSystemStats();
      await supabaseService.publishSystemStats(stats);
    } catch {}
  }
  await pollTelemetry();
  setInterval(pollTelemetry, 5000);

  // 3. Quota Poller
  async function pollQuota() {
    try {
      const usage = await quotaCollector.getUsage();
      if (usage) {
        await supabaseService.publishQuotaState(usage);
      }
    } catch {}
  }
  await pollQuota();
  setInterval(pollQuota, config.quotaPollIntervalMs);

  // 4. Antigravity Agent Session Poller (every 3 seconds)
  async function pollAgentSession() {
    try {
      const session = await agentSessionMonitor.getSessionState();
      await supabaseService.publishSessionState(session);
    } catch {}
  }
  await pollAgentSession();
  setInterval(pollAgentSession, 3000);

  console.log('\n[OverWatch] Daemon is actively running. Press Ctrl+C to terminate.\n');
}

bootstrap().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
