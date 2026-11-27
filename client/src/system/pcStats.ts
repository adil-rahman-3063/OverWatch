import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { capturePrimaryScreenAndSetClipboard } from './imageClipboard.js';

const execPromise = util.promisify(exec);

export interface SystemStats {
  cpuUsagePercent: number;
  totalRamGb: number;
  usedRamGb: number;
  ramUsagePercent: number;
  uptimeHours: number;
  hostname: string;
  battery?: {
    hasBattery: boolean;
    percent: number;
    isCharging: boolean;
  };
}

// Calculate CPU usage by sampling os.cpus() times
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = os.cpus().map((cpu) => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0),
    }));

    setTimeout(() => {
      const endMeasure = os.cpus().map((cpu) => ({
        idle: cpu.times.idle,
        total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0),
      }));

      let totalDiff = 0;
      let idleDiff = 0;

      for (let i = 0; i < startMeasure.length; i++) {
        totalDiff += endMeasure[i].total - startMeasure[i].total;
        idleDiff += endMeasure[i].idle - startMeasure[i].idle;
      }

      if (totalDiff === 0) {
        resolve(0);
        return;
      }

      const usage = Math.round(100 - (100 * idleDiff) / totalDiff);
      resolve(Math.max(0, Math.min(100, usage)));
    }, 400);
  });
}

let lastBatteryCheck = 0;
let cachedBattery: { hasBattery: boolean; percent: number; isCharging: boolean } = {
  hasBattery: true,
  percent: 100,
  isCharging: true,
};

async function getPcBattery(): Promise<{ hasBattery: boolean; percent: number; isCharging: boolean }> {
  const now = Date.now();
  if (now - lastBatteryCheck < 8000 && lastBatteryCheck > 0) {
    return cachedBattery;
  }
  try {
    const { stdout } = await execPromise(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $p=[System.Windows.Forms.SystemInformation]::PowerStatus; Write-Output ($p.BatteryLifePercent.ToString() + '|' + $p.PowerLineStatus.ToString() + '|' + $p.BatteryChargeStatus.ToString())"`,
      { timeout: 3000 }
    );
    const parts = stdout.trim().split('|');
    if (parts.length >= 2) {
      const pctRaw = parseFloat(parts[0]);
      const lineStatus = parts[1].trim();
      const chargeStatus = (parts[2] || '').trim();
      const hasBattery = !chargeStatus.includes('NoSystemBattery') && pctRaw >= 0;
      cachedBattery = {
        hasBattery,
        percent: hasBattery ? Math.round(pctRaw * 100) : 100,
        isCharging: lineStatus === 'Online',
      };
      lastBatteryCheck = now;
    }
  } catch {}
  return cachedBattery;
}

export async function getSystemStats(): Promise<SystemStats> {
  const cpuUsagePercent = await getCpuUsage();
  const totalRamBytes = os.totalmem();
  const freeRamBytes = os.freemem();
  const usedRamBytes = totalRamBytes - freeRamBytes;

  const totalRamGb = parseFloat((totalRamBytes / (1024 ** 3)).toFixed(1));
  const usedRamGb = parseFloat((usedRamBytes / (1024 ** 3)).toFixed(1));
  const ramUsagePercent = Math.round((usedRamBytes / totalRamBytes) * 100);
  const uptimeHours = parseFloat((os.uptime() / 3600).toFixed(1));
  const battery = await getPcBattery();

  return {
    cpuUsagePercent,
    totalRamGb,
    usedRamGb,
    ramUsagePercent,
    uptimeHours,
    hostname: os.hostname(),
    battery,
  };
}

export async function executeMacro(action: string, workspaceDir?: string): Promise<boolean> {
  try {
    switch (action) {
      case 'lock_pc':
        // Lock Windows Workstation
        await execPromise('rundll32.exe user32.dll,LockWorkStation');
        return true;

      case 'turn_off_screens':
        // Put monitors to sleep (0xF170 = SC_MONITORPOWER, 2 = power off)
        const psSleepCommand = `powershell -NoProfile -Command "(Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);' -Name 'W' -Namespace 'M' -PassThru)::SendMessage(-1, 0x0112, 0xF170, 2)"`;
        await execPromise(psSleepCommand);
        return true;

      case 'open_terminal':
        const targetDir = workspaceDir || process.cwd();
        // Open Windows Terminal or PowerShell in workspace
        exec(`start powershell.exe -NoExit -Command "Set-Location '${targetDir}'"`);
        return true;

      case 'open_ide':
        const ideDir = workspaceDir || process.cwd();
        // Launch Antigravity IDE or VS Code in workspace
        exec(`code "${ideDir}" || start "" "${ideDir}"`);
        return true;

      case 'screenshot_clipboard':
        // Capture primary laptop/PC screen and copy directly to Windows OS clipboard
        const screenRes = await capturePrimaryScreenAndSetClipboard();
        return screenRes.success;

      default:
        console.warn(`[Macro] Unknown action: ${action}`);
        return false;
    }
  } catch (err: any) {
    console.error(`[Macro] Failed to execute ${action}:`, err.message);
    return false;
  }
}
