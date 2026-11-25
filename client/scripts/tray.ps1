# OverWatch Windows System Tray Companion
# Runs the OverWatch daemon in the background with a system tray icon, context menu, and log capture.

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

# 2. Kill any stale OverWatch node processes on port 49152
try {
    $existing = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "dist[\\/]index.js" -or $_.Path -match "OverWatch"
    }
    if ($existing) {
        $existing | Stop-Process -Force -ErrorAction SilentlyContinue
    }
} catch {}

# Global process holder
$script:daemonProc = $null

function Start-DaemonProcess {
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        try { $script:daemonProc.Kill() } catch {}
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "node.exe"
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

    # Pipe output to daemon.log
    $logStream = [System.IO.File]::AppendText($logPath)
    $logStream.WriteLine("`n=== [OverWatch Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ===")
    $logStream.Flush()

    Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
        if ($EventArgs.Data) {
            $msg = "[$([DateTime]::Now.ToString('HH:mm:ss'))] " + $EventArgs.Data
            [System.IO.File]::AppendAllText($Event.MessageData, $msg + "`r`n")
        }
    } -MessageData $logPath | Out-Null

    Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
        if ($EventArgs.Data) {
            $msg = "[$([DateTime]::Now.ToString('HH:mm:ss')) ERR] " + $EventArgs.Data
            [System.IO.File]::AppendAllText($Event.MessageData, $msg + "`r`n")
        }
    } -MessageData $logPath | Out-Null

    $proc.Start() | Out-Null
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()

    $script:daemonProc = $proc
}

# 3. Create System Tray Icon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

if (Test-Path $icoPath) {
    $notifyIcon.Icon = New-Object System.Drawing.Icon $icoPath
} else {
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
}

$notifyIcon.Text = "OverWatch • Mobile Interlock (Live)"
$notifyIcon.Visible = $true

# Context Menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuTitle = New-Object System.Windows.Forms.ToolStripMenuItem "OverWatch v1.0 • Online"
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
    Start-DaemonProcess
    $notifyIcon.ShowBalloonTip(2000, "OverWatch", "Daemon restarted successfully.", [System.Windows.Forms.ToolTipIcon]::Info)
})
$contextMenu.Items.Add($menuRestart) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem "Exit OverWatch"
$menuExit.Add_Click({
    $notifyIcon.Visible = $false
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        try { $script:daemonProc.Kill() } catch {}
    }
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
    Stop-Process -Id $PID -Force
})
$contextMenu.Items.Add($menuExit) | Out-Null

$notifyIcon.ContextMenuStrip = $contextMenu

# Double click shows status
$notifyIcon.Add_DoubleClick({
    $statusText = if ($script:daemonProc -and -not $script:daemonProc.HasExited) { "Running (PID: $($script:daemonProc.Id))" } else { "Stopped" }
    $notifyIcon.ShowBalloonTip(3000, "OverWatch Status", "Daemon: $statusText`nPort: 49152`nMobile approvals are active.", [System.Windows.Forms.ToolTipIcon]::Info)
})

# Start daemon child process
Start-DaemonProcess

# Show balloon tip on initial launch
$notifyIcon.ShowBalloonTip(3000, "OverWatch Active", "Running silently in tray. Click icon for options or logs.", [System.Windows.Forms.ToolTipIcon]::Info)

# Run the Windows Forms message loop to keep tray icon alive
[System.Windows.Forms.Application]::Run()
