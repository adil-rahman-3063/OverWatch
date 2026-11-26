import http from 'http';
import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { supabaseService } from '../supabase.js';
import { mediaController } from '../media/windowsMedia.js';
import { agentSessionMonitor } from '../session/agentSession.js';
import {
  getPrimaryLanIp,
  saveImageAndSetClipboard,
  getWindowsClipboardImage,
  capturePrimaryScreen,
} from '../system/imageClipboard.js';

export class LocalIpcServer {
  private server: http.Server | null = null;

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Enable local & LAN CORS for mobile access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = req.url?.split('?')[0] || '/';

        // 1. Health check & LAN IP discovery
        if (req.method === 'GET' && url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', deviceId: config.deviceId, lanIp: getPrimaryLanIp() }));
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

              agentSessionMonitor.recordHookStart({
                tool: payload.tool || 'unknown_tool',
                command: payload.command || payload.rawArgs || '',
                cwd: payload.cwd || process.cwd(),
                conversationId: payload.conversationId,
              });

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

        // 4. Wi-Fi Direct Image Upload (Mobile -> Windows Clipboard & Disk)
        if (req.method === 'POST' && url === '/image/upload') {
          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          req.on('end', async () => {
            try {
              const rawBuffer = Buffer.concat(chunks);
              let imageBuffer: Buffer;

              // Check if body is JSON with base64 or raw image binary
              const contentType = req.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                const parsed = JSON.parse(rawBuffer.toString('utf-8') || '{}');
                let b64 = parsed.imageBase64 || parsed.image || '';
                if (b64.includes('base64,')) {
                  b64 = b64.split('base64,')[1];
                }
                imageBuffer = Buffer.from(b64, 'base64');
              } else {
                imageBuffer = rawBuffer;
              }

              if (!imageBuffer || imageBuffer.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No image data provided' }));
                return;
              }

              const result = await saveImageAndSetClipboard(imageBuffer);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: result.success,
                filePath: result.filePath,
                bytes: imageBuffer.length,
                message: 'Image beamed to Windows Clipboard and saved to Pictures/OverWatch',
              }));
            } catch (err: any) {
              console.error('[LocalServer] Image upload failed:', err.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 5. Wi-Fi Direct Clipboard Image Fetch (Windows Clipboard -> Mobile)
        if (req.method === 'GET' && url === '/image/clipboard') {
          try {
            const clipResult = await getWindowsClipboardImage();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(clipResult));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 6. Wi-Fi Direct Screen Capture (PC Screen -> Mobile)
        if (req.method === 'GET' && url === '/image/screenshot') {
          try {
            const screenResult = await capturePrimaryScreen();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(screenResult));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[LocalServer] Port ${config.localIpcPort} is already in use by an active OverWatch instance.`);
          console.warn(`[LocalServer] Continuing in companion mode (sharing existing hook gateway).`);
          resolve();
        } else {
          console.error('[LocalServer] Server error:', err.message);
          resolve();
        }
      });

      // Bind to 0.0.0.0 to allow incoming Wi-Fi direct requests from phones on the local LAN
      this.server.listen(config.localIpcPort, '0.0.0.0', () => {
        const lanIp = getPrimaryLanIp();
        console.log(`[LocalServer] Listening on http://0.0.0.0:${config.localIpcPort} (LAN IP: http://${lanIp}:${config.localIpcPort})`);
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
