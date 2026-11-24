import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export interface MediaInfo {
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped' | 'NoActiveSession';
  sourceAppId?: string | null;
  updatedAt: string;
}

// Virtual key codes for Win32 keybd_event
const MEDIA_KEYS: Record<string, number> = {
  play_pause: 0xB3,
  next: 0xB0,
  prev: 0xB1,
  stop: 0xB2,
  volume_mute: 0xAD,
  volume_down: 0xAE,
  volume_up: 0xAF,
};

export class WindowsMediaController {
  private scriptPath: string;
  private lastMediaInfo: MediaInfo = {
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
    updatedAt: new Date().toISOString(),
  };

  constructor() {
    // Locate get-media.ps1 relative to dist or src or root
    const candidates = [
      path.resolve(__dirname, '../../scripts/get-media.ps1'),
      path.resolve(__dirname, '../scripts/get-media.ps1'),
      path.resolve(process.cwd(), 'scripts/get-media.ps1'),
      path.resolve(process.cwd(), 'client/scripts/get-media.ps1'),
      'c:\\Users\\adilr\\Documents\\open-source\\OverWatch\\client\\scripts\\get-media.ps1',
    ];

    const found = candidates.find((p) => fs.existsSync(p));
    this.scriptPath = found || candidates[0];
  }

  /**
   * Retrieves the currently playing media session information using WinRT.
   */
  async getCurrentMedia(): Promise<MediaInfo> {
    try {
      if (!fs.existsSync(this.scriptPath)) {
        return this.lastMediaInfo;
      }

      const command = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${this.scriptPath}"`;
      const { stdout } = await execPromise(command, { timeout: 3500 });

      const trimmed = stdout.trim();
      if (!trimmed) {
        return this.lastMediaInfo;
      }

      const parsed = JSON.parse(trimmed);
      this.lastMediaInfo = {
        title: parsed.title || '',
        artist: parsed.artist || '',
        album: parsed.album || '',
        playbackStatus: parsed.playbackStatus || 'Stopped',
        sourceAppId: parsed.sourceAppId || null,
        updatedAt: new Date().toISOString(),
      };
      return this.lastMediaInfo;
    } catch (err) {
      return {
        ...this.lastMediaInfo,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Dispatches a native media keyboard event (play/pause, next, prev, volume).
   */
  async sendMediaCommand(action: 'play_pause' | 'next' | 'prev' | 'volume_up' | 'volume_down' | 'volume_mute'): Promise<boolean> {
    const vkCode = MEDIA_KEYS[action];
    if (!vkCode) {
      console.warn(`[MediaController] Unknown media command: ${action}`);
      return false;
    }

    const psCommand = `powershell -NoProfile -NonInteractive -Command "$c = Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);' -Name 'W' -Namespace 'M' -PassThru; [M.W]::keybd_event(${vkCode}, 0, 0, [UIntPtr]::Zero); [M.W]::keybd_event(${vkCode}, 0, 2, [UIntPtr]::Zero);"`;

    try {
      await execPromise(psCommand, { timeout: 2000 });
      return true;
    } catch (error) {
      console.error(`[MediaController] Failed to send key event for ${action}:`, error);
      return false;
    }
  }
}

export const mediaController = new WindowsMediaController();
