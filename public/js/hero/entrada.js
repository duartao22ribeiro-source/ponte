'use strict';
/* Ponte · hero, entrar e criar conta
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// Luz suave que segue o cursor na hero (só em ecrãs com rato).
function bindHeroLight() {
  const hero = $('.auth-hero');
  if (!hero) return;
  $('[data-to-form]', hero)?.addEventListener('click', () => $('.auth-body').scrollIntoView({ behavior: 'smooth' }));
  if (!matchMedia('(hover: hover)').matches) return;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

// ======================================================================
// Entrar / criar conta
// ======================================================================
const DEMO = [
  ['marta@exemplo.pt', 'Marta Lopes', 'Participante · Preparar'],
  ['rui@exemplo.pt', 'Rui Teixeira', 'Participante · Integrar'],
  ['sofia@exemplo.pt', 'Sofia Antunes', 'Participante · Mudar'],
  ['tiago@exemplo.pt', 'Tiago Moreira', 'Participante · Decidir'],
  ['anfitria@ruralmove.demo', 'Leonor Ferreira', 'Anfitriã'],
  ['equipa@ruralmove.demo', 'Equipa Rural Move', 'Administração'],
];

// ---------- entrar com Google ou Apple (versão de demonstração) ----------
// Não liga a contas reais: abre uma janela com contas fictícias. No login entra com a escolhida;
// no registo preenche o nome e o e-mail. Para ligar a sério é preciso configurar OAuth no servidor.
const SOCIAL = {
  google: { label: 'Google', icon: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>' },
  apple: { label: 'Apple', icon: '<svg viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>' },
};
// pessoas fictícias novas, para experimentar o registo
const DEMO_NEW = [
  ['ines.carvalho@exemplo.pt', 'Inês Carvalho', ''],
  ['joao.pires@exemplo.pt', 'João Pires', ''],
];
function socialHTML() {
  return `<div class="social-login">${Object.entries(SOCIAL).map(([k, s]) => `<button type="button" class="btn social ${k}" data-social="${k}">${s.icon}Continuar com ${s.label}</button>`).join('')}</div>
    <div class="auth-divider"><span>ou com e-mail</span></div>`;
}
function bindSocial(accounts, onPick) {
  $$('[data-social]').forEach(b => b.onclick = () => {
    const s = SOCIAL[b.dataset.social];
    openModal(`Continuar com ${s.label}`, `
      <p class="notice">Demonstração: aqui escolherias a tua conta ${s.label}. Nesta versão usamos contas fictícias da Ponte e não é pedida nenhuma palavra-passe.</p>
      <ul class="list account-pick">${accounts.map(([e, n, r]) => `<li><button type="button" data-pick="${esc(e)}">${avatar({ name: n }, 40)}<span><b>${esc(n)}</b><span class="small muted">${esc(r || e)}</span></span></button></li>`).join('')}</ul>`,
    (m, close) => $$('[data-pick]', m).forEach(p => p.onclick = () => { close(); onPick(accounts.find(a => a[0] === p.dataset.pick)); }));
  });
}

async function authView() {
  S.shellRole = null;
  document.body.classList.add('auth-page');
  const register = location.hash.startsWith('#/registo');
  document.title = register ? 'Criar conta · Ponte' : 'Entrar · Ponte';
  const hero = `<section class="auth-hero">
      <div class="hero-top">
        <div class="row" style="gap:12px"><img src="/icons/ponte.svg" width="44" height="44" alt=""><div><div class="brand-name">Ponte</div><div class="brand-sub">Rural Move</div></div></div>
      </div>
      <div class="hero-copy">
        <h1>Da primeira estadia <em>à decisão de ficar.</em></h1>
        <p>Um anfitrião que vive na aldeia acompanha-te antes de chegares, durante a estadia e até seis meses depois.</p>
        <button type="button" class="btn hero-cta" data-to-form>${register ? 'Criar conta' : 'Entrar'} <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>
      </div>
    </section>`;

  if (!register) {
    $('#root').innerHTML = `<div class="auth">${hero}<section class="auth-body">
      <h2>Entrar</h2>
      ${socialHTML()}
      <form id="login" novalidate>
        <div class="form-error hidden" role="alert"></div>
        <label class="field"><span>E-mail</span><input type="email" name="email" autocomplete="email" required></label>
        <label class="field"><span>Palavra-passe</span><input type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn block" type="submit">Entrar</button>
      </form>
      <p class="muted" style="margin-top:16px;text-align:center">Inscreveste-te numa Rural Experience? <a href="#/registo">Cria a tua conta</a></p>
      <div class="card flat" style="margin-top:24px">
        <div class="eyebrow">Demonstração</div>
        <p class="small muted">Contas fictícias do território-piloto de Miranda do Douro. Palavra-passe: <b>ponte2026</b></p>
        <div class="demo-accounts">${DEMO.map(([e, n, r]) => `<button type="button" data-demo="${e}"><b>${esc(n)}</b><span class="muted">${esc(r)}</span></button>`).join('')}</div>
      </div>
    </section></div>`;
    bindHeroLight();
    const form = $('#login');
    const doLogin = async (email, password) => {
      const err = $('.form-error', form);
      try { await api('/api/login', { method: 'POST', body: { email, password } }); location.hash = '#/'; await boot(); }
      catch (e) { err.textContent = e.message; err.classList.remove('hidden'); }
    };
    form.onsubmit = e => { e.preventDefault(); doLogin(form.email.value, form.password.value); };
    $$('[data-demo]').forEach(b => b.onclick = () => { form.email.value = b.dataset.demo; form.password.value = 'ponte2026'; doLogin(b.dataset.demo, 'ponte2026'); });
    bindSocial(DEMO, ([email]) => doLogin(email, 'ponte2026'));
    return;
  }

  let editions = [];
  try { editions = await api('/api/editions/open'); } catch { /* sem edições */ }
  $('#root').innerHTML = `<div class="auth">${hero}<section class="auth-body">
    <a href="#/entrar" class="btn ghost small" style="margin-left:-10px">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Voltar</a>
    <h2 style="margin-top:8px">Criar conta</h2>
    <p class="muted">Usa o e-mail com que te inscreveste na Rural Experience.</p>
    ${socialHTML()}
    <form id="reg" novalidate>
      <div class="form-error hidden" role="alert"></div>
      <label class="field"><span>Nome</span><input name="name" autocomplete="name" required></label>
      <label class="field"><span>E-mail</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="field"><span>Palavra-passe</span><input type="password" name="password" autocomplete="new-password" minlength="8" required><small class="muted">Pelo menos 8 caracteres.</small></label>
      <div class="form-row">
        <label class="field"><span>Telemóvel <i class="muted">(opcional)</i></span><input type="tel" name="phone" autocomplete="tel"></label>
        <label class="field"><span>Onde vives agora</span><input name="city" placeholder="Ex.: Lisboa"></label>
      </div>
      <label class="field"><span>Edição em que te inscreveste</span><select name="edition_id" required>
        ${editions.length ? editions.map(e => `<option value="${e.id}">${esc(e.name)} · ${fmtShort(e.start_date)} a ${fmtShort(e.end_date)}</option>`).join('') : '<option value="">Não há edições abertas</option>'}
      </select></label>
      <h3 style="margin-top:22px">O teu trabalho</h3>
      <div class="form-row">
        <label class="field"><span>Situação profissional</span><select name="work_situation">${Object.entries(WORK).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label class="field"><span>Dias de trabalho remoto por semana</span><select name="remote_days">${[5, 4, 3, 2, 1].map(n => `<option>${n}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Agregado familiar <i class="muted">(opcional)</i></span><textarea name="household" rows="2" placeholder="Ex.: companheiro e um filho de 5 anos"></textarea><small class="muted">Só se quiseres. Ajuda o anfitrião a pensar em escola e emprego para a tua família.</small></label>
      <div class="field" style="margin-bottom:18px"><span class="muted small" style="display:block;margin-bottom:8px">Hoje, quanto pensas em mudar-te para o interior?</span>${scaleHTML('move_interest', 3, ['Nada', 'Muito'])}</div>
      <label class="check"><input type="checkbox" name="consent" required><span>Aceito que a Rural Move trate os meus dados pessoais para gerir a minha participação e o acompanhamento da Ponte para a Fixação. Os meus dados só são partilhados com o anfitrião do meu território e com a equipa da Rural Move. Posso descarregar ou apagar os meus dados a qualquer momento no meu perfil.</span></label>
      <button class="btn block" type="submit">Criar conta</button>
    </form></section></div>`;
  bindHeroLight();
  const form = $('#reg');
  bindSocial(DEMO_NEW, ([email, name]) => { form.elements.name.value = name; form.elements.email.value = email; form.elements.password.focus(); toast('Nome e e-mail preenchidos. Escolhe uma palavra-passe.'); });
  form.onsubmit = async e => {
    e.preventDefault();
    const err = $('.form-error', form);
    const d = readForm(form);
    d.consent = form.consent.checked;
    try {
      await api('/api/register', { method: 'POST', body: d });
      location.hash = '#/'; await boot(); toast('Bem-vindo à Ponte!');
    } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); err.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
}
