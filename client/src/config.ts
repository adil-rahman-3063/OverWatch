import dotenv from 'dotenv';
import path from 'path';

// Load .env from client folder or current working directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  deviceId: process.env.DEVICE_ID || 'default',
  localIpcPort: parseInt(process.env.LOCAL_IPC_PORT || '49152', 10),
  fallbackDecision: (process.env.FALLBACK_DECISION || 'deny') as 'ask' | 'deny',
  quotaPollIntervalMs: parseInt(process.env.QUOTA_POLL_INTERVAL_MS || '120000', 10),
  mediaPollIntervalMs: parseInt(process.env.MEDIA_POLL_INTERVAL_MS || '2500', 10),
  permissionTimeoutMs: 50000, // 50 seconds before auto-fallback
};
