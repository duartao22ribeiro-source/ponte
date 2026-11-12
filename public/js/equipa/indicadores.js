'use strict';
/* Ponte · indicadores, testemunhos e relatório por município
   Responsável: Pessoa 3 · Fases 3 e 4 (Mudar e Decidir) (ver EQUIPA.md) */

// ======================================================================
// EQUIPA RURAL MOVE
// ======================================================================
const pct = v => v == null ? '—' : `${v}%`;
function kpiRow(k) {
  return `<td>${k.participants}</td><td>${pct(k.pondera_pct)} <span class="small muted">${k.answered ? `(${k.pondera}/${k.answered})` : ''}</span></td><td>${k.fixed}</td><td>${money(k.cost)}</td><td><b>${money(k.cost_per_fixed)}</b></td>`;
}
const KPI_HEAD = '<th>Participantes</th><th>Pondera mudar-se</th><th>Fixados (12 meses)</th><th>Custo</th><th>Custo por fixado</th>';

async function eIndicadores(main) {
  const d = await api('/api/e/kpis');
  const t = d.total;
  setHero('Indicadores', 'Ponte para a Fixação · todos os territórios', 'Equipa Rural Move');
  const totalPh = d.phases.reduce((s, p) => s + p.n, 0) || 1;
  const phColors = { preparar: '#4888B0', integrar: '#58C0E0', mudar: '#7DCC5D', decidir: '#3F6038' };
  main.innerHTML = `
    <div class="grid four">
      <div class="card"><div class="stat">${t.participants}</div><div class="stat-label">Participantes</div></div>
      <div class="card"><div class="stat">${pct(t.pondera_pct)}</div><div class="stat-label">Ponderam mudar-se no fim da estadia (4 ou 5)${t.answered ? ` · ${t.pondera} de ${t.answered} respostas` : ''}</div></div>
      <div class="card"><div class="stat">${t.fixed}</div><div class="stat-label">Pessoas fixadas no prazo de 12 meses</div></div>
      <div class="card dark"><div class="stat">${money(t.cost_per_fixed)}</div><div class="stat-label">Custo por pessoa fixada</div></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Onde estão os participantes</h3>
      <div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin:12px 0">${d.phases.map(p => p.n ? `<span title="${phaseOf(p.phase).label}: ${p.n}" style="width:${p.n / totalPh * 100}%;background:${phColors[p.phase]}"></span>` : '').join('')}</div>
      <div class="row small">${d.phases.map(p => `<span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${phColors[p.phase]};margin-right:6px"></i>${phaseOf(p.phase).label}: <b>${p.n}</b></span>`).join('')}</div>
    </div>
    <div class="section-title"><h2>Por território</h2></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Território</th>${KPI_HEAD}</tr></thead><tbody>
      ${d.by_territory.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${esc(r.municipality)}</div></td>${kpiRow(r)}</tr>`).join('')}
    </tbody></table></div></div>
    <div class="section-title"><h2>Por edição</h2></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Edição</th>${KPI_HEAD}</tr></thead><tbody>
      ${d.by_edition.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${fmtShort(r.start_date)} a ${fmtDate(r.end_date)}</div></td>${kpiRow(r)}</tr>`).join('')}
    </tbody></table></div></div>
    <p class="small muted">Pondera mudar-se: respostas 4 ou 5 à pergunta do fim da estadia, sobre quem respondeu. Fixados: decisão "mudei-me" com data de mudança até 12 meses depois do fim da estadia. Custo por fixado: custo das edições (introduzido à mão em Edições) a dividir pelas pessoas fixadas.</p>`;
}

async function eTestemunhos(main) {
  const d = await api('/api/e/testimonials');
  const pending = d.testimonials.filter(t => t.status === 'pendente');
  setHero('Testemunhos', `${pending.length} por aprovar`, 'Equipa Rural Move');
  const tab = tabsHTML('etm', [['pendentes', `Por aprovar (${pending.length})`], ['todos', 'Todos'], ['pedidos', `Pedidos de conversa (${d.requests.filter(r => r.status === 'pedido').length})`]]);
  let body = '';
  const card = t => `<div class="card"><div class="row between"><div><b>${esc(t.author_name)}</b><div class="small muted">${esc(t.author_role || '')}${t.territory_name ? ` · ${esc(t.territory_name)}` : ''} · ${fmtDate(t.created_at)}</div></div>${chip(t.status)}</div>
    <p class="quote" style="margin-top:12px">${esc(t.body)}</p>
    <div class="row">${t.status !== 'aprovado' ? `<button class="btn small" data-st="${t.id}" data-v="aprovado">Aprovar</button>` : ''}${t.status !== 'rejeitado' ? `<button class="btn danger small" data-st="${t.id}" data-v="rejeitado">${t.status === 'aprovado' ? 'Despublicar' : 'Rejeitar'}</button>` : ''}<button class="btn ghost small" data-edit="${t.id}">Editar texto</button></div></div>`;
  if (S.tab.etm === 'pendentes') body = pending.map(card).join('') || `<div class="card">${emptyState('Não há testemunhos por aprovar.')}</div>`;
  if (S.tab.etm === 'todos') body = d.testimonials.map(card).join('');
  if (S.tab.etm === 'pedidos') body = `<p class="small muted">Participantes que pediram para falar com um embaixador. Põe-nos em contacto e atualiza o estado.</p><div class="card"><ul class="list">${d.requests.map(r => `<li><div class="row between"><div><b>${esc(r.requester)}</b> quer falar com <b>${esc(r.author_name)}</b>
    <div class="small muted">${esc(r.requester_email)} · ${fmtDate(r.created_at)}</div>${r.message ? `<div class="small" style="margin-top:4px">"${esc(r.message)}"</div>` : ''}</div>
    <select data-req="${r.id}" style="width:auto;min-height:38px">${['pedido', 'marcado', 'concluido'].map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></div></li>`).join('') || `<li>${emptyState('Sem pedidos.')}</li>`}</ul></div>`;
  main.innerHTML = tab + body;
  $$('[data-st]', main).forEach(b => b.onclick = () => act(() => api(`/api/e/testimonials/${b.dataset.st}`, { method: 'PUT', body: { status: b.dataset.v } }), b.dataset.v === 'aprovado' ? 'Testemunho publicado.' : 'Testemunho rejeitado.'));
  $$('[data-edit]', main).forEach(b => b.onclick = () => {
    const t = d.testimonials.find(x => x.id === Number(b.dataset.edit));
    openForm({ title: 'Editar testemunho', values: t, fields: [{ name: 'body', label: 'Texto', type: 'textarea', rows: 6, required: true }, { name: 'author_role', label: 'Apresentação do autor', optional: true }],
      onSubmit: v => api(`/api/e/testimonials/${t.id}`, { method: 'PUT', body: v }) });
  });
  $$('[data-req]', main).forEach(s => s.onchange = () => act(() => api(`/api/e/requests/${s.dataset.req}`, { method: 'PUT', body: { status: s.value } }), 'Estado atualizado.'));
}

async function eRelatorio(main) {
  const m = S.tab.reportMun || '';
  const d = await api(`/api/e/report${m ? `?municipality=${encodeURIComponent(m)}` : ''}`);
  setHero('Relatório por município', 'Para o modelo de cofinanciamento por resultado', 'Equipa Rural Move');
  if (!d.municipality) { main.innerHTML = `<div class="card">${emptyState('Ainda não há territórios.')}</div>`; return; }
  const per = Number(S.tab.reportPer || 0);
  main.innerHTML = `<div class="card no-print"><div class="form-row">
      <label class="field"><span>Município</span><select id="mun">${d.municipalities.map(x => `<option ${x === d.municipality ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="field"><span>Cofinanciamento por pessoa fixada (€) <i class="muted">(opcional)</i></span><input type="number" min="0" id="per" value="${per || ''}" placeholder="Valor acordado com a câmara"></label>
    </div><button class="btn" id="print">Exportar PDF</button> <span class="small muted">Abre a janela de impressão: escolhe "Guardar como PDF".</span></div>
    <div class="card report">
      <div class="report-head">
        <div><div class="eyebrow">Rural Move · Ponte para a Fixação</div><h1 style="margin:4px 0">Relatório de fixação</h1><div>Município de <b>${esc(d.municipality)}</b></div></div>
        <div class="small muted" style="text-align:right">Gerado a ${fmtDate(d.generated_at)}<br>${d.editions.length} ${d.editions.length === 1 ? 'edição' : 'edições'}</div>
      </div>
      <div class="grid four" style="margin-bottom:18px">
        <div><div class="stat">${d.kpis.participants}</div><div class="stat-label">Participantes</div></div>
        <div><div class="stat">${pct(d.kpis.pondera_pct)}</div><div class="stat-label">Ponderam mudar-se no fim da estadia</div></div>
        <div><div class="stat">${d.kpis.fixed}</div><div class="stat-label">Pessoas fixadas em 12 meses</div></div>
        <div><div class="stat">${money(d.kpis.cost_per_fixed)}</div><div class="stat-label">Custo por pessoa fixada</div></div>
      </div>
      <h3>Pessoas fixadas no concelho</h3>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Edição</th><th>Fim da estadia</th><th>Data de fixação</th><th>Localidade</th><th>Dias após estadia</th></tr></thead><tbody>
        ${d.fixed.map(f => `<tr><td>${esc(f.name)}</td><td>${esc(f.edition_name)}</td><td>${fmtDate(f.departure)}</td><td>${fmtDate(f.moved_at)}</td><td>${esc(f.locality || '—')}</td><td>${f.days_after}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Ainda não há pessoas fixadas.</td></tr>'}
      </tbody></table></div>
      ${per ? `<div class="card flat" style="background:var(--soft);margin-top:18px"><div class="row between"><span>Cofinanciamento: ${d.fixed.length} × ${money(per)}</span><span class="price">${money(d.fixed.length * per)}</span></div></div>` : ''}
      <h3 style="margin-top:22px">Edições incluídas</h3>
      <ul class="list-plain">${d.editions.map(e => `<li>${esc(e.name)} · ${fmtDate(e.start_date)} a ${fmtDate(e.end_date)}</li>`).join('')}</ul>
      <p class="small muted" style="margin-top:18px">Considera-se fixada a pessoa que registou a decisão "mudei-me" com data de mudança até 12 meses depois do fim da estadia. Dados pessoais tratados com consentimento dos participantes, partilhados apenas para efeitos do acordo de cofinanciamento.</p>
    </div>`;
  $('#mun', main).onchange = ev => { S.tab.reportMun = ev.target.value; reload(); };
  $('#per', main).onchange = ev => { S.tab.reportPer = ev.target.value; reload(); };
  $('#print', main).onclick = () => window.print();
}
