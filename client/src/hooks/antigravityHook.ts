#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Antigravity PreToolUse Hook
 * Invoked by Antigravity whenever a tool (run_command, read_file, write_file, edit_file) is called.
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
  workspacePaths?: string[];
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

function isPathInside(targetPath: string, parentDir: string): boolean {
  try {
    const rel = path.relative(path.resolve(parentDir), path.resolve(targetPath));
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch {
    return false;
  }
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
  const cwd = hookInput.cwd || process.cwd();
  const workspaces = (hookInput.workspacePaths && hookInput.workspacePaths.length > 0)
    ? hookInput.workspacePaths
    : [cwd];

  // 1. Intelligent Filtering for Workspace File Operations
  // Routine edits, writes, and reads inside the project workspace execute with zero latency
  if (toolName === 'read_file' || toolName === 'write_file' || toolName === 'edit_file') {
    const targetPath = args.Path || args.path || args.file || '';
    if (targetPath) {
      const isInside = workspaces.some((ws) => isPathInside(targetPath, ws));
      if (isInside) {
        // Internal project operation: auto-allow immediately
        process.stdout.write(JSON.stringify({ decision: 'allow' }));
        process.exit(0);
      }
    }
  }

  // 2. Format request representation for mobile screen
  let displayCommand = '';
  if (toolName === 'run_command') {
    displayCommand = (args.CommandLine || args.command || '').trim();
  } else if (toolName === 'read_file') {
    displayCommand = `Read outside workspace: ${args.Path || args.path || args.file || ''}`;
  } else if (toolName === 'write_file') {
    displayCommand = `Write outside workspace: ${args.Path || args.path || args.file || ''}`;
  } else if (toolName === 'edit_file') {
    displayCommand = `Edit outside workspace: ${args.Path || args.path || args.file || ''}`;
  } else {
    displayCommand = (args.CommandLine || args.command || args.Path || JSON.stringify(args) || '').trim();
  }

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
        command: displayCommand,
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
          reason: 'OverWatch mobile confirmed and approved tool execution.',
        };
        if (toolName === 'run_command' && displayCommand) {
          const firstWord = displayCommand.split(/\s+/)[0];
          payload.permissionOverrides = [`command(${firstWord})`];
        }
        process.stdout.write(JSON.stringify(payload));
        process.exit(0);
      } else {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `OverWatch mobile rejected request (decision: ${decision || 'denied'}).`,
          })
        );
        process.exit(0);
      }
    } else {
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: 'OverWatch daemon returned non-200. Fail-closed: execution blocked.',
        })
      );
      process.exit(0);
    }
  } catch (err: any) {
    // If daemon is offline (not started), allow graceful transparent pass-through
    if (err?.cause?.code === 'ECONNREFUSED' || err?.message?.includes('fetch failed')) {
      process.exit(0);
    }

    // If mobile timed out while daemon was online -> STRICT FAIL-CLOSED (DENY)
    process.stdout.write(
      JSON.stringify({
        decision: 'deny',
        reason: 'OverWatch mobile approval not granted (timed out or disconnected). Blocked.',
      })
    );
    process.exit(0);
  }
}

main();
