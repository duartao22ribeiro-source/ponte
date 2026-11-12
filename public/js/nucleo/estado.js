'use strict';
/* Ponte · estado global, utilitários, constantes e ícones
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

// ======================================================================
// Estado e utilitários
// ======================================================================
const S = { me: null, unread: 0, territory: null, tab: {}, cleanup: [], route: null, shellRole: null };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const todayISO = () => new Date().toISOString().slice(0, 10);
const toDate = iso => new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : String(iso).replace(' ', 'T') + (String(iso).includes('T') ? '' : 'Z'));
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDate = (iso, opts) => {
  if (!iso) return '';
  const d = toDate(iso);
  return opts ? d.toLocaleDateString('pt-PT', opts) : `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtShort = iso => iso ? `${toDate(iso).getDate()} ${MESES[toDate(iso).getMonth()]}` : '';
const fmtWeekday = iso => fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = iso => iso ? toDate(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDateTime = iso => iso ? `${fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })}, ${String(iso).slice(11, 16).replace(':', 'h')}` : '';
const daysUntil = iso => Math.round((toDate(iso.slice(0, 10)) - toDate(todayISO())) / 86400000);
const relDays = n => n == null ? 'nunca' : n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
const money = v => v == null || v === '' ? '—' : Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const isWeekend = iso => [0, 6].includes(toDate(iso).getDay());
const lines = txt => String(txt || '').split('\n').map(s => s.trim()).filter(Boolean);
const telHref = s => 'tel:' + String(s || '').replace(/[^\d+]/g, '');
const firstName = n => String(n || '').split(' ')[0];

const PHASES = [
  { key: 'preparar', label: 'Preparar', when: 'Semana antes', desc: 'Conhece o destino e o teu anfitrião antes de chegar.' },
  { key: 'integrar', label: 'Integrar', when: '2 a 4 semanas', desc: 'Vive a aldeia ao teu ritmo, sem obrigações.' },
  { key: 'mudar', label: 'Mudar', when: 'Meses 1 a 6', desc: 'Resolve com o anfitrião o que te impede de mudar.' },
  { key: 'decidir', label: 'Decidir', when: 'Depois', desc: 'Decide o que queres fazer a seguir.' },
];
const phaseOf = k => PHASES.find(p => p.key === k) || PHASES[0];
const phaseIndex = k => PHASES.findIndex(p => p.key === k);
const AREAS = [
  { key: 'casa', label: 'Casa' },
  { key: 'apoios', label: 'Apoios municipais à fixação' },
  { key: 'escola', label: 'Escola' },
  { key: 'emprego', label: 'Emprego para a família' },
];
const TASK_STATUS = { por_fazer: 'Por fazer', em_curso: 'Em curso', feito: 'Feito' };
const STATUS_CHIP = { por_fazer: '', em_curso: 'blue', feito: 'green', pedida: 'warn', confirmada: 'green', realizada: '', cancelada: '', pendente: 'warn', aprovado: 'green', rejeitado: '', pedido: 'warn', marcado: 'blue', concluido: 'green' };
const STATUS_LABEL = { pedida: 'Pedida', confirmada: 'Confirmada', realizada: 'Realizada', cancelada: 'Cancelada', pendente: 'Pendente de aprovação', aprovado: 'Aprovado', rejeitado: 'Rejeitado', pedido: 'Pedido', marcado: 'Marcado', concluido: 'Concluído' };
const WORK = { freelancer: 'Freelancer', startup: 'Equipa de startup', profissional: 'Profissional por conta de outrem', outro: 'Outra situação' };
const GUIDE_CATS = { negocios: 'Negócios', saude: 'Saúde', escolas: 'Escolas', transportes: 'Transportes', contactos: 'Pessoas de contacto' };
const CONTACT_TYPES = { presencial: 'Presencial', telefone: 'Telefone', videochamada: 'Videochamada', mensagem: 'Mensagem', email: 'E-mail' };
const DECISIONS = {
  mudei: { label: 'Mudei-me', desc: 'Já vivo, ou vou viver, no território.' },
  visitas: { label: 'Vou voltar em visitas', desc: 'Ainda não é altura, mas quero manter a ligação.' },
  embaixador: { label: 'Quero ser embaixador', desc: 'Conto a minha experiência a quem está a pensar inscrever-se.' },
};
const chip = (status, label) => `<span class="chip ${STATUS_CHIP[status] || ''}">${esc(label || STATUS_LABEL[status] || status)}</span>`;
const phaseChip = k => `<span class="chip phase-${k}">${esc(phaseOf(k).label)}</span>`;

// ---------- ícones (traço simples) ----------
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  preparar: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  integrar: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>'),
  mudar: svg('<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5 12 13l9-4.5M12 13v7"/>'),
  decidir: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
  grid: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
  map: svg('<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'),
  quote: svg('<path d="M4 5h16v11H9l-5 4z"/><path d="m9 10.5 2 2 4-4"/>'),
  file: svg('<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  phone: svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>'),
  ext: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>'),
  back: svg('<path d="M15 5 8 12l7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  send: svg('<path d="M4 12 20 4l-6 16-3-7z"/>'),
  video: svg('<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/>'),
};
