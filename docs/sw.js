// NHBRC Trainer service worker — offline-first cache.
const VERSION = 'nhbrc-v3.11.1';
const ASSET_VER = '3.11.1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=' + ASSET_VER,
  './tenant.js?v=' + ASSET_VER,
  './data.js?v=' + ASSET_VER,
  './quiz-extra.js?v=' + ASSET_VER,
  './regulations.js?v=' + ASSET_VER,
  './library.js?v=' + ASSET_VER,
  './affiliates.js?v=' + ASSET_VER,
  './license.js?v=' + ASSET_VER,
  './auth.js?v=' + ASSET_VER,
  './chat.js?v=' + ASSET_VER,
  './calculators.js?v=' + ASSET_VER,
  './forms.js?v=' + ASSET_VER,
  './snag.js?v=' + ASSET_VER,
  './app.js?v=' + ASSET_VER,
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && new URL(e.request.url).origin === location.origin) {
          const clone = resp.clone();
          caches.open(VERSION).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
