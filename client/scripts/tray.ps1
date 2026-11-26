# OverWatch Windows System Tray Companion
# Runs the OverWatch daemon in the background with a system tray icon, context menu, auto-restart watchdog, and log capture.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$clientRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$projectRoot = Resolve-Path (Join-Path $clientRoot "..")
$icoPath = Join-Path $clientRoot "assets\overwatch.ico"
$logPath = Join-Path $clientRoot "daemon.log"
$nodeScript = Join-Path $clientRoot "dist\index.js"

# 1. Ensure client build exists
if (-not (Test-Path $nodeScript)) {
    Write-Host "[OverWatch Tray] Compiling client first..." -ForegroundColor Yellow
    Set-Location $clientRoot
    & npm run build
}

# 2. Kill any stale OverWatch processes on port 49152 or old node instances
function Stop-StaleProcesses {
    try {
        $conns = Get-NetTCPConnection -LocalPort 49152 -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $pids) {
                if ($p -gt 0 -and $p -ne $PID) {
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
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
}

Stop-StaleProcesses

# Global process holder
$script:daemonProc = $null

function Start-DaemonProcess {
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        try { $script:daemonProc.Kill() } catch {}
    }

    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    $nodeExe = if ($nodeCmd) { $nodeCmd.Source } else { "node.exe" }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $nodeExe
    $psi.Arguments = "`"$nodeScript`""
    $psi.WorkingDirectory = $clientRoot.Path
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $proc.EnableRaisingEvents = $true

    # Log startup banner cleanly without file locking
    $startBanner = "`r`n=== [OverWatch Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ===`r`n"
    try {
        [System.IO.File]::AppendAllText($logPath, $startBanner)
    } catch {}

    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            try {
                $msg = "[$([DateTime]::Now.ToString('HH:mm:ss'))] " + $EventArgs.Data + "`r`n"
                [System.IO.File]::AppendAllText($Event.MessageData, $msg)
            } catch {}
        }
    } -MessageData $logPath | Out-Null

    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            try {
                $msg = "[$([DateTime]::Now.ToString('HH:mm:ss')) ERR] " + $EventArgs.Data + "`r`n"
                [System.IO.File]::AppendAllText($Event.MessageData, $msg)
            } catch {}
        }
    } -MessageData $logPath | Out-Null

    $proc.Start() | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    $script:daemonProc = $proc
}

# 3. Create System Tray Icon
$script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon

try {
    if (Test-Path $icoPath) {
        $script:notifyIcon.Icon = New-Object System.Drawing.Icon $icoPath
    } else {
        $script:notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
    }
} catch {
    $script:notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
}

$script:notifyIcon.Text = "OverWatch • Mobile Interlock (Live)"
$script:notifyIcon.Visible = $true

# Context Menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuTitle = New-Object System.Windows.Forms.ToolStripMenuItem "OverWatch • Windows System Tray"
$menuTitle.Enabled = $false
$contextMenu.Items.Add($menuTitle) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuOpenWeb = New-Object System.Windows.Forms.ToolStripMenuItem "Open Mobile Web App"
$menuOpenWeb.Add_Click({
    Start-Process "https://adil-rahman-3063.github.io/OverWatch"
})
$contextMenu.Items.Add($menuOpenWeb) | Out-Null

$menuLogs = New-Object System.Windows.Forms.ToolStripMenuItem "View Live Logs (daemon.log)"
$menuLogs.Add_Click({
    if (-not (Test-Path $logPath)) { "" | Out-File $logPath }
    Start-Process "notepad.exe" $logPath
})
$contextMenu.Items.Add($menuLogs) | Out-Null

$menuRestart = New-Object System.Windows.Forms.ToolStripMenuItem "Restart Daemon"
$menuRestart.Add_Click({
    Stop-StaleProcesses
    Start-DaemonProcess
    $script:notifyIcon.ShowBalloonTip(2000, "OverWatch", "Daemon restarted successfully.", [System.Windows.Forms.ToolTipIcon]::Info)
})
$contextMenu.Items.Add($menuRestart) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem "Exit OverWatch"
$menuExit.Add_Click({
    $script:notifyIcon.Visible = $false
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        try { $script:daemonProc.Kill() } catch {}
    }
    Stop-StaleProcesses
    $script:notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
    Stop-Process -Id $PID -Force
})
$contextMenu.Items.Add($menuExit) | Out-Null

$script:notifyIcon.ContextMenuStrip = $contextMenu

# Double click shows status
$script:notifyIcon.Add_DoubleClick({
    $statusText = if ($script:daemonProc -and -not $script:daemonProc.HasExited) { "Running (PID: $($script:daemonProc.Id))" } else { "Stopped" }
    $script:notifyIcon.ShowBalloonTip(3000, "OverWatch Status", "Daemon: $statusText`nPort: 49152`nMobile approvals are active.", [System.Windows.Forms.ToolTipIcon]::Info)
})

# Start daemon child process
Start-DaemonProcess

# Watchdog Timer: check daemon health every 5 seconds and auto-revive if terminated
$watchdogTimer = New-Object System.Windows.Forms.Timer
$watchdogTimer.Interval = 5000
$watchdogTimer.Add_Tick({
    if ($script:daemonProc -and $script:daemonProc.HasExited) {
        $exitCode = $script:daemonProc.ExitCode
        $logMsg = "[$([DateTime]::Now.ToString('HH:mm:ss')) ERR] OverWatch daemon exited unexpectedly with code $exitCode. Restarting...`r`n"
        try { [System.IO.File]::AppendAllText($logPath, $logMsg) } catch {}
        
        $script:notifyIcon.Text = "OverWatch • Daemon Restarting..."
        Start-DaemonProcess
        $script:notifyIcon.Text = "OverWatch • Mobile Interlock (Live)"
    }
})
$watchdogTimer.Start()

# Show balloon tip on initial launch
$script:notifyIcon.ShowBalloonTip(5000, "OverWatch is Live", "Running silently in tray. Click '^' on your taskbar if hidden.", [System.Windows.Forms.ToolTipIcon]::Info)

# Run the Windows Forms message loop to keep tray icon alive
[System.Windows.Forms.Application]::Run()
