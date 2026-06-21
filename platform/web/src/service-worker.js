/// <reference types="@sveltejs/kit" />
// Offline-capable service worker. Precaches the built app shell + static files,
// then serves visited pages from cache when the network is unavailable. Light
// enough for a small server (all caching happens in the user's browser).
import { build, files, version } from '$service-worker';

const CACHE = `tmm-cache-${version}`;
const PRECACHE = [...build, ...files];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Built assets are content-hashed → cache-first (fast, offline).
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((c) => c || fetch(request)));
    return;
  }

  // Pages + guide content → network-first, fall back to cache (offline reading).
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(request);
        if (res && res.status === 200 && (request.mode === 'navigate' || url.pathname.startsWith('/guides'))) {
          cache.put(request, res.clone());
        }
        return res;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const home = await cache.match('/');
          if (home) return home;
        }
        throw err;
      }
    })()
  );
});
