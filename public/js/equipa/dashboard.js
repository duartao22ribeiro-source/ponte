'use strict';
/* Ponte · painel da equipa: números que contam, donut das fases e mapa de calor da origem dos participantes
   Usado nos Indicadores (equipa/indicadores.js). Estilos em css/dashboard.css. */

// Cores das fases: tons da marca, validados para se distinguirem entre si (também com daltonismo).
// O contraste com o fundo é baixo, por isso cada cor vai sempre acompanhada do nome e do número na legenda.
const PHASE_COLORS = { preparar: '#2A72B8', integrar: '#3CB0DA', mudar: '#7BC95A', decidir: '#2F7D3E' };

// ---------- números que contam até ao valor ----------
const COUNT_FMT = {
  int: v => Math.round(v).toLocaleString('pt-PT'),
  pct: v => `${Math.round(v)}%`,
  money: v => money(Math.round(v)),
};
function countUp(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]', root).forEach(el => {
    const to = Number(el.dataset.count), fmt = COUNT_FMT[el.dataset.fmt || 'int'];
    if (!Number.isFinite(to) || reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now() + 150, dur = 1000;
    const step = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  });
}

// anel de percentagem (ponderam mudar-se)
function ringHTML(pctValue) {
  const r = 22, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, Number(pctValue) || 0));
  return `<svg class="kpi-ring" viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="${r}" class="kpi-ring-track"/>
    <circle cx="28" cy="28" r="${r}" class="kpi-ring-fill" style="--c:${c.toFixed(1)};--len:${(c * v / 100).toFixed(1)}"/>
  </svg>`;
}

// ---------- donut ----------
// data: [{ key, label, value, color }]. O centro mostra o total; ao passar pelo gráfico ou pela legenda,
// mostra a fase, o número e a percentagem.
function donutHTML(data, { size = 220, stroke = 28, totalLabel = 'Participantes' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, mid = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = data.filter(d => d.value > 0);
  const gap = shown.length > 1 ? 2 : 0; // 2px de fundo entre fatias
  let acc = 0;
  const segs = data.map((d, i) => {
    if (!(d.value > 0)) return '';
    const len = (d.value / total) * c;
    const seg = `<circle class="donut-seg" data-key="${d.key}" cx="${mid}" cy="${mid}" r="${r}" stroke="${d.color}" stroke-width="${stroke}"
      stroke-dasharray="0 ${c.toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" data-len="${Math.max(0.5, len - gap).toFixed(2)}" data-c="${c.toFixed(2)}" style="--i:${i}"/>`;
    acc += len;
    return seg;
  }).join('');
  const rows = data.map(d => `<button type="button" class="donut-row" data-key="${d.key}">
      <span class="donut-dot" style="background:${d.color}"></span><span class="donut-name">${esc(d.label)}</span>
      <span class="donut-n">${d.value}</span><span class="donut-p">${total ? Math.round(d.value / total * 100) : 0}%</span>
    </button>`).join('');
  return `<div class="donut" data-total="${total}" data-total-label="${esc(totalLabel)}">
    <div class="donut-chart" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(totalLabel)} por fase: ${data.map(d => `${d.label} ${d.value}`).join(', ')}">
        <circle class="donut-base" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}"/>
        <g transform="rotate(-90 ${mid} ${mid})">${segs}</g>
      </svg>
      <div class="donut-center" aria-live="polite"><span class="donut-c-label">${esc(totalLabel)}</span><span class="donut-c-value">${total}</span><span class="donut-c-pct"></span></div>
    </div>
    <div class="donut-legend">${rows}</div>
  </div>`;
}
function bindDonut(root, data) {
  $$('.donut', root).forEach(el => {
    const total = Number(el.dataset.total);
    const center = $('.donut-center', el);
    const show = key => {
      const d = data.find(x => x.key === key);
      el.classList.toggle('has-active', !!d);
      $$('[data-key]', el).forEach(n => n.classList.toggle('active', n.dataset.key === key));
      center.classList.remove('swap'); void center.offsetWidth; center.classList.add('swap');
      $('.donut-c-label', center).textContent = d ? d.label : el.dataset.totalLabel;
      $('.donut-c-value', center).textContent = d ? d.value : total;
      $('.donut-c-pct', center).textContent = d && total ? `${Math.round(d.value / total * 100)}%` : '';
    };
    let pinned = null;
    $$('[data-key]', el).forEach(n => {
      n.addEventListener('mouseenter', () => show(n.dataset.key));
      n.addEventListener('mouseleave', () => show(pinned));
      n.addEventListener('click', () => { pinned = pinned === n.dataset.key ? null : n.dataset.key; show(pinned); }); // toque no telemóvel
    });
    // as fatias desenham-se uma a uma ao aparecer
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $$('.donut-seg', el).forEach(s => s.setAttribute('stroke-dasharray', `${s.dataset.len} ${s.dataset.c}`))));
  });
}

// ---------- mapa de calor: de onde vêm os participantes ----------
// Coordenadas das cidades mais comuns (sedes de concelho). Uma cidade que não esteja aqui aparece na lista,
// mas não no mapa.
const PT_CITIES = {
  'lisboa': [38.7223, -9.1393], 'porto': [41.1579, -8.6291], 'amadora': [38.7538, -9.2308], 'vila nova de gaia': [41.1239, -8.6118],
  'sintra': [38.8029, -9.3817], 'cascais': [38.6979, -9.4215], 'oeiras': [38.697, -9.3017], 'loures': [38.8309, -9.1685],
  'odivelas': [38.7927, -9.1838], 'almada': [38.679, -9.1569], 'seixal': [38.6401, -9.1013], 'barreiro': [38.6631, -9.0724],
  'setubal': [38.5244, -8.8882], 'matosinhos': [41.1821, -8.6891], 'maia': [41.2357, -8.6199], 'gondomar': [41.1444, -8.5322],
  'valongo': [41.1888, -8.4983], 'braga': [41.5454, -8.4265], 'guimaraes': [41.4425, -8.2918], 'viana do castelo': [41.6918, -8.8344],
  'vila real': [41.3006, -7.7441], 'braganca': [41.8061, -6.7567], 'aveiro': [40.6405, -8.6538], 'viseu': [40.6566, -7.9125],
  'guarda': [40.5373, -7.2658], 'coimbra': [40.2033, -8.4103], 'leiria': [39.7436, -8.8071], 'castelo branco': [39.8222, -7.4909],
  'santarem': [39.2362, -8.6859], 'portalegre': [39.2967, -7.4285], 'evora': [38.5714, -7.9135], 'beja': [38.0151, -7.8632],
  'faro': [37.0194, -7.9304], 'funchal': [32.6669, -16.9241], 'ponta delgada': [37.7412, -25.6756], 'miranda do douro': [41.4939, -6.2737],
};
const normCity = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

let heatLoading = null;
function loadHeat() {
  if (window.L && L.heatLayer) return Promise.resolve();
  if (!heatLoading) heatLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
    s.onload = res; s.onerror = () => { heatLoading = null; rej(new Error('Não foi possível carregar o mapa de calor.')); };
    document.head.appendChild(s);
  });
  return heatLoading;
}

function originsListHTML(origins) {
  const max = Math.max(1, ...origins.map(o => o.n));
  return `<ol class="origins-list">${origins.map(o => `<li data-city="${esc(o.city)}">
      <span class="origins-name">${esc(o.city)}${PT_CITIES[normCity(o.city)] ? '' : ' <span class="muted small">(fora do mapa)</span>'}</span>
      <span class="origins-n">${o.n}</span><span class="origins-bar"><i style="width:${(o.n / max * 100).toFixed(1)}%"></i></span>
    </li>`).join('') || '<li class="muted">Ainda sem participantes.</li>'}</ol>`;
}

async function originsMap(el, origins, destinations) {
  try {
    const L = await loadLeaflet();
    await loadHeat();
    if (!el.isConnected) return null;
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView([39.6, -8], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const known = origins.map(o => ({ ...o, ll: PT_CITIES[normCity(o.city)] })).filter(o => o.ll);
    const max = Math.max(1, ...known.map(o => o.n));
    // uma só cor, do verde-claro ao verde-escuro: mais participantes, mais escuro
    L.heatLayer(known.map(o => [...o.ll, o.n]), {
      radius: 36, blur: 22, maxZoom: 8, max: max * .55, minOpacity: .5,
      gradient: { .25: '#C9E8B8', .5: '#7BC95A', .75: '#2F7D3E', 1: '#1E4A26' },
    }).addTo(map);
    // áreas invisíveis por cima do calor, para mostrar o detalhe ao passar ou tocar
    const markers = {};
    known.forEach(o => {
      markers[o.city] = L.circleMarker(o.ll, { radius: 16, opacity: 0, fillOpacity: 0 })
        .bindTooltip(`<b>${esc(o.city)}</b><br>${o.n} participante${o.n === 1 ? '' : 's'}`, { direction: 'top', className: 'map-tip' }).addTo(map);
    });
    const dests = destinations.filter(t => t.lat != null && t.lng != null);
    dests.forEach(t => L.circleMarker([t.lat, t.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#2A72B8', fillOpacity: 1 })
      .bindTooltip(`<b>${esc(t.name)}</b><br>Destino · ${t.n} participante${t.n === 1 ? '' : 's'}`, { direction: 'top', className: 'map-tip' }).addTo(map));
    const pts = [...known.map(o => o.ll), ...dests.map(t => [t.lat, t.lng])];
    if (pts.length) map.fitBounds(pts, { padding: [36, 36], maxZoom: 8 });
    // a lista ao lado acende a cidade no mapa
    $$('.origins-list [data-city]', el.closest('.card')).forEach(li => {
      const m = markers[li.dataset.city]; if (!m) return;
      li.addEventListener('mouseenter', () => m.openTooltip());
      li.addEventListener('mouseleave', () => m.closeTooltip());
      li.addEventListener('click', () => { map.flyTo(m.getLatLng(), 9, { duration: .8 }); m.openTooltip(); });
    });
    return map;
  } catch (e) {
    el.innerHTML = `<p class="muted small" style="padding:16px">${esc(e.message || 'Não foi possível mostrar o mapa.')}</p>`;
    return null;
  }
}
