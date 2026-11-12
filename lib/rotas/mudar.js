// Ponte · rotas: visitas de regresso e plano de mudança.
// Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md)
const {
  q1, run, fail, pick, insert, update, requireRole, assertParticipantAccess, planOf, route,
} = require('../nucleo');

route('POST', '/api/p/visits', ({ user, body }) => {
  requireRole(user, 'participante');
  if (!body.date) fail(400, 'Escolhe a data.');
  insert('visits', { user_id: user.id, date: body.date, nights: Number(body.nights) || null, purpose: body.purpose || null });
  return { ok: true };
});
route('DELETE', '/api/p/visits/:id', ({ user, params }) => {
  requireRole(user, 'participante');
  run(`UPDATE visits SET status='cancelada' WHERE id=? AND user_id=? AND status IN ('pedida','confirmada')`, params.id, user.id);
  return { ok: true };
});

// --- plano de mudança (participante dono ou anfitrião do território)
function taskWithOwner(taskId) {
  return q1('SELECT t.*, p.user_id FROM tasks t JOIN move_plans p ON p.id=t.plan_id WHERE t.id=?', taskId);
}
route('POST', '/api/plan/:pid/tasks', ({ user, params, body }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const pid = Number(params.pid);
  assertParticipantAccess(user, pid);
  if (!['casa', 'apoios', 'escola', 'emprego'].includes(body.area) || !String(body.title || '').trim()) fail(400, 'Indica a área e a tarefa.');
  const plan = planOf(pid, true);
  const pos = (q1('SELECT MAX(position) m FROM tasks WHERE plan_id=? AND area=?', plan.id, body.area).m || 0) + 1;
  insert('tasks', { plan_id: plan.id, area: body.area, title: String(body.title).trim(), due_date: body.due_date || null, notes: body.notes || null, position: pos });
  return { ok: true };
});
route('POST', '/api/plan/:pid/create', ({ user, params }) => {
  requireRole(user, 'anfitriao', 'admin', 'participante');
  assertParticipantAccess(user, Number(params.pid));
  planOf(Number(params.pid), true);
  return { ok: true };
});
route('PUT', '/api/tasks/:id', ({ user, params, body }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const t = taskWithOwner(params.id);
  if (!t) fail(404, 'Tarefa não encontrada.');
  assertParticipantAccess(user, t.user_id);
  const data = pick(body, ['title', 'status', 'due_date', 'notes', 'area']);
  if (data.status && !['por_fazer', 'em_curso', 'feito'].includes(data.status)) fail(400, 'Estado inválido.');
  if (data.area && !['casa', 'apoios', 'escola', 'emprego'].includes(data.area)) fail(400, 'Área inválida.');
  update('tasks', t.id, data);
  return { ok: true };
});
route('DELETE', '/api/tasks/:id', ({ user, params }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const t = taskWithOwner(params.id);
  if (!t) fail(404, 'Tarefa não encontrada.');
  assertParticipantAccess(user, t.user_id);
  run('DELETE FROM tasks WHERE id=?', t.id);
  return { ok: true };
});
