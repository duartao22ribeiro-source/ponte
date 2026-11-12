'use strict';
/* Ponte · perfil e RGPD (exportar/apagar dados), comum a todos
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// ---------- Perfil (todos) ----------
async function profileView(main) {
  await refreshMe();
  const u = S.me;
  setHero('O meu perfil', u.email);
  const p = u.role === 'participante';
  main.innerHTML = `
    <div class="card"><form id="prof" novalidate>
      <div class="form-error hidden" role="alert"></div>
      <div class="field row" style="margin-bottom:18px">${avatar(u, 72)}
        <div><label class="btn secondary small" style="cursor:pointer">Mudar foto<input type="file" accept="image/*" id="photo-in" hidden></label>
        ${u.photo ? '<button type="button" class="btn ghost small" id="photo-rm">Remover</button>' : ''}</div></div>
      <div class="form-row">
        ${fieldHTML({ name: 'name', label: 'Nome', required: true }, u.name)}
        ${fieldHTML({ name: 'phone', label: 'Telemóvel', type: 'tel', optional: true }, u.phone)}
      </div>
      ${fieldHTML({ name: 'city', label: p ? 'Onde vives agora' : 'Onde vives', optional: true }, u.city)}
      ${u.role === 'anfitriao' ? fieldHTML({ name: 'bio', label: 'Apresentação curta (os participantes veem isto)', type: 'textarea', rows: 4 }, u.bio) : ''}
      ${p ? `<div class="form-row">
          ${fieldHTML({ name: 'work_situation', label: 'Situação profissional', type: 'select', options: Object.entries(WORK) }, u.work_situation)}
          ${fieldHTML({ name: 'remote_days', label: 'Dias de trabalho remoto por semana', type: 'select', options: [5, 4, 3, 2, 1].map(n => [n, n]) }, u.remote_days)}
        </div>
        ${fieldHTML({ name: 'household', label: 'Agregado familiar', type: 'textarea', rows: 2, optional: true, hint: 'Só se quiseres. Ajuda o anfitrião a pensar em escola e emprego para a família.' }, u.household)}
        ${fieldHTML({ name: 'move_interest', label: 'Quanto pensas em mudar-te para o interior? (1 a 5)', type: 'scale' }, u.move_interest)}` : ''}
      <button class="btn" type="submit">Guardar</button>
    </form></div>
    <div class="card"><h3>Palavra-passe</h3><form id="pw" novalidate>
      <div class="form-row">
        <label class="field"><span>Atual</span><input type="password" name="current_password" autocomplete="current-password"></label>
        <label class="field"><span>Nova</span><input type="password" name="new_password" autocomplete="new-password" minlength="8"></label>
      </div><button class="btn secondary" type="submit">Mudar palavra-passe</button></form></div>
    ${p ? `<div class="card"><h3>Os teus dados</h3>
      <p class="small muted">Deste o teu consentimento a ${fmtDate(u.consent_at)}. Os teus dados só são vistos pelo anfitrião do teu território e pela equipa da Rural Move.</p>
      <div class="row"><a class="btn secondary" href="/api/me/export" download>Descarregar os meus dados</a><button class="btn danger" id="del-acc">Apagar a minha conta</button></div></div>` : ''}
    <button class="btn ghost" id="logout">Terminar sessão</button>`;
  const form = $('#prof', main);
  let photo;
  $('#photo-in', main).onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    photo = await resizeImage(f, 320);
    act(() => api('/api/me', { method: 'PUT', body: { photo } }), 'Foto atualizada.').then(() => { S.shellRole = null; runRoute(); });
  };
  $('#photo-rm', main)?.addEventListener('click', () => act(() => api('/api/me', { method: 'PUT', body: { photo: null } }), 'Foto removida.').then(() => { S.shellRole = null; runRoute(); }));
  form.onsubmit = ev => {
    ev.preventDefault();
    const fields = ['name', 'phone', 'city', 'bio', 'work_situation', 'remote_days', 'household', 'move_interest'].filter(n => form.elements[n]).map(n => ({ name: n, type: n === 'remote_days' || n === 'move_interest' ? 'number' : 'text' }));
    act(() => api('/api/me', { method: 'PUT', body: readForm(form, fields) }), 'Perfil guardado.');
  };
  const pw = $('#pw', main);
  pw.onsubmit = ev => { ev.preventDefault(); act(() => api('/api/me', { method: 'PUT', body: { current_password: pw.current_password.value, new_password: pw.new_password.value } }), 'Palavra-passe alterada.'); };
  $('#logout', main).onclick = async () => { await api('/api/logout', { method: 'POST' }); S.me = null; location.hash = '#/entrar'; authView(); };
  $('#del-acc', main)?.addEventListener('click', () => openModal('Apagar a minha conta', `
    <p>Vamos apagar a tua conta e todos os teus dados: perfil, plano de mudança, diário, mensagens, decisão e testemunhos. Não é possível recuperar.</p>
    <p class="small muted">Se quiseres guardar uma cópia, descarrega primeiro os teus dados.</p>
    <form novalidate><div class="form-error hidden" role="alert"></div>
      <label class="field"><span>Confirma com a tua palavra-passe</span><input type="password" name="password" required></label>
      <button class="btn danger block" type="submit">Apagar tudo</button></form>`, (m) => {
    const f = $('form', m);
    f.onsubmit = async ev => {
      ev.preventDefault();
      try { await api('/api/me', { method: 'DELETE', body: { password: f.password.value } }); location.reload(); }
      catch (e) { const er = $('.form-error', f); er.textContent = e.message; er.classList.remove('hidden'); }
    };
  }));
}
