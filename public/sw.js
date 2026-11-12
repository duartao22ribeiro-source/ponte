// Service worker: app shell em cache; API sempre pela rede.
const CACHE = 'ponte-v8';
// Os restantes CSS/JS entram na cache à medida que são pedidos (não é preciso listá-los aqui).
const SHELL = ['/', '/css/base.css', '/js/main.js', '/manifest.webmanifest', '/icons/ponte.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (url.origin === location.origin) {
    // rede primeiro, cache como recurso offline
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request.mode === 'navigate' ? '/' : e.request, copy));
        return res;
      }).catch(() => caches.match(e.request.mode === 'navigate' ? '/' : e.request))
    );
  }
});
