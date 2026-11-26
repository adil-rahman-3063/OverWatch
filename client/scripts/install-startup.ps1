try {
    $startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = Join-Path $startupDir "OverWatch.lnk"
    $trayScript = Join-Path $PSScriptRoot "tray.ps1"
    $icoPath = Join-Path $PSScriptRoot "..\assets\overwatch.ico"

    # Create shortcut in Windows Startup folder to launch silently into System Tray
    $wsh = New-Object -ComObject WScript.Shell
    $shortcut = $wsh.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-STA -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$trayScript`""
    $shortcut.WorkingDirectory = (Resolve-Path "$PSScriptRoot\..").Path
    $shortcut.Description = "OverWatch Windows Client Daemon (System Tray)"
    if (Test-Path $icoPath) {
        $shortcut.IconLocation = "$icoPath, 0"
    }
    $shortcut.WindowStyle = 7 # Minimized
    $shortcut.Save()

    Write-Host "OverWatch auto-start registered in Windows Startup folder:" -ForegroundColor Green
    Write-Host "  -> $shortcutPath" -ForegroundColor Cyan
    Write-Host "OverWatch will now automatically start silently in the System Tray when you log in." -ForegroundColor Green
} catch {
    Write-Host "Note: Startup folder registration can be completed by double-clicking 'setup.bat' on your PC." -ForegroundColor Yellow
}
