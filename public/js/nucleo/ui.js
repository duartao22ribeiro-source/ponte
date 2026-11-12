'use strict';
/* Ponte · componentes partilhados: colinas, API, avisos, modais, formulários, separadores
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// ---------- elemento gráfico: colinas em camadas ----------
function hills(last = 'var(--cream)', cls = 'hills') {
  return `<svg class="${cls}" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 38 C240 18 420 30 640 40 S1080 20 1440 30 V100 H0Z" fill="#4888B0"/>
    <path d="M0 52 C260 36 470 50 700 56 S1110 38 1440 46 V100 H0Z" fill="#58C0E0"/>
    <path d="M0 66 C300 52 520 66 760 70 S1150 56 1440 62 V100 H0Z" fill="#5E9450"/>
    <path d="M0 82 C320 70 560 84 800 86 S1180 74 1440 78 V100 H0Z" fill="${last}"/>
  </svg>`;
}

function emptyState(text, action = '') {
  return `<div class="empty">
    <svg viewBox="0 0 240 70" aria-hidden="true">
      <path d="M0 40 C50 25 90 32 130 38 S200 28 240 34 V70 H0Z" fill="#4888B0" opacity=".5"/>
      <path d="M0 50 C60 40 110 48 150 52 S210 44 240 48 V70 H0Z" fill="#58C0E0" opacity=".6"/>
      <path d="M0 60 C70 52 120 60 170 62 S220 56 240 58 V70 H0Z" fill="#7DCC5D" opacity=".8"/>
    </svg>
    <p>${text}</p>${action}</div>`;
}
const HOUSE_TINTS = { pedra: ['#C9B79C', '#8C7A62'], centro: ['#E7DCC6', '#B5A381'], ruina: ['#B9A991', '#7A6C58'], moradia: ['#F1ECE0', '#C8BEA8'] };
function houseArt(key, id) {
  const keys = Object.keys(HOUSE_TINTS);
  const [wall, roof] = HOUSE_TINTS[key] || HOUSE_TINTS[keys[(id || 0) % keys.length]];
  return `<svg class="ph" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="320" height="180" fill="#DCEEF5"/>
    <path d="M0 110 C80 90 150 100 220 105 S300 95 320 98 V180 H0Z" fill="#4888B0" opacity=".55"/>
    <path d="M0 128 C90 112 170 122 240 126 S300 118 320 120 V180 H0Z" fill="#7DCC5D"/>
    <path d="M0 150 C90 140 190 150 320 142 V180 H0Z" fill="#3F6038"/>
    <rect x="118" y="86" width="84" height="56" fill="${wall}"/>
    <path d="M110 90 L160 58 L210 90 Z" fill="${roof}"/>
    <rect x="152" y="112" width="16" height="30" fill="#24361F" opacity=".8"/>
    <rect x="128" y="100" width="14" height="12" fill="#F4F1E8"/><rect x="178" y="100" width="14" height="12" fill="#F4F1E8"/>
  </svg>`;
}

function avatar(u, size = 44) {
  const initials = String(u?.name || '?').replace(/\(.*\)/, '').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const inner = u?.photo && String(u.photo).startsWith('data:image') ? `<img src="${esc(u.photo)}" alt="">` : esc(initials);
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .38)}px">${inner}</span>`;
}

// ---------- API ----------
async function api(path, { method = 'GET', body } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (method !== 'GET') { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body ?? {}); }
  let res;
  try { res = await fetch(path, opts); } catch { throw new Error('Sem ligação à internet. Tenta outra vez.'); }
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) {
    if (res.status === 401 && S.me) { S.me = null; boot(); }
    throw new Error(data?.error || 'Ocorreu um erro.');
  }
  return data;
}

function toast(msg, type = '') {
  $$('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// Executa uma ação, mostra mensagem e volta a desenhar a vista
async function act(fn, ok) {
  try { await fn(); if (ok) toast(ok); await reload(); }
  catch (e) { toast(e.message, 'error'); }
}

// ---------- modal / formulários ----------
function openModal(title, html, onMount) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" style="background:var(--soft);color:var(--dark)" data-close aria-label="Fechar">${ICON.close}</button></div>
    <div class="modal-body">${html}</div></div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  onMount?.($('.modal', back), close);
  setTimeout(() => $('.modal input:not([type=hidden]), .modal textarea, .modal select', back)?.focus(), 50);
  return close;
}

function fieldHTML(f, v) {
  const val = v ?? f.default ?? '';
  const req = f.required ? 'required' : '';
  const attrs = `name="${f.name}" id="f-${f.name}" ${req} ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
  const label = `<span>${esc(f.label)}${f.required ? '' : f.optional ? ' <i class="muted">(opcional)</i>' : ''}</span>`;
  const hint = f.hint ? `<small class="muted" style="display:block;margin-top:4px">${esc(f.hint)}</small>` : '';
  switch (f.type) {
    case 'textarea': return `<label class="field">${label}<textarea ${attrs} rows="${f.rows || 4}">${esc(val)}</textarea>${hint}</label>`;
    case 'select': return `<label class="field">${label}<select ${attrs}>${f.options.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${hint}</label>`;
    case 'checkbox': return `<label class="check"><input type="checkbox" name="${f.name}" ${val ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
    case 'photo': return `<div class="field" style="margin-bottom:14px"><span class="muted small" style="display:block;margin-bottom:6px">${esc(f.label)} <i>(opcional)</i></span>
        <div class="row"><img data-photo-preview src="${esc(val)}" alt="" style="width:96px;height:64px;object-fit:cover;border-radius:10px;background:var(--soft);${val ? '' : 'display:none'}">
        <label class="btn secondary small" style="cursor:pointer">Escolher foto<input type="file" accept="image/*" data-photo-input hidden></label>
        ${val ? '<button type="button" class="btn ghost small" data-photo-clear>Remover</button>' : ''}</div>
        <input type="hidden" name="${f.name}" value="${esc(val)}"></div>`;
    case 'scale': return `<div class="field" style="margin-bottom:16px"><span class="muted small" style="display:block;margin-bottom:8px">${esc(f.label)}</span>${scaleHTML(f.name, val)}</div>`;
    default: return `<label class="field">${label}<input type="${f.type || 'text'}" ${attrs} value="${esc(val)}">${hint}</label>`;
  }
}
function scaleHTML(name, val, legend = ['Nada', 'Muito']) {
  return `<div class="scale" role="radiogroup">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="${name}" value="${n}" ${Number(val) === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
    <div class="scale-legend"><span>${legend[0]}</span><span>${legend[1]}</span></div>`;
}

function readForm(form, fields) {
  const fd = new FormData(form);
  const out = {};
  const names = fields ? fields.map(f => f.name) : Array.from(new Set(Array.from(form.elements).map(e => e.name).filter(Boolean)));
  for (const name of names) {
    const f = fields?.find(x => x.name === name);
    const el = form.elements[name];
    if ((f && f.type === 'checkbox') || el?.type === 'checkbox') { out[name] = !!el?.checked; continue; }
    let v = fd.get(name);
    if (v == null) { out[name] = null; continue; }
    v = String(v).trim();
    if (f && (f.type === 'number' || f.type === 'scale')) out[name] = v === '' ? null : Number(v);
    else out[name] = v === '' ? null : v;
  }
  return out;
}

async function resizeImage(file, max = 900) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .82);
  } finally { URL.revokeObjectURL(url); }
}
function bindPhotoInputs(root, max) {
  $$('[data-photo-input]', root).forEach(inp => {
    const box = inp.closest('.field');
    inp.onchange = async () => {
      const file = inp.files[0]; if (!file) return;
      try {
        const data = await resizeImage(file, max);
        $('input[type=hidden]', box).value = data;
        const img = $('[data-photo-preview]', box); img.src = data; img.style.display = '';
      } catch { toast('Não foi possível ler a imagem.', 'error'); }
    };
  });
  $$('[data-photo-clear]', root).forEach(b => b.onclick = () => {
    const box = b.closest('.field'); $('input[type=hidden]', box).value = ''; $('[data-photo-preview]', box).style.display = 'none'; b.remove();
  });
}

// Formulário genérico num modal
function openForm({ title, fields, values = {}, submit = 'Guardar', intro = '', onSubmit, onDelete, deleteLabel = 'Apagar' }) {
  const html = `${intro ? `<p class="muted">${intro}</p>` : ''}<form novalidate>
    <div class="form-error hidden" role="alert"></div>
    ${fields.map(f => f.row ? `<div class="form-row">${f.row.map(x => fieldHTML(x, values[x.name])).join('')}</div>` : fieldHTML(f, values[f.name])).join('')}
    <div class="row between" style="margin-top:8px">
      ${onDelete ? `<button type="button" class="btn danger" data-delete>${esc(deleteLabel)}</button>` : '<span></span>'}
      <button class="btn" type="submit">${esc(submit)}</button>
    </div></form>`;
  const flat = fields.flatMap(f => f.row || [f]);
  return openModal(title, html, (modal, close) => {
    const form = $('form', modal);
    bindPhotoInputs(modal, flat.find(f => f.type === 'photo')?.max || 900);
    form.onsubmit = async e => {
      e.preventDefault();
      const err = $('.form-error', form);
      const missing = flat.filter(f => f.required && !String(form.elements[f.name]?.value || '').trim());
      if (missing.length) { err.textContent = `Falta preencher: ${missing.map(f => f.label).join(', ')}.`; err.classList.remove('hidden'); return; }
      const btn = $('button[type=submit]', form); btn.disabled = true;
      try { await onSubmit(readForm(form, flat)); close(); await reload(); }
      catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); btn.disabled = false; }
    };
    if (onDelete) $('[data-delete]', form).onclick = async () => {
      if (!confirm('Tens a certeza? Esta ação não pode ser desfeita.')) return;
      try { await onDelete(); close(); toast('Apagado.'); await reload(); } catch (ex) { toast(ex.message, 'error'); }
    };
  });
}

// Tabs simples, com memória por vista
function tabsHTML(key, tabs, def) {
  const cur = S.tab[key] && tabs.some(t => t[0] === S.tab[key]) ? S.tab[key] : def || tabs[0][0];
  S.tab[key] = cur;
  return `<div class="tabs" role="tablist" data-tabs="${key}">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'active' : ''}" data-tab="${k}">${esc(l)}</button>`).join('')}</div>`;
}
function bindTabs(root) {
  S.tabFrom = S.tabFrom || {};
  $$('[data-tabs]', root).forEach(t => {
    const key = t.dataset.tabs;
    placeTabIndicator(t, S.tabFrom[key]);
    S.tabFrom[key] = null;
    t.addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (!b || b.classList.contains('active')) return;
      const cur = $('[data-tab].active', t);
      if (cur) S.tabFrom[key] = { x: cur.offsetLeft, w: cur.offsetWidth }; // o indicador parte daqui
      S.tab[key] = b.dataset.tab;
      const main = $('#main'); enterMotion(main); reload().then(() => enterMotion(main, true));
    });
  });
}
// Pastilha que desliza para o separador ativo (css/movimento.css). Como o ecrã é redesenhado
// ao trocar de separador, parte da posição do separador anterior e anima até ao novo.
function placeTabIndicator(t, from) {
  const act = $('[data-tab].active', t); if (!act) return;
  const set = r => { t.style.setProperty('--tab-x', `${r.x}px`); t.style.setProperty('--tab-w', `${r.w}px`); };
  t.classList.add('has-indicator');
  if (from) { t.classList.add('no-anim'); set(from); void t.offsetWidth; t.classList.remove('no-anim'); }
  set({ x: act.offsetLeft, w: act.offsetWidth });
}
