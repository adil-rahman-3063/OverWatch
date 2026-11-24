$startupDir = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir "OverWatch.lnk"
$vbsPath = Join-Path $PSScriptRoot "overwatch-silent.vbs"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Removed OverWatch shortcut from Windows Startup." -ForegroundColor Green
} else {
    Write-Host "OverWatch startup shortcut was not found." -ForegroundColor Yellow
}

if (Test-Path $vbsPath) {
    Remove-Item $vbsPath -Force
}
