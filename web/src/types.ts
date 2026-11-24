export interface MediaState {
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped' | 'NoActiveSession';
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
