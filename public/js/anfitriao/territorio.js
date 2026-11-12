'use strict';
/* Ponte · gestão de conteúdos do território (agenda, guia, casas, apoios)
   Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md) */

// ---------- Gestão do território (anfitrião; equipa via /territorio/:id) ----------
const CONTENT_FIELDS = {
  activities: [
    { name: 'title', label: 'Título', required: true },
    { row: [{ name: 'date', label: 'Data', type: 'date', required: true }, { name: 'time', label: 'Hora', type: 'time', optional: true }] },
    { row: [{ name: 'location', label: 'Local', optional: true }, { name: 'spots', label: 'Lugares', type: 'number', min: 1, optional: true, hint: 'Vazio = sem limite' }] },
    { name: 'description', label: 'Descrição', type: 'textarea', optional: true, rows: 3 },
  ],
  guide: [
    { row: [{ name: 'name', label: 'Nome', required: true }, { name: 'category', label: 'Categoria', type: 'select', options: Object.entries(GUIDE_CATS) }] },
    { name: 'description', label: 'Descrição', type: 'textarea', optional: true, rows: 2 },
    { row: [{ name: 'contact_person', label: 'Pessoa de contacto', optional: true }, { name: 'phone', label: 'Telefone', type: 'tel', optional: true }] },
    { name: 'address', label: 'Morada', optional: true },
    { row: [{ name: 'lat', label: 'Latitude', type: 'number', step: 'any', optional: true }, { name: 'lng', label: 'Longitude', type: 'number', step: 'any', optional: true, hint: 'Para aparecer no mapa' }] },
  ],
  houses: [
    { name: 'title', label: 'Título', required: true },
    { row: [{ name: 'kind', label: 'Tipo', type: 'select', options: [['arrendamento', 'Arrendamento'], ['compra', 'Compra']] }, { name: 'price', label: 'Preço (€)', type: 'number', min: 0, optional: true, hint: 'Renda mensal ou preço de venda' }] },
    { row: [{ name: 'location', label: 'Localidade', optional: true }, { name: 'bedrooms', label: 'Quartos', type: 'number', min: 0, optional: true }] },
    { name: 'description', label: 'Descrição', type: 'textarea', optional: true, rows: 3 },
    { name: 'contact', label: 'Contacto', optional: true, placeholder: 'Nome · telefone' },
    { name: 'photo', label: 'Foto', type: 'photo', max: 1000 },
  ],
  supports: [
    { name: 'title', label: 'Nome do apoio', required: true },
    { name: 'description', label: 'Descrição', type: 'textarea', optional: true, rows: 3 },
    { name: 'url', label: 'Link oficial', type: 'url', optional: true, placeholder: 'https://' },
  ],
};
const CONTENT_LABEL = { activities: 'atividade', guide: 'entrada no guia', houses: 'casa', supports: 'apoio' };

async function territoryView(main, params = {}) {
  const tq = params.id ? `?territory=${params.id}` : '';
  const d = await api(`/api/t/content${tq}`);
  setHero(d.territory.name, `Município de ${d.territory.municipality}`, S.me.role === 'admin' ? 'Conteúdos do território' : 'O teu território');
  const tab = tabsHTML('terr', [['ficha', 'Ficha do destino'], ['activities', 'Agenda'], ['guide', 'Guia local'], ['houses', 'Casas'], ['supports', 'Apoios']]);
  const k = S.tab.terr;
  let body = '';
  if (k === 'ficha') {
    const s = d.destination || {};
    body = `<div class="card"><form id="dest" novalidate>
      <p class="small muted">É isto que os participantes veem antes de chegar. Sê claro sobre o que está e não está incluído.</p>
      ${fieldHTML({ name: 'accommodation', label: 'Alojamento', type: 'textarea', rows: 3 }, s.accommodation)}
      ${fieldHTML({ name: 'meals', label: 'Refeições incluídas', type: 'textarea', rows: 2 }, s.meals)}
      ${fieldHTML({ name: 'workspace', label: 'Espaço de trabalho', type: 'textarea', rows: 2 }, s.workspace)}
      <div class="form-row">
        ${fieldHTML({ name: 'internet_mbps', label: 'Internet: download testado (Mbps)', type: 'number', min: 0 }, s.internet_mbps)}
        ${fieldHTML({ name: 'internet_upload_mbps', label: 'Upload (Mbps)', type: 'number', min: 0, optional: true }, s.internet_upload_mbps)}
      </div>
      ${fieldHTML({ name: 'internet_tested_at', label: 'Data do teste', type: 'date', max: todayISO() }, s.internet_tested_at)}
      ${fieldHTML({ name: 'quiet_space', label: 'Há espaço silencioso para chamadas', type: 'checkbox' }, s.quiet_space)}
      ${fieldHTML({ name: 'quiet_space_notes', label: 'Detalhes do espaço para chamadas', optional: true }, s.quiet_space_notes)}
      <div class="form-row">
        ${fieldHTML({ name: 'included', label: 'Está incluído (uma linha por item)', type: 'textarea', rows: 6 }, s.included)}
        ${fieldHTML({ name: 'not_included', label: 'Não está incluído (uma linha por item)', type: 'textarea', rows: 6 }, s.not_included)}
      </div>
      <button class="btn" type="submit">Guardar ficha</button></form></div>`;
  } else {
    const items = d[k];
    const add = `<div class="row between" style="margin-bottom:14px"><span class="muted small">${items.length} ${items.length === 1 ? 'registo' : 'registos'}</span><button class="btn" data-add>+ Adicionar ${CONTENT_LABEL[k]}</button></div>`;
    if (k === 'houses') body = add + `<div class="grid two">${items.map(h => houseCard(h, true)).join('')}</div>`;
    else body = add + `<div class="card"><ul class="list">${items.map(i => {
      const title = i.title || i.name;
      const meta = k === 'activities' ? `${fmtWeekday(i.date)}${i.time ? `, ${i.time.replace(':', 'h')}` : ''} · ${i.signups} inscritos${i.spots ? ` de ${i.spots}` : ''}${i.date < todayISO() ? ' · já passou' : ''}`
        : k === 'guide' ? `${GUIDE_CATS[i.category] || i.category}${i.phone ? ` · ${i.phone}` : ''}${i.lat ? '' : ' · sem localização no mapa'}`
        : i.url || '';
      return `<li><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><b>${esc(title)}</b><div class="small muted">${esc(meta)}</div></div><button class="btn secondary small" data-edit-item="${i.id}">Editar</button></div></li>`;
    }).join('') || `<li>${emptyState('Ainda não há registos.')}</li>`}</ul></div>`;
  }
  main.innerHTML = (params.id ? `<a href="#/territorios" class="btn ghost small" style="margin:-6px 0 8px -10px">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Territórios</a>` : '') + tab + body;

  const dest = $('#dest', main);
  if (dest) dest.onsubmit = ev => {
    ev.preventDefault();
    const fields = ['accommodation', 'meals', 'workspace', 'internet_mbps', 'internet_upload_mbps', 'internet_tested_at', 'quiet_space', 'quiet_space_notes', 'included', 'not_included']
      .map(n => ({ name: n, type: n.startsWith('internet_') && n.endsWith('mbps') ? 'number' : n === 'quiet_space' ? 'checkbox' : 'text' }));
    act(() => api(`/api/t/destination${tq}`, { method: 'PUT', body: readForm(dest, fields) }), 'Ficha guardada.');
  };
  if (k !== 'ficha') {
    const fields = CONTENT_FIELDS[k];
    $('[data-add]', main).onclick = () => openForm({
      title: `Nova ${CONTENT_LABEL[k]}`.replace('Nova apoio', 'Novo apoio'), fields,
      onSubmit: v => api(`/api/t/${k}${tq}`, { method: 'POST', body: v }).then(() => toast('Adicionado.')),
    });
    $$('[data-edit-item]', main).forEach(b => b.onclick = () => {
      const item = d[k].find(i => i.id === Number(b.dataset.editItem));
      openForm({
        title: 'Editar', fields, values: { ...item, photo: item.photo && String(item.photo).startsWith('data:') ? item.photo : '' },
        onSubmit: v => {
          // Mantém a ilustração de exemplo se não houver foto nova
          if (k === 'houses' && !v.photo && item.photo && !String(item.photo).startsWith('data:')) delete v.photo;
          return api(`/api/t/${k}/${item.id}${tq}`, { method: 'PUT', body: v });
        },
        onDelete: () => api(`/api/t/${k}/${item.id}${tq}`, { method: 'DELETE' }),
      });
    });
  }
}
