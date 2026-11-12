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
  const phases = d.phases.map(p => ({ key: p.phase, label: phaseOf(p.phase).label, value: p.n, color: PHASE_COLORS[p.phase] }));
  const fixedPct = t.participants ? Math.round(t.fixed / t.participants * 100) : 0;
  main.innerHTML = `
    <div class="grid four kpis">
      <button type="button" class="card kpi" data-goto="#dash-fases">
        <span class="kpi-label">Participantes</span>
        <span class="kpi-value" data-count="${t.participants}">${t.participants}</span>
        <span class="kpi-strip" aria-hidden="true">${phases.filter(p => p.value).map(p => `<i style="flex:${p.value};background:${p.color}"></i>`).join('')}</span>
        <span class="kpi-foot">Distribuídos pelas 4 fases</span>
      </button>
      <div class="card kpi">
        <span class="kpi-label">Ponderam mudar-se</span>
        <div class="kpi-row"><span class="kpi-value" ${t.pondera_pct != null ? `data-count="${t.pondera_pct}" data-fmt="pct"` : ''}>${pct(t.pondera_pct)}</span>${t.pondera_pct != null ? ringHTML(t.pondera_pct) : ''}</div>
        <span class="kpi-foot">${t.answered ? `${t.pondera} de ${t.answered} respostas no fim da estadia (4 ou 5)` : 'Ainda sem respostas no fim da estadia'}</span>
      </div>
      <button type="button" class="card kpi" data-goto="#dash-territorio">
        <span class="kpi-label">Fixados em 12 meses</span>
        <span class="kpi-value" data-count="${t.fixed}">${t.fixed}</span>
        <span class="kpi-bar" aria-hidden="true"><i style="width:${fixedPct}%"></i></span>
        <span class="kpi-foot">${fixedPct}% dos participantes</span>
      </button>
      <div class="card kpi dark">
        <span class="kpi-label">Custo por pessoa fixada</span>
        <span class="kpi-value" ${t.cost_per_fixed != null ? `data-count="${t.cost_per_fixed}" data-fmt="money"` : ''}>${money(t.cost_per_fixed)}</span>
        <span class="kpi-foot">${t.cost ? `${money(t.cost)} de custo total das edições` : 'Custo das edições por indicar'}</span>
      </div>
    </div>
    <div class="dash-grid">
      <div class="card" id="dash-fases">
        <div class="card-head"><h3>Em que fase estão</h3></div>
        ${donutHTML(phases)}
      </div>
      <div class="card">
        <div class="card-head"><h3>De onde vêm os participantes</h3></div>
        <div class="origins"><div class="origins-map" id="origins-map"></div>
          <div class="origins-legend"><span>Menos</span><span class="heat-scale"></span><span>Mais participantes</span><span class="dest-dot"></span><span>Destino</span></div>
          ${originsListHTML(d.origins || [])}</div>
      </div>
    </div>
    <div class="section-title" id="dash-territorio"><h2>Por território</h2></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Território</th>${KPI_HEAD}</tr></thead><tbody>
      ${d.by_territory.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${esc(r.municipality)}</div></td>${kpiRow(r)}</tr>`).join('')}
    </tbody></table></div></div>
    <div class="section-title"><h2>Por edição</h2></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Edição</th>${KPI_HEAD}</tr></thead><tbody>
      ${d.by_edition.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${fmtShort(r.start_date)} a ${fmtDate(r.end_date)}</div></td>${kpiRow(r)}</tr>`).join('')}
    </tbody></table></div></div>
    <p class="small muted">Pondera mudar-se: respostas 4 ou 5 à pergunta do fim da estadia, sobre quem respondeu. Fixados: decisão "mudei-me" com data de mudança até 12 meses depois do fim da estadia. Custo por fixado: custo das edições (introduzido à mão em Edições) a dividir pelas pessoas fixadas.</p>`;
  countUp(main);
  bindDonut(main, phases);
  $$('[data-goto]', main).forEach(b => b.onclick = () => $(b.dataset.goto)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  originsMap($('#origins-map', main), d.origins || [], d.destinations || []).then(map => { if (map) S.cleanup.push(() => map.remove()); });
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
