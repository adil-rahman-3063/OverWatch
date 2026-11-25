Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background dark circle
$brushDark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 10, 15))
$g.FillEllipse($brushDark, 1, 1, 30, 30)

# Amber Outer Ring
$penAmber = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 245, 158, 11), 2)
$g.DrawEllipse($penAmber, 2, 2, 28, 28)

# Cyan Center Core / Radar Eye
$brushCyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 6, 182, 212))
$g.FillEllipse($brushCyan, 9, 9, 14, 14)

# Inner white glow
$brushWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.FillEllipse($brushWhite, 12, 12, 8, 8)

$dir = Join-Path $PSScriptRoot "..\assets"
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
$icoPath = Join-Path $dir "overwatch.ico"

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

Write-Host "OverWatch icon created at: $icoPath" -ForegroundColor Green
