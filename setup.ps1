# ==============================================================================
# OverWatch Windows 1-Click All-in-One Setup Script
# Configures environment, installs packages, builds client & web, registers hooks,
# and sets up the Windows System Tray companion.
# ==============================================================================

[CmdletBinding()]
param (
    [switch]$Yes,
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey,
    [string]$Pin = "123456"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Num, [string]$Title)
    Write-Host "`n[$Num/7] " -ForegroundColor Cyan -NoNewline
    Write-Host "$Title" -ForegroundColor White
    Write-Host ("-" * 60) -ForegroundColor DarkGray
}

Clear-Host
Write-Host @"
==================================================================
   ____                   _       __      __       __  
  / __ \ _   __ ___  ____| |     / /___ _/ /______/ /_ 
 / / / /| | / // _ \/ ___/ | /| / / __ `/ __/ ___/ __ \
/ /_/ / | |/ //  __/ /   | |/ |/ / /_/ / /_/ /__/ / / /
\____/  |___/ \___/_/    |__/|__/\__,_/\__/\___/_/ /_/ 

        WINDOWS 1-CLICK ALL-IN-ONE SETUP COMPANION
==================================================================
"@ -ForegroundColor Yellow

$rootDir = $PSScriptRoot
$clientDir = Join-Path $rootDir "client"
$webDir = Join-Path $rootDir "web"

# ------------------------------------------------------------------------------
# STEP 1: Verify Prerequisites
# ------------------------------------------------------------------------------
Write-Step "1" "Verifying System Prerequisites"

try {
    $nodeVer = (node -v).Trim()
    Write-Host "  ✓ Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js is NOT installed or not on system PATH!" -ForegroundColor Red
    Write-Host "    Please install Node.js (v18+) from: https://nodejs.org/" -ForegroundColor Yellow
    Exit 1
}

try {
    $npmVer = (npm -v).Trim()
    Write-Host "  ✓ npm detected: v$npmVer" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm is NOT installed!" -ForegroundColor Red
    Exit 1
}

# ------------------------------------------------------------------------------
# STEP 2: Configure Environment Files (.env)
# ------------------------------------------------------------------------------
Write-Step "2" "Configuring Supabase & Security Credentials"

$clientEnvPath = Join-Path $clientDir ".env"
$webEnvPath = Join-Path $webDir ".env"
$clientEnvExample = Join-Path $clientDir ".env.example"
$webEnvExample = Join-Path $webDir ".env.example"

if (-not (Test-Path $clientEnvPath)) {
    if (-not $SupabaseUrl -and -not $Yes) {
        Write-Host "  Enter your Supabase Project URL (e.g. https://your-ref.supabase.co):" -ForegroundColor Cyan
        $SupabaseUrl = Read-Host "  URL"
    }

    if (-not $SupabaseAnonKey -and -not $Yes) {
        Write-Host "  Enter your Supabase Publishable / Anon Key:" -ForegroundColor Cyan
        $SupabaseAnonKey = Read-Host "  Key"
    }

    if (-not $SupabaseUrl) { $SupabaseUrl = "https://your-project.supabase.co" }
    if (-not $SupabaseAnonKey) { $SupabaseAnonKey = "sb_publishable_placeholder" }

    $clientEnvContent = @"
# OverWatch Client Environment Configuration
SUPABASE_URL=$SupabaseUrl
SUPABASE_ANON_KEY=$SupabaseAnonKey
DEVICE_ID=default
LOCAL_IPC_PORT=49152
FALLBACK_DECISION=deny
QUOTA_POLL_INTERVAL_MS=120000
MEDIA_POLL_INTERVAL_MS=2500
"@
    Set-Content -Path $clientEnvPath -Value $clientEnvContent -Encoding UTF8
    Write-Host "  ✓ Created client/.env" -ForegroundColor Green
} else {
    Write-Host "  ✓ client/.env already exists" -ForegroundColor Green
    # Read existing credentials to sync to web/.env if needed
    $clientEnvText = Get-Content $clientEnvPath -Raw
    if ($clientEnvText -match 'SUPABASE_URL=(.*)') { $SupabaseUrl = $matches[1].Trim() }
    if ($clientEnvText -match 'SUPABASE_ANON_KEY=(.*)') { $SupabaseAnonKey = $matches[1].Trim() }
}

if (-not (Test-Path $webEnvPath)) {
    if (-not $SupabaseUrl) { $SupabaseUrl = "https://your-project.supabase.co" }
    if (-not $SupabaseAnonKey) { $SupabaseAnonKey = "sb_publishable_placeholder" }

    $webEnvContent = @"
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$SupabaseAnonKey
VITE_DEVICE_ID=default
VITE_ACCESS_PIN=$Pin
"@
    Set-Content -Path $webEnvPath -Value $webEnvContent -Encoding UTF8
    Write-Host "  ✓ Created web/.env (Access PIN: $Pin)" -ForegroundColor Green
} else {
    Write-Host "  ✓ web/.env already exists" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 3: Install Node Dependencies
# ------------------------------------------------------------------------------
Write-Step "3" "Installing Dependencies (Client & Web)"

Write-Host "  -> Installing client dependencies..." -ForegroundColor DarkGray
Push-Location $clientDir
try {
    npm install --no-audit --no-fund
    Write-Host "  ✓ Client dependencies installed" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "  -> Installing web dependencies..." -ForegroundColor DarkGray
Push-Location $webDir
try {
    npm install --no-audit --no-fund
    Write-Host "  ✓ Web dependencies installed" -ForegroundColor Green
} finally {
    Pop-Location
}

# ------------------------------------------------------------------------------
# STEP 4: Build Client and Web Projects
# ------------------------------------------------------------------------------
Write-Step "4" "Compiling Client TypeScript and Building Web PWA"

Write-Host "  -> Compiling client daemon..." -ForegroundColor DarkGray
Push-Location $clientDir
try {
    npm run build
    Write-Host "  ✓ Client daemon compiled to dist/" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "  -> Building web application..." -ForegroundColor DarkGray
Push-Location $webDir
try {
    npm run build
    Write-Host "  ✓ Web application compiled to dist/" -ForegroundColor Green
} finally {
    Pop-Location
}

# ------------------------------------------------------------------------------
# STEP 5: Generate System Tray Icon
# ------------------------------------------------------------------------------
Write-Step "5" "Generating Windows System Tray Icon"

$iconScript = Join-Path $clientDir "scripts\generate-icon.ps1"
if (Test-Path $iconScript) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $iconScript
    Write-Host "  ✓ OverWatch tray icon generated in client/assets/overwatch.ico" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 6: Register Antigravity & Claude Code Hooks
# ------------------------------------------------------------------------------
Write-Step "6" "Registering Agent Lifecycle Hooks"

Push-Location $clientDir
try {
    npm run setup:hooks
    Write-Host "  ✓ Remote command approval hooks registered successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Note: Hook setup completed with warnings (ensure IDE is installed)." -ForegroundColor Yellow
} finally {
    Pop-Location
}

# ------------------------------------------------------------------------------
# STEP 7: Windows Startup & Tray Companion
# ------------------------------------------------------------------------------
Write-Step "7" "Windows Startup & System Tray Integration"

$installStartupScript = Join-Path $clientDir "scripts\install-startup.ps1"
$setupAutostart = $Yes

if (-not $Yes) {
    $reply = Read-Host "  Do you want OverWatch to start automatically in the tray when Windows boots? (Y/n)"
    if ($reply -eq "" -or $reply -match '^[Yy]') {
        $setupAutostart = $true
    }
}

if ($setupAutostart -and (Test-Path $installStartupScript)) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $installStartupScript
}

Write-Host "`n" + ("=" * 66) -ForegroundColor Green
Write-Host "   🎉 OVERWATCH SETUP COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 66) -ForegroundColor Green

Write-Host @"

  Quick Start Guide:
  ------------------
  1. Start in System Tray:   Run 'start-tray.bat' (Runs silently in your Windows Tray)
  2. Start with Console:     Run 'start-client.bat' (Shows live log terminal)
  3. Start Web App (Dev):    Run 'cd web && npm run dev' (or open GitHub Pages)

"@ -ForegroundColor White

if (-not $Yes) {
    $launch = Read-Host "  Would you like to launch OverWatch in the System Tray right now? (Y/n)"
    if ($launch -eq "" -or $launch -match '^[Yy]') {
        Write-Host "  Starting OverWatch in System Tray..." -ForegroundColor Cyan
        $trayPath = Join-Path $clientDir "scripts\tray.ps1"
        $vbsPath = Join-Path $clientDir "scripts\silent-launch.vbs"
        if (Test-Path $vbsPath) {
            Start-Process "wscript.exe" -ArgumentList "//nologo `"$vbsPath`" `"$trayPath`""
        } else {
            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = "powershell.exe"
            $psi.Arguments = "-STA -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$trayPath`""
            $psi.UseShellExecute = $false
            $psi.CreateNoWindow = $true
            $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
            [System.Diagnostics.Process]::Start($psi) | Out-Null
        }
        
        Start-Sleep -Seconds 2
        Write-Host "  [OK] OverWatch is now running silently in your Windows System Tray!" -ForegroundColor Green
        Write-Host "  [Tip] If you do not see the shield icon on your taskbar, click the up arrow (^) next to your clock." -ForegroundColor Yellow
        Write-Host "  [Tip] You can also run start-client.bat anytime if you prefer a visible console terminal." -ForegroundColor DarkGray
    }
}