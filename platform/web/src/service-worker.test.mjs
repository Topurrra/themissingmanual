import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8').replace(/^import .*\$service-worker.*;$/m, '');
const origin = 'https://manual.test';
const keyOf = (r) => new URL(typeof r === 'string' ? r : r.url, origin).href;

function setup(version = 'new', initial = {}) {
  const stores = new Map(Object.entries(initial).map(([name, entries]) => [name, new Map(entries)]));
  const handlers = {};
  let network = async () => new Response('network');
  let skipWaiting = false;
  const added = [];
  const storedHeaders = new WeakMap();
  let failWrites = false;
  const cache = (entries) => ({
    match: async (r) => {
      const response = entries.get(keyOf(r));
      if (!response) return;
      const vary = (response.headers.get('vary') || '').split(',').map((s) => s.trim()).filter(Boolean);
      const saved = storedHeaders.get(response) || new Headers();
      if (vary.some((name) => name === '*' || saved.get(name) !== (r.headers?.get(name) || null))) return;
      return response.clone();
    },
    put: async (r, res) => {
      if (failWrites) throw new Error('quota exceeded');
      const copy = res.clone(); storedHeaders.set(copy, new Headers(r.headers)); entries.set(keyOf(r), copy);
    },
    delete: async (r) => entries.delete(keyOf(r)),
    keys: async () => [...entries].map(([url, res]) => new Request(url, { headers: storedHeaders.get(res) })),
    add: async (r) => { entries.set(keyOf(r), new Response('shell')); },
    addAll: async (paths) => { added.push(...paths); for (const p of paths) entries.set(keyOf(p), new Response('asset')); }
  });
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      return cache(stores.get(name));
    },
    match: async (r) => {
      for (const entries of stores.values()) if (entries.has(keyOf(r))) return entries.get(keyOf(r)).clone();
    }
  };
  const context = vm.createContext({
    build: ['/_app/immutable/entry/start.abc.js', '/_app/immutable/assets/runtime.wasm', '/_app/immutable/assets/runtime.data'],
    files: ['/icon-192.png', '/large.zip', '/fonts.css', '/fonts/inter-400-latin.woff2'], version,
    caches, URL, Request, Response, Headers, location: { origin },
    fetch: (...args) => network(...args),
    self: { addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting: async () => { skipWaiting = true; }, clients: { claim: async () => {} } }
  });
  vm.runInContext(source, context);
  async function event(name, extra = {}) {
    const pending = []; let response;
    handlers[name]({ ...extra, waitUntil: (p) => pending.push(p), respondWith: (p) => { response = p; } });
    const res = await response;
    await Promise.all(pending);
    return res;
  }
  function request(path, mode = 'navigate') {
    return { url: origin + path, method: 'GET', mode, headers: new Headers() };
  }
  return { stores, added, event, request, failWrites: () => { failWrites = true; }, setNetwork: (fn) => { network = fn; }, didSkip: () => skipWaiting };
}

test('installation excludes heavy runtimes and waits for a safe update', async () => {
  const s = setup(); await s.event('install');
  assert.ok(s.added.includes('/_app/immutable/entry/start.abc.js'));
  assert.ok(!s.added.some((p) => /\.(wasm|data)$/.test(p)));
  assert.equal(s.didSkip(), false);
});

test('activation preserves reading content and unrelated origin caches', async () => {
  const s = setup('new', { 'tmm-content-v1': [], 'other-app': [], 'tmm-assets-old': [] });
  await s.event('activate');
  assert.ok(s.stores.has('tmm-content-v1'));
  assert.ok(s.stores.has('other-app'));
  assert.ok(!s.stores.has('tmm-assets-old'));
});

test('a visited guide remains available after an app update', async () => {
  const s = setup('new', { 'tmm-content-v1': [[origin + '/guides/example/1', new Response('saved guide')]] });
  await s.event('activate');
  s.setNetwork(async () => { throw new Error('offline'); });
  assert.equal(await (await s.event('fetch', { request: s.request('/guides/example/1') })).text(), 'saved guide');
});

test('cache-write failure cannot turn a successful request into a failure', async () => {
  const s = setup();
  s.failWrites();
  s.setNetwork(async () => new Response('fresh guide'));
  assert.equal(await (await s.event('fetch', { request: s.request('/guides/example/1') })).text(), 'fresh guide');
});

test('activation retains assets used by saved HTML from a previous build', async () => {
  const saved = new Response('old HTML', { headers: { 'x-tmm-assets': 'tmm-assets-old' } });
  const s = setup('new', {
    'tmm-content-v1': [[origin + '/guides/example/1', saved]],
    'tmm-assets-old': [[origin + '/_app/immutable/entry/old.js', new Response('old JS')]]
  });
  await s.event('activate');
  s.setNetwork(async () => { throw new Error('offline'); });
  assert.equal(await (await s.event('fetch', { request: s.request('/_app/immutable/entry/old.js', 'cors') })).text(), 'old JS');
});

test('first upgrade migrates visited guides from the legacy cache', async () => {
  const s = setup('new', { 'tmm-cache-legacy': [
    [origin + '/guides/example/1', new Response('legacy guide')],
    [origin + '/admin', new Response('private')]
  ] });
  await s.event('activate');
  s.setNetwork(async () => { throw new Error('offline'); });
  assert.equal(await (await s.event('fetch', { request: s.request('/guides/example/1') })).text(), 'legacy guide');
  assert.ok(!s.stores.get('tmm-content-v1').has(origin + '/admin'));
});

test('uncached offline navigation returns a truthful 503 instead of the homepage', async () => {
  const s = setup(); await s.event('install');
  s.setNetwork(async () => { throw new Error('offline'); });
  const response = await s.event('fetch', { request: s.request('/guides/missing/1') });
  assert.equal(response.status, 503);
  assert.match(await response.text(), /offline/i);
});

test('HTTP server errors fall back to the visited guide', async () => {
  const s = setup('new', { 'tmm-content-v1': [[origin + '/guides/example/1', new Response('saved guide')]] });
  s.setNetwork(async () => new Response('broken', { status: 503 }));
  assert.equal(await (await s.event('fetch', { request: s.request('/guides/example/1') })).text(), 'saved guide');
});

test('private and no-store responses are not saved for offline use', async () => {
  for (const directive of ['no-store', 'private']) {
    const s = setup();
    s.setNetwork(async () => new Response('private', { headers: { 'cache-control': directive } }));
    await s.event('fetch', { request: s.request('/guides/example/1') });
    assert.ok(![...s.stores.values()].some((entries) => entries.has(origin + '/guides/example/1')));
  }
});

test('large built runtimes cache on demand', async () => {
  const s = setup();
  const request = s.request('/_app/immutable/assets/runtime.wasm', 'cors');
  await s.event('fetch', { request });
  s.setNetwork(async () => { throw new Error('offline'); });
  assert.equal(await (await s.event('fetch', { request })).text(), 'network');
});

test('content cache evicts oldest visits at its limit', async () => {
  const s = setup();
  for (let i = 0; i < 105; i++) await s.event('fetch', { request: s.request(`/guides/example/${i}`) });
  const pages = s.stores.get('tmm-content-v1');
  assert.ok(pages.size <= 100);
  assert.ok(!pages.has(origin + '/guides/example/0'));
  assert.ok(pages.has(origin + '/guides/example/104'));
});

test('admin and stateful API requests bypass worker interception', async () => {
  const s = setup();
  for (const path of ['/admin', '/api/test', '/push.subscribe.json', '/tutor']) {
    assert.equal(await s.event('fetch', { request: s.request(path) }), undefined);
  }
});

test('oversized pages do not consume the offline content budget', async () => {
  const s = setup();
  s.setNetwork(async () => new Response('x'.repeat(2 * 1024 * 1024 + 1)));
  const res = await s.event('fetch', { request: s.request('/guides/huge/1') });
  assert.equal(res.status, 200);
  assert.ok(![...s.stores.values()].some((entries) => entries.has(origin + '/guides/huge/1')));
});

test('private responses remove a previously cached public representation', async () => {
  const s = setup('new', { 'tmm-content-v1': [[origin + '/guides/example/1', new Response('previously public')]] });
  s.setNetwork(async () => new Response('now private', { headers: { 'cache-control': 'no-store' } }));
  await s.event('fetch', { request: s.request('/guides/example/1') });
  assert.ok(!s.stores.get('tmm-content-v1').has(origin + '/guides/example/1'));
});

test('asset budget eviction removes dependent old HTML with the old build', async () => {
  const saved = new Response('old HTML', { headers: { 'x-tmm-assets': 'tmm-assets-old' } });
  const s = setup('new', {
    'tmm-content-v1': [[origin + '/guides/example/1', saved]],
    'tmm-assets-old': [[origin + '/_app/immutable/entry/old.js', new Response('old JS', { headers: { 'x-tmm-bytes': '70000000' } })]]
  });
  await s.event('activate');
  assert.ok(!s.stores.has('tmm-assets-old'));
  assert.ok(!s.stores.get('tmm-content-v1').has(origin + '/guides/example/1'));
});

test('an active worker never deletes a newer waiting builds cache', async () => {
  const s = setup('active', { 'tmm-assets-active': [], 'tmm-assets-waiting': [] });
  await s.event('activate');
  assert.ok(s.stores.has('tmm-assets-waiting'));
});

test('concurrent visits still respect the content cache limit', async () => {
  const s = setup();
  await Promise.all(Array.from({ length: 105 }, (_, i) =>
    s.event('fetch', { request: s.request(`/guides/example/${i}`) })
  ));
  assert.ok(s.stores.get('tmm-content-v1').size <= 100);
});

test('reading fonts are cached only after a reader requests them', async () => {
  const s = setup(); await s.event('install');
  assert.ok(!s.added.includes('/fonts/inter-400-latin.woff2'));
  const request = s.request('/fonts/inter-400-latin.woff2', 'cors');
  await s.event('fetch', { request });
  s.setNetwork(async () => { throw new Error('offline'); });
  assert.equal(await (await s.event('fetch', { request })).text(), 'network');
});

test('evicting an optional current runtime preserves cached reading pages', async () => {
  const s = setup('current', {
    'tmm-content-v1': [[origin + '/guides/example/1', new Response('guide', { headers: { 'x-tmm-assets': 'tmm-assets-current' } })]],
    'tmm-assets-current': [[origin + '/_app/immutable/assets/large.wasm', new Response('runtime', { headers: { 'x-tmm-bytes': '70000000' } })]]
  });
  await s.event('activate');
  assert.ok(s.stores.get('tmm-content-v1').has(origin + '/guides/example/1'));
  assert.ok(!s.stores.get('tmm-assets-current').has(origin + '/_app/immutable/assets/large.wasm'));
});

test('first-visit HTML warmup matches an offline navigation despite Vary Accept', async () => {
  const s = setup();
  s.setNetwork(async () => new Response('saved HTML', { headers: { 'content-type': 'text/html', vary: 'Accept' } }));
  const warm = s.request('/guides/example/1', 'cors'); warm.headers.set('accept', 'text/html');
  await s.event('fetch', { request: warm });
  s.setNetwork(async () => { throw new Error('offline'); });
  const navigation = s.request('/guides/example/1');
  navigation.headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  assert.equal(await (await s.event('fetch', { request: navigation })).text(), 'saved HTML');
});

test('an offline Markdown request never receives the cached HTML representation', async () => {
  const s = setup();
  s.setNetwork(async () => new Response('saved HTML', { headers: { 'content-type': 'text/html', vary: 'Accept' } }));
  const warm = s.request('/guides/example/1', 'cors'); warm.headers.set('accept', 'text/html');
  await s.event('fetch', { request: warm });
  s.setNetwork(async () => { throw new Error('offline'); });
  for (const accept of ['text/markdown', 'text/markdown, text/html;q=0.9']) {
    const markdown = s.request('/guides/example/1', 'cors'); markdown.headers.set('accept', accept);
    await assert.rejects(s.event('fetch', { request: markdown }), /offline/);
  }
});

test('visited game pages cache offline while game-related private endpoints bypass interception', async () => {
  const s = setup();
  s.setNetwork(async () => new Response('game page', {headers:{'content-type':'text/html'}}));
  for (const path of ['/games','/games/chess','/games/checkers','/games/sudoku','/games/go']) {
    await s.event('fetch',{request:s.request(path)});
  }
  s.setNetwork(async () => { throw new Error('offline'); });
  for (const path of ['/games','/games/chess','/games/checkers','/games/sudoku','/games/go']) {
    assert.equal(await (await s.event('fetch',{request:s.request(path)})).text(),'game page');
  }
  assert.equal(await s.event('fetch',{request:s.request('/api/games')}),undefined);
});
