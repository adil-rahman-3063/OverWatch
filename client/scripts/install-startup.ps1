$startupDir = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir "OverWatch.lnk"
$targetScript = Join-Path $PSScriptRoot "..\start-client.bat"
$vbsPath = Join-Path $PSScriptRoot "overwatch-silent.vbs"

# Create silent VBScript runner so it runs in the background without a persistent black console window
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$targetScript" & chr(34), 0
Set WshShell = Nothing
"@
Set-Content -Path $vbsPath -Value $vbsContent -Encoding ASCII

# Create shortcut in Windows Startup folder
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = (Resolve-Path "$PSScriptRoot\..").Path
$shortcut.Description = "OverWatch Windows Client Daemon"
$shortcut.Save()

Write-Host "OverWatch auto-start registered in Windows Startup folder:" -ForegroundColor Green
Write-Host "  -> $shortcutPath" -ForegroundColor Cyan
Write-Host "OverWatch will now automatically start in the background when you log in to Windows." -ForegroundColor Green
