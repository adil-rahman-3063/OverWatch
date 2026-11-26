#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Antigravity PreToolUse Hook
 * Invoked by Antigravity whenever a tool (e.g. run_command) is called.
 * Receives JSON on stdin, queries the OverWatch daemon, and returns JSON decision on stdout.
 */

interface HookInput {
  toolCall?: {
    id?: string;
    name?: string;
    args?: Record<string, any>;
  };
  cwd?: string;
  conversationId?: string;
  hookEventName?: string;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  // 0. Transparent pass-through if OverWatch gate is uninstalled or disabled in hooks.json
  try {
    const configHooksPath = path.join(os.homedir(), '.gemini', 'config', 'hooks.json');
    const disabledFlag = path.join(__dirname, '..', '..', '.disabled');
    if (fs.existsSync(disabledFlag)) {
      process.exit(0);
    }
    if (fs.existsSync(configHooksPath)) {
      const config = JSON.parse(fs.readFileSync(configHooksPath, 'utf8'));
      if (!config['overwatch-gate'] || config['overwatch-gate'].enabled === false) {
        process.exit(0);
      }
    }
  } catch {}

  let hookInput: HookInput = {};

  try {
    const raw = await readStdin();
    if (raw && raw.trim().length > 0) {
      hookInput = JSON.parse(raw);
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason: 'Failed to parse hook stdin' }));
    process.exit(0);
  }

  const toolName = hookInput.toolCall?.name || 'unknown';
  const args = hookInput.toolCall?.args || {};
  const command = (args.CommandLine || args.command || JSON.stringify(args) || '').trim();
  const cwd = hookInput.cwd || process.cwd();

  const IPC_PORT = process.env.LOCAL_IPC_PORT || '49152';
  const url = `http://127.0.0.1:${IPC_PORT}/hook`;

  try {
    const controller = new AbortController();
    // Allow up to 48 seconds for mobile response before timing out
    const timeout = setTimeout(() => controller.abort(), 48000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'antigravity',
        tool: toolName,
        command: command,
        cwd: cwd,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const result: any = await response.json();
      const decision = result.decision;

      // Fail-closed security: ONLY execute if phone explicitly approved 'allow'
      if (decision === 'allow') {
        const payload: Record<string, any> = {
          decision: 'allow',
          reason: 'OverWatch mobile confirmed and approved command execution.',
        };
        if (command) {
          const firstWord = command.split(/\s+/)[0];
          payload.permissionOverrides = [`command(${firstWord})`];
        }
        process.stdout.write(JSON.stringify(payload));
        process.exit(0);
      } else {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `OverWatch mobile rejected command (decision: ${decision || 'denied'}).`,
          })
        );
        process.exit(0);
      }
    } else {
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: 'OverWatch daemon returned non-200. Fail-closed: command blocked.',
        })
      );
      process.exit(0);
    }
  } catch (err: any) {
    // If mobile times out, disconnected, or daemon offline -> STRICT FAIL-CLOSED (DENY)
    process.stdout.write(
      JSON.stringify({
        decision: 'deny',
        reason: 'OverWatch mobile approval not granted (timed out or offline). Command blocked.',
      })
    );
    process.exit(0);
  }
}

main();
