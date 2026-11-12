// Ponte · servidor HTTP: ficheiros estáticos e encaminhamento para as rotas da API.
// Cada área tem o seu ficheiro em lib/rotas/ (ver EQUIPA.md).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { PORT, PUBLIC, HttpError, fail, readBody, send, currentUser, routes } = require('./nucleo');

require('./rotas/conta');
require('./rotas/preparar');
require('./rotas/integrar');
require('./rotas/mudar');
require('./rotas/decidir');
require('./rotas/anfitriao');
require('./rotas/territorio');
require('./rotas/equipa-gestao');
require('./rotas/equipa-indicadores');

// ---------- ficheiros estáticos ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};
function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' || file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(file).pipe(res);
}

// ---------- servidor ----------
async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  try {
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      // Proteção CSRF simples: os pedidos de escrita têm de vir da própria app (JSON).
      if (req.method !== 'GET' && !String(req.headers['content-type'] || '').includes('application/json')) fail(415, 'Formato não suportado.');
      const body = req.method === 'GET' ? {} : await readBody(req);
      const user = currentUser(req);
      const out = await r.handler({ req, res, params, body, user, query: url.searchParams });
      if (!res.headersSent) send(res, 200, out ?? { ok: true });
      return;
    }
    fail(404, 'Não encontrado.');
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Ocorreu um erro. Tenta outra vez.' });
  }
}

module.exports = handler;
if (require.main === module) {
  http.createServer(handler).listen(PORT, () => console.log(`Ponte a correr em http://localhost:${PORT}`));
}
