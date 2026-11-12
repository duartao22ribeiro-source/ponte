'use strict';
/* Ponte · plano de mudança, casas, apoios, visitas
   Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md) */

// ---------- Plano de mudança (partilhado participante/anfitrião) ----------
function planHTML(plan) {
  return AREAS.map(a => {
    const ts = plan.tasks.filter(t => t.area === a.key);
    const done = ts.filter(t => t.status === 'feito').length;
    return `<section class="area">
      <div class="area-head"><h3>${a.label}</h3><span class="chip ${ts.length && done === ts.length ? 'green' : ''}">${done}/${ts.length}</span></div>
      ${ts.map(t => `<div class="task ${t.status}">
        <button class="status-btn ${t.status}" data-cycle="${t.id}" aria-label="Estado: ${TASK_STATUS[t.status]}. Carrega para mudar">${t.status === 'feito' ? ICON.check : ''}</button>
        <div class="task-main" data-edit-task="${t.id}" role="button" tabindex="0">
          <div class="task-title">${esc(t.title)}</div>
          <div class="task-meta"><span class="chip ${STATUS_CHIP[t.status]}">${TASK_STATUS[t.status]}</span>${t.due_date ? `<span>${t.status === 'feito' ? '' : 'até '}${fmtDate(t.due_date)}</span>` : ''}</div>
          ${t.notes ? `<div class="task-notes">${esc(t.notes)}</div>` : ''}
        </div></div>`).join('') || '<p class="small muted" style="margin:0 0 6px">Ainda sem tarefas.</p>'}
      <button class="btn ghost small" data-add-task="${a.key}">+ Adicionar tarefa</button>
    </section>`;
  }).join('');
}
const TASK_FIELDS = [
  { name: 'title', label: 'Tarefa', required: true },
  { row: [
    { name: 'area', label: 'Área', type: 'select', options: AREAS.map(a => [a.key, a.label]) },
    { name: 'status', label: 'Estado', type: 'select', options: Object.entries(TASK_STATUS) },
  ] },
  { name: 'due_date', label: 'Data', type: 'date', optional: true },
  { name: 'notes', label: 'Notas', type: 'textarea', optional: true, rows: 3 },
];
function bindPlan(root, pid, plan) {
  const find = id => plan.tasks.find(t => t.id === Number(id));
  $$('[data-cycle]', root).forEach(b => b.onclick = () => {
    const t = find(b.dataset.cycle);
    const next = { por_fazer: 'em_curso', em_curso: 'feito', feito: 'por_fazer' }[t.status];
    act(() => api(`/api/tasks/${t.id}`, { method: 'PUT', body: { status: next } }), `"${t.title.slice(0, 40)}": ${TASK_STATUS[next].toLowerCase()}`);
  });
  const edit = el => {
    const t = find(el.dataset.editTask);
    openForm({ title: 'Editar tarefa', fields: TASK_FIELDS, values: t,
      onSubmit: v => api(`/api/tasks/${t.id}`, { method: 'PUT', body: v }),
      onDelete: () => api(`/api/tasks/${t.id}`, { method: 'DELETE' }) });
  };
  $$('[data-edit-task]', root).forEach(el => { el.onclick = () => edit(el); el.onkeydown = ev => { if (ev.key === 'Enter') edit(el); }; });
  $$('[data-add-task]', root).forEach(b => b.onclick = () => openForm({
    title: 'Nova tarefa', fields: TASK_FIELDS.filter(f => !f.row).concat([]), values: { area: b.dataset.addTask },
    onSubmit: v => api(`/api/plan/${pid}/tasks`, { method: 'POST', body: { ...v, area: b.dataset.addTask } }),
  }));
}

// ---------- Fase 3: Mudar ----------
async function pMudar(main) {
  const d = await overview();
  const e = d.enrollment, f = d.followup;
  setHero('Mudar', f ? `Acompanhamento até ${fmtDate(f.end)}` : 'Até 6 meses depois da estadia', 'Fase 3 · Meses 1 a 6');
  const tab = tabsHTML('mudar', [['plano', 'Plano'], ['casas', 'Casas'], ['apoios', 'Apoios da câmara'], ['visitas', 'Visitas']]);
  const plan = d.plan;
  let head = phaseNotice(e, 'mudar');
  if (phaseIndex(e.phase) >= 2) head += `<div class="card dark"><div class="grid two" style="gap:18px">
      <div><div class="stat-label">Plano de mudança</div><div class="stat">${plan ? plan.progress : 0}%</div>
        <div class="progress" style="margin-top:10px"><i style="width:${plan ? plan.progress : 0}%"></i></div>
        <div class="small muted" style="margin-top:6px">${plan ? `${plan.done} de ${plan.total} tarefas feitas` : 'Ainda sem plano'}</div></div>
      <div><div class="stat-label">Acompanhamento</div><div class="stat">${f ? f.months_left : 6} <span style="font-size:1rem">${f && f.months_left === 1 ? 'mês' : 'meses'}</span></div>
        <div class="small muted" style="margin-top:6px">${f ? `faltam até ${fmtDate(f.end)} · mês ${Math.max(1, f.month)} de 6` : ''}</div>
        <div class="row" style="gap:4px;margin-top:10px">${[1, 2, 3, 4, 5, 6].map(i => `<span style="flex:1;height:6px;border-radius:3px;background:${f && i <= f.month ? 'var(--accent)' : 'rgba(244,241,232,.15)'}"></span>`).join('')}</div></div>
    </div></div>`;
  let body = '';

  if (S.tab.mudar === 'plano') {
    body = plan
      ? `<p class="muted small">Plano feito em conjunto com ${esc(firstName(d.host?.name || 'o anfitrião'))}. Carrega no círculo para mudar o estado de uma tarefa: por fazer, em curso, feito.</p>${planHTML(plan)}`
      : `<div class="card">${emptyState('O teu plano de mudança é criado com o anfitrião no fim da estadia.', '<button class="btn" data-create-plan>Começar o plano</button>')}</div>`;
  }
  if (S.tab.mudar === 'casas') {
    const k = S.tab.houseKind || 'todas';
    const hs = d.houses.filter(h => k === 'todas' || h.kind === k);
    body = `<p class="muted small">Casas partilhadas por ${esc(firstName(d.host?.name || 'o anfitrião'))}. Contacta diretamente ou pede-lhe para ir contigo ver.</p>
      <div class="filters" data-filter="houseKind">${[['todas', 'Todas'], ['arrendamento', 'Arrendar'], ['compra', 'Comprar']].map(([x, l]) => `<button data-f="${x}" class="${k === x ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div class="grid two">${hs.map(houseCard).join('') || `<div class="card">${emptyState('Não há casas nesta categoria.')}</div>`}</div>`;
  }
  if (S.tab.mudar === 'apoios') {
    body = `<p class="muted small">Apoios da Câmara Municipal de ${esc(e.municipality)} a quem se muda para o concelho. Confirma sempre as condições no site oficial.</p>
      ${d.supports.map(s => `<div class="card"><h3>${esc(s.title)}</h3><p class="small">${esc(s.description || '')}</p>${s.url ? `<a class="btn secondary small" href="${esc(s.url)}" target="_blank" rel="noopener">Ver no site oficial ${ICON.ext.replace('<svg', '<svg width="16" height="16"')}</a>` : ''}</div>`).join('') || `<div class="card">${emptyState('Ainda não há apoios registados.')}</div>`}`;
  }
  if (S.tab.mudar === 'visitas') {
    body = `<div class="card"><h2>Marcar visita de regresso</h2>
        <p class="small muted">Volta à aldeia para ver casas, visitar a escola ou tratar de assuntos na câmara. ${esc(firstName(d.host?.name || 'O anfitrião'))} confirma e ajuda a organizar.</p>
        <form id="visit-form" novalidate>
          <div class="form-row">
            <label class="field"><span>Data de chegada</span><input type="date" name="date" min="${todayISO()}" required></label>
            <label class="field"><span>Noites</span><input type="number" name="nights" min="1" max="30" value="2"></label>
          </div>
          <label class="field"><span>O que queres fazer? <i class="muted">(opcional)</i></span><input name="purpose" placeholder="Ex.: ver casas e conhecer a escola"></label>
          <button class="btn" type="submit">Pedir visita</button>
        </form></div>
      <div class="card"><h3>As tuas visitas</h3><ul class="list">${d.visits.map(v => `<li><div class="row between"><div><b>${fmtWeekday(v.date)}</b>${v.nights ? ` · ${v.nights} ${v.nights === 1 ? 'noite' : 'noites'}` : ''}<div class="small muted">${esc(v.purpose || '')}</div></div>
        <div class="row">${chip(v.status)}${['pedida', 'confirmada'].includes(v.status) && v.date >= todayISO() ? `<button class="btn ghost small" data-cancel-visit="${v.id}">Cancelar</button>` : ''}</div></div></li>`).join('') || '<li class="muted small">Ainda não marcaste visitas.</li>'}</ul></div>`;
  }

  main.innerHTML = head + tab + body;
  if (plan && S.tab.mudar === 'plano') bindPlan(main, S.me.id, plan);
  $('[data-create-plan]', main)?.addEventListener('click', () => act(() => api(`/api/plan/${S.me.id}/create`, { method: 'POST' }), 'Plano criado.'));
  $$('[data-filter]', main).forEach(fl => fl.onclick = ev => { const b = ev.target.closest('[data-f]'); if (b) { S.tab[fl.dataset.filter] = b.dataset.f; reload(); } });
  const vf = $('#visit-form', main);
  if (vf) vf.onsubmit = ev => { ev.preventDefault(); if (!vf.date.value) return toast('Escolhe a data.', 'error'); act(() => api('/api/p/visits', { method: 'POST', body: readForm(vf) }), 'Pedido de visita enviado.'); };
  $$('[data-cancel-visit]', main).forEach(b => b.onclick = () => confirm('Cancelar esta visita?') && act(() => api(`/api/p/visits/${b.dataset.cancelVisit}`, { method: 'DELETE' }), 'Visita cancelada.'));
}

function houseCard(h, editable = false) {
  const photo = h.photo && String(h.photo).startsWith('data:image') ? `<img class="ph" src="${esc(h.photo)}" alt="${esc(h.title)}">` : houseArt(h.photo, h.id);
  const phone = (String(h.contact || '').match(/(\+?\d[\d\s]{7,})/) || [])[1];
  return `<div class="card house">${photo}<div class="body">
    <div class="row between"><span class="chip ${h.kind === 'compra' ? 'blue' : 'green'}">${h.kind === 'compra' ? 'Compra' : 'Arrendamento'}</span><span class="price">${money(h.price)}${h.kind === 'arrendamento' && h.price ? '<span class="small muted">/mês</span>' : ''}</span></div>
    <h3 style="margin:10px 0 2px">${esc(h.title)}</h3>
    <div class="small muted">${esc(h.location || '')}${h.bedrooms ? ` · T${esc(h.bedrooms)}` : ''}</div>
    ${h.description ? `<p class="small" style="margin:8px 0">${esc(h.description)}</p>` : ''}
    ${h.contact ? `<div class="small"><b>Contacto:</b> ${esc(h.contact)}</div>` : ''}
    <div class="row" style="margin-top:12px">${phone && !editable ? `<a class="btn small" href="${telHref(phone)}">${ICON.phone.replace('<svg', '<svg width="16" height="16"')} Ligar</a>` : ''}
    ${editable ? `<button class="btn secondary small" data-edit-item="${h.id}">Editar</button>` : ''}</div>
  </div></div>`;
}
