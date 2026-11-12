// Ponte · rotas: inscrições em atividades, diário, resposta de fim de estadia e mensagens.
// Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md)
const {
  q, q1, run, plain, fail, insert, enrollmentOf, requireRole, canMessage, route,
} = require('../nucleo');

route('POST', '/api/activities/:id/signup', ({ user, params }) => {
  requireRole(user, 'participante');
  const enr = enrollmentOf(user.id);
  const a = q1('SELECT * FROM activities WHERE id=?', params.id);
  if (!a || !enr || a.territory_id !== enr.territory_id) fail(404, 'Atividade não encontrada.');
  const taken = q1('SELECT COUNT(*) n FROM activity_signups WHERE activity_id=?', a.id).n;
  if (a.spots && taken >= a.spots) fail(409, 'Esta atividade já está cheia.');
  run('INSERT OR IGNORE INTO activity_signups (activity_id,user_id) VALUES (?,?)', a.id, user.id);
  return { ok: true };
});
route('DELETE', '/api/activities/:id/signup', ({ user, params }) => {
  requireRole(user, 'participante');
  run('DELETE FROM activity_signups WHERE activity_id=? AND user_id=?', params.id, user.id);
  return { ok: true };
});

route('POST', '/api/p/diary', ({ user, body }) => {
  requireRole(user, 'participante');
  if (!['gostei', 'preocupa'].includes(body.kind) || !String(body.body || '').trim()) fail(400, 'Escreve alguma coisa.');
  insert('diary_entries', { user_id: user.id, kind: body.kind, body: String(body.body).trim() });
  return { ok: true };
});
route('DELETE', '/api/p/diary/:id', ({ user, params }) => {
  requireRole(user, 'participante');
  run('DELETE FROM diary_entries WHERE id=? AND user_id=?', params.id, user.id);
  return { ok: true };
});

route('POST', '/api/p/interest-end', ({ user, body }) => {
  requireRole(user, 'participante');
  const v = Number(body.value);
  if (!(v >= 1 && v <= 5)) fail(400, 'Escolhe um valor de 1 a 5.');
  run('UPDATE enrollments SET interest_end=? WHERE user_id=?', v, user.id);
  return { ok: true };
});

// --- mensagens
route('GET', '/api/messages/:other', ({ user, params }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const other = Number(params.other);
  if (!canMessage(user, other)) fail(403, 'Não podes falar com esta pessoa.');
  run(`UPDATE messages SET read_at=datetime('now') WHERE from_id=? AND to_id=? AND read_at IS NULL`, other, user.id);
  const o = q1('SELECT id, name, photo, role FROM users WHERE id=?', other);
  return {
    other: plain(o),
    messages: plain(q(`SELECT id, from_id, to_id, body, created_at FROM messages WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?) ORDER BY created_at, id`, user.id, other, other, user.id)),
  };
});
route('POST', '/api/messages/:other', ({ user, params, body }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const other = Number(params.other);
  if (!canMessage(user, other)) fail(403, 'Não podes falar com esta pessoa.');
  const text = String(body.body || '').trim();
  if (!text) fail(400, 'Mensagem vazia.');
  if (text.length > 4000) fail(400, 'Mensagem demasiado longa.');
  insert('messages', { from_id: user.id, to_id: other, body: text });
  return { ok: true };
});
