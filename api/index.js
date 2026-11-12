// Ponto de entrada na Vercel: todos os pedidos /api/* passam por aqui.
let handler, erro;
try { handler = require('../lib/ponte'); } catch (e) { erro = e; console.error(e); }

module.exports = (req, res) => {
  if (handler) return handler(req, res);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Erro ao arrancar: ' + (erro && erro.stack) + '\nNode ' + process.version);
};
