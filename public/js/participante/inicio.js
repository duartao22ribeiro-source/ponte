'use strict';
/* Ponte · início do participante e cartões comuns às fases
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// ======================================================================
// PARTICIPANTE
// ======================================================================
async function overview() { return api('/api/p/overview'); }

function journeyHTML(phase, linkable = true) {
  const idx = phaseIndex(phase);
  return `<div class="journey">${PHASES.map((p, i) => `<${linkable ? `a href="#/${p.key}"` : 'div'} class="step ${i < idx ? 'done' : i === idx ? 'current' : ''}">
    <div class="bar"></div><div class="label">${p.label}</div><div class="when">${p.when}</div></${linkable ? 'a' : 'div'}>`).join('')}</div>`;
}

function hostCard(host, compact = false) {
  if (!host) return '';
  return `<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:center">
    ${avatar(host, compact ? 52 : 64)}
    <div style="flex:1;min-width:0"><div class="eyebrow" style="margin:0">O teu anfitrião</div><h3 style="margin:2px 0 0">${esc(host.name)}</h3><div class="small muted">${esc(host.city || '')}</div></div>
    </div>
    <div class="row" style="margin-top:14px">
      <a class="btn small" href="#/conversa">${ICON.chat.replace('<svg', '<svg width="18" height="18"')} Escrever</a>
      ${host.phone ? `<a class="btn secondary small" href="${telHref(host.phone)}">${ICON.phone.replace('<svg', '<svg width="18" height="18"')} Ligar</a>` : ''}
    </div></div>`;
}

async function pHome(main) {
  const d = await overview();
  if (!d.enrollment) { setHero(`Olá, ${firstName(S.me.name)}`); main.innerHTML = `<div class="card">${emptyState('Ainda não estás inscrito numa edição. Fala com a equipa da Rural Move.')}</div>`; return; }
  const e = d.enrollment, ph = phaseOf(e.phase);
  let sub = e.edition_name;
  if (e.phase === 'preparar' && e.arrival) { const n = daysUntil(e.arrival); sub = n > 0 ? `Chegas daqui a ${n} ${n === 1 ? 'dia' : 'dias'} a ${e.territory_name}` : `Bem-vindo a ${e.territory_name}`; }
  if (e.phase === 'integrar' && e.departure) { const n = daysUntil(e.departure); sub = `Estás em ${e.territory_name} · ${n > 0 ? `faltam ${n} dias de estadia` : 'último dia de estadia'}`; }
  if (e.phase === 'mudar' && d.followup) sub = `Mês ${Math.max(1, d.followup.month)} de 6 de acompanhamento`;
  if (e.phase === 'decidir') sub = 'Fim do acompanhamento';
  setHero(`Olá, ${firstName(S.me.name)}`, sub);

  const next = [];
  if (e.phase === 'preparar') {
    const call = d.welcome_calls.find(c => ['pedida', 'confirmada'].includes(c.status));
    next.push(call
      ? `<li><div class="row between"><div><b>Videochamada de boas-vindas</b><div class="small muted">${fmtDateTime(call.datetime)}</div></div>${chip(call.status)}</div>${call.link && call.status === 'confirmada' ? `<a class="btn small" style="margin-top:10px" href="${esc(call.link)}" target="_blank" rel="noopener">${ICON.video.replace('<svg', '<svg width="18" height="18"')} Entrar na chamada</a>` : ''}</li>`
      : `<li><b>Marca a videochamada de boas-vindas</b><p class="small muted">Conhece ${esc(firstName(d.host?.name))} antes de chegares.</p><a class="btn small" href="#/preparar" data-go-tab="preparar:anfitriao">Marcar</a></li>`);
    next.push(`<li><b>Lê a ficha do destino</b><p class="small muted">Alojamento, refeições, internet testada e o que está incluído.</p><a class="btn secondary small" href="#/preparar" data-go-tab="preparar:destino">Ver ficha</a></li>`);
    next.push(`<li><b>Fala com quem já foi</b><p class="small muted">Lê os testemunhos e pede uma conversa a um embaixador.</p><a class="btn secondary small" href="#/preparar" data-go-tab="preparar:embaixadores">Ver embaixadores</a></li>`);
  }
  if (e.phase === 'integrar') {
    const mine = d.activities.filter(a => a.signed && a.date >= todayISO());
    next.push(mine.length
      ? `<li><b>A tua próxima atividade</b><p class="small muted">${esc(mine[0].title)} · ${fmtWeekday(mine[0].date)}${mine[0].time ? `, ${mine[0].time.replace(':', 'h')}` : ''}</p><a class="btn secondary small" href="#/integrar" data-go-tab="integrar:agenda">Ver agenda</a></li>`
      : `<li><b>Vê a agenda da comunidade</b><p class="small muted">Escolhe as atividades que te dão jeito. Nada é obrigatório.</p><a class="btn small" href="#/integrar" data-go-tab="integrar:agenda">Ver agenda</a></li>`);
    next.push(`<li><b>Escreve no teu diário</b><p class="small muted">O que estás a gostar e o que te preocupa numa possível mudança.</p><a class="btn secondary small" href="#/integrar" data-go-tab="integrar:diario">Abrir diário</a></li>`);
  }
  if (e.phase === 'mudar' && d.plan) {
    const pending = d.plan.tasks.filter(t => t.status !== 'feito').sort((a, b) => String(a.due_date || '9').localeCompare(String(b.due_date || '9')));
    next.push(`<li><div class="row between"><b>Plano de mudança</b><span class="small muted">${d.plan.done} de ${d.plan.total} tarefas</span></div>
      <div class="progress" style="margin:10px 0"><i style="width:${d.plan.progress}%"></i></div>
      ${pending[0] ? `<p class="small muted">Próxima: ${esc(pending[0].title)}${pending[0].due_date ? ` · até ${fmtShort(pending[0].due_date)}` : ''}</p>` : ''}
      <a class="btn small" href="#/mudar" data-go-tab="mudar:plano">Ver plano</a></li>`);
    const v = d.visits.find(v => ['pedida', 'confirmada'].includes(v.status) && v.date >= todayISO());
    if (v) next.push(`<li><div class="row between"><div><b>Visita de regresso</b><div class="small muted">${fmtWeekday(v.date)}</div></div>${chip(v.status)}</div></li>`);
  }
  if (e.phase === 'decidir') {
    next.push(d.decision
      ? `<li><b>A tua decisão: ${esc(DECISIONS[d.decision.choice].label)}</b>${d.my_testimonial ? `<p class="small muted">Testemunho: ${esc(STATUS_LABEL[d.my_testimonial.status])}</p>` : ''}<a class="btn secondary small" href="#/decidir">Ver</a></li>`
      : `<li><b>Regista a tua decisão</b><p class="small muted">Mudaste-te, vais voltar em visitas ou queres ser embaixador?</p><a class="btn small" href="#/decidir">Decidir</a></li>`);
  }

  main.innerHTML = `
    <div class="card dark">
      <div class="eyebrow" style="color:var(--accent)">O teu percurso</div>
      ${journeyHTML(e.phase)}
      <p style="margin:12px 0 0" class="muted">${esc(ph.desc)}</p>
      ${e.phase === 'mudar' && d.followup ? `<div class="row between" style="margin-top:14px"><span>Faltam <b>${d.followup.months_left} ${d.followup.months_left === 1 ? 'mês' : 'meses'}</b> de acompanhamento</span><span class="small muted">até ${fmtShort(d.followup.end)}</span></div>` : ''}
    </div>
    <div class="grid two">
      <div class="card"><h2>Próximos passos</h2><ul class="list">${next.join('')}</ul></div>
      <div>${hostCard(d.host)}
        <div class="card"><h3>${esc(d.territory.name)}</h3><p class="small muted" style="margin:0">${esc(d.territory.description || '')}</p></div>
      </div>
    </div>`;
  $$('[data-go-tab]', main).forEach(a => a.addEventListener('click', () => { const [k, t] = a.dataset.goTab.split(':'); S.tab[k] = t; }));
}

function phaseNotice(e, key) {
  const cur = phaseIndex(e.phase), idx = phaseIndex(key);
  if (idx > cur) return `<div class="notice">Esta fase ainda não começou. Podes ir espreitando o que aí vem.</div>`;
  return '';
}
