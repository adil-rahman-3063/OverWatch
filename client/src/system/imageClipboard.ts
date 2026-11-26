import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

/**
 * Resolves the primary local LAN IPv4 address (e.g. 192.168.1.45)
 * so mobile devices on the same Wi-Fi can stream directly.
 */
export function getPrimaryLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        if (
          net.address.startsWith('192.168.') ||
          net.address.startsWith('10.') ||
          net.address.startsWith('172.')
        ) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Saves an image buffer to disk (Pictures/OverWatch) and copies it
 * directly to the Windows Clipboard as a bitmap (Ctrl+V ready).
 */
export async function saveImageAndSetClipboard(
  imageBuffer: Buffer,
  sourceName?: string
): Promise<{ success: boolean; filePath: string; error?: string }> {
  try {
    const picturesDir = path.join(os.homedir(), 'Pictures', 'OverWatch');
    if (!fs.existsSync(picturesDir)) {
      fs.mkdirSync(picturesDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `beam_${timestamp}.png`;
    const filePath = path.join(picturesDir, fileName);

    await fs.promises.writeFile(filePath, imageBuffer);
    console.log(`[ImageBeam] Saved image to: ${filePath}`);

    // Set Windows Clipboard bitmap via PowerShell STA
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $path = '${filePath.replace(/'/g, "''")}'
      $stream = [System.IO.File]::OpenRead($path)
      $img = [System.Drawing.Image]::FromStream($stream)
      [System.Windows.Forms.Clipboard]::SetImage($img)
      $img.Dispose()
      $stream.Close()
      $stream.Dispose()
    `;
    const base64 = Buffer.from(psScript, 'utf16le').toString('base64');
    await execPromise(`powershell -NoProfile -NonInteractive -STA -EncodedCommand ${base64}`, {
      timeout: 5000,
    });
    console.log('[ImageBeam] Copied image directly to Windows Clipboard.');

    // Fire non-blocking balloon notification
    try {
      const balloonScript = `
        Add-Type -AssemblyName System.Windows.Forms
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Information
        $notify.Visible = $true
        $notify.ShowBalloonTip(3000, 'OverWatch', 'Image beamed from mobile • Ready to Ctrl+V!', [System.Windows.Forms.ToolTipIcon]::Info)
        Start-Sleep -Milliseconds 1500
        $notify.Dispose()
      `;
      const balloonBase64 = Buffer.from(balloonScript, 'utf16le').toString('base64');
      exec(`powershell -NoProfile -NonInteractive -STA -EncodedCommand ${balloonBase64}`).unref();
    } catch {}

    return { success: true, filePath };
  } catch (err: any) {
    console.error('[ImageBeam] Failed to set clipboard image:', err.message);
    return { success: false, filePath: '', error: err.message };
  }
}

/**
 * Reads any image currently on the Windows Clipboard, returning base64 PNG data.
 */
export async function getWindowsClipboardImage(): Promise<{ hasImage: boolean; base64?: string; error?: string }> {
  try {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        $ms = New-Object System.IO.MemoryStream
        $img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Close()
        $img.Dispose()
        [System.Convert]::ToBase64String($bytes)
      } else {
        Write-Output "NO_IMAGE"
      }
    `;
    const base64Cmd = Buffer.from(psScript, 'utf16le').toString('base64');
    const { stdout } = await execPromise(`powershell -NoProfile -NonInteractive -STA -EncodedCommand ${base64Cmd}`, {
      timeout: 6000,
      maxBuffer: 25 * 1024 * 1024,
    });

    const result = stdout.trim();
    if (!result || result === 'NO_IMAGE') {
      return { hasImage: false };
    }

    return { hasImage: true, base64: result };
  } catch (err: any) {
    console.warn('[ImageBeam] Failed to read clipboard image:', err.message);
    return { hasImage: false, error: err.message };
  }
}

/**
 * Captures the Windows primary monitor screen and returns base64 PNG data.
 */
export async function capturePrimaryScreen(): Promise<{ success: boolean; base64?: string; filePath?: string; error?: string }> {
  try {
    const screenshotsDir = path.join(os.homedir(), 'Pictures', 'OverWatch', 'Screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(screenshotsDir, `snip_${timestamp}.png`);

    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bounds = $screen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      
      # Save to disk
      $path = '${filePath.replace(/'/g, "''")}'
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

      # Output base64
      $ms = New-Object System.IO.MemoryStream
      $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
      $bytes = $ms.ToArray()
      $graphics.Dispose()
      $bitmap.Dispose()
      $ms.Close()
      [System.Convert]::ToBase64String($bytes)
    `;
    const base64Cmd = Buffer.from(psScript, 'utf16le').toString('base64');
    const { stdout } = await execPromise(`powershell -NoProfile -NonInteractive -STA -EncodedCommand ${base64Cmd}`, {
      timeout: 8000,
      maxBuffer: 30 * 1024 * 1024,
    });

    const base64 = stdout.trim();
    if (!base64) {
      return { success: false, error: 'Empty screen capture output' };
    }

    return { success: true, base64, filePath };
  } catch (err: any) {
    console.error('[ImageBeam] Screen capture failed:', err.message);
    return { success: false, error: err.message };
  }
}
