// Ponte · rotas: registo da decisão e testemunho.
// Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md)
const {
  db, q1, run, fail, today, insert, update, enrollmentOf, requireRole, route,
} = require('../nucleo');

route('POST', '/api/p/decision', ({ user, body }) => {
  requireRole(user, 'participante');
  const choice = body.choice;
  if (!['mudei', 'visitas', 'embaixador'].includes(choice)) fail(400, 'Escolhe uma opção.');
  const ambassador = choice === 'embaixador' || !!body.ambassador ? 1 : 0;
  const data = {
    choice, ambassador,
    moved_at: choice === 'mudei' ? (body.moved_at || today()) : null,
    locality: choice === 'mudei' ? (body.locality || null) : null,
    notes: body.notes || null,
  };
  db.exec('BEGIN');
  try {
    if (q1('SELECT id FROM decisions WHERE user_id=?', user.id)) update('decisions', user.id, data, 'user_id');
    else insert('decisions', { user_id: user.id, ...data });
    run(`UPDATE enrollments SET phase='decidir' WHERE user_id=?`, user.id);
    const text = String(body.testimonial || '').trim();
    if (ambassador && text) {
      const enr = enrollmentOf(user.id);
      const existing = q1(`SELECT id FROM testimonials WHERE user_id=? AND status!='aprovado'`, user.id);
      const t = { author_name: user.name, author_role: body.author_role || null, territory_id: enr?.territory_id || null, body: text, status: 'pendente' };
      if (existing) update('testimonials', existing.id, t); else insert('testimonials', { user_id: user.id, ...t });
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return { ok: true };
});
