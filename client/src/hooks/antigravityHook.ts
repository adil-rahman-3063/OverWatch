#!/usr/bin/env node

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
  let hookInput: HookInput = {};

  try {
    const raw = await readStdin();
    if (raw && raw.trim().length > 0) {
      hookInput = JSON.parse(raw);
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: 'ask', reason: 'Failed to parse hook stdin' }));
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
    // Allow up to 48 seconds for mobile response before falling back to local ask
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
      const decision = result.decision || 'ask';

      const payload: Record<string, any> = {
        decision: decision === 'allow' ? 'allow' : decision === 'deny' ? 'deny' : 'ask',
        reason: `OverWatch mobile remote decision: ${decision}`,
      };

      if (decision === 'allow' && command) {
        const firstWord = command.split(/\s+/)[0];
        payload.permissionOverrides = [`command(${firstWord})`];
      }

      process.stdout.write(JSON.stringify(payload));
      process.exit(0);
    } else {
      process.stdout.write(JSON.stringify({ decision: 'ask', reason: 'Daemon returned non-200' }));
      process.exit(0);
    }
  } catch (err: any) {
    process.stdout.write(
      JSON.stringify({
        decision: 'ask',
        reason: 'OverWatch mobile confirmation timed out or offline; falling back to local prompt.',
      })
    );
    process.exit(0);
  }
}

main();
