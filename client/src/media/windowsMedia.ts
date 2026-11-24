import { exec, spawn } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface MediaInfo {
  title: string;
  artist: string;
  album: string;
  playbackStatus: 'Playing' | 'Paused' | 'Stopped' | 'NoActiveSession';
  sourceAppId?: string | null;
  updatedAt: string;
}

// PowerShell script to query WinRT GlobalSystemMediaTransportControls
const GET_MEDIA_SCRIPT = `
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction Stop
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' }

    function Await-AsyncOp($asyncOp, $type) {
        $method = $asTaskGeneric.MakeGenericMethod($type)
        $task = $method.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    }

    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media,ContentType=WindowsRuntime] | Out-Null
    $managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await-AsyncOp $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $session = $manager.GetCurrentSession()
    if ($session) {
        $propsAsync = $session.TryGetMediaPropertiesAsync()
        $props = Await-AsyncOp $propsAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
        $playbackInfo = $session.GetPlaybackInfo()
        [PSCustomObject]@{
            title = if ($props.Title) { $props.Title } else { "" }
            artist = if ($props.Artist) { $props.Artist } else { "" }
            album = if ($props.AlbumTitle) { $props.AlbumTitle } else { "" }
            playbackStatus = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Stopped" }
            sourceAppId = $session.SourceAppId
        } | ConvertTo-Json -Compress
    } else {
        [PSCustomObject]@{
            title = ""
            artist = ""
            album = ""
            playbackStatus = "NoActiveSession"
            sourceAppId = $null
        } | ConvertTo-Json -Compress
    }
} catch {
    [PSCustomObject]@{
        title = ""
        artist = ""
        album = ""
        playbackStatus = "Stopped"
        error = $_.Exception.Message
    } | ConvertTo-Json -Compress
}
`;

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
  private lastMediaInfo: MediaInfo = {
    title: '',
    artist: '',
    album: '',
    playbackStatus: 'Stopped',
    updatedAt: new Date().toISOString(),
  };

  /**
   * Retrieves the currently playing media session information using WinRT.
   */
  async getCurrentMedia(): Promise<MediaInfo> {
    try {
      // Run powershell without profile for speed
      const command = `powershell -NoProfile -NonInteractive -Command "${GET_MEDIA_SCRIPT.replace(/\r?\n/g, ' ')}"`;
      const { stdout } = await execPromise(command, { timeout: 3500 });
      
      const parsed = JSON.parse(stdout.trim());
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
