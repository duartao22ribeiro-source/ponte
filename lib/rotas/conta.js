// Ponte · rotas: autenticação, conta, RGPD e visão geral do percurso.
// Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md)
const {
  db, q, q1, run, plain, fail, today, pick, insert, update, parseCookies, send, SESSION_DAYS, createSession, sessionCookie, publicUser, hostPublic, enrollmentOf, requireRole, planOf, followup, territoryContent, route, hashPassword, verifyPassword,
} = require('../nucleo');

// --- autenticação e conta
route('GET', '/api/editions/open', () => plain(q(`
  SELECT ed.id, ed.name, ed.start_date, ed.end_date, ed.slots, t.name territory_name, t.municipality,
         (SELECT COUNT(*) FROM enrollments e WHERE e.edition_id=ed.id) taken
  FROM editions ed JOIN territories t ON t.id=ed.territory_id
  WHERE ed.end_date >= date('now') ORDER BY ed.start_date`)));

route('POST', '/api/register', ({ body, res }) => {
  const b = body;
  if (!b.consent) fail(400, 'Precisamos do teu consentimento para tratar os teus dados.');
  if (!b.name || !b.email || !b.password) fail(400, 'Preenche o nome, o e-mail e a palavra-passe.');
  if (String(b.password).length < 8) fail(400, 'A palavra-passe deve ter pelo menos 8 caracteres.');
  const email = String(b.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'E-mail inválido.');
  if (q1('SELECT id FROM users WHERE email=?', email)) fail(409, 'Já existe uma conta com este e-mail.');
  const ed = plain(q1('SELECT * FROM editions WHERE id=?', Number(b.edition_id)));
  if (!ed) fail(400, 'Escolhe a edição em que te inscreveste.');
  const interest = Math.min(5, Math.max(1, Number(b.move_interest) || 3));
  db.exec('BEGIN');
  try {
    const id = insert('users', {
      email, password_hash: hashPassword(String(b.password)), role: 'participante', name: String(b.name).trim(),
      phone: b.phone || null, city: b.city || null, work_situation: b.work_situation || null,
      remote_days: Number(b.remote_days) || null, household: b.household || null, move_interest: interest,
      consent_at: new Date().toISOString(),
    });
    insert('enrollments', { user_id: id, edition_id: ed.id, phase: 'preparar', arrival: ed.start_date, departure: ed.end_date });
    db.exec('COMMIT');
    const token = createSession(id);
    send(res, 201, { ok: true }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  } catch (e) { db.exec('ROLLBACK'); throw e; }
});

route('POST', '/api/login', ({ body, res }) => {
  const u = q1('SELECT * FROM users WHERE email=? AND active=1', String(body.email || '').trim().toLowerCase());
  if (!u || !verifyPassword(String(body.password || ''), u.password_hash)) fail(401, 'E-mail ou palavra-passe errados.');
  const token = createSession(u.id);
  send(res, 200, { ok: true, role: u.role }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
});

route('POST', '/api/logout', ({ req, res }) => {
  const token = parseCookies(req).ponte_sessao;
  if (token) run('DELETE FROM sessions WHERE token=?', token);
  send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
});

route('GET', '/api/me', ({ user }) => {
  if (!user) return { user: null };
  const unread = q1('SELECT COUNT(*) n FROM messages WHERE to_id=? AND read_at IS NULL', user.id).n;
  const territory = user.territory_id ? plain(q1('SELECT * FROM territories WHERE id=?', user.territory_id)) : null;
  return { user: publicUser(user), unread, territory };
});

route('PUT', '/api/me', ({ user, body }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const fields = ['name', 'phone', 'city', 'photo', 'bio'];
  if (user.role === 'participante') fields.push('work_situation', 'remote_days', 'household', 'move_interest');
  const data = pick(body, fields);
  if ('name' in data && !data.name) fail(400, 'O nome não pode ficar vazio.');
  if ('move_interest' in data && data.move_interest != null) data.move_interest = Math.min(5, Math.max(1, Number(data.move_interest)));
  if (data.photo && String(data.photo).length > 600000) fail(413, 'Foto demasiado grande.');
  update('users', user.id, data);
  if (body.new_password) {
    if (!verifyPassword(String(body.current_password || ''), user.password_hash)) fail(400, 'A palavra-passe atual está errada.');
    if (String(body.new_password).length < 8) fail(400, 'A nova palavra-passe deve ter pelo menos 8 caracteres.');
    update('users', user.id, { password_hash: hashPassword(String(body.new_password)) });
  }
  return { ok: true };
});

// RGPD: exportar e apagar
route('GET', '/api/me/export', ({ user, res }) => {
  requireRole(user, 'participante', 'anfitriao', 'admin');
  const id = user.id;
  const data = {
    exportado_em: new Date().toISOString(),
    utilizador: publicUser(user),
    inscricao: enrollmentOf(id),
    plano_de_mudanca: planOf(id),
    diario: plain(q('SELECT * FROM diary_entries WHERE user_id=?', id)),
    inscricoes_atividades: plain(q('SELECT a.title, a.date, s.created_at FROM activity_signups s JOIN activities a ON a.id=s.activity_id WHERE s.user_id=?', id)),
    mensagens: plain(q('SELECT * FROM messages WHERE from_id=? OR to_id=? ORDER BY created_at', id, id)),
    videochamadas: plain(q('SELECT * FROM welcome_calls WHERE user_id=?', id)),
    visitas: plain(q('SELECT * FROM visits WHERE user_id=?', id)),
    registos_de_contacto: plain(q('SELECT date, type, summary FROM contact_logs WHERE participant_id=?', id)),
    pedidos_embaixadores: plain(q('SELECT * FROM ambassador_requests WHERE user_id=?', id)),
    decisao: plain(q1('SELECT * FROM decisions WHERE user_id=?', id)),
    testemunhos: plain(q('SELECT * FROM testimonials WHERE user_id=?', id)),
  };
  const body = JSON.stringify(data, null, 2);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="ponte-os-meus-dados-${today()}.json"`,
    'Cache-Control': 'no-store',
  });
  res.end(body);
});

route('DELETE', '/api/me', ({ user, body, res }) => {
  requireRole(user, 'participante');
  if (!verifyPassword(String(body.password || ''), user.password_hash)) fail(400, 'Palavra-passe errada.');
  run('DELETE FROM users WHERE id=?', user.id); // cascata apaga todos os dados associados
  send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
});

// --- participante: visão geral do percurso
route('GET', '/api/p/overview', ({ user }) => {
  requireRole(user, 'participante');
  const enr = enrollmentOf(user.id);
  if (!enr) return { enrollment: null };
  const host = plain(q1('SELECT * FROM users WHERE id=?', enr.host_id));
  const plan = ['mudar', 'decidir'].includes(enr.phase) ? planOf(user.id, true) : planOf(user.id);
  return {
    enrollment: enr,
    followup: followup(enr),
    territory: plain(q1('SELECT * FROM territories WHERE id=?', enr.territory_id)),
    host: hostPublic(host),
    ...territoryContent(enr.territory_id, user.id),
    testimonials: plain(q(`SELECT id, author_name, author_role, body, available_for_chat, created_at FROM testimonials WHERE status='aprovado' AND (territory_id=? OR territory_id IS NULL) ORDER BY id DESC`, enr.territory_id)),
    ambassador_requests: plain(q('SELECT * FROM ambassador_requests WHERE user_id=?', user.id)),
    welcome_calls: plain(q('SELECT * FROM welcome_calls WHERE user_id=? ORDER BY datetime DESC', user.id)),
    diary: plain(q('SELECT * FROM diary_entries WHERE user_id=? ORDER BY created_at DESC', user.id)),
    plan,
    visits: plain(q('SELECT * FROM visits WHERE user_id=? ORDER BY date DESC', user.id)),
    decision: plain(q1('SELECT * FROM decisions WHERE user_id=?', user.id)),
    my_testimonial: plain(q1('SELECT * FROM testimonials WHERE user_id=? ORDER BY id DESC', user.id)),
  };
});
