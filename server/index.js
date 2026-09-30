import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewPages } from './review.js';
const root = fileURLToPath(new URL('../', import.meta.url));
if (existsSync(resolve(root, '.env'))) process.loadEnvFile(resolve(root, '.env'));
const production = process.argv.includes('--production');
const vite = production ? null : await (await import('vite')).createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
let inFlight = false, lastRequest = 0;
const server = createServer(async (req, res) => {
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (req.url?.split('?')[0] === '/api/review') {
    if (req.method !== 'POST') return send(405, { error: 'Use POST.' });
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(403, { error: 'Cross-origin review is not allowed.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Send JSON.' });
    if (inFlight || Date.now() - lastRequest < 5000) return send(429, { error: 'Wait a few seconds before another review.' });
    inFlight = true; lastRequest = Date.now();
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 1_000_000) { send(413, { error: 'Review request is too large.' }); return; } chunks.push(chunk); }
      let data; try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { return send(400, { error: 'Invalid JSON.' }); }
      send(200, await reviewPages(data.pages, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL }));
    } catch (error) { send(400, { error: error.name === 'TimeoutError' ? 'Gemini review timed out. Try again.' : error.message }); }
    finally { inFlight = false; }
    return;
  }
  if (vite) return vite.middlewares(req, res);
  try {
    const dist = resolve(root, 'dist');
    const path = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(dist + sep) && path !== dist) { res.writeHead(403); return res.end(); }
    const asset = existsSync(path) && path !== dist ? path : resolve(dist, 'index.html');
    const type = { js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', html: 'text/html' }[asset.split('.').pop()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(readFileSync(asset));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log('Business MCP: http://127.0.0.1:' + (process.env.PORT || 5173)));
