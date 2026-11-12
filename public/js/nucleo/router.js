'use strict';
/* Ponte · estrutura da app (menu, topo) e navegação
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// ======================================================================
// Router e estrutura
// ======================================================================

function matchRoute(role, path) {
  for (const r of NAV[role]) {
    const keys = [];
    const re = new RegExp('^' + r.path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    const m = path.match(re);
    if (m) return { r, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}
const currentPath = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];
const go = path => { location.hash = '#' + path; };

function renderShell() {
  const role = S.me.role;
  const items = NAV[role].filter(i => i.label && i.hidden !== true);
  const roleLabel = { participante: 'Participante', anfitriao: 'Anfitrião', admin: 'Equipa Rural Move' }[role];
  $('#root').innerHTML = `<div class="app">
    <aside class="sidenav">
      <a class="brand" href="#/"><img src="/icons/icon.svg" alt="" width="36" height="36" style="border-radius:10px"><span><span class="brand-name">Ponte</span><br><span class="brand-sub">Rural Move</span></span></a>
      <nav>${items.map(i => `<a href="#${i.path}" data-nav="${i.path}">${ICON[i.icon]}<span>${esc(i.label)}</span>${i.badge || i.path === '/conversa' ? '<span class="badge-dot hidden" data-unread></span>' : ''}</a>`).join('')}</nav>
      <div class="side-foot">${avatar(S.me, 30)} <a href="#/perfil" style="color:inherit">${esc(S.me.name)}</a><br><span class="small">${roleLabel}</span></div>
      ${hills('#3F6038')}
    </aside>
    <div class="content">
      <header class="topbar">
        <div class="topbar-row">
          <a class="brand" href="#/"><img src="/icons/icon.svg" alt="" width="32" height="32" style="border-radius:9px"><span class="brand-name">Ponte</span></a>
          <span class="spacer"></span>
          ${role === 'participante' ? `<a class="icon-btn" href="#/conversa" aria-label="Conversa com o anfitrião">${ICON.chat}<span class="badge-dot hidden" data-unread></span></a>` : ''}
          <a class="icon-btn" href="#/perfil" aria-label="O meu perfil" style="padding:0;overflow:hidden">${avatar(S.me, 40)}</a>
        </div>
        <div class="topbar-hero"><div class="eyebrow" style="color:var(--accent)" id="hero-eyebrow"></div><h1 id="hero-title"></h1><p id="hero-sub"></p></div>
        <span class="orb o1" aria-hidden="true"></span><span class="orb o2" aria-hidden="true"></span>
        ${landscape()}
      </header>
      <main id="main" tabindex="-1"></main>
    </div>
    <nav class="bottomnav" aria-label="Navegação">${items.filter(i => i.hidden !== 'mobile').map(i => `<a href="#${i.path}" data-nav="${i.path}"><span class="nav-ico">${ICON[i.icon]}</span><span class="nav-label">${esc(i.label)}</span>${i.badge ? '<span class="badge-dot hidden" data-unread style="top:0;right:calc(50% - 26px)"></span>' : ''}</a>`).join('')}</nav>
  </div>`;
  S.shellRole = role;
  document.body.classList.remove('auth-page');
  if (items.filter(i => i.hidden !== 'mobile').length > 5) $('.bottomnav').classList.add('many');
}

function setHero(title, sub = '', eyebrow = '') {
  $('#hero-title').textContent = title;
  $('#hero-sub').textContent = sub;
  $('#hero-eyebrow').textContent = eyebrow;
  document.title = `${title} · Ponte`;
}

function updateBadges() {
  $$('[data-unread]').forEach(b => { b.textContent = S.unread; b.classList.toggle('hidden', !S.unread); });
}
async function refreshMe() {
  try { const d = await api('/api/me'); if (d.user) { S.me = d.user; S.unread = d.unread; S.territory = d.territory; updateBadges(); } } catch { /* ignora */ }
}

async function runRoute() {
  S.cleanup.forEach(fn => fn()); S.cleanup = [];
  if (!S.me) return;
  if (S.shellRole !== S.me.role) renderShell();
  const path = currentPath();
  const m = matchRoute(S.me.role, path) || matchRoute(S.me.role, '/');
  S.route = m;
  $$('[data-nav]').forEach(a => {
    const active = a.dataset.nav === m.r.path || (a.dataset.nav !== '/' && path.startsWith(a.dataset.nav));
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const main = $('#main');
  main.innerHTML = '<div class="loading"><div class="spinner"></div>A carregar…</div>';
  window.scrollTo(0, 0);
  await renderView(main, m);
  refreshMe();
}
async function renderView(main, m) {
  try { await m.r.view(main, m.params); bindTabs(main); }
  catch (e) { main.innerHTML = `<div class="card">${emptyState(esc(e.message))}</div>`; }
}
async function reload() {
  if (!S.route) return;
  S.cleanup.forEach(fn => fn()); S.cleanup = [];
  const y = window.scrollY;
  await renderView($('#main'), S.route);
  window.scrollTo(0, y);
}

async function boot() {
  try {
    const d = await api('/api/me');
    S.me = d.user; S.unread = d.unread || 0; S.territory = d.territory;
  } catch { S.me = null; }
  S.shellRole = null;
  if (!S.me) return authView();
  if (location.hash.startsWith('#/registo') || location.hash.startsWith('#/entrar')) location.hash = '#/';
  await runRoute();
}
