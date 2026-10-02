const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATABASE_URL = process.env.DATABASE_URL || '';

let pool = null;
function getPool() {
  if (pool) return pool;
  if (!DATABASE_URL) return null;
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.indexOf('sslmode=require') !== -1 ? { rejectUnauthorized: false } : false,
    });
  } catch (error) {
    console.error('No se pudo cargar pg:', error.message);
    pool = null;
  }
  return pool;
}

async function initDb() {
  const db = getPool();
  if (!db) {
    console.warn('DATABASE_URL no configurada: la API trabajara sin persistencia.');
    return;
  }
  try {
    await db.query('CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    console.log('Tabla store lista.');
  } catch (error) {
    console.error('Error inicializando DB:', error.message);
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.sql': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  const db = getPool();
  if (!db) {
    sendJson(res, 503, { error: 'database not configured' });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/db') {
    try {
      const result = await db.query('SELECT key, value FROM store');
      const out = {};
      result.rows.forEach((row) => { out[row.key] = row.value; });
      sendJson(res, 200, out);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/store') {
    try {
      const payload = JSON.parse((await readBody(req)) || '{}');
      if (!payload.key) { sendJson(res, 400, { error: 'key required' }); return true; }
      await db.query(
        'INSERT INTO store (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
        [String(payload.key), String(payload.value == null ? '' : payload.value)]
      );
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return true;
  }

  const match = pathname.match(/^\/api\/store\/(.+)$/);
  if (match) {
    const key = decodeURIComponent(match[1]);
    if (req.method === 'PUT') {
      try {
        const payload = JSON.parse((await readBody(req)) || '{}');
        await db.query(
          'INSERT INTO store (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
          [key, String(payload.value == null ? '' : payload.value)]
        );
        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { error: error.message });
      }
      return true;
    }
    if (req.method === 'DELETE') {
      try {
        await db.query('DELETE FROM store WHERE key = $1', [key]);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { error: error.message });
      }
      return true;
    }
  }

  return false;
}

function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    if (pathname.indexOf('/api/') === 0) {
      const handled = await handleApi(req, res, pathname);
      if (!handled) sendJson(res, 404, { error: 'not found' });
      return;
    }
    serveStatic(res, pathname);
  } catch (error) {
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  }
});

initDb().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('NEO server en http://0.0.0.0:' + PORT);
    console.log('DATABASE_URL: ' + (DATABASE_URL ? 'configurada' : 'no configurada'));
  });
});

process.on('uncaughtException', (error) => console.error('Uncaught:', error.message));
process.on('unhandledRejection', (error) => console.error('Unhandled:', error));
