// Ponte · núcleo do servidor: base de dados, sessão, permissões, cálculos e registo de rotas.
// Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md). Mexer aqui afeta todos: combina antes no grupo.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { open, hashPassword, verifyPassword } = require('./db');

const PORT = Number(process.env.PORT) || 8095;
const PUBLIC = path.join(__dirname, '..', 'public');
const db = open();

// ---------- utilitários ----------
const q = (sql, ...p) => db.prepare(sql).all(...p);
const q1 = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);
const plain = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, msg) => { throw new HttpError(status, msg); };

function today() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}
function addMonths(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k] === '' ? null : obj[k];
  return out;
}
function insert(table, data) {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
  return Number(run(sql, ...keys.map(k => data[k])).lastInsertRowid);
}
function update(table, id, data, idCol = 'id') {
  const keys = Object.keys(data);
  if (!keys.length) return;
  run(`UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE ${idCol}=?`, ...keys.map(k => data[k]), id);
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 4 * 1024 * 1024) { reject(new HttpError(413, 'Pedido demasiado grande.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

// ---------- sessão ----------
const SESSION_DAYS = 30;
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  run(`INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now',?))`, token, userId, `+${SESSION_DAYS} days`);
  return token;
}
function sessionCookie(token, maxAge) {
  return `ponte_sessao=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${process.env.VERCEL ? "; Secure" : ""}`;
}
function currentUser(req) {
  const token = parseCookies(req).ponte_sessao;
  if (!token) return null;
  const u = q1(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>datetime('now') AND u.active=1`, token);
  return u ? plain(u) : null;
}
function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}
function hostPublic(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, photo: u.photo, bio: u.bio, city: u.city, phone: u.phone, email: u.email };
}

// ---------- contexto / permissões ----------
function enrollmentOf(userId) {
  return plain(q1(`
    SELECT e.*, ed.name edition_name, ed.start_date, ed.end_date, ed.host_id, ed.territory_id,
           t.name territory_name, t.municipality
    FROM enrollments e JOIN editions ed ON ed.id=e.edition_id JOIN territories t ON t.id=ed.territory_id
    WHERE e.user_id=?`, userId));
}

function requireRole(user, ...roles) {
  if (!user) fail(401, 'Precisas de iniciar sessão.');
  if (!roles.includes(user.role)) fail(403, 'Não tens permissão para isto.');
}

// Um anfitrião só vê participantes do seu território
function canSeeParticipant(user, participantId) {
  if (user.role === 'admin') return true;
  if (user.role === 'participante') return user.id === Number(participantId);
  if (user.role === 'anfitriao') {
    const enr = enrollmentOf(participantId);
    return !!(enr && user.territory_id && enr.territory_id === user.territory_id);
  }
  return false;
}
function assertParticipantAccess(user, pid) {
  const p = q1(`SELECT id FROM users WHERE id=? AND role='participante'`, pid);
  if (!p || !canSeeParticipant(user, pid)) fail(404, 'Participante não encontrado.');
}

// Território sobre o qual o utilizador pode editar conteúdos
function editableTerritory(user, requested) {
  if (user.role === 'anfitriao') {
    if (!user.territory_id) fail(403, 'Não tens território atribuído.');
    return user.territory_id;
  }
  if (user.role === 'admin') {
    const t = Number(requested);
    if (!t || !q1('SELECT id FROM territories WHERE id=?', t)) fail(400, 'Indica o território.');
    return t;
  }
  fail(403, 'Não tens permissão para isto.');
}

// O par pode trocar mensagens?
function canMessage(user, otherId) {
  const other = q1('SELECT id, role, territory_id FROM users WHERE id=? AND active=1', otherId);
  if (!other || other.id === user.id) return false;
  if (user.role === 'admin' || other.role === 'admin') return true;
  if (user.role === 'participante') {
    const enr = enrollmentOf(user.id);
    return !!enr && enr.host_id === other.id;
  }
  if (user.role === 'anfitriao') return other.role === 'participante' && canSeeParticipant(user, other.id);
  return false;
}

// ---------- cálculo de estado ----------
function planOf(userId, create = false) {
  let plan = q1('SELECT * FROM move_plans WHERE user_id=?', userId);
  if (!plan && create) {
    const id = insert('move_plans', { user_id: userId });
    const template = [
      ['casa', 'Definir o tipo de casa e o orçamento'],
      ['casa', 'Visitar casas disponíveis com o anfitrião'],
      ['apoios', 'Reunir com o gabinete de novos residentes da câmara'],
      ['apoios', 'Preparar a candidatura aos apoios à fixação'],
      ['escola', 'Visitar a escola ou o jardim de infância'],
      ['emprego', 'Mapear oportunidades de emprego para a família'],
    ];
    template.forEach(([area, title], i) => insert('tasks', { plan_id: id, area, title, position: i + 1 }));
    plan = q1('SELECT * FROM move_plans WHERE id=?', id);
  }
  if (!plan) return null;
  const tasks = plain(q('SELECT * FROM tasks WHERE plan_id=? ORDER BY area, position, id', plan.id));
  const done = tasks.filter(t => t.status === 'feito').length;
  return { ...plain(plan), tasks, progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0, done, total: tasks.length };
}

function followup(enr) {
  if (!enr || !enr.departure) return null;
  const end = addMonths(enr.departure, 6);
  const daysLeft = daysBetween(today(), end);
  const daysSince = daysBetween(enr.departure, today());
  return {
    end,
    month: Math.min(6, Math.max(0, Math.ceil(daysSince / 30.44))),
    months_left: Math.max(0, Math.ceil(daysLeft / 30.44)),
    days_left: Math.max(0, daysLeft),
  };
}

function lastContact(hostId, pid) {
  const log = q1('SELECT MAX(date) d FROM contact_logs WHERE participant_id=?', pid).d;
  const msg = q1(`SELECT MAX(substr(created_at,1,10)) d FROM messages WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)`, hostId, pid, pid, hostId).d;
  const call = q1(`SELECT MAX(substr(datetime,1,10)) d FROM welcome_calls WHERE user_id=? AND status='realizada'`, pid).d;
  return [log, msg, call].filter(Boolean).sort().pop() || null;
}

function participantSummary(hostId, row) {
  const plan = planOf(row.id);
  const enr = enrollmentOf(row.id);
  const last = lastContact(hostId || enr?.host_id, row.id);
  const decision = plain(q1('SELECT * FROM decisions WHERE user_id=?', row.id));
  const days = last ? daysBetween(last, today()) : null;
  return {
    id: row.id, name: row.name, photo: row.photo, city: row.city, email: row.email, phone: row.phone,
    work_situation: row.work_situation, move_interest: row.move_interest, household: row.household,
    enrollment: enr, followup: enr?.phase === 'mudar' ? followup(enr) : null,
    plan_progress: plan ? plan.progress : null, plan_done: plan?.done ?? 0, plan_total: plan?.total ?? 0,
    last_contact: last, days_since_contact: days,
    alert: !decision && (days === null || days > 14),
    decision,
    unread: q1('SELECT COUNT(*) n FROM messages WHERE from_id=? AND to_id=? AND read_at IS NULL', row.id, hostId || 0).n,
    pending_calls: q1(`SELECT COUNT(*) n FROM welcome_calls WHERE user_id=? AND status='pedida'`, row.id).n,
    pending_visits: q1(`SELECT COUNT(*) n FROM visits WHERE user_id=? AND status='pedida'`, row.id).n,
  };
}

function territoryContent(territoryId, userId) {
  return {
    destination: plain(q1('SELECT * FROM destination_sheets WHERE territory_id=?', territoryId)),
    activities: plain(q(`
      SELECT a.*, (SELECT COUNT(*) FROM activity_signups s WHERE s.activity_id=a.id) signups,
             EXISTS(SELECT 1 FROM activity_signups s WHERE s.activity_id=a.id AND s.user_id=?) signed
      FROM activities a WHERE territory_id=? ORDER BY date, time`, userId || 0, territoryId)),
    guide: plain(q('SELECT * FROM guide_items WHERE territory_id=? ORDER BY category, name', territoryId)),
    houses: plain(q('SELECT * FROM houses WHERE territory_id=? ORDER BY created_at DESC, id DESC', territoryId)),
    supports: plain(q('SELECT * FROM municipal_supports WHERE territory_id=? ORDER BY id', territoryId)),
  };
}

// ---------- indicadores ----------
function kpisFor(enrollRows, costTotal) {
  const n = enrollRows.length;
  const answered = enrollRows.filter(r => r.interest_end != null);
  const pondera = answered.filter(r => r.interest_end >= 4).length;
  const fixed = enrollRows.filter(r => r.choice === 'mudei' && r.moved_at && r.departure && daysBetween(r.departure, r.moved_at) <= 365).length;
  return {
    participants: n,
    answered: answered.length,
    pondera,
    pondera_pct: answered.length ? Math.round((pondera / answered.length) * 100) : null,
    fixed,
    cost: costTotal || null,
    cost_per_fixed: costTotal && fixed ? Math.round(costTotal / fixed) : null,
  };
}
function enrollRowsSql(where = '', ...p) {
  return plain(q(`
    SELECT e.*, ed.territory_id, ed.cost, ed.name edition_name, t.municipality, t.name territory_name,
           u.name, d.choice, d.moved_at, d.locality
    FROM enrollments e JOIN editions ed ON ed.id=e.edition_id JOIN territories t ON t.id=ed.territory_id
    JOIN users u ON u.id=e.user_id LEFT JOIN decisions d ON d.user_id=e.user_id ${where}`, ...p));
}

// ---------- rotas ----------
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler });
};

module.exports = {
  http,
  fs,
  path,
  crypto,
  PORT,
  PUBLIC,
  db,
  q,
  q1,
  run,
  plain,
  HttpError,
  fail,
  today,
  daysBetween,
  addMonths,
  pick,
  insert,
  update,
  parseCookies,
  readBody,
  send,
  SESSION_DAYS,
  createSession,
  sessionCookie,
  currentUser,
  publicUser,
  hostPublic,
  enrollmentOf,
  requireRole,
  canSeeParticipant,
  assertParticipantAccess,
  editableTerritory,
  canMessage,
  planOf,
  followup,
  lastContact,
  participantSummary,
  territoryContent,
  kpisFor,
  enrollRowsSql,
  routes,
  route,
  open,
  hashPassword,
  verifyPassword,
};
