export interface MediaSessionItem {
  index: number;
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped';
  sourceAppId?: string;
}

export interface MediaState {
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped' | 'NoActiveSession';
  sourceAppId?: string | null;
  sessions?: MediaSessionItem[];
  activeSessionIndex?: number;
  updatedAt?: string;
}

export interface PermissionRequest {
  id: string;
  agent: string;
  tool: string;
  command: string;
  cwd: string;
  status: 'pending' | 'allowed' | 'denied' | 'expired';
  createdAt?: string;
  expiresAt?: string;
}

export interface QuotaBucket {
  id: string;
  name: string;
  window: string;
  remaining_fraction: number;
  reset_time: string;
}

export interface QuotaGroup {
  name: string;
  description?: string;
  buckets: QuotaBucket[];
}

export interface QuotaData {
  antigravity?: {
    groups: QuotaGroup[];
    rawText?: string;
    fetchedAt: string;
  };
}

export interface SystemStats {
  cpuUsagePercent: number;
  totalRamGb: number;
  usedRamGb: number;
  ramUsagePercent: number;
  uptimeHours: number;
  hostname: string;
}
