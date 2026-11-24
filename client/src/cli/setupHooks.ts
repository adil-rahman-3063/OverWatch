import fs from 'fs';
import path from 'path';
import os from 'os';

const isRemove = process.argv.includes('--remove') || process.argv.includes('-r');

const HOOK_SCRIPT_PATH = path.resolve(__dirname, '../hooks/antigravityHook.js');
const CLAUDE_HOOK_PATH = path.resolve(__dirname, '../hooks/claudeHook.js');

async function setupAntigravityHooks() {
  const configDir = path.join(os.homedir(), '.gemini', 'config');
  const hooksPath = path.join(configDir, 'hooks.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let hooksConfig: Record<string, any> = {};
  if (fs.existsSync(hooksPath)) {
    try {
      const content = fs.readFileSync(hooksPath, 'utf-8');
      hooksConfig = JSON.parse(content);
      // Backup
      const backupPath = `${hooksPath}.bak.${Date.now()}`;
      fs.writeFileSync(backupPath, content);
      console.log(`[Backup] Saved existing hooks to ${backupPath}`);
    } catch {
      hooksConfig = {};
    }
  }

  if (isRemove) {
    if (hooksConfig['overwatch-gate']) {
      delete hooksConfig['overwatch-gate'];
      fs.writeFileSync(hooksPath, JSON.stringify(hooksConfig, null, 2), 'utf-8');
      console.log('[Antigravity] OverWatch hook removed successfully.');
    } else {
      console.log('[Antigravity] No OverWatch hook found to remove.');
    }
    return;
  }

  // Add OverWatch hook for run_command
  hooksConfig['overwatch-gate'] = {
    enabled: true,
    PreToolUse: [
      {
        matcher: "run_command",
        hooks: [
          {
            type: "command",
            command: `node "${HOOK_SCRIPT_PATH}"`,
            timeout: 50,
          },
        ],
      },
    ],
  };

  fs.writeFileSync(hooksPath, JSON.stringify(hooksConfig, null, 2), 'utf-8');
  console.log(`[Antigravity] OverWatch hook registered successfully in:\n  -> ${hooksPath}`);
}

async function setupClaudeHooks() {
  const claudeDir = path.join(os.homedir(), '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');

  if (!fs.existsSync(claudeDir)) {
    console.log('[Claude] Claude directory not found, skipping Claude hook setup.');
    return;
  }

  let settings: Record<string, any> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(content);
      const backupPath = `${settingsPath}.bak.${Date.now()}`;
      fs.writeFileSync(backupPath, content);
      console.log(`[Backup] Saved Claude settings to ${backupPath}`);
    } catch {
      settings = {};
    }
  }

  if (isRemove) {
    if (settings.hooks?.PermissionRequest) {
      delete settings.hooks.PermissionRequest;
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('[Claude] OverWatch hook removed from Claude settings.');
    }
    return;
  }

  settings.hooks = settings.hooks || {};
  settings.hooks.PermissionRequest = [
    {
      type: "command",
      command: `node "${CLAUDE_HOOK_PATH}"`,
      timeout: 50,
    },
  ];

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log(`[Claude] OverWatch hook registered in:\n  -> ${settingsPath}`);
}

async function main() {
  console.log(`\n--- OverWatch Hook Configuration (${isRemove ? 'UNINSTALL' : 'INSTALL'}) ---`);
  await setupAntigravityHooks();
  await setupClaudeHooks();
  console.log('--- Done ---\n');
}

main().catch(console.error);
