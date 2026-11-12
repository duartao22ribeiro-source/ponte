'use strict';
/* Ponte · hero, entrar e criar conta
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// Paisagem da hero: colinas em camadas, sol e a ponte entre duas encostas.
function landscape(cls = 'landscape') {
  return `<svg class="${cls}" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <radialGradient id="ls-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F4F1E8" stop-opacity=".55"/><stop offset=".35" stop-color="#F4F1E8" stop-opacity=".16"/><stop offset="1" stop-color="#F4F1E8" stop-opacity="0"/></radialGradient>
      <linearGradient id="ls-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4888B0"/><stop offset="1" stop-color="#3B6F92"/></linearGradient>
      <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58C0E0"/><stop offset="1" stop-color="#4AA3C2"/></linearGradient>
      <linearGradient id="ls-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DCC5D"/><stop offset="1" stop-color="#5E9450"/></linearGradient>
      <linearGradient id="ls-brand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C7343"/><stop offset="1" stop-color="#3F6038"/></linearGradient>
    </defs>
    <circle class="ls-sun" cx="880" cy="120" r="150" fill="url(#ls-sun)"/>
    <circle cx="880" cy="120" r="34" fill="#F4F1E8" opacity=".85"/>
    <path class="ls-l1" d="M-100 170 C80 120 230 150 380 165 S700 110 860 140 S1150 120 1300 150 V360 H-100Z" fill="url(#ls-blue)" opacity=".75"/>
    <path class="ls-l2" d="M-100 205 C120 170 260 200 420 210 S720 175 900 195 S1160 180 1300 195 V360 H-100Z" fill="url(#ls-sky)" opacity=".9"/>
    <g class="ls-bridge" fill="none" stroke="#F4F1E8" stroke-linecap="round" opacity=".9">
      <path d="M430 232 H770" stroke-width="3"/>
      <path d="M455 262 Q600 150 745 262" stroke-width="2.5"/>
      <path d="M520 232 V203 M560 232 V184 M600 232 V178 M640 232 V184 M680 232 V203" stroke-width="1.5" opacity=".75"/>
    </g>
    <path class="ls-l3" d="M-100 245 C60 220 230 238 420 252 C470 256 450 280 520 290 S760 250 900 238 S1160 222 1300 232 V360 H-100Z" fill="url(#ls-green)"/>
    <path class="ls-l4" d="M-100 285 C140 262 330 286 540 296 S880 270 1060 280 S1220 276 1300 280 V360 H-100Z" fill="url(#ls-brand)"/>
    <path class="ls-l5" d="M-100 322 C200 306 420 324 640 328 S1020 312 1300 318 V360 H-100Z" fill="#2B4426"/>
  </svg>`;
}
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

async function authView() {
  S.shellRole = null;
  document.body.classList.add('auth-page');
  const register = location.hash.startsWith('#/registo');
  document.title = register ? 'Criar conta · Ponte' : 'Entrar · Ponte';
  const hero = `<section class="auth-hero">
      <div class="hero-top">
        <div class="row" style="gap:12px"><img src="/icons/icon.svg" width="44" height="44" alt="" style="border-radius:12px"><div><div class="brand-name">Ponte</div><div class="brand-sub">Rural Move</div></div></div>
        <span class="hero-pill glass-edge"><i></i>Ponte para a Fixação</span>
      </div>
      <div class="hero-copy">
        <h1>Da primeira estadia <em>à decisão de ficar.</em></h1>
        <p>Um anfitrião que vive na aldeia acompanha-te antes de chegares, durante a estadia e até seis meses depois.</p>
        <ol class="hero-steps">${PHASES.map((ph, i) => `<li><b>0${i + 1}</b>${esc(ph.label)}</li>`).join('')}</ol>
        <button type="button" class="btn hero-cta" data-to-form>${register ? 'Criar conta' : 'Entrar'} <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>
      </div>
      <span class="orb o1" aria-hidden="true"></span><span class="orb o2" aria-hidden="true"></span><span class="orb o3" aria-hidden="true"></span>
      <div class="hero-chat glass-edge sheen" aria-hidden="true">
        <div class="row" style="gap:10px"><span class="avatar" style="width:32px;height:32px;font-size:.75rem">LF</span><div><b>Leonor</b><div class="small">Anfitriã · Sendim</div></div></div>
        <p>Bem-vinda a Sendim! Amanhã há feira no largo, passo aí às 10h.</p>
      </div>
      <div class="hero-peek glass-edge sheen" aria-hidden="true">
        <div class="row between"><span class="small">Plano de mudança</span><span class="chip phase-mudar">Mudar</span></div>
        <div class="peek-num">44%</div>
        <div class="progress thin"><i style="width:44%"></i></div>
        <div class="peek-row"><span class="peek-dot"></span>Próxima: entrevista na cooperativa</div>
        <div class="peek-row"><span class="peek-dot blue"></span>Visita de regresso confirmada</div>
      </div>
      <dl class="hero-stats glass-edge sheen">
        <div><dt>2 a 4</dt><dd>semanas a viver na aldeia</dd></div>
        <div><dt>6</dt><dd>meses de acompanhamento</dd></div>
        <div><dt>1</dt><dd>anfitrião local contigo</dd></div>
      </dl>
      ${landscape('landscape hero-land')}
    </section>`;

  if (!register) {
    $('#root').innerHTML = `<div class="auth">${hero}<section class="auth-body">
      <h2>Entrar</h2>
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
    return;
  }

  let editions = [];
  try { editions = await api('/api/editions/open'); } catch { /* sem edições */ }
  $('#root').innerHTML = `<div class="auth">${hero}<section class="auth-body">
    <a href="#/entrar" class="btn ghost small" style="margin-left:-10px">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Voltar</a>
    <h2 style="margin-top:8px">Criar conta</h2>
    <p class="muted">Usa o e-mail com que te inscreveste na Rural Experience.</p>
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
