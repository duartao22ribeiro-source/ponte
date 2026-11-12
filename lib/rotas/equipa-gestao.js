// Ponte · rotas: equipa: territórios, edições e anfitriões.
// Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md)
const {
  q, q1, run, plain, fail, pick, insert, update, requireRole, route, hashPassword,
} = require('../nucleo');

// --- equipa Rural Move
route('GET', '/api/e/territories', ({ user }) => {
  requireRole(user, 'admin');
  return plain(q(`SELECT t.*, (SELECT COUNT(*) FROM editions e WHERE e.territory_id=t.id) editions,
                  (SELECT GROUP_CONCAT(name, ', ') FROM users u WHERE u.territory_id=t.id AND u.role='anfitriao') hosts
                  FROM territories t ORDER BY name`));
});
const TERR_COLS = ['name', 'municipality', 'region', 'description', 'lat', 'lng'];
route('POST', '/api/e/territories', ({ user, body }) => {
  requireRole(user, 'admin');
  const data = pick(body, TERR_COLS);
  if (!data.name || !data.municipality) fail(400, 'Indica o nome e o município.');
  return { id: insert('territories', data) };
});
route('PUT', '/api/e/territories/:id', ({ user, params, body }) => {
  requireRole(user, 'admin');
  update('territories', Number(params.id), pick(body, TERR_COLS));
  return { ok: true };
});
route('DELETE', '/api/e/territories/:id', ({ user, params }) => {
  requireRole(user, 'admin');
  if (q1('SELECT id FROM editions WHERE territory_id=?', params.id)) fail(409, 'Este território tem edições. Apaga-as primeiro.');
  run('DELETE FROM territories WHERE id=?', params.id);
  return { ok: true };
});

route('GET', '/api/e/editions', ({ user }) => {
  requireRole(user, 'admin');
  return plain(q(`SELECT ed.*, t.name territory_name, t.municipality, h.name host_name,
                  (SELECT COUNT(*) FROM enrollments e WHERE e.edition_id=ed.id) enrolled
                  FROM editions ed JOIN territories t ON t.id=ed.territory_id LEFT JOIN users h ON h.id=ed.host_id
                  ORDER BY ed.start_date DESC`));
});
const ED_COLS = ['territory_id', 'name', 'start_date', 'end_date', 'slots', 'host_id', 'cost'];
route('POST', '/api/e/editions', ({ user, body }) => {
  requireRole(user, 'admin');
  const data = pick(body, ED_COLS);
  if (!data.territory_id || !data.name || !data.start_date || !data.end_date) fail(400, 'Preenche o território, o nome e as datas.');
  return { id: insert('editions', data) };
});
route('PUT', '/api/e/editions/:id', ({ user, params, body }) => {
  requireRole(user, 'admin');
  update('editions', Number(params.id), pick(body, ED_COLS));
  return { ok: true };
});
route('DELETE', '/api/e/editions/:id', ({ user, params }) => {
  requireRole(user, 'admin');
  if (q1('SELECT id FROM enrollments WHERE edition_id=?', params.id)) fail(409, 'Esta edição tem participantes inscritos.');
  run('DELETE FROM editions WHERE id=?', params.id);
  return { ok: true };
});
route('GET', '/api/e/editions/:id/participants', ({ user, params }) => {
  requireRole(user, 'admin');
  return plain(q(`SELECT u.id, u.name, u.email, u.city, e.phase, e.arrival, e.departure, e.interest_end, u.move_interest, d.choice
                  FROM enrollments e JOIN users u ON u.id=e.user_id LEFT JOIN decisions d ON d.user_id=u.id
                  WHERE e.edition_id=? ORDER BY u.name`, params.id));
});

route('GET', '/api/e/hosts', ({ user }) => {
  requireRole(user, 'admin');
  return plain(q(`SELECT u.id, u.name, u.email, u.phone, u.city, u.bio, u.photo, u.territory_id, u.active, t.name territory_name
                  FROM users u LEFT JOIN territories t ON t.id=u.territory_id WHERE u.role='anfitriao' ORDER BY u.name`));
});
route('POST', '/api/e/hosts', ({ user, body }) => {
  requireRole(user, 'admin');
  const email = String(body.email || '').trim().toLowerCase();
  if (!body.name || !email || !body.password) fail(400, 'Preenche o nome, o e-mail e a palavra-passe inicial.');
  if (String(body.password).length < 8) fail(400, 'A palavra-passe deve ter pelo menos 8 caracteres.');
  if (q1('SELECT id FROM users WHERE email=?', email)) fail(409, 'Já existe uma conta com este e-mail.');
  return {
    id: insert('users', {
      email, password_hash: hashPassword(String(body.password)), role: 'anfitriao', name: body.name,
      phone: body.phone || null, city: body.city || null, bio: body.bio || null,
      territory_id: Number(body.territory_id) || null, consent_at: new Date().toISOString(),
    }),
  };
});
route('PUT', '/api/e/hosts/:id', ({ user, params, body }) => {
  requireRole(user, 'admin');
  const h = q1(`SELECT id FROM users WHERE id=? AND role='anfitriao'`, params.id);
  if (!h) fail(404, 'Anfitrião não encontrado.');
  const data = pick(body, ['name', 'phone', 'city', 'bio', 'territory_id', 'active']);
  if (body.email) data.email = String(body.email).trim().toLowerCase();
  if (body.password) {
    if (String(body.password).length < 8) fail(400, 'A palavra-passe deve ter pelo menos 8 caracteres.');
    data.password_hash = hashPassword(String(body.password));
  }
  update('users', h.id, data);
  if (data.active === 0 || data.active === false) run('DELETE FROM sessions WHERE user_id=?', h.id);
  return { ok: true };
});
