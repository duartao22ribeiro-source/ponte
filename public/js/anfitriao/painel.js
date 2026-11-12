'use strict';
/* Ponte · painel do anfitrião, ficha do participante, contactos, conversas
   Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md) */

// ======================================================================
// ANFITRIÃO
// ======================================================================
async function hPainel(main) {
  const d = await api('/api/h/participants');
  const ps = d.participants;
  const alerts = ps.filter(p => p.alert);
  const terr = S.territory?.name || '';
  const hour = new Date().getHours();
  setHero(`${hour < 13 ? 'Bom dia' : hour < 20 ? 'Boa tarde' : 'Boa noite'}, ${firstName(S.me.name)}`, `${terr} · ${ps.length} participantes`, 'Painel do anfitrião');
  const f = S.tab.hPhase || 'todos';
  const list = ps.filter(p => f === 'todos' || p.enrollment?.phase === f);
  main.innerHTML = `
    <div class="grid four">
      <div class="card"><div class="stat">${ps.length}</div><div class="stat-label">Participantes</div></div>
      <div class="card"><div class="stat" style="color:${alerts.length ? 'var(--warn)' : 'inherit'}">${alerts.length}</div><div class="stat-label">Sem contacto há +14 dias</div></div>
      <div class="card"><div class="stat">${d.upcoming_calls.filter(c => c.status === 'pedida').length}</div><div class="stat-label">Videochamadas por confirmar</div></div>
      <div class="card"><div class="stat">${d.upcoming_visits.length}</div><div class="stat-label">Visitas de regresso marcadas</div></div>
    </div>
    ${alerts.length ? `<div class="section-title"><h2>Alertas</h2></div>${alerts.map(p => `<div class="card alert-card"><div class="row between">
      <div><b>${esc(p.name)}</b> ${phaseChip(p.enrollment.phase)}<div class="small muted" style="margin-top:4px">Sem contacto ${p.last_contact ? `há ${p.days_since_contact} dias (último a ${fmtShort(p.last_contact)})` : 'registado'}</div></div>
      <div class="row"><button class="btn small" data-log="${p.id}" data-name="${esc(p.name)}">Registar contacto</button><a class="btn secondary small" href="#/conversa/${p.id}">Mensagem</a></div>
    </div></div>`).join('')}` : ''}
    ${d.upcoming_calls.length || d.upcoming_visits.length ? `<div class="section-title"><h2>Agenda</h2></div><div class="card"><ul class="list">
      ${d.upcoming_calls.map(c => `<li><div class="row between"><div>${ICON.video.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} <b>Videochamada com ${esc(c.name)}</b><div class="small muted">${fmtDateTime(c.datetime)}${c.note ? ` · ${esc(c.note)}` : ''}</div></div>
        <div class="row">${chip(c.status)}${c.status === 'pedida' ? `<button class="btn small" data-confirm-call="${c.id}">Confirmar</button>` : `<button class="btn secondary small" data-done-call="${c.id}">Realizada</button>`}</div></div></li>`).join('')}
      ${d.upcoming_visits.map(v => `<li><div class="row between"><div><b>Visita de ${esc(v.name)}</b><div class="small muted">${fmtWeekday(v.date)}${v.nights ? ` · ${v.nights} noites` : ''}${v.purpose ? ` · ${esc(v.purpose)}` : ''}</div></div>
        <div class="row">${chip(v.status)}${v.status === 'pedida' ? `<button class="btn small" data-confirm-visit="${v.id}">Confirmar</button>` : ''}</div></div></li>`).join('')}
    </ul></div>` : ''}
    <div class="section-title"><h2>Participantes</h2></div>
    <div class="filters" data-filter="hPhase">${[['todos', 'Todos'], ...PHASES.map(p => [p.key, p.label])].map(([k, l]) => `<button data-f="${k}" class="${f === k ? 'active' : ''}">${l} <span class="muted">${k === 'todos' ? ps.length : ps.filter(p => p.enrollment?.phase === k).length}</span></button>`).join('')}</div>
    <div class="grid two">${list.map(p => `<a class="card pcard ${p.alert ? 'alert-card' : ''}" href="#/participante/${p.id}">
      ${avatar(p, 48)}
      <div class="pmain">
        <div class="row between" style="flex-wrap:nowrap"><span class="pname">${esc(p.name)}</span>${phaseChip(p.enrollment.phase)}</div>
        <div class="small muted">${esc(WORK[p.work_situation] || '')}${p.city ? ` · ${esc(p.city)}` : ''}</div>
        ${p.plan_total ? `<div class="row" style="margin-top:8px;flex-wrap:nowrap"><div class="progress thin" style="flex:1"><i style="width:${p.plan_progress}%"></i></div><span class="small">${p.plan_progress}%</span></div>` : ''}
        <div class="row small" style="margin-top:6px;gap:8px">
          <span class="${p.alert ? '' : 'muted'}" style="${p.alert ? 'color:var(--warn);font-weight:500' : ''}">Último contacto: ${relDays(p.days_since_contact)}</span>
          ${p.followup ? `<span class="muted">· faltam ${p.followup.months_left} meses</span>` : ''}
          ${p.unread ? `<span class="chip accent">${p.unread} nova${p.unread > 1 ? 's' : ''}</span>` : ''}
          ${p.pending_calls ? '<span class="chip warn">Videochamada</span>' : ''}${p.pending_visits ? '<span class="chip warn">Visita</span>' : ''}
          ${p.decision ? `<span class="chip dark">${esc(DECISIONS[p.decision.choice].label)}</span>` : ''}
        </div>
      </div></a>`).join('') || `<div class="card">${emptyState('Sem participantes nesta fase.')}</div>`}</div>`;
  $$('[data-filter]', main).forEach(fl => fl.onclick = ev => { const b = ev.target.closest('[data-f]'); if (b) { S.tab[fl.dataset.filter] = b.dataset.f; reload(); } });
  $$('[data-log]', main).forEach(b => b.onclick = () => contactForm(b.dataset.log, b.dataset.name));
  $$('[data-confirm-call]', main).forEach(b => b.onclick = () => openForm({
    title: 'Confirmar videochamada', fields: [{ name: 'link', label: 'Link da videochamada', type: 'url', optional: true, placeholder: 'https://…', hint: 'O participante vê este link na app.' }],
    submit: 'Confirmar', onSubmit: v => api(`/api/h/calls/${b.dataset.confirmCall}`, { method: 'PUT', body: { status: 'confirmada', link: v.link } }),
  }));
  $$('[data-done-call]', main).forEach(b => b.onclick = () => act(() => api(`/api/h/calls/${b.dataset.doneCall}`, { method: 'PUT', body: { status: 'realizada' } }), 'Marcada como realizada.'));
  $$('[data-confirm-visit]', main).forEach(b => b.onclick = () => act(() => api(`/api/h/visits/${b.dataset.confirmVisit}`, { method: 'PUT', body: { status: 'confirmada' } }), 'Visita confirmada.'));
}

function contactForm(pid, name) {
  openForm({
    title: `Registar contacto${name ? ` com ${firstName(name)}` : ''}`,
    fields: [
      { row: [{ name: 'date', label: 'Data', type: 'date', required: true, default: todayISO(), max: todayISO() }, { name: 'type', label: 'Tipo', type: 'select', options: Object.entries(CONTACT_TYPES) }] },
      { name: 'summary', label: 'Resumo', type: 'textarea', rows: 3, optional: true, placeholder: 'O que falaram? Há próximos passos?' },
    ],
    onSubmit: v => api(`/api/h/participants/${pid}/contacts`, { method: 'POST', body: v }).then(() => toast('Contacto registado.')),
  });
}

async function hParticipante(main, { id }) {
  const p = await api(`/api/h/participants/${id}`);
  const e = p.enrollment;
  setHero(p.name, `${phaseOf(e.phase).label} · ${e.edition_name}`, 'Participante');
  const tab = tabsHTML('hp', [['plano', 'Plano de mudança'], ['acomp', 'Acompanhamento'], ['conversa', 'Conversa'], ['percurso', 'Percurso']]);
  const top = `<div class="card"><div class="row between" style="align-items:flex-start">
      <div class="row" style="flex-wrap:nowrap">${avatar(p, 56)}<div><h2 style="margin:0">${esc(p.name)}</h2>
        <div class="small muted">${esc(WORK[p.work_situation] || '')}${p.remote_days ? ` · ${p.remote_days} dias remotos/semana` : ''}</div>
        <div class="small" style="margin-top:4px">${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}${p.phone ? ` · <a href="${telHref(p.phone)}">${esc(p.phone)}</a>` : ''}</div></div></div>
      <div class="row"><button class="btn small" data-log="${p.id}">Registar contacto</button><button class="btn secondary small" data-edit-enr>Fase e datas</button></div>
    </div>
    ${journeyHTML(e.phase, false)}
    <dl class="kv" style="margin-top:14px">
      <dt>Estadia</dt><dd>${e.arrival ? `${fmtShort(e.arrival)} a ${fmtDate(e.departure)}` : '—'}</dd>
      ${p.household ? `<dt>Agregado</dt><dd>${esc(p.household)}</dd>` : ''}
      <dt>Interesse em mudar-se</dt><dd>${p.move_interest ? `${p.move_interest}/5 no registo` : '—'}${e.interest_end ? ` · <b>${e.interest_end}/5 no fim da estadia</b>` : ''}</dd>
      <dt>Último contacto</dt><dd style="${p.alert ? 'color:var(--warn);font-weight:500' : ''}">${p.last_contact ? `${fmtDate(p.last_contact)} (${relDays(p.days_since_contact)})` : 'Nenhum registado'}</dd>
      ${p.followup ? `<dt>Acompanhamento</dt><dd>Mês ${Math.max(1, p.followup.month)} de 6 · faltam ${p.followup.months_left} meses</dd>` : ''}
      ${p.decision ? `<dt>Decisão</dt><dd><b>${esc(DECISIONS[p.decision.choice].label)}</b>${p.decision.locality ? ` · ${esc(p.decision.locality)}` : ''}${p.decision.ambassador ? ' · quer ser embaixador' : ''}</dd>` : ''}
    </dl></div>`;
  let body = '';
  if (S.tab.hp === 'plano') {
    body = p.plan ? `<div class="card"><div class="row between"><h2 style="margin:0">Plano de mudança</h2><span class="small muted">${p.plan.done} de ${p.plan.total} tarefas</span></div>
        <div class="progress" style="margin:12px 0 18px"><i style="width:${p.plan.progress}%"></i></div>${planHTML(p.plan)}</div>`
      : `<div class="card">${emptyState('Este participante ainda não tem plano de mudança.', '<button class="btn" data-create-plan>Criar plano com tarefas-base</button>')}</div>`;
  }
  if (S.tab.hp === 'acomp') {
    body = `<div class="grid two">
      <div class="card"><h3>Notas privadas</h3><p class="small muted">Só tu e a equipa da Rural Move veem estas notas.</p>
        <form id="note-form"><textarea name="body" rows="7">${esc(p.note?.body || '')}</textarea>
        <div class="row between" style="margin-top:10px"><span class="small muted">${p.note ? `Atualizado a ${fmtDate(p.note.updated_at)}` : ''}</span><button class="btn small" type="submit">Guardar notas</button></div></form></div>
      <div class="card"><div class="row between"><h3 style="margin:0">Registo de contactos</h3><button class="btn small" data-log="${p.id}">+ Registar</button></div>
        <ul class="list" style="margin-top:8px">${p.contacts.map(c => `<li><div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div><b>${fmtDate(c.date)}</b> <span class="chip">${esc(CONTACT_TYPES[c.type] || c.type)}</span>${c.summary ? `<div class="small" style="margin-top:4px">${esc(c.summary)}</div>` : ''}</div>
          <button class="btn ghost small" data-del-contact="${c.id}" aria-label="Apagar registo">${ICON.close.replace('<svg', '<svg width="16" height="16"')}</button></div></li>`).join('') || '<li class="muted small">Ainda não há contactos registados.</li>'}</ul></div>
    </div>`;
  }
  if (S.tab.hp === 'conversa') body = chatHTML(p);
  if (S.tab.hp === 'percurso') {
    body = `<div class="grid two">
      <div class="card"><h3>Videochamadas</h3><ul class="list">${p.calls.map(c => `<li><div class="row between"><div><b>${fmtDateTime(c.datetime)}</b>${c.note ? `<div class="small muted">${esc(c.note)}</div>` : ''}</div><div class="row">${chip(c.status)}
        ${c.status === 'pedida' ? `<button class="btn small" data-confirm-call="${c.id}">Confirmar</button>` : c.status === 'confirmada' ? `<button class="btn secondary small" data-done-call="${c.id}">Realizada</button>` : ''}</div></div></li>`).join('') || '<li class="muted small">Nenhuma.</li>'}</ul></div>
      <div class="card"><h3>Visitas de regresso</h3><ul class="list">${p.visits.map(v => `<li><div class="row between"><div><b>${fmtDate(v.date)}</b>${v.nights ? ` · ${v.nights} noites` : ''}<div class="small muted">${esc(v.purpose || '')}</div></div><div class="row">${chip(v.status)}
        ${v.status === 'pedida' ? `<button class="btn small" data-visit="${v.id}" data-s="confirmada">Confirmar</button>` : v.status === 'confirmada' ? `<button class="btn secondary small" data-visit="${v.id}" data-s="realizada">Realizada</button>` : ''}</div></div></li>`).join('') || '<li class="muted small">Nenhuma.</li>'}</ul></div>
      <div class="card"><h3>Atividades em que se inscreveu</h3><ul class="list">${p.activities.map(a => `<li>${esc(a.title)} <span class="small muted">· ${fmtShort(a.date)}</span></li>`).join('') || '<li class="muted small">Nenhuma.</li>'}</ul></div>
      ${p.bio ? `<div class="card"><h3>Sobre</h3><p class="small">${esc(p.bio)}</p></div>` : ''}
    </div>`;
  }
  main.innerHTML = `<a href="#/" class="btn ghost small" style="margin:-6px 0 8px -10px">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Painel</a>` + top + tab + body;

  if (p.plan && S.tab.hp === 'plano') bindPlan(main, p.id, p.plan);
  $('[data-create-plan]', main)?.addEventListener('click', () => act(() => api(`/api/plan/${p.id}/create`, { method: 'POST' }), 'Plano criado.'));
  $$('[data-log]', main).forEach(b => b.onclick = () => contactForm(p.id, p.name));
  $('[data-edit-enr]', main).onclick = () => openForm({
    title: 'Fase e datas',
    fields: [
      { name: 'phase', label: 'Fase do percurso', type: 'select', options: PHASES.map(x => [x.key, `${x.label} · ${x.when}`]) },
      { row: [{ name: 'arrival', label: 'Chegada', type: 'date' }, { name: 'departure', label: 'Partida', type: 'date', hint: 'Os 6 meses contam a partir daqui.' }] },
    ],
    values: e,
    onSubmit: v => api(`/api/h/participants/${p.id}/enrollment`, { method: 'PUT', body: v }),
  });
  const nf = $('#note-form', main);
  if (nf) nf.onsubmit = ev => { ev.preventDefault(); act(() => api(`/api/h/participants/${p.id}/note`, { method: 'PUT', body: { body: nf.body.value } }), 'Notas guardadas.'); };
  $$('[data-del-contact]', main).forEach(b => b.onclick = () => confirm('Apagar este registo?') && act(() => api(`/api/h/contacts/${b.dataset.delContact}`, { method: 'DELETE' })));
  $$('[data-confirm-call]', main).forEach(b => b.onclick = () => openForm({
    title: 'Confirmar videochamada', fields: [{ name: 'link', label: 'Link da videochamada', type: 'url', optional: true, placeholder: 'https://…' }],
    submit: 'Confirmar', onSubmit: v => api(`/api/h/calls/${b.dataset.confirmCall}`, { method: 'PUT', body: { status: 'confirmada', link: v.link } }),
  }));
  $$('[data-done-call]', main).forEach(b => b.onclick = () => act(() => api(`/api/h/calls/${b.dataset.doneCall}`, { method: 'PUT', body: { status: 'realizada' } })));
  $$('[data-visit]', main).forEach(b => b.onclick = () => act(() => api(`/api/h/visits/${b.dataset.visit}`, { method: 'PUT', body: { status: b.dataset.s } })));
  if (S.tab.hp === 'conversa') await mountChat(main, p.id);
}

async function hConversas(main) {
  const list = await api('/api/h/conversations');
  setHero('Conversas', `${list.length} participantes`);
  main.innerHTML = `<div class="card"><ul class="list">${list.map(c => `<li><a class="pcard" href="#/conversa/${c.id}">${avatar(c, 46)}
    <div class="pmain"><div class="row between" style="flex-wrap:nowrap"><span class="pname">${esc(c.name)}</span><span class="small muted">${c.last ? fmtShort(c.last.created_at) : ''}</span></div>
    <div class="row between" style="flex-wrap:nowrap"><span class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.last ? `${c.last.from_id === S.me.id ? 'Tu: ' : ''}${esc(c.last.body)}` : 'Sem mensagens'}</span>${c.unread ? `<span class="chip accent">${c.unread}</span>` : ''}</div></div></a></li>`).join('') || `<li>${emptyState('Sem participantes.')}</li>`}</ul></div>`;
}
async function hConversa(main, { id }) {
  const d = await api(`/api/messages/${id}`);
  setHero('Conversa', d.other.name);
  main.innerHTML = `<a href="#/conversas" class="btn ghost small" style="margin:-6px 0 8px -10px">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Conversas</a>${chatHTML(d.other)}
    <div style="margin-top:6px"><a class="btn ghost small" href="#/participante/${id}">Ver ficha do participante</a></div>`;
  await mountChat(main, id);
}
