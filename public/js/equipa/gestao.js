'use strict';
/* Ponte · gestão de edições, territórios e anfitriões
   Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md) */

async function eEdicoes(main) {
  const [eds, terrs, hosts] = await Promise.all([api('/api/e/editions'), api('/api/e/territories'), api('/api/e/hosts')]);
  setHero('Edições', `${eds.length} ${eds.length === 1 ? 'edição' : 'edições'}`, 'Equipa Rural Move');
  const fields = [
    { name: 'name', label: 'Nome', required: true },
    { row: [{ name: 'territory_id', label: 'Território', type: 'select', options: terrs.map(t => [t.id, t.name]) }, { name: 'host_id', label: 'Anfitrião', type: 'select', options: [['', 'Por atribuir'], ...hosts.filter(h => h.active).map(h => [h.id, h.name])] }] },
    { row: [{ name: 'start_date', label: 'Início', type: 'date', required: true }, { name: 'end_date', label: 'Fim', type: 'date', required: true }] },
    { row: [{ name: 'slots', label: 'Vagas', type: 'number', min: 1, default: 8 }, { name: 'cost', label: 'Custo da edição (€)', type: 'number', min: 0, optional: true, hint: 'Usado no custo por pessoa fixada' }] },
  ];
  const norm = v => ({ ...v, territory_id: Number(v.territory_id), host_id: v.host_id ? Number(v.host_id) : null });
  main.innerHTML = `<div class="row between" style="margin-bottom:14px"><span></span><button class="btn" data-new ${terrs.length ? '' : 'disabled'}>+ Nova edição</button></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Edição</th><th>Datas</th><th>Anfitrião</th><th>Vagas</th><th>Custo</th><th></th></tr></thead><tbody>
    ${eds.map(e => `<tr><td><b>${esc(e.name)}</b><div class="small muted">${esc(e.territory_name)}</div></td><td class="small">${fmtShort(e.start_date)} a ${fmtDate(e.end_date)}</td>
      <td>${esc(e.host_name || '—')}</td><td>${e.enrolled}/${e.slots}</td><td>${money(e.cost)}</td>
      <td style="white-space:nowrap"><button class="btn ghost small" data-people="${e.id}">Participantes</button><button class="btn secondary small" data-edit="${e.id}">Editar</button></td></tr>`).join('') || `<tr><td colspan="6">${emptyState('Ainda não há edições.')}</td></tr>`}
    </tbody></table></div></div>`;
  $('[data-new]', main).onclick = () => openForm({ title: 'Nova edição', fields, onSubmit: v => api('/api/e/editions', { method: 'POST', body: norm(v) }) });
  $$('[data-edit]', main).forEach(b => b.onclick = () => {
    const e = eds.find(x => x.id === Number(b.dataset.edit));
    openForm({ title: 'Editar edição', fields, values: e, onSubmit: v => api(`/api/e/editions/${e.id}`, { method: 'PUT', body: norm(v) }), onDelete: () => api(`/api/e/editions/${e.id}`, { method: 'DELETE' }) });
  });
  $$('[data-people]', main).forEach(b => b.onclick = async () => {
    const e = eds.find(x => x.id === Number(b.dataset.people));
    const ps = await api(`/api/e/editions/${e.id}/participants`);
    openModal(e.name, `<ul class="list">${ps.map(p => `<li><div class="row between"><div><b>${esc(p.name)}</b><div class="small muted">${esc(p.email)} · ${esc(p.city || '')}</div></div><div class="row">${phaseChip(p.phase)}${p.choice ? `<span class="chip dark">${esc(DECISIONS[p.choice].label)}</span>` : ''}</div></div></li>`).join('') || '<li class="muted">Sem inscritos.</li>'}</ul>`);
  });
}

async function eTerritorios(main) {
  const ts = await api('/api/e/territories');
  setHero('Territórios', `${ts.length} ${ts.length === 1 ? 'território' : 'territórios'}`, 'Equipa Rural Move');
  const fields = [
    { row: [{ name: 'name', label: 'Nome', required: true }, { name: 'municipality', label: 'Município', required: true }] },
    { name: 'region', label: 'Região', optional: true },
    { name: 'description', label: 'Descrição', type: 'textarea', rows: 3, optional: true },
    { row: [{ name: 'lat', label: 'Latitude', type: 'number', step: 'any', optional: true }, { name: 'lng', label: 'Longitude', type: 'number', step: 'any', optional: true }] },
  ];
  main.innerHTML = `<div class="row between" style="margin-bottom:14px"><span></span><button class="btn" data-new>+ Novo território</button></div>
    <div class="grid two">${ts.map(t => `<div class="card"><div class="eyebrow">${esc(t.region || '')}</div><h3>${esc(t.name)}</h3>
      <div class="small muted">Município de ${esc(t.municipality)} · ${t.editions} ${t.editions === 1 ? 'edição' : 'edições'} · Anfitrião: ${esc(t.hosts || 'por atribuir')}</div>
      ${t.description ? `<p class="small" style="margin-top:8px">${esc(t.description)}</p>` : ''}
      <div class="row" style="margin-top:10px"><a class="btn small" href="#/territorio/${t.id}">Gerir conteúdos</a><button class="btn secondary small" data-edit="${t.id}">Editar</button></div></div>`).join('') || `<div class="card">${emptyState('Ainda não há territórios.')}</div>`}</div>`;
  $('[data-new]', main).onclick = () => openForm({ title: 'Novo território', fields, onSubmit: v => api('/api/e/territories', { method: 'POST', body: v }) });
  $$('[data-edit]', main).forEach(b => b.onclick = () => {
    const t = ts.find(x => x.id === Number(b.dataset.edit));
    openForm({ title: 'Editar território', fields, values: t, onSubmit: v => api(`/api/e/territories/${t.id}`, { method: 'PUT', body: v }), onDelete: () => api(`/api/e/territories/${t.id}`, { method: 'DELETE' }) });
  });
}

async function eAnfitrioes(main) {
  const [hs, ts] = await Promise.all([api('/api/e/hosts'), api('/api/e/territories')]);
  setHero('Anfitriões', `${hs.filter(h => h.active).length} contas ativas`, 'Equipa Rural Move');
  const terrOpts = [['', 'Sem território'], ...ts.map(t => [t.id, t.name])];
  const base = [
    { row: [{ name: 'name', label: 'Nome', required: true }, { name: 'email', label: 'E-mail', type: 'email', required: true }] },
    { row: [{ name: 'phone', label: 'Telefone', type: 'tel', optional: true }, { name: 'city', label: 'Onde vive', optional: true }] },
    { name: 'territory_id', label: 'Território', type: 'select', options: terrOpts, hint: 'O anfitrião só vê os participantes deste território.' },
    { name: 'bio', label: 'Apresentação', type: 'textarea', rows: 3, optional: true },
  ];
  const norm = v => ({ ...v, territory_id: v.territory_id ? Number(v.territory_id) : null });
  main.innerHTML = `<div class="row between" style="margin-bottom:14px"><span></span><button class="btn" data-new>+ Novo anfitrião</button></div>
    <div class="card"><ul class="list">${hs.map(h => `<li><div class="row between"><div class="row" style="flex-wrap:nowrap">${avatar(h, 44)}<div><b>${esc(h.name)}</b> ${h.active ? '' : '<span class="chip">Desativado</span>'}
      <div class="small muted">${esc(h.email)}${h.phone ? ` · ${esc(h.phone)}` : ''}</div><div class="small">${esc(h.territory_name || 'Sem território')}</div></div></div>
      <button class="btn secondary small" data-edit="${h.id}">Editar</button></div></li>`).join('') || `<li>${emptyState('Ainda não há anfitriões.')}</li>`}</ul></div>`;
  $('[data-new]', main).onclick = () => openForm({
    title: 'Novo anfitrião', fields: [...base, { name: 'password', label: 'Palavra-passe inicial', type: 'text', required: true, hint: 'Pelo menos 8 caracteres. Partilha-a com o anfitrião e pede-lhe para a mudar.' }],
    onSubmit: v => api('/api/e/hosts', { method: 'POST', body: norm(v) }),
  });
  $$('[data-edit]', main).forEach(b => b.onclick = () => {
    const h = hs.find(x => x.id === Number(b.dataset.edit));
    openForm({
      title: 'Editar anfitrião', values: { ...h, active: !!h.active },
      fields: [...base, { name: 'password', label: 'Nova palavra-passe', type: 'text', optional: true, hint: 'Deixa vazio para manter.' }, { name: 'active', label: 'Conta ativa', type: 'checkbox' }],
      onSubmit: v => { const body = norm(v); body.active = v.active ? 1 : 0; if (!body.password) delete body.password; return api(`/api/e/hosts/${h.id}`, { method: 'PUT', body }); },
    });
  });
}
