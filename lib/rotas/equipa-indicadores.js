// Ponte · rotas: equipa: testemunhos, pedidos, indicadores e relatório.
// Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md)
const {
  q, plain, fail, daysBetween, pick, update, requireRole, kpisFor, enrollRowsSql, route,
} = require('../nucleo');

route('GET', '/api/e/testimonials', ({ user }) => {
  requireRole(user, 'admin');
  return {
    testimonials: plain(q(`SELECT tm.*, t.name territory_name FROM testimonials tm LEFT JOIN territories t ON t.id=tm.territory_id
                           ORDER BY CASE tm.status WHEN 'pendente' THEN 0 ELSE 1 END, tm.created_at DESC`)),
    requests: plain(q(`SELECT r.*, u.name requester, u.email requester_email, tm.author_name
                       FROM ambassador_requests r JOIN users u ON u.id=r.user_id JOIN testimonials tm ON tm.id=r.testimonial_id
                       ORDER BY CASE r.status WHEN 'pedido' THEN 0 ELSE 1 END, r.created_at DESC`)),
  };
});
route('PUT', '/api/e/testimonials/:id', ({ user, params, body }) => {
  requireRole(user, 'admin');
  const data = pick(body, ['status', 'body', 'author_role', 'available_for_chat']);
  if (data.status && !['pendente', 'aprovado', 'rejeitado'].includes(data.status)) fail(400, 'Estado inválido.');
  update('testimonials', Number(params.id), data);
  return { ok: true };
});
route('PUT', '/api/e/requests/:id', ({ user, params, body }) => {
  requireRole(user, 'admin');
  const data = pick(body, ['status']);
  if (!['pedido', 'marcado', 'concluido'].includes(data.status)) fail(400, 'Estado inválido.');
  update('ambassador_requests', Number(params.id), data);
  return { ok: true };
});

route('GET', '/api/e/kpis', ({ user }) => {
  requireRole(user, 'admin');
  const rows = enrollRowsSql();
  const editions = plain(q(`SELECT ed.*, t.name territory_name, t.municipality FROM editions ed JOIN territories t ON t.id=ed.territory_id ORDER BY ed.start_date DESC`));
  const territories = plain(q('SELECT * FROM territories ORDER BY name'));
  const sumCost = eds => eds.reduce((s, e) => s + (Number(e.cost) || 0), 0);
  return {
    total: kpisFor(rows, sumCost(editions)),
    by_territory: territories.map(t => ({
      id: t.id, name: t.name, municipality: t.municipality,
      ...kpisFor(rows.filter(r => r.territory_id === t.id), sumCost(editions.filter(e => e.territory_id === t.id))),
    })),
    by_edition: editions.map(e => ({
      id: e.id, name: e.name, territory_name: e.territory_name, start_date: e.start_date, end_date: e.end_date,
      ...kpisFor(rows.filter(r => r.edition_id === e.id), Number(e.cost) || 0),
    })),
    phases: ['preparar', 'integrar', 'mudar', 'decidir'].map(p => ({ phase: p, n: rows.filter(r => r.phase === p).length })),
  };
});

route('GET', '/api/e/report', ({ user, query }) => {
  requireRole(user, 'admin');
  const municipalities = plain(q('SELECT DISTINCT municipality FROM territories ORDER BY municipality')).map(r => r.municipality);
  const m = query.get('municipality') || municipalities[0];
  if (!m) return { municipalities, municipality: null };
  const rows = enrollRowsSql('WHERE t.municipality=?', m);
  const fixed = rows.filter(r => r.choice === 'mudei' && r.moved_at && r.departure && daysBetween(r.departure, r.moved_at) <= 365)
    .map(r => ({ name: r.name, edition_name: r.edition_name, territory_name: r.territory_name, departure: r.departure, moved_at: r.moved_at, locality: r.locality, days_after: daysBetween(r.departure, r.moved_at) }));
  const editions = plain(q(`SELECT ed.* FROM editions ed JOIN territories t ON t.id=ed.territory_id WHERE t.municipality=?`, m));
  return {
    municipalities, municipality: m, generated_at: new Date().toISOString(),
    kpis: kpisFor(rows, editions.reduce((s, e) => s + (Number(e.cost) || 0), 0)),
    editions: editions.map(e => ({ name: e.name, start_date: e.start_date, end_date: e.end_date })),
    fixed,
  };
});
