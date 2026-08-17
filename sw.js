/* Offline-Speicher der App. Version hochzählen, wenn eine neue Fassung hochgeladen wird. */
const VERSION = 'fh-handy-v7';
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(treffer => {
      if (treffer) {
        /* im Hintergrund auffrischen, falls Netz da ist */
        fetch(e.request).then(r => {
          if (r && r.ok) caches.open(VERSION).then(c => c.put(e.request, r.clone()));
        }).catch(() => {});
        return treffer;
      }
      return fetch(e.request).then(r => {
        if (r && r.ok && new URL(e.request.url).origin === location.origin) {
          const kopie = r.clone();
          caches.open(VERSION).then(c => c.put(e.request, kopie));
        }
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
