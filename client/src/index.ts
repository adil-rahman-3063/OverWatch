import { config } from './config.js';
import { mediaController } from './media/windowsMedia.js';
import { quotaCollector } from './quota/antigravityQuota.js';
import { supabaseService } from './supabase.js';
import { localServer } from './ipc/localServer.js';

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

  console.log(`[Config] Device ID: ${config.deviceId}`);
  console.log(`[Config] Supabase URL: ${config.supabaseUrl}`);
  console.log(`[Config] Local IPC Port: ${config.localIpcPort}`);

  // 1. Start Local IPC HTTP Server
  await localServer.start();

  // 2. Initialize Supabase Realtime Service
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('[Error] SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env!');
    process.exit(1);
  }
  await supabaseService.init();

  // 3. Media Poller Loop (detect track changes)
  let lastTrackSignature = '';
  async function pollMedia() {
    try {
      const media = await mediaController.getCurrentMedia();
      const signature = `${media.title}-${media.artist}-${media.playbackStatus}`;
      if (signature !== lastTrackSignature) {
        lastTrackSignature = signature;
        console.log(`[Media] Track change detected: "${media.title}" by ${media.artist} [${media.playbackStatus}]`);
        await supabaseService.publishMediaState(media);
      }
    } catch (err: any) {
      console.warn('[Media] Polling error:', err.message);
    }
  }

  // Initial media poll & schedule interval
  await pollMedia();
  setInterval(pollMedia, config.mediaPollIntervalMs);

  // 4. Quota Poller Loop
  async function pollQuota() {
    try {
      console.log('[Quota] Refreshing Antigravity quota...');
      const usage = await quotaCollector.getUsage();
      if (usage) {
        console.log(`[Quota] Fetched ${usage.groups.length} quota groups successfully.`);
        await supabaseService.publishQuotaState(usage);
      }
    } catch (err: any) {
      console.warn('[Quota] Polling error:', err.message);
    }
  }

  // Initial quota poll & schedule interval
  await pollQuota();
  setInterval(pollQuota, config.quotaPollIntervalMs);

  console.log('\n[OverWatch] Daemon is actively running. Press Ctrl+C to terminate.\n');
}

bootstrap().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
