#!/usr/bin/env node
/**
 * utils/dashboard-server.js
 * Serves dashboard.html + dashboard-data.js on http://localhost:4200
 * No npm deps — built-in http only.
 *
 * Usage:
 *   node utils/dashboard-server.js
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.DASHBOARD_PORT || 4200;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Default to dashboard.html
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/dashboard.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: stay within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${urlPath}`);
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n⚡ Dashboard server running`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log(`   Ctrl+C to stop`);
});
