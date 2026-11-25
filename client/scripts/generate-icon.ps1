Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Pure Black OLED background
$brushBlack = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
$g.FillRectangle($brushBlack, 0, 0, 32, 32)

# Crisp White Outer Aperture Ring
$penWhite = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 2)
$g.DrawEllipse($penWhite, 3, 3, 26, 26)

# Minimal Crosshair Ticks
$penTick = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 1.5)
$g.DrawLine($penTick, 16, 1, 16, 6)
$g.DrawLine($penTick, 16, 26, 16, 31)
$g.DrawLine($penTick, 1, 16, 6, 16)
$g.DrawLine($penTick, 26, 16, 31, 16)

# Center Core Eye
$brushCore = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillEllipse($brushCore, 12, 12, 8, 8)

# Center Aperture Pupil (Black Void)
$brushVoid = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
$g.FillEllipse($brushVoid, 14, 14, 4, 4)

$dir = Join-Path $PSScriptRoot "..\assets"
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
$icoPath = Join-Path $dir "overwatch.ico"

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

Write-Host "OverWatch monochrome icon created at: $icoPath" -ForegroundColor Green
