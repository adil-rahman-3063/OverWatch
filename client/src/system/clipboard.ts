import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Sets the Windows clipboard text safely using base64 encoding
 * to prevent character-escaping or shell-injection issues.
 */
export async function setWindowsClipboard(text: string): Promise<boolean> {
  try {
    const base64 = Buffer.from(text, 'utf-8').toString('base64');
    const psCommand = `powershell -NoProfile -NonInteractive -Command "$bytes = [System.Convert]::FromBase64String('${base64}'); $str = [System.Text.Encoding]::UTF8.GetString($bytes); Set-Clipboard -Value $str"`;
    await execPromise(psCommand, { timeout: 3000 });
    console.log(`[Clipboard] Beamed ${text.length} characters to Windows clipboard.`);
    return true;
  } catch (err: any) {
    console.error('[Clipboard] Failed to set clipboard:', err.message);
    return false;
  }
}

/**
 * Reads current text from the Windows clipboard, returning base64 decoded string.
 */
export async function getWindowsClipboard(): Promise<string> {
  try {
    const psCommand = `powershell -NoProfile -NonInteractive -Command "$clip = Get-Clipboard -Raw; if ($clip) { [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($clip)) } else { '' }"`;
    const { stdout } = await execPromise(psCommand, { timeout: 3000 });
    const trimmed = stdout.trim();
    if (!trimmed) return '';
    return Buffer.from(trimmed, 'base64').toString('utf-8');
  } catch (err: any) {
    console.warn('[Clipboard] Failed to get clipboard:', err.message);
    return '';
  }
}
