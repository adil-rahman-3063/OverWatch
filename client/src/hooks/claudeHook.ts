#!/usr/bin/env node

/**
 * Claude Code Permission Hook
 * Receives tool permission requests from Claude Code on stdin,
 * forwards them to OverWatch, and returns the decision.
 */

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  let hookInput: any = {};

  try {
    const raw = await readStdin();
    if (raw && raw.trim().length > 0) {
      hookInput = JSON.parse(raw);
    }
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'ask' }));
    process.exit(0);
  }

  const IPC_PORT = process.env.LOCAL_IPC_PORT || '49152';
  const url = `http://127.0.0.1:${IPC_PORT}/hook`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 48000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'claude',
        tool: hookInput.tool || 'command',
        command: hookInput.command || hookInput.input || JSON.stringify(hookInput),
        cwd: hookInput.cwd || process.cwd(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const result: any = await response.json();
      process.stdout.write(JSON.stringify({ decision: result.decision || 'ask' }));
      process.exit(0);
    } else {
      process.stdout.write(JSON.stringify({ decision: 'ask' }));
      process.exit(0);
    }
  } catch {
    // Daemon offline -> fallback to terminal prompt
    process.stdout.write(JSON.stringify({ decision: 'ask' }));
    process.exit(0);
  }
}

main();
