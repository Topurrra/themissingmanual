/// <reference types="@sveltejs/kit" />
// Offline-capable service worker. Precaches the built app shell + static files,
// then serves visited pages from cache when the network is unavailable. Light
// enough for a small server (all caching happens in the user's browser).
import { build, files, version } from '$service-worker';

const CACHE = `tmm-cache-${version}`;
// Precache the hashed app shell + small static essentials only. static/ also
// holds 100+ explainer pages, zips, and og images - far too heavy to force on
// every first visit; those cache at runtime when actually opened.
const SMALL_STATIC = files.filter(
  (f) => /^\/(icon-|favicon|manifest|robots|syntax-highlight)/.test(f)
);
const PRECACHE = [...build, ...SMALL_STATIC];

// Never intercept or cache anything stateful, private, or admin-only.
const NEVER_CACHE = /^\/(admin|api|feedback|tutor|mcp)/;

self.addEventListener('install', (event) => {
  // Precache hashed assets (atomic), plus the home shell best-effort so there is
  // always an offline landing page and the navigation fallback always resolves.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE).then(() => c.add('/').catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

// Comeback loop: opt-in "cards are due" review reminders. The payload is our
// own JSON (see push.js's checkAndSend), not push-service-defined.
self.addEventListener('push', (event) => {
  let data = { title: 'Time to review', body: 'Cards are ready for review.', url: '/review' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-64.png',
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/review';
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clientsList) {
        if (new URL(c.url).pathname === url && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (NEVER_CACHE.test(url.pathname)) return;

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
