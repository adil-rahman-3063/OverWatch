import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export interface PromptInjectionResult {
  success: boolean;
  targetTitle?: string;
  targetProcess?: string;
  error?: string;
}

/**
 * Injects a beamed prompt into the active Antigravity / IDE / terminal window.
 * Uses Win32 AttachThreadInput and SetForegroundWindow to bypass Windows foreground locks,
 * activates the window, focuses the chat input (Ctrl+L), pastes the clipboard (Ctrl+V),
 * and submits (Enter).
 */
export async function injectPromptToWindow(
  workspace?: string,
  promptText?: string
): Promise<PromptInjectionResult> {
  const ws = workspace || '';
  const wsName = ws ? path.basename(ws).replace(/["`$\\]/g, '') : '';
  const parentName = ws ? path.basename(path.dirname(ws)).replace(/["`$\\]/g, '') : '';

  const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAct {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    public static bool ForceForeground(IntPtr hWnd) {
        if (hWnd == IntPtr.Zero) return false;
        if (IsIconic(hWnd)) {
            ShowWindow(hWnd, 9); // SW_RESTORE
        } else {
            ShowWindow(hWnd, 5); // SW_SHOW
        }
        keybd_event(0, 0, 0, UIntPtr.Zero);
        uint currentThread = (uint)AppDomain.GetCurrentThreadId();
        uint forePid;
        IntPtr foreHwnd = GetForegroundWindow();
        uint foreThread = GetWindowThreadProcessId(foreHwnd, out forePid);
        if (foreThread != currentThread) {
            AttachThreadInput(currentThread, foreThread, true);
            SetForegroundWindow(hWnd);
            AttachThreadInput(currentThread, foreThread, false);
        } else {
            SetForegroundWindow(hWnd);
        }
        return true;
    }
}
"@

$wsName = '${wsName}'
$pName = '${parentName}'

$procs = Get-Process | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and ($_.MainWindowTitle -or $_.ProcessName) }
$target = $null

# 1. Match subfolder/folder in title (e.g. landing)
if ($wsName -and $wsName -ne 'OverWatch') {
    $target = $procs | Where-Object { $_.MainWindowTitle -like "*$wsName*" } | Select-Object -First 1
}

# 2. Match parent folder in title (e.g. OverWatch)
if (-not $target -and $pName) {
    $target = $procs | Where-Object { $_.MainWindowTitle -like "*$pName*" } | Select-Object -First 1
}

# 3. Match Antigravity in title or process name
if (-not $target) {
    $target = $procs | Where-Object { $_.MainWindowTitle -like "*Antigravity*" -or $_.ProcessName -like "*antigravity*" } | Select-Object -First 1
}

# 4. Match Visual Studio Code / Cursor / Code
if (-not $target) {
    $target = $procs | Where-Object { $_.MainWindowTitle -like "*Visual Studio Code*" -or $_.ProcessName -match "^(Code|Cursor)$" } | Select-Object -First 1
}

# 5. Fallback: check terminal windows
if (-not $target) {
    $target = $procs | Where-Object { $_.ProcessName -match "^(WindowsTerminal|cmd|powershell)$" } | Select-Object -First 1
}

if ($target) {
    [WinAct]::ForceForeground($target.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 250
    $wshell = New-Object -ComObject wscript.shell

    $isTerm = $target.ProcessName -match "^(WindowsTerminal|cmd|powershell)$"
    if (-not $isTerm) {
        # Send Ctrl+L to focus chat input box in Antigravity / AI IDE
        $wshell.SendKeys('^l')
        Start-Sleep -Milliseconds 200
    }

    # Send Ctrl+V to paste prompt
    $wshell.SendKeys('^v')
    Start-Sleep -Milliseconds 120

    # Send Enter to submit prompt
    $wshell.SendKeys('{ENTER}')

    Write-Output "OK:$($target.ProcessName):$($target.MainWindowTitle)"
} else {
    Write-Output "NOT_FOUND"
}
`;

  try {
    const base64 = Buffer.from(psScript, 'utf16le').toString('base64');
    const { stdout } = await execPromise(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${base64}`,
      { timeout: 7000 }
    );
    const trimmed = stdout.trim();
    if (trimmed.startsWith('OK:')) {
      const parts = trimmed.split(':');
      const targetProcess = parts[1] || '';
      const targetTitle = parts.slice(2).join(':') || '';
      return { success: true, targetProcess, targetTitle };
    }
    return { success: false, error: 'Target window not found' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
