'use strict';
/* Ponte · decisão final e testemunho de embaixador
   Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md) */

// ---------- Fase 4: Decidir ----------
async function pDecidir(main) {
  const d = await overview();
  const e = d.enrollment, dec = d.decision, tm = d.my_testimonial;
  setHero('Decidir', d.followup ? `Fim do acompanhamento: ${fmtDate(d.followup.end)}` : '', 'Fase 4 · Depois');
  let html = phaseIndex(e.phase) < 3 && !dec ? `<div class="notice">Esta fase chega no fim do acompanhamento${d.followup ? ` (${fmtDate(d.followup.end)})` : ''}. Se já sabes o que vais fazer, podes registar a tua decisão agora.</div>` : '';
  if (dec) {
    html += `<div class="card dark"><div class="eyebrow" style="color:var(--accent)">A tua decisão</div><h2>${esc(DECISIONS[dec.choice].label)}</h2>
      ${dec.choice === 'mudei' ? `<p class="muted" style="margin:0">${dec.locality ? `Em ${esc(dec.locality)} · ` : ''}desde ${fmtDate(dec.moved_at)}</p>` : ''}
      ${dec.ambassador && dec.choice !== 'embaixador' ? '<p class="muted" style="margin:6px 0 0">E também queres ser embaixador.</p>' : ''}
      ${dec.notes ? `<p style="margin:10px 0 0">${esc(dec.notes)}</p>` : ''}
      <p class="small muted" style="margin:14px 0 0">Obrigado por teres feito este caminho connosco.</p></div>`;
    if (tm) html += `<div class="card"><div class="row between"><h3 style="margin:0">O teu testemunho</h3>${chip(tm.status)}</div><p class="quote" style="margin-top:12px">${esc(tm.body)}</p>
      ${tm.status === 'pendente' ? '<p class="small muted" style="margin:0">A equipa da Rural Move vai rever o texto antes de o publicar.</p>' : tm.status === 'aprovado' ? '<p class="small muted" style="margin:0">Já está publicado para quem está a preparar a sua estadia.</p>' : ''}</div>`;
  }
  const v = dec || { choice: '', ambassador: 0 };
  html += `<div class="card"><h2>${dec ? 'Alterar a decisão' : 'O que decidiste?'}</h2>
    <form id="dec-form" novalidate>
      <div class="form-error hidden" role="alert"></div>
      <div class="options" role="radiogroup">${Object.entries(DECISIONS).map(([k, x]) => `<label class="option"><input type="radio" name="choice" value="${k}" ${v.choice === k ? 'checked' : ''}><span><strong>${x.label}</strong><span class="small muted">${x.desc}</span></span></label>`).join('')}</div>
      <div data-show="mudei" class="form-row" style="margin-top:16px">
        <label class="field"><span>Data da mudança</span><input type="date" name="moved_at" value="${esc(v.moved_at || todayISO())}"></label>
        <label class="field"><span>Aldeia ou localidade</span><input name="locality" value="${esc(v.locality || '')}" placeholder="Ex.: Sendim"></label>
      </div>
      <label class="check" data-show="mudei visitas" style="margin-top:16px"><input type="checkbox" name="ambassador" ${v.ambassador ? 'checked' : ''}><span>Também quero ser embaixador e contar a minha experiência</span></label>
      <div data-show-amb style="margin-top:16px">
        <label class="field"><span>O teu testemunho</span><textarea name="testimonial" rows="5" placeholder="Como foi a experiência? O que ajudou mais?">${esc(tm && tm.status !== 'aprovado' ? tm.body : '')}</textarea><small class="muted">Fica pendente até a equipa da Rural Move o aprovar. Depois aparece a quem está a preparar a estadia.</small></label>
        <label class="field"><span>Como te apresentas</span><input name="author_role" value="${esc(tm?.author_role || '')}" placeholder="Ex.: Designer, mudou-se para Sendim"></label>
      </div>
      <label class="field" style="margin-top:6px"><span>Queres acrescentar alguma coisa? <i class="muted">(opcional)</i></span><textarea name="notes" rows="2">${esc(v.notes || '')}</textarea></label>
      <button class="btn" type="submit">${dec ? 'Guardar alterações' : 'Registar decisão'}</button>
    </form></div>`;
  main.innerHTML = html;
  const form = $('#dec-form', main);
  const sync = () => {
    const c = form.querySelector('input[name=choice]:checked')?.value;
    $$('[data-show]', form).forEach(el => el.classList.toggle('hidden', !el.dataset.show.split(' ').includes(c)));
    $('[data-show-amb]', form).classList.toggle('hidden', !(c === 'embaixador' || ((c === 'mudei' || c === 'visitas') && form.ambassador.checked)));
  };
  form.addEventListener('change', sync); sync();
  form.onsubmit = ev => {
    ev.preventDefault();
    const val = readForm(form);
    const err = $('.form-error', form);
    if (!val.choice) { err.textContent = 'Escolhe uma opção.'; err.classList.remove('hidden'); return; }
    if (val.choice === 'embaixador' && !val.testimonial) { err.textContent = 'Escreve o teu testemunho.'; err.classList.remove('hidden'); return; }
    act(() => api('/api/p/decision', { method: 'POST', body: val }), 'Decisão registada. Obrigado!');
  };
}
