import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_FILE = 'Quantif-Plancher-V7.html';
const defaultRoot = fileURLToPath(new URL('../', import.meta.url));

// Local test server only: never expose the repository or a directory listing.
export function createAppServer(root = defaultRoot) {
  const appPath = resolve(root, APP_FILE);
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      return send(405, 'Method not allowed');
    }
    const pathname = (request.url || '/').split('?')[0];
    if (pathname !== '/' && pathname !== `/${APP_FILE}`) {
      return send(404, 'Not found');
    }
    try {
      const html = await readFile(appPath);
      send(200, html, 'text/html; charset=utf-8');
    } catch {
      send(503, 'Application file unavailable');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer between 1 and 65535.');
    process.exitCode = 1;
  } else {
    const server = createAppServer();
    server.on('error', error => {
      console.error(`Test server failed: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Test application: http://127.0.0.1:${port}/${APP_FILE}`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => {
        server.close(() => { process.exitCode = 0; });
        server.closeAllConnections();
      });
    }
  }
}
