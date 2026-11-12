'use strict';
/* Ponte · conversa entre participante e anfitrião
   Responsável: Pessoa 2 · Fases 1 e 2 (Preparar e Integrar) (ver EQUIPA.md) */

// ---------- Conversa ----------
function chatHTML(other) {
  return `<div class="card chat">
    <div class="row" style="padding-bottom:10px;border-bottom:1px solid var(--line);flex-wrap:nowrap">${avatar(other, 38)}<div><b>${esc(other.name)}</b><div class="small muted">${other.role === 'anfitriao' ? 'Anfitrião' : other.role === 'admin' ? 'Equipa Rural Move' : 'Participante'}</div></div></div>
    <div class="chat-log" aria-live="polite"></div>
    <form class="chat-form"><label class="hidden" for="chat-input">Mensagem</label><textarea id="chat-input" name="body" rows="1" placeholder="Escreve uma mensagem…"></textarea><button class="btn" type="submit" aria-label="Enviar" style="padding:0 16px">${ICON.send.replace('<svg', '<svg width="20" height="20"')}</button></form>
  </div>`;
}
async function mountChat(root, otherId) {
  const log = $('.chat-log', root), form = $('.chat-form', root);
  let count = -1;
  const paint = msgs => {
    if (msgs.length === count) return;
    count = msgs.length;
    let lastDay = '';
    log.innerHTML = msgs.length ? msgs.map(m => {
      const day = m.created_at.slice(0, 10);
      const sep = day !== lastDay ? `<div class="chat-day">${fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : '';
      lastDay = day;
      return `${sep}<div class="bubble ${m.from_id === S.me.id ? 'mine' : 'theirs'}">${esc(m.body)}<time>${fmtTime(m.created_at)}</time></div>`;
    }).join('') : emptyState('Ainda não há mensagens. Diz olá!');
    log.scrollTop = log.scrollHeight;
  };
  const load = async () => { try { const d = await api(`/api/messages/${otherId}`); paint(d.messages); } catch { /* tenta de novo */ } };
  await load();
  const timer = setInterval(() => document.visibilityState === 'visible' && load(), 5000);
  S.cleanup.push(() => clearInterval(timer));
  const ta = form.body;
  ta.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey && window.matchMedia('(min-width: 700px)').matches) { ev.preventDefault(); form.requestSubmit(); } });
  form.onsubmit = async ev => {
    ev.preventDefault();
    const text = ta.value.trim(); if (!text) return;
    ta.value = '';
    try { await api(`/api/messages/${otherId}`, { method: 'POST', body: { body: text } }); await load(); }
    catch (e) { ta.value = text; toast(e.message, 'error'); }
  };
  refreshMe();
}
async function pChat(main) {
  const d = await overview();
  if (!d.host) { setHero('Conversa'); main.innerHTML = `<div class="card">${emptyState('Ainda não tens anfitrião atribuído.')}</div>`; return; }
  setHero('Conversa', `Com ${d.host.name}, o teu anfitrião`);
  main.innerHTML = chatHTML({ ...d.host, role: 'anfitriao' });
  await mountChat(main, d.host.id);
}
