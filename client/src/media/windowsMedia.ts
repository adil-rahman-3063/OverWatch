import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export interface MediaSessionItem {
  index: number;
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped';
  sourceAppId?: string;
}

export interface MediaInfo {
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped' | 'NoActiveSession';
  sourceAppId?: string | null;
  sessions?: MediaSessionItem[];
  activeSessionIndex?: number;
  updatedAt: string;
}

export class WindowsMediaController {
  private getScriptPath: string;
  private sendScriptPath: string;
  private lastMediaInfo: MediaInfo = {
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
    sessions: [],
    activeSessionIndex: 0,
    updatedAt: new Date().toISOString(),
  };

  constructor() {
    const getCandidates = [
      path.resolve(__dirname, '../../scripts/get-media.ps1'),
      path.resolve(__dirname, '../scripts/get-media.ps1'),
      path.resolve(process.cwd(), 'scripts/get-media.ps1'),
      path.resolve(process.cwd(), 'client/scripts/get-media.ps1'),
      'c:\\Users\\adilr\\Documents\\open-source\\OverWatch\\client\\scripts\\get-media.ps1',
    ];

    const sendCandidates = [
      path.resolve(__dirname, '../../scripts/send-media.ps1'),
      path.resolve(__dirname, '../scripts/send-media.ps1'),
      path.resolve(process.cwd(), 'scripts/send-media.ps1'),
      path.resolve(process.cwd(), 'client/scripts/send-media.ps1'),
      'c:\\Users\\adilr\\Documents\\open-source\\OverWatch\\client\\scripts\\send-media.ps1',
    ];

    const foundGet = getCandidates.find((p) => fs.existsSync(p));
    this.getScriptPath = foundGet || getCandidates[0];

    const foundSend = sendCandidates.find((p) => fs.existsSync(p));
    this.sendScriptPath = foundSend || sendCandidates[0];
  }

  /**
   * Retrieves all active media sessions information using WinRT.
   */
  async getCurrentMedia(): Promise<MediaInfo> {
    try {
      if (!fs.existsSync(this.getScriptPath)) {
        return this.lastMediaInfo;
      }

      const command = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${this.getScriptPath}"`;
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
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        activeSessionIndex: typeof parsed.activeSessionIndex === 'number' ? parsed.activeSessionIndex : 0,
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
   * Dispatches a targeted session media command (play_pause, next, prev, volume).
   */
  async sendMediaCommand(action: string, sessionIndex: number = -1): Promise<boolean> {
    try {
      const command = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${this.sendScriptPath}" -Action "${action}" -SessionIndex ${sessionIndex}`;
      await execPromise(command, { timeout: 3500 });
      return true;
    } catch (error) {
      console.error(`[MediaController] Failed to dispatch ${action} (session ${sessionIndex}):`, error);
      return false;
    }
  }
}

export const mediaController = new WindowsMediaController();
