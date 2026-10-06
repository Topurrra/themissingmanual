/// <reference types="@sveltejs/kit" />
// Offline-capable service worker. Precaches the built app shell + static files,
// then serves visited pages from cache when the network is unavailable. Light
// enough for a small server (all caching happens in the user's browser).
import { build, files, version } from '$service-worker';

const ASSETS = `tmm-assets-${version}`;
const CONTENT = 'tmm-content-v1';
const MAX_PAGES = 100;
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const MAX_ASSET_BYTES = 64 * 1024 * 1024;
// Precache the hashed app shell + small static essentials only. static/ also
// holds 100+ explainer pages, zips, and og images - far too heavy to force on
// every first visit; those cache at runtime when actually opened.
const SMALL_STATIC = files.filter(
  (f) => /^\/(icon-|favicon|manifest|robots|syntax-highlight)/.test(f)
);
const PRECACHE = [...build.filter((f) => !/\.(wasm|data)$/.test(f)), ...SMALL_STATIC];
const BUILT = new Set(build);
const STATIC = new Set(files);

// Never intercept or cache anything stateful, private, or admin-only.
const NEVER_CACHE = /^\/(?:admin|api|feedback|tutor|mcp)(?:[/.]|$)|^\/push\./;
const IMMUTABLE = '/_app/immutable/';

function publicContent(path) {
  return path === '/' || /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})\/)?(?:guides|categories|practice|review|games)(?:\/|$)/.test(path);
}

function cacheable(res) {
  return res.status === 200 && !res.redirected &&
    !/\b(?:no-store|private)\b/i.test(res.headers.get('cache-control') || '') &&
    !res.headers.get('vary')?.includes('*');
}

// HTML routes advertise Vary: Accept because the same URL can return Markdown.
// Normalize only HTML/navigation requests, retaining every other Vary dimension.
function contentRequest(request, html = false) {
  const accept = request.headers.get('accept') || '';
  // Agent requests may list HTML as a lower-priority fallback. Leave their
  // negotiation intact rather than collapsing them into the browser variant.
  if (!html && /text\/markdown/i.test(accept)) return request;
  if (html || request.mode === 'navigate' || /text\/html/i.test(accept)) {
    const headers = new Headers(request.headers);
    headers.set('accept', 'text/html');
    return new Request(request.url, { headers });
  }
  return request;
}

// Serialize writes so concurrent visits cannot race eviction or grow the cache
// beyond the limit. A quota failure must never break a successful network read.
let writes = Promise.resolve();
function saveContent(request, response, assets = ASSETS) {
  writes = writes.then(async () => {
    const type = response.headers.get('content-type') || '';
    if (type.includes('text/markdown')) return;
    request = contentRequest(request, type.includes('text/html'));
    const cache = await caches.open(CONTENT);
    if (!cacheable(response)) { await cache.delete(request); return; }
    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_CONTENT_BYTES) return;
    const headers = new Headers(response.headers);
    headers.set('x-tmm-assets', assets);
    await cache.delete(request);
    await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
    const keys = await cache.keys();
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(key);
  }).catch(() => {});
  return writes;
}

async function assetMatch(request, includeOld = true) {
  const current = await (await caches.open(ASSETS)).match(request);
  if (current) return current;
  if (!includeOld) return;
  for (const name of await caches.keys()) {
    if (name !== ASSETS && /^(?:tmm-assets-|tmm-cache-)/.test(name)) {
      const cached = await (await caches.open(name)).match(request);
      if (cached) return cached;
    }
  }
}

// Keep the assets named by cached HTML. Evict the oldest build with its pages
// only when the combined asset budget is exceeded; never leave orphaned HTML.
async function pruneAssets() {
  const pages = await caches.open(CONTENT);
  const keys = await pages.keys();
  const references = new Map();
  for (const key of keys) {
    const name = (await pages.match(key))?.headers.get('x-tmm-assets');
    if (name) {
      if (!references.has(name)) references.set(name, []);
      references.get(name).push(key);
    }
  }
  const retained = [];
  let total = 0;
  await caches.open(ASSETS);
  const names = await caches.keys();
  // CacheStorage keeps creation order. Caches after ours belong to an update
  // still installing/waiting; the active worker must leave them alone.
  for (const name of names.slice(0, names.indexOf(ASSETS) + 1)) {
    if (!/^(?:tmm-assets-|tmm-cache-)/.test(name)) continue;
    if (name !== ASSETS && !references.has(name)) { await caches.delete(name); continue; }
    const cache = await caches.open(name);
    let bytes = 0;
    for (const key of await cache.keys()) {
      const response = await cache.match(key);
      bytes += Number(response.headers.get('x-tmm-bytes')) || (await response.arrayBuffer()).byteLength;
    }
    total += bytes;
    retained.push({ name, bytes });
  }
  for (const { name, bytes } of retained) {
    if (total <= MAX_ASSET_BYTES) break;
    if (name === ASSETS) continue;
    for (const key of references.get(name) || []) await pages.delete(key);
    await caches.delete(name);
    total -= bytes;
  }
  if (total > MAX_ASSET_BYTES) {
    const current = await caches.open(ASSETS);
    for (const key of await current.keys()) {
      if (PRECACHE.includes(new URL(key.url).pathname)) continue;
      const response = await current.match(key);
      total -= Number(response.headers.get('x-tmm-bytes')) || (await response.arrayBuffer()).byteLength;
      await current.delete(key);
      // Current JS/CSS shell chunks are protected by PRECACHE. Evicting an
      // optional WASM runtime, font or download must not discard reading pages.
      if (total <= MAX_ASSET_BYTES) break;
    }
  }
}

function saveAsset(request, response) {
  writes = writes.then(async () => {
    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_ASSET_BYTES) return;
    const headers = new Headers(response.headers);
    headers.set('x-tmm-bytes', String(body.byteLength));
    await (await caches.open(ASSETS)).put(request, new Response(body, {
      status: response.status, statusText: response.statusText, headers
    }));
    await pruneAssets();
  }).catch(() => {});
  return writes;
}

self.addEventListener('install', (event) => {
  // Installation is atomic. Let an update wait until old controlled tabs close;
  // replacing their worker immediately would strand old lazy chunk requests.
  event.waitUntil(
    caches
      .open(ASSETS)
      .then((c) => c.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // One-time upgrade from the previous combined cache layout. Preserve
      // visited public pages and their asset cache before retiring unused builds.
      const pages = await caches.open(CONTENT);
      for (const name of await caches.keys()) {
        if (!name.startsWith('tmm-cache-')) continue;
        const legacy = await caches.open(name);
        for (const request of await legacy.keys()) {
          if (publicContent(new URL(request.url).pathname) && !(await pages.match(request))) {
            await saveContent(request, await legacy.match(request), name);
          }
          if (publicContent(new URL(request.url).pathname)) await legacy.delete(request);
        }
      }
      await pruneAssets().catch(() => {});
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
  let url = new URL('/review', location.origin);
  try {
    const candidate = new URL(event.notification.data?.url || '/review', location.origin);
    if (candidate.origin === location.origin) url = candidate;
  } catch (e) {}
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clientsList) {
        if (c.url === url.href && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url.href);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (NEVER_CACHE.test(url.pathname)) return;

  // Content-hashed assets cache on demand, including WASM/data excluded from
  // install. Older paths are served from the build referenced by saved HTML.
  if (BUILT.has(url.pathname) || url.pathname.startsWith(IMMUTABLE) || STATIC.has(url.pathname)) {
    event.respondWith((async () => {
      const cached = await assetMatch(request, url.pathname.startsWith(IMMUTABLE)).catch(() => null);
      if (cached) return cached;
      let response;
      try { response = await fetch(request); }
      catch (err) {
        const older = await assetMatch(request).catch(() => null);
        if (older) return older;
        throw err;
      }
      if (cacheable(response)) {
        event.waitUntil(saveAsset(request, response.clone()));
      }
      return response;
    })());
    return;
  }

  if (!publicContent(url.pathname)) return;

  // Pages + guide content → network-first, fall back to cache (offline reading).
  event.respondWith(
    (async () => {
      const cached = () => caches.open(CONTENT).then((cache) => cache.match(contentRequest(request))).catch(() => null);
      try {
        const res = await fetch(request);
        if (res.status >= 500) return (await cached()) || res;
        event.waitUntil(saveContent(request, res.clone()));
        return res;
      } catch (err) {
        const saved = await cached();
        if (saved) return saved;
        if (request.mode === 'navigate') {
          return new Response('You are offline. This page has not been saved yet. Reconnect and visit it to make it available offline.', {
            status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
          });
        }
        throw err;
      }
    })()
  );
});
