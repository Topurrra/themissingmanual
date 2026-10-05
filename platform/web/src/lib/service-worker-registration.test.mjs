import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const layout = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const start = layout.indexOf('  onMount(() => {\n    if (!("serviceWorker" in navigator))');
const source = layout.slice(start, layout.indexOf('\n  onMount(', start + 1));

test('dev cleanup unregisters only the application worker and its caches', async () => {
  const removed = [];
  const unregistered = [];
  const context = vm.createContext({
    onMount: (fn) => fn(), dev: true, URL,
    location: { origin: 'https://manual.test' },
    navigator: { serviceWorker: { getRegistrations: async () => [
      { active: { scriptURL: 'https://manual.test/service-worker.js' }, unregister: () => unregistered.push('manual') },
      { active: { scriptURL: 'https://manual.test/other/worker.js' }, unregister: () => unregistered.push('other') }
    ] } },
    caches: { keys: async () => ['tmm-cache-old', 'tmm-assets-new', 'tmm-content-v1', 'other-app'], delete: (key) => removed.push(key) }
  });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  assert.deepEqual(unregistered, ['manual']);
  assert.deepEqual(removed, ['tmm-cache-old', 'tmm-assets-new', 'tmm-content-v1']);
});

test('production registration failures are observable', async () => {
  const warnings = [];
  const context = vm.createContext({
    onMount: (fn) => fn(), dev: false,
    navigator: { serviceWorker: { controller: null, addEventListener: () => {}, removeEventListener: () => {}, register: async () => { throw new Error('install failed'); } } },
    console: { warn: (...args) => warnings.push(args) }
  });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0]), /install failed/);
});

test('first controller activation saves the current page for offline reading', async () => {
  let change; const fetched = [];
  const context = vm.createContext({
    onMount: (fn) => fn(), dev: false,
    location: { origin: 'https://manual.test', href: 'https://manual.test/guides/example/1' },
    navigator: { serviceWorker: {
      controller: null, register: async () => ({}),
      addEventListener: (name, fn) => { if (name === 'controllerchange') change = fn; },
      removeEventListener: () => {}
    } },
    fetch: async (url) => { fetched.push(url); }, console
  });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  assert.equal(typeof change, 'function');
  await change();
  assert.deepEqual(fetched, ['https://manual.test/guides/example/1']);
});
