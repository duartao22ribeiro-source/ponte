'use strict';
/* Ponte · menu de cada perfil e arranque (carregado em último lugar)
   Responsável: Pessoa 1 · Hero e base (ver EQUIPA.md) */

const NAV = {
  participante: [
    { path: '/', label: 'Início', icon: 'home', view: pHome },
    { path: '/preparar', label: 'Preparar', icon: 'preparar', view: pPreparar, phase: 'preparar' },
    { path: '/integrar', label: 'Integrar', icon: 'integrar', view: pIntegrar, phase: 'integrar' },
    { path: '/mudar', label: 'Mudar', icon: 'mudar', view: pMudar, phase: 'mudar' },
    { path: '/decidir', label: 'Decidir', icon: 'decidir', view: pDecidir, phase: 'decidir' },
    { path: '/conversa', label: 'Conversa', icon: 'chat', view: pChat, hidden: 'mobile' },
    { path: '/perfil', label: 'Perfil', icon: 'user', view: profileView, hidden: true },
  ],
  anfitriao: [
    { path: '/', label: 'Painel', icon: 'grid', view: hPainel },
    { path: '/conversas', label: 'Conversas', icon: 'chat', view: hConversas, badge: true },
    { path: '/territorio', label: 'Território', icon: 'map', view: territoryView },
    { path: '/perfil', label: 'Perfil', icon: 'user', view: profileView },
    { path: '/participante/:id', view: hParticipante, hidden: true },
    { path: '/conversa/:id', view: hConversa, hidden: true },
  ],
  admin: [
    { path: '/', label: 'Indicadores', icon: 'chart', view: eIndicadores },
    { path: '/edicoes', label: 'Edições', icon: 'calendar', view: eEdicoes },
    { path: '/territorios', label: 'Territórios', icon: 'map', view: eTerritorios },
    { path: '/anfitrioes', label: 'Anfitriões', icon: 'user', view: eAnfitrioes },
    { path: '/testemunhos', label: 'Testemunhos', icon: 'quote', view: eTestemunhos },
    { path: '/relatorio', label: 'Relatório', icon: 'file', view: eRelatorio },
    { path: '/territorio/:id', view: territoryView, hidden: true },
    { path: '/perfil', view: profileView, hidden: true },
  ],
};

window.addEventListener('hashchange', () => { if (S.me) runRoute(); else authView(); });
setInterval(() => { if (S.me && document.visibilityState === 'visible') refreshMe(); }, 30000);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

boot();
