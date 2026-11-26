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
 * Shows a native Windows 10/11 Toast notification banner with chime.
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

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const rand = Math.floor(Math.random() * 900 + 100);
    const fileName = `beam_${dateStr}_${ms}_${rand}.png`;
    const filePath = path.join(picturesDir, fileName);

    await fs.promises.writeFile(filePath, imageBuffer);
    console.log(`[ImageBeam] Saved image to: ${filePath}`);

    // 1. Set Windows Clipboard bitmap via PowerShell STA
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
    console.log('[ImageBeam] Copied image directly to Windows Clipboard (Ctrl+V ready).');

    // 2. Fire native Windows notification with audio chime + dark HUD popup
    try {
      const toastScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}

        try {
          $form = New-Object System.Windows.Forms.Form
          $form.Text = "OverWatch"
          $form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
          $form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
          $form.TopMost = $true
          $form.ShowInTaskbar = $false
          $form.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 22)
          $form.Size = New-Object System.Drawing.Size(320, 72)

          $screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
          $form.Location = New-Object System.Drawing.Point(($screen.Right - 336), ($screen.Bottom - 88))

          $title = New-Object System.Windows.Forms.Label
          $title.Text = "OverWatch • Image Beamed"
          $title.ForeColor = [System.Drawing.Color]::FromArgb(20, 241, 149)
          $title.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
          $title.Location = New-Object System.Drawing.Point(16, 12)
          $title.Size = New-Object System.Drawing.Size(288, 20)
          $form.Controls.Add($title)

          $sub = New-Object System.Windows.Forms.Label
          $sub.Text = "Image copied to Windows Clipboard • Ready to Ctrl+V"
          $sub.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
          $sub.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
          $sub.Location = New-Object System.Drawing.Point(16, 36)
          $sub.Size = New-Object System.Drawing.Size(288, 24)
          $form.Controls.Add($sub)

          $notify = New-Object System.Windows.Forms.NotifyIcon
          $notify.Icon = [System.Drawing.SystemIcons]::Information
          $notify.Text = "OverWatch"
          $notify.Visible = $true
          $notify.ShowBalloonTip(3000, "OverWatch • Image Beamed", "Image received from phone • Ready to Ctrl+V!", [System.Windows.Forms.ToolTipIcon]::Info)

          $form.Show()
          for ($i = 0; $i -lt 30; $i++) {
              [System.Windows.Forms.Application]::DoEvents()
              Start-Sleep -Milliseconds 100
          }
          $form.Close()
          $form.Dispose()
          $notify.Visible = $false
          $notify.Dispose()
        } catch {}
      `;
      const toastBase64 = Buffer.from(toastScript, 'utf16le').toString('base64');
      exec(`powershell -NoProfile -NonInteractive -STA -EncodedCommand ${toastBase64}`).unref();
    } catch {}

    return { success: true, filePath };
  } catch (err: any) {
    console.error('[ImageBeam] Failed to set clipboard image:', err.message);
    return { success: false, filePath: '', error: err.message };
  }
}

/**
 * Reads any image currently on the Windows Clipboard.
 * Automatically downsamples/compresses to high-quality JPEG (~80KB)
 * so it effortlessly transmits over Supabase Realtime WebSocket (<256KB).
 */
export async function getWindowsClipboardImage(): Promise<{ hasImage: boolean; base64?: string; error?: string }> {
  try {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        
        # Downscale to max 1280px if needed to stay well under the 256KB Realtime limit
        $maxDim = 1280
        $w = $img.Width
        $h = $img.Height
        if ($w -gt $maxDim -or $h -gt $maxDim) {
            if ($w -gt $h) {
                $h = [int]($h * $maxDim / $w)
                $w = $maxDim
            } else {
                $w = [int]($w * $maxDim / $h)
                $h = $maxDim
            }
            $resized = New-Object System.Drawing.Bitmap($w, $h)
            $g = [System.Drawing.Graphics]::FromImage($resized)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($img, 0, 0, $w, $h)
            $g.Dispose()
            $img.Dispose()
            $img = $resized
        }

        $ms = New-Object System.IO.MemoryStream
        $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
        $img.Save($ms, $encoder, $encParams)
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
 * Captures the Windows primary monitor screen:
 * 1. Saves full-res uncompressed PNG to Pictures/OverWatch/Screenshots/snip_*.png
 * 2. Compresses to high-quality JPEG (~80KB) for instantaneous Supabase beaming.
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
      try {
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();' -Name DpiFix -Namespace Win32
        [Win32.DpiFix]::SetProcessDPIAware() | Out-Null
      } catch {}
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bounds = $screen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      
      # 1. Save full-resolution PNG to disk
      $path = '${filePath.replace(/'/g, "''")}'
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

      # 2. Resized / Compressed JPEG for instant real-time network beaming (<150KB)
      $maxDim = 1280
      $w = $bounds.Width
      $h = $bounds.Height
      if ($w -gt $maxDim -or $h -gt $maxDim) {
          if ($w -gt $h) {
              $h = [int]($h * $maxDim / $w)
              $w = $maxDim
          } else {
              $w = [int]($w * $maxDim / $h)
              $h = $maxDim
          }
      }
      $resized = New-Object System.Drawing.Bitmap($w, $h)
      $resGraph = [System.Drawing.Graphics]::FromImage($resized)
      $resGraph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $resGraph.DrawImage($bitmap, 0, 0, $w, $h)
      $resGraph.Dispose()

      $ms = New-Object System.IO.MemoryStream
      $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)
      $resized.Save($ms, $encoder, $encParams)
      $bytes = $ms.ToArray()
      $graphics.Dispose()
      $bitmap.Dispose()
      $resized.Dispose()
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
