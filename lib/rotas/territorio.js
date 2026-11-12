// Ponte · rotas: conteúdos do território (agenda, guia, casas, apoios, ficha do destino).
// Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md)
const {
  q1, run, plain, fail, pick, insert, update, requireRole, editableTerritory, territoryContent, route,
} = require('../nucleo');

// --- conteúdos do território (anfitrião do território ou equipa)
const CONTENT = {
  activities: { table: 'activities', cols: ['title', 'description', 'date', 'time', 'location', 'spots'], required: ['title', 'date'] },
  guide: { table: 'guide_items', cols: ['category', 'name', 'description', 'contact_person', 'phone', 'address', 'lat', 'lng'], required: ['category', 'name'] },
  houses: { table: 'houses', cols: ['title', 'kind', 'price', 'location', 'bedrooms', 'description', 'photo', 'contact'], required: ['title', 'kind'] },
  supports: { table: 'municipal_supports', cols: ['title', 'description', 'url'], required: ['title'] },
};
route('GET', '/api/t/content', ({ user, query }) => {
  requireRole(user, 'anfitriao', 'admin');
  const tid = editableTerritory(user, query.get('territory'));
  return { territory: plain(q1('SELECT * FROM territories WHERE id=?', tid)), ...territoryContent(tid, 0) };
});
route('POST', '/api/t/:kind', ({ user, params, body, query }) => {
  requireRole(user, 'anfitriao', 'admin');
  const cfg = CONTENT[params.kind]; if (!cfg) fail(404, 'Não encontrado.');
  const tid = editableTerritory(user, query.get('territory'));
  const data = pick(body, cfg.cols);
  for (const r of cfg.required) if (!data[r]) fail(400, 'Preenche os campos obrigatórios.');
  if (data.photo && String(data.photo).length > 900000) fail(413, 'Foto demasiado grande.');
  return { id: insert(cfg.table, { territory_id: tid, ...data }) };
});
route('PUT', '/api/t/:kind/:id', ({ user, params, body, query }) => {
  requireRole(user, 'anfitriao', 'admin');
  const cfg = CONTENT[params.kind]; if (!cfg) fail(404, 'Não encontrado.');
  const tid = editableTerritory(user, query.get('territory'));
  const row = q1(`SELECT * FROM ${cfg.table} WHERE id=? AND territory_id=?`, params.id, tid);
  if (!row) fail(404, 'Não encontrado.');
  const data = pick(body, cfg.cols);
  for (const r of cfg.required) if (r in data && !data[r]) fail(400, 'Preenche os campos obrigatórios.');
  if (data.photo && String(data.photo).length > 900000) fail(413, 'Foto demasiado grande.');
  update(cfg.table, row.id, data);
  return { ok: true };
});
route('DELETE', '/api/t/:kind/:id', ({ user, params, query }) => {
  requireRole(user, 'anfitriao', 'admin');
  const cfg = CONTENT[params.kind]; if (!cfg) fail(404, 'Não encontrado.');
  const tid = editableTerritory(user, query.get('territory'));
  run(`DELETE FROM ${cfg.table} WHERE id=? AND territory_id=?`, params.id, tid);
  return { ok: true };
});
route('PUT', '/api/t/destination', ({ user, body, query }) => {
  requireRole(user, 'anfitriao', 'admin');
  const tid = editableTerritory(user, query.get('territory'));
  const cols = ['accommodation', 'meals', 'workspace', 'internet_mbps', 'internet_upload_mbps', 'internet_tested_at', 'quiet_space', 'quiet_space_notes', 'included', 'not_included'];
  const data = pick(body, cols);
  if ('quiet_space' in data) data.quiet_space = data.quiet_space ? 1 : 0;
  if (!q1('SELECT territory_id FROM destination_sheets WHERE territory_id=?', tid)) insert('destination_sheets', { territory_id: tid });
  update('destination_sheets', tid, data, 'territory_id');
  return { ok: true };
});
