// NENEMI service worker — makes the app installable and keeps the shell
// available offline. Network-first for the page so updates flow through;
// the API is never cached (sync handles offline on its own via localStorage).

const VERSION = 'nenemi-shell-v4';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/n-192.png', '/icons/n-512.png', '/icons/n-180.png', '/icons/nenemi-mark.woff2', '/welcome.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // fonts, Clerk, etc. go straight through
  if (url.pathname.startsWith('/api/')) return;             // never cache the API

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/index.html') : undefined)))
  );
});
