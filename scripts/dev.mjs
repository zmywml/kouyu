import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, relative, isAbsolute } from 'node:path';
import './build.mjs';

const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };
const root = normalize(join(process.cwd(), 'dist'));
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = resolve(root, '.' + urlPath);
    const relativePath = relative(root, file);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) throw new Error('Invalid path');
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { if (extname(file)) throw new Error('Missing asset'); file = join(root, 'index.html'); }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(5173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:5173'));
