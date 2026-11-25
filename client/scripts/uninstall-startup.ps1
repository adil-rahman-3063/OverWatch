$startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
if (-not (Test-Path $startupDir)) {
    $startupDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
}
$shortcutPath = Join-Path $startupDir "OverWatch.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Removed OverWatch shortcut from Windows Startup." -ForegroundColor Green
} else {
    Write-Host "OverWatch startup shortcut was not found." -ForegroundColor Yellow
}
