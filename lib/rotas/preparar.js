// Ponte · rotas: videochamada de boas-vindas e pedidos a embaixadores.
// Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md)
const {
  q1, run, fail, insert, enrollmentOf, requireRole, route,
} = require('../nucleo');

route('POST', '/api/p/welcome-call', ({ user, body }) => {
  requireRole(user, 'participante');
  const enr = enrollmentOf(user.id);
  if (!body.datetime) fail(400, 'Escolhe o dia e a hora.');
  if (q1(`SELECT id FROM welcome_calls WHERE user_id=? AND status IN ('pedida','confirmada')`, user.id)) fail(409, 'Já tens uma videochamada marcada.');
  insert('welcome_calls', { user_id: user.id, host_id: enr?.host_id || null, datetime: String(body.datetime), note: body.note || null });
  return { ok: true };
});
route('DELETE', '/api/p/welcome-call/:id', ({ user, params }) => {
  requireRole(user, 'participante');
  run(`UPDATE welcome_calls SET status='cancelada' WHERE id=? AND user_id=?`, params.id, user.id);
  return { ok: true };
});

route('POST', '/api/p/ambassador-request', ({ user, body }) => {
  requireRole(user, 'participante');
  const t = q1(`SELECT id FROM testimonials WHERE id=? AND status='aprovado' AND available_for_chat=1`, Number(body.testimonial_id));
  if (!t) fail(404, 'Embaixador não encontrado.');
  if (q1(`SELECT id FROM ambassador_requests WHERE user_id=? AND testimonial_id=?`, user.id, t.id)) fail(409, 'Já pediste uma conversa a esta pessoa.');
  insert('ambassador_requests', { user_id: user.id, testimonial_id: t.id, message: body.message || null });
  return { ok: true };
});
