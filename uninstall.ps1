# ==============================================================================
# OverWatch Windows 1-Click Uninstaller Script
# Stops running daemon processes, unregisters hooks, and removes Windows startup.
# ==============================================================================

[CmdletBinding()]
param (
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host @"
==================================================================
   ____                   _       __      __       __  
  / __ \ _   __ ___  ____| |     / /___ _/ /______/ /_ 
 / / / /| | / // _ \/ ___/ | /| / / __ `/ __/ ___/ __ \
/ /_/ / | |/ //  __/ /   | |/ |/ / /_/ / /_/ /__/ / / /
\____/  |___/ \___/_/    |__/|__/\__,_/\__/\___/_/ /_/ 

               WINDOWS CLIENT UNINSTALLER
==================================================================
"@ -ForegroundColor Yellow

$rootDir = $PSScriptRoot
$clientDir = Join-Path $rootDir "client"

# 1. Stop running OverWatch daemon processes
Write-Host "-> Stopping running OverWatch processes..." -ForegroundColor Cyan
try {
    $portConn = Get-NetTCPConnection -LocalPort 49152 -ErrorAction SilentlyContinue
    if ($portConn) {
        $portConn | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            if ($_ -gt 0 -and $_ -ne $PID) {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            }
        }
    }
} catch {}

try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "dist[\\/]index\.js"
    } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}

try {
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "tray\.ps1"
    } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}
Write-Host "  ✓ Processes stopped" -ForegroundColor Green

# 2. Unregister Antigravity hooks
Write-Host "-> Unregistering Antigravity lifecycle hooks..." -ForegroundColor Cyan
$hooksPath = Join-Path $env:USERPROFILE ".gemini\config\hooks.json"
if (Test-Path $hooksPath) {
    try {
        $content = Get-Content $hooksPath -Raw
        $config = $content | ConvertFrom-Json
        if ($config.'overwatch-gate') {
            $config.PSObject.Properties.Remove('overwatch-gate')
            $updated = $config | ConvertTo-Json -Depth 10
            Set-Content -Path $hooksPath -Value $updated -Encoding UTF8
            Write-Host "  ✓ Removed 'overwatch-gate' from $hooksPath" -ForegroundColor Green
        } else {
            Write-Host "  ✓ No active 'overwatch-gate' hook found" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "  ⚠ Error updating hooks.json: $_" -ForegroundColor Yellow
    }
}

# 3. Remove Windows Startup shortcut
Write-Host "-> Removing Windows Startup auto-launch shortcut..." -ForegroundColor Cyan
$startupShortcut = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\OverWatch.lnk"
if (Test-Path $startupShortcut) {
    Remove-Item -Path $startupShortcut -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed startup shortcut from Windows Startup folder" -ForegroundColor Green
} else {
    Write-Host "  ✓ No startup shortcut found" -ForegroundColor DarkGray
}

Write-Host "`n" + ("=" * 66) -ForegroundColor Green
Write-Host "   OverWatch Client successfully uninstalled." -ForegroundColor Green
Write-Host "   To reinstall anytime, run: setup.bat" -ForegroundColor Cyan
Write-Host ("=" * 66) -ForegroundColor Green
