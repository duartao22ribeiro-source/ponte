// Ponte · rotas: painel do anfitrião: participantes, notas, contactos, chamadas, visitas.
// Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md)
const {
  q, q1, run, plain, fail, pick, insert, update, requireRole, assertParticipantAccess, planOf, participantSummary, route,
} = require('../nucleo');

// --- anfitrião
function hostParticipants(user) {
  const rows = user.role === 'admin'
    ? plain(q(`SELECT u.* FROM users u JOIN enrollments e ON e.user_id=u.id WHERE u.role='participante'`))
    : plain(q(`SELECT u.* FROM users u JOIN enrollments e ON e.user_id=u.id JOIN editions ed ON ed.id=e.edition_id
               WHERE u.role='participante' AND ed.territory_id=?`, user.territory_id || -1));
  return rows.map(r => participantSummary(user.role === 'anfitriao' ? user.id : null, r));
}
route('GET', '/api/h/participants', ({ user }) => {
  requireRole(user, 'anfitriao', 'admin');
  const order = { preparar: 0, integrar: 1, mudar: 2, decidir: 3 };
  const list = hostParticipants(user).sort((a, b) => (b.alert - a.alert) || (order[a.enrollment?.phase] - order[b.enrollment?.phase]));
  const upcoming = plain(q(`
    SELECT c.*, u.name FROM welcome_calls c JOIN users u ON u.id=c.user_id
    WHERE c.status IN ('pedida','confirmada') AND c.host_id=? ORDER BY c.datetime`, user.id));
  const visits = plain(q(`
    SELECT v.*, u.name FROM visits v JOIN users u ON u.id=v.user_id JOIN enrollments e ON e.user_id=u.id JOIN editions ed ON ed.id=e.edition_id
    WHERE v.status IN ('pedida','confirmada') AND v.date>=date('now') AND ed.territory_id=? ORDER BY v.date`, user.territory_id || -1));
  return { participants: list, upcoming_calls: upcoming, upcoming_visits: visits };
});

route('GET', '/api/h/participants/:id', ({ user, params }) => {
  requireRole(user, 'anfitriao', 'admin');
  const pid = Number(params.id);
  assertParticipantAccess(user, pid);
  const row = plain(q1('SELECT * FROM users WHERE id=?', pid));
  return {
    ...participantSummary(user.role === 'anfitriao' ? user.id : null, row),
    remote_days: row.remote_days, bio: row.bio,
    plan: planOf(pid),
    note: plain(q1('SELECT body, updated_at FROM host_notes WHERE participant_id=?', pid)),
    contacts: plain(q('SELECT * FROM contact_logs WHERE participant_id=? ORDER BY date DESC, id DESC', pid)),
    calls: plain(q('SELECT * FROM welcome_calls WHERE user_id=? ORDER BY datetime DESC', pid)),
    visits: plain(q('SELECT * FROM visits WHERE user_id=? ORDER BY date DESC', pid)),
    activities: plain(q('SELECT a.title, a.date FROM activity_signups s JOIN activities a ON a.id=s.activity_id WHERE s.user_id=? ORDER BY a.date', pid)),
  };
});

route('PUT', '/api/h/participants/:id/enrollment', ({ user, params, body }) => {
  requireRole(user, 'anfitriao', 'admin');
  const pid = Number(params.id);
  assertParticipantAccess(user, pid);
  const data = pick(body, ['phase', 'arrival', 'departure', 'interest_end']);
  if (data.phase && !['preparar', 'integrar', 'mudar', 'decidir'].includes(data.phase)) fail(400, 'Fase inválida.');
  update('enrollments', pid, data, 'user_id');
  if (data.phase === 'mudar') planOf(pid, true);
  return { ok: true };
});

route('PUT', '/api/h/participants/:id/note', ({ user, params, body }) => {
  requireRole(user, 'anfitriao', 'admin');
  const pid = Number(params.id);
  assertParticipantAccess(user, pid);
  run(`INSERT INTO host_notes (participant_id,host_id,body,updated_at) VALUES (?,?,?,datetime('now'))
       ON CONFLICT(participant_id) DO UPDATE SET body=excluded.body, host_id=excluded.host_id, updated_at=excluded.updated_at`,
    pid, user.id, String(body.body || ''));
  return { ok: true };
});

route('POST', '/api/h/participants/:id/contacts', ({ user, params, body }) => {
  requireRole(user, 'anfitriao', 'admin');
  const pid = Number(params.id);
  assertParticipantAccess(user, pid);
  if (!body.date || !body.type) fail(400, 'Indica a data e o tipo de contacto.');
  insert('contact_logs', { host_id: user.id, participant_id: pid, date: body.date, type: body.type, summary: body.summary || null });
  return { ok: true };
});
route('DELETE', '/api/h/contacts/:id', ({ user, params }) => {
  requireRole(user, 'anfitriao', 'admin');
  const c = q1('SELECT * FROM contact_logs WHERE id=?', params.id);
  if (!c) fail(404, 'Registo não encontrado.');
  assertParticipantAccess(user, c.participant_id);
  run('DELETE FROM contact_logs WHERE id=?', c.id);
  return { ok: true };
});

route('PUT', '/api/h/calls/:id', ({ user, params, body }) => {
  requireRole(user, 'anfitriao', 'admin');
  const c = q1('SELECT * FROM welcome_calls WHERE id=?', params.id);
  if (!c) fail(404, 'Videochamada não encontrada.');
  assertParticipantAccess(user, c.user_id);
  const data = pick(body, ['status', 'link', 'datetime']);
  if (data.status && !['pedida', 'confirmada', 'realizada', 'cancelada'].includes(data.status)) fail(400, 'Estado inválido.');
  update('welcome_calls', c.id, data);
  return { ok: true };
});
route('PUT', '/api/h/visits/:id', ({ user, params, body }) => {
  requireRole(user, 'anfitriao', 'admin');
  const v = q1('SELECT * FROM visits WHERE id=?', params.id);
  if (!v) fail(404, 'Visita não encontrada.');
  assertParticipantAccess(user, v.user_id);
  const data = pick(body, ['status', 'date']);
  if (data.status && !['pedida', 'confirmada', 'realizada', 'cancelada'].includes(data.status)) fail(400, 'Estado inválido.');
  update('visits', v.id, data);
  return { ok: true };
});

route('GET', '/api/h/conversations', ({ user }) => {
  requireRole(user, 'anfitriao');
  return hostParticipants(user).map(p => {
    const last = plain(q1(`SELECT body, created_at, from_id FROM messages WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?) ORDER BY created_at DESC, id DESC LIMIT 1`, user.id, p.id, p.id, user.id));
    return { id: p.id, name: p.name, photo: p.photo, phase: p.enrollment?.phase, unread: p.unread, last };
  }).sort((a, b) => String(b.last?.created_at || '').localeCompare(String(a.last?.created_at || '')));
});
