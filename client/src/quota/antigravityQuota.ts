import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export interface QuotaBucket {
  id: string;
  name: string;
  window: string;
  remaining_fraction: number; // e.g. 0.919 for 91.9%
  reset_time: string;
}

export interface QuotaGroup {
  name: string;
  description?: string;
  buckets: QuotaBucket[];
}

export interface AntigravityQuotaData {
  groups: QuotaGroup[];
  rawText?: string;
  fetchedAt: string;
}

export class AntigravityQuotaCollector {
  private agyPath: string | null = null;

  constructor() {
    this.locateAgyBinary();
  }

  private locateAgyBinary(): string {
    if (this.agyPath) return this.agyPath;

    // 1. Check default Windows installation directory
    const defaultWinPath = path.join(os.homedir(), '.gemini', 'bin', 'agy.exe');
    if (fs.existsSync(defaultWinPath)) {
      this.agyPath = defaultWinPath;
      return defaultWinPath;
    }

    // 2. Check AppData local
    const appDataPath = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Antigravity', 'bin', 'agy.exe');
    if (fs.existsSync(appDataPath)) {
      this.agyPath = appDataPath;
      return appDataPath;
    }

    // 3. Fallback to 'agy' on system PATH
    this.agyPath = 'agy';
    return 'agy';
  }

  /**
   * Queries Antigravity usage via `agy -p /usage --output-format json`
   */
  async getUsage(): Promise<AntigravityQuotaData | null> {
    const binary = this.locateAgyBinary();
    const command = `"${binary}" -p /usage --output-format json`;

    try {
      const { stdout } = await execPromise(command, { timeout: 15000 });
      const parsed = JSON.parse(stdout.trim());
      
      const groups: QuotaGroup[] = parsed?.command?.data?.groups || [];
      return {
        groups,
        rawText: parsed?.response || '',
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[AntigravityQuota] Failed to fetch usage:', err.message);
      return null;
    }
  }
}

export const quotaCollector = new AntigravityQuotaCollector();
