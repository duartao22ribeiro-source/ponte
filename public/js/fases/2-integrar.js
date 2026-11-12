'use strict';
/* Ponte · agenda, guia local com mapa, diário
   Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md) */

// ---------- Fase 2: Integrar ----------
let leafletLoading = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoading) leafletLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = () => res(window.L); s.onerror = () => { leafletLoading = null; rej(new Error('mapa')); };
    document.head.appendChild(s);
  });
  return leafletLoading;
}
async function drawMap(el, items, center) {
  try {
    const L = await loadLeaflet();
    if (!el.isConnected) return null;
    const map = L.map(el, { scrollWheelZoom: false }).setView(center, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const markers = {};
    const pts = [];
    items.filter(i => i.lat && i.lng).forEach(i => {
      const m = L.circleMarker([i.lat, i.lng], { radius: 8, color: '#24361F', weight: 2, fillColor: '#7DCC5D', fillOpacity: 1 })
        .addTo(map).bindPopup(`<b>${esc(i.name)}</b><br>${esc(GUIDE_CATS[i.category] || '')}`);
      markers[i.id] = m; pts.push([i.lat, i.lng]);
    });
    if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30] });
    S.cleanup.push(() => map.remove());
    return { map, markers };
  } catch {
    el.innerHTML = '<div class="empty"><p>Não foi possível carregar o mapa.</p></div>';
    return null;
  }
}

async function pIntegrar(main) {
  const d = await overview();
  const e = d.enrollment;
  setHero('Integrar', e.arrival && e.departure ? `${fmtShort(e.arrival)} a ${fmtShort(e.departure)} · ${e.territory_name}` : e.territory_name, 'Fase 2 · 2 a 4 semanas');
  const tab = tabsHTML('integrar', [['agenda', 'Agenda'], ['guia', 'Guia local'], ['diario', 'Diário']]);
  let body = phaseNotice(e, 'integrar');

  if (S.tab.integrar === 'agenda') {
    const f = S.tab.agendaFilter || 'todas';
    let acts = d.activities.filter(a => a.date >= todayISO());
    if (f === 'fds') acts = acts.filter(a => isWeekend(a.date));
    if (f === 'minhas') acts = acts.filter(a => a.signed);
    body += `<div class="notice green">Nada é obrigatório. Escolhe as atividades que te dão jeito; as principais são ao fim de semana para não chocarem com o teu trabalho.</div>
      <div class="filters" data-filter="agendaFilter">${[['todas', 'Todas'], ['fds', 'Fim de semana'], ['minhas', 'As minhas']].map(([k, l]) => `<button data-f="${k}" class="${f === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      ${acts.length ? acts.map(a => {
        const full = a.spots && a.signups >= a.spots && !a.signed;
        return `<div class="card"><div class="activity">
          <div class="date-box ${isWeekend(a.date) ? 'weekend' : ''}"><small>${fmtDate(a.date, { weekday: 'short' }).replace('.', '')}</small><b>${toDate(a.date).getDate()}</b><small>${MESES[toDate(a.date).getMonth()]}</small></div>
          <div style="flex:1;min-width:0">
            <h3 style="margin-bottom:2px">${esc(a.title)}</h3>
            <div class="small muted">${a.time ? esc(a.time.replace(':', 'h')) + ' · ' : ''}${esc(a.location || '')}</div>
            ${a.description ? `<p class="small" style="margin:8px 0">${esc(a.description)}</p>` : ''}
            <div class="row between" style="margin-top:8px">
              <span class="small muted">${a.spots ? `${a.signups} de ${a.spots} lugares` : `${a.signups} inscritos`}</span>
              ${a.signed ? `<button class="btn secondary small" data-unsign="${a.id}">${ICON.check.replace('<svg', '<svg width="16" height="16"')} Inscrito · cancelar</button>`
                : full ? '<span class="chip">Lotada</span>' : `<button class="btn small" data-sign="${a.id}">Inscrever-me</button>`}
            </div>
          </div></div></div>`;
      }).join('') : `<div class="card">${emptyState(f === 'minhas' ? 'Ainda não te inscreveste em nenhuma atividade.' : 'Não há atividades marcadas.')}</div>`}`;
  }

  if (S.tab.integrar === 'guia') {
    const cat = S.tab.guideCat || 'todos';
    const items = d.guide.filter(i => cat === 'todos' || i.category === cat);
    body += `<div class="filters" data-filter="guideCat">${[['todos', 'Todos'], ...Object.entries(GUIDE_CATS)].map(([k, l]) => `<button data-f="${k}" class="${cat === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div class="map" id="guide-map" role="region" aria-label="Mapa do guia local"></div>
      <div class="card"><ul class="list">${items.map(i => `<li data-guide="${i.id}">
        <div class="row between" style="align-items:flex-start;flex-wrap:nowrap"><div><b>${esc(i.name)}</b>${cat === 'todos' ? ` <span class="chip" style="margin-left:4px">${esc(GUIDE_CATS[i.category] || i.category)}</span>` : ''}
          ${i.description ? `<div class="small" style="margin-top:4px">${esc(i.description)}</div>` : ''}
          <div class="small muted" style="margin-top:4px">${[i.contact_person, i.address].filter(Boolean).map(esc).join(' · ')}</div></div>
          ${i.phone ? `<a class="icon-btn" style="background:var(--soft);color:var(--dark);flex:0 0 auto" href="${telHref(i.phone)}" aria-label="Ligar para ${esc(i.name)}">${ICON.phone}</a>` : ''}
        </div></li>`).join('') || '<li class="muted">Sem resultados.</li>'}</ul></div>`;
  }

  if (S.tab.integrar === 'diario') {
    const kind = S.tab.diaryKind || 'gostei';
    const good = d.diary.filter(x => x.kind === 'gostei'), bad = d.diary.filter(x => x.kind === 'preocupa');
    const entry = x => `<li><div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div><div>${esc(x.body)}</div><div class="small muted">${fmtDate(x.created_at)}</div></div><button class="btn ghost small" data-del-diary="${x.id}" aria-label="Apagar">${ICON.close.replace('<svg', '<svg width="16" height="16"')}</button></div></li>`;
    body += `<div class="card">
        <h2>Como está a correr?</h2>
        <p class="small muted">Só tu vês o teu diário. Usa-o para pensar numa possível mudança e, se quiseres, fala disto com o anfitrião.</p>
        <form id="diary-form" novalidate>
          <div class="tabs" style="margin-bottom:12px" data-kind>${[['gostei', 'Gostei'], ['preocupa', 'Preocupa-me']].map(([k, l]) => `<button type="button" data-k="${k}" class="${kind === k ? 'active' : ''}">${l}</button>`).join('')}</div>
          <label class="field"><span>${kind === 'gostei' ? 'O que gostaste hoje?' : 'O que te preocupa numa possível mudança?'}</span><textarea name="body" rows="3" required></textarea></label>
          <button class="btn" type="submit">Guardar</button>
        </form>
      </div>
      <div class="grid two">
        <div class="card"><h3>O que gostei</h3><ul class="list">${good.map(entry).join('') || '<li class="muted small">Nada ainda.</li>'}</ul></div>
        <div class="card"><h3>O que me preocupa</h3><ul class="list">${bad.map(entry).join('') || '<li class="muted small">Nada ainda.</li>'}</ul></div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>No fim da estadia</h3>
        <p class="small muted">Depois destas semanas, quanto pensas em mudar-te para cá? Podes mudar a resposta até ao último dia.</p>
        ${scaleHTML('interest_end', e.interest_end)}
      </div>`;
  }

  main.innerHTML = tab + body;
  $$('[data-filter]', main).forEach(fl => fl.onclick = ev => { const b = ev.target.closest('[data-f]'); if (b) { S.tab[fl.dataset.filter] = b.dataset.f; reload(); } });
  $$('[data-sign]', main).forEach(b => b.onclick = () => act(() => api(`/api/activities/${b.dataset.sign}/signup`, { method: 'POST' }), 'Inscrição feita.'));
  $$('[data-unsign]', main).forEach(b => b.onclick = () => act(() => api(`/api/activities/${b.dataset.unsign}/signup`, { method: 'DELETE' }), 'Inscrição cancelada.'));
  $$('[data-del-diary]', main).forEach(b => b.onclick = () => confirm('Apagar esta entrada?') && act(() => api(`/api/p/diary/${b.dataset.delDiary}`, { method: 'DELETE' })));
  const kb = $('[data-kind]', main);
  if (kb) kb.onclick = ev => { const b = ev.target.closest('[data-k]'); if (b) { S.tab.diaryKind = b.dataset.k; reload(); } };
  const df = $('#diary-form', main);
  if (df) df.onsubmit = ev => { ev.preventDefault(); if (!df.body.value.trim()) return; act(() => api('/api/p/diary', { method: 'POST', body: { kind: S.tab.diaryKind || 'gostei', body: df.body.value } }), 'Guardado no diário.'); };
  $$('input[name=interest_end]', main).forEach(r => r.onchange = () => act(() => api('/api/p/interest-end', { method: 'POST', body: { value: Number(r.value) } }), 'Resposta guardada.'));
  const mapEl = $('#guide-map', main);
  if (mapEl) {
    const cat = S.tab.guideCat || 'todos';
    const items = d.guide.filter(i => cat === 'todos' || i.category === cat);
    const m = await drawMap(mapEl, items, [d.territory.lat || 41.45, d.territory.lng || -6.3]);
    if (m) $$('[data-guide]', main).forEach(li => li.addEventListener('click', ev => {
      if (ev.target.closest('a')) return;
      const mk = m.markers[li.dataset.guide];
      if (mk) { m.map.setView(mk.getLatLng(), 14); mk.openPopup(); mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }));
  }
}
