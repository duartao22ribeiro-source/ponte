'use strict';
/* Ponte · ecrã de carregamento com o emblema da Ponte
   Aparece só quando a página abre (já vem no index.html).
   O boot() esconde-o quando a primeira página está pronta (hideSplash). */

const SPLASH_MIN_MS = 1300; // tempo mínimo desde que a página abre, para a animação se ver toda

async function hideSplash() {
  const el = document.getElementById('splash');
  if (!el || el.hidden || el.classList.contains('out')) return;
  const wait = SPLASH_MIN_MS - performance.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  el.classList.add('out');
  setTimeout(() => { if (el.classList.contains('out')) el.hidden = true; }, 500);
}
