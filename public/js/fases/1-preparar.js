'use strict';
/* Ponte · ficha do destino, anfitrião, videochamada, embaixadores
   Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md) */

// ---------- velocímetro da internet ----------
// Escala como a do Speedtest: as velocidades baixas têm mais espaço, porque é aí que a diferença se sente.
const SPEED_STOPS = [0, 5, 10, 50, 100, 250, 500, 1000];
const GAUGE_START = 150, GAUGE_SWEEP = 240; // graus: o arco vai de baixo à esquerda a baixo à direita

function speedFraction(v) {
  const n = SPEED_STOPS.length - 1;
  if (!(v > 0)) return 0;
  if (v >= SPEED_STOPS[n]) return 1;
  const i = SPEED_STOPS.findIndex(s => s > v) - 1;
  return (i + (v - SPEED_STOPS[i]) / (SPEED_STOPS[i + 1] - SPEED_STOPS[i])) / n;
}


function speedGauge(down) {
  const pt = (deg, r) => { const a = deg * Math.PI / 180; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)].map(n => n.toFixed(2)); };
  const [x1, y1] = pt(GAUGE_START, 80), [x2, y2] = pt(GAUGE_START + GAUGE_SWEEP, 80);
  const arc = `M${x1} ${y1} A80 80 0 1 1 ${x2} ${y2}`;
  const f = speedFraction(Number(down));
  const ticks = SPEED_STOPS.map((s, i) => {
    const deg = GAUGE_START + GAUGE_SWEEP * i / (SPEED_STOPS.length - 1);
    const [a, b] = pt(deg, 68), [tx, ty] = pt(deg, 58);
    return `<circle cx="${a}" cy="${b}" r="1"/><text x="${tx}" y="${ty}">${s}</text>`;
  }).join('');
  return `<svg class="gauge" viewBox="0 12 200 140" role="img" aria-label="${down > 0 ? `${down} Mbps de download` : 'Velocidade por testar'}"
      style="--off:${(100 - f * 100).toFixed(2)};--deg:${(GAUGE_START + GAUGE_SWEEP * f).toFixed(1)}deg">
    <defs><linearGradient id="gauge-grad" x1="0" x2="1"><stop offset="0" stop-color="#58C0E0"/><stop offset="1" stop-color="#7DCC5D"/></linearGradient></defs>
    <path class="gauge-track" d="${arc}" pathLength="100"/>
    <path class="gauge-fill" d="${arc}" pathLength="100"/>
    <g class="gauge-ticks">${ticks}</g>
    <g class="gauge-needle"><line x1="100" y1="100" x2="164" y2="100"/><circle cx="100" cy="100" r="5"/></g>
    <text class="gauge-value" x="100" y="132" data-count="${down > 0 ? Number(down) : ''}">${down > 0 ? esc(down) : '—'}</text>
    <text class="gauge-unit" x="100" y="146">Mbps · download</text>
  </svg>`;
}

// o número do velocímetro conta até ao valor, ao mesmo ritmo do ponteiro
function countUpGauge(root) {
  const el = $('.gauge-value[data-count]', root);
  const to = Number(el?.dataset.count);
  if (!to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now() + 200, dur = 1100;
  const step = now => {
    const k = Math.min(1, Math.max(0, (now - t0) / dur));
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = '0';
  requestAnimationFrame(step);
}

// ---------- Fase 1: Preparar ----------
async function pPreparar(main) {
  const d = await overview();
  const e = d.enrollment;
  setHero('Preparar', e.arrival ? `Chegada a ${fmtWeekday(e.arrival)}` : e.edition_name);
  const tab = tabsHTML('preparar', [['destino', 'Ficha do destino'], ['anfitriao', 'Anfitrião'], ['embaixadores', 'Embaixadores']]);
  let body = '';

  if (S.tab.preparar === 'destino') {
    const s = d.destination;
    if (!s) body = `<div class="card">${emptyState('A ficha do destino ainda está a ser preparada pelo anfitrião.')}</div>`;
    else body = `
      <div class="card dark internet">
        <div class="eyebrow" style="color:var(--accent)">Internet testada</div>
        <div class="internet-body">
          ${speedGauge(s.internet_mbps)}
          <div class="internet-info">
            ${s.internet_upload_mbps ? `<p class="internet-up"><b>${esc(s.internet_upload_mbps)}</b> Mbps de upload</p>` : ''}
            <p class="small muted">${s.internet_tested_at ? `Último teste a ${fmtDate(s.internet_tested_at)}` : 'Data do teste por indicar'}</p>
            <div>${s.quiet_space ? '<span class="chip accent">Há espaço silencioso para chamadas</span>' : '<span class="chip warn">Sem espaço silencioso para chamadas</span>'}</div>
            ${s.quiet_space_notes ? `<p class="small muted" style="margin:8px 0 0">${esc(s.quiet_space_notes)}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="grid three">
        <div class="card"><h3>Alojamento</h3><p class="small">${esc(s.accommodation || '—')}</p></div>
        <div class="card"><h3>Refeições</h3><p class="small">${esc(s.meals || '—')}</p></div>
        <div class="card"><h3>Espaço de trabalho</h3><p class="small">${esc(s.workspace || '—')}</p></div>
      </div>
      <div class="grid two" style="margin-top:14px">
        <div class="card"><h3>Está incluído</h3><ul class="list-plain">${lines(s.included).map(l => `<li>${esc(l)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
        <div class="card"><h3>Não está incluído</h3><ul class="list-plain">${lines(s.not_included).map(l => `<li>${esc(l)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
      </div>`;
  }

  if (S.tab.preparar === 'anfitriao') {
    const h = d.host;
    const active = d.welcome_calls.find(c => ['pedida', 'confirmada'].includes(c.status));
    const minDT = new Date(Date.now() + 3600e3).toISOString().slice(0, 16);
    body = !h ? `<div class="card">${emptyState('O teu anfitrião ainda não foi atribuído.')}</div>` : `
      <div class="card">
        <div class="row" style="flex-wrap:nowrap;align-items:center;gap:16px">${avatar(h, 88)}<div><h2 style="margin:0">${esc(h.name)}</h2><div class="muted">${esc(h.city || '')}</div></div></div>
        <p style="margin-top:16px">${esc(h.bio || '')}</p>
        <div class="row"><a class="btn secondary small" href="#/conversa">Escrever</a>${h.phone ? `<a class="btn secondary small" href="${telHref(h.phone)}">Ligar</a>` : ''}</div>
      </div>
      <div class="card">
        <h2>Videochamada de boas-vindas</h2>
        ${active ? `<div class="row between"><div><b>${fmtDateTime(active.datetime)}</b>${active.note ? `<div class="small muted">${esc(active.note)}</div>` : ''}</div>${chip(active.status)}</div>
          ${active.status === 'pedida' ? `<p class="small muted" style="margin-top:10px">${esc(firstName(h.name))} vai confirmar e enviar-te o link.</p>` : ''}
          <div class="row" style="margin-top:12px">${active.link && active.status === 'confirmada' ? `<a class="btn small" href="${esc(active.link)}" target="_blank" rel="noopener">Entrar na chamada</a>` : ''}<button class="btn ghost small" data-cancel-call="${active.id}">Cancelar</button></div>`
        : `<p class="muted small">Uma conversa de 20 minutos para se conhecerem e tirares dúvidas antes de chegares.</p>
          <form id="call-form" novalidate>
            <label class="field"><span>Dia e hora que te dão jeito</span><input type="datetime-local" name="datetime" min="${minDT}" required></label>
            <label class="field"><span>Há alguma coisa que queiras falar? <i class="muted">(opcional)</i></span><textarea name="note" rows="2"></textarea></label>
            <button class="btn" type="submit">Pedir videochamada</button>
          </form>`}
        ${d.welcome_calls.filter(c => !['pedida', 'confirmada'].includes(c.status)).map(c => `<div class="row between small muted" style="margin-top:10px"><span>${fmtDateTime(c.datetime)}</span>${chip(c.status)}</div>`).join('')}
      </div>`;
  }

  if (S.tab.preparar === 'embaixadores') {
    const asked = Object.fromEntries(d.ambassador_requests.map(r => [r.testimonial_id, r]));
    body = `<p class="muted">Antigos participantes contam como foi. Se quiseres, pede uma conversa a um deles: a equipa da Rural Move põe-vos em contacto.</p>
      ${d.testimonials.length ? d.testimonials.map(t => `<div class="card">
        <p class="quote">${esc(t.body)}</p>
        <div class="row between"><div><b>${esc(t.author_name)}</b><div class="small muted">${esc(t.author_role || '')}</div></div>
        ${asked[t.id] ? chip(asked[t.id].status, asked[t.id].status === 'pedido' ? 'Conversa pedida' : STATUS_LABEL[asked[t.id].status]) : t.available_for_chat ? `<button class="btn secondary small" data-ask="${t.id}" data-name="${esc(t.author_name)}">Pedir conversa</button>` : ''}</div>
      </div>`).join('') : `<div class="card">${emptyState('Ainda não há testemunhos para este território.')}</div>`}`;
  }

  main.innerHTML = tab + body;
  countUpGauge(main);
  const cf = $('#call-form', main);
  if (cf) cf.onsubmit = ev => {
    ev.preventDefault();
    if (!cf.datetime.value) return toast('Escolhe o dia e a hora.', 'error');
    act(() => api('/api/p/welcome-call', { method: 'POST', body: { datetime: cf.datetime.value, note: cf.note.value } }), 'Pedido enviado ao anfitrião.');
  };
  $$('[data-cancel-call]', main).forEach(b => b.onclick = () => confirm('Cancelar a videochamada?') && act(() => api(`/api/p/welcome-call/${b.dataset.cancelCall}`, { method: 'DELETE' }), 'Videochamada cancelada.'));
  $$('[data-ask]', main).forEach(b => b.onclick = () => openForm({
    title: `Conversar com ${b.dataset.name}`,
    intro: 'A equipa da Rural Move vai combinar convosco uma conversa por telefone ou videochamada.',
    fields: [{ name: 'message', label: 'O que gostavas de lhe perguntar?', type: 'textarea', optional: true, rows: 3 }],
    submit: 'Pedir conversa',
    onSubmit: v => api('/api/p/ambassador-request', { method: 'POST', body: { testimonial_id: Number(b.dataset.ask), message: v.message } }).then(() => toast('Pedido enviado.')),
  }));
}
