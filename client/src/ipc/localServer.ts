import http from 'http';
import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { supabaseService } from '../supabase.js';
import { mediaController } from '../media/windowsMedia.js';

export class LocalIpcServer {
  private server: http.Server | null = null;

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Enable local CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = req.url || '/';

        // 1. Health check
        if (req.method === 'GET' && url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', deviceId: config.deviceId }));
          return;
        }

        // 2. Local Media trigger
        if (req.method === 'POST' && url === '/media') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { action } = JSON.parse(body || '{}');
              if (action) {
                await mediaController.sendMediaCommand(action);
                const updated = await mediaController.getCurrentMedia();
                await supabaseService.publishMediaState(updated);
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. Hook permission request
        if (req.method === 'POST' && url === '/hook') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const requestId = randomUUID();

              const decision = await supabaseService.requestPermission({
                id: requestId,
                agent: payload.agent || 'antigravity',
                tool: payload.tool || 'unknown_tool',
                command: payload.command || payload.rawArgs || '',
                cwd: payload.cwd || process.cwd(),
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ decision, requestId }));
            } catch (err: any) {
              console.error('[LocalServer] Error processing hook request:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ decision: config.fallbackDecision, error: err.message }));
            }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      });

      this.server.listen(config.localIpcPort, '127.0.0.1', () => {
        console.log(`[LocalServer] Listening for agent hooks on http://127.0.0.1:${config.localIpcPort}`);
        resolve();
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

export const localServer = new LocalIpcServer();
