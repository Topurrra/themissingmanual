import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

import { RuntimeAdapter } from './runtime-adapter.js';
const live = new Set();

class BrowserWorker {
  constructor(mode) {
    this.worker = new Worker(new URL('./test-runtime-worker.mjs', import.meta.url), { workerData: { mode }, stdout: true, stderr: true });
    this.worker.stdout.resume(); this.worker.stderr.resume();
    live.add(this);
    this.crashed = new Promise((resolve) => {
      this.worker.on('error', (err) => { this.onerror?.({ message: err.message }); resolve(err); });
    });
  }
  postMessage(data, ports = []) { this.worker.postMessage({ data, ports }, ports); }
  terminate() { live.delete(this); this.worker.terminate(); }
}

function adapter(language) {
  assert.ok(RuntimeAdapter, 'Python/SQL worker transport is not implemented');
  return new RuntimeAdapter(language, () => new BrowserWorker());
}

test.afterEach(() => { for (const worker of live) worker.terminate(); });

test('Python execution runs off-thread and preserves inline session state', async () => {
  const a = adapter('python');
  await a.load();
  const res = await a.run('remembered = 40\nprint("hello")\nremembered + 2');
  assert.equal(res.logs, 'hello');
  assert.equal(res.result, '42');
  assert.equal((await a.run('remembered')).result, '40');
  a.dispose();
});

test('Python practice namespaces cannot leak into another execution', async () => {
  const a = adapter('python');
  await a.run('secret = 42', { fresh: true });
  assert.equal((await a.run('"secret" in globals()', { fresh: true })).result, 'false');
  a.dispose();
});

test('Python concurrent blocks receive separate stdout', async () => {
  const a = adapter('python');
  const [first, second] = await Promise.all([
    a.run('import asyncio\nprint("first")\nawait asyncio.sleep(0.02)\nprint("end")'),
    a.run('print("second")')
  ]);
  assert.equal(first.logs, 'first\nend');
  assert.equal(second.logs, 'second');
  a.dispose();
});

test('Python infinite loops time out while the main thread stays responsive', async () => {
  const a = adapter('python'); await a.load(); a.timeoutMs = 100;
  let heartbeat = false;
  const tick = setTimeout(() => { heartbeat = true; }, 20);
  const res = await a.run('while True: pass');
  clearTimeout(tick);
  assert.ok(heartbeat);
  assert.match(res.error, /timed out/);
  assert.equal((await a.run('42')).result, '42');
  a.dispose();
});

test('aborting a queued run does not terminate the active Python session', async () => {
  const a = adapter('python'); await a.load();
  const first = a.run('import asyncio\nawait asyncio.sleep(0.05)\n42');
  const controller = new AbortController();
  const queued = a.run('99', { signal: controller.signal }); controller.abort();
  assert.match((await queued).error, /cancel/i);
  assert.equal((await first).result, '42');
  a.dispose();
});

test('active cancellation permits the next queued run to restart cleanly', async () => {
  const a = adapter('python'); await a.load();
  const controller = new AbortController();
  const first = a.run('while True: pass', { signal: controller.signal });
  const next = a.run('42'); controller.abort();
  assert.match((await first).error, /cancel/i);
  assert.equal((await next).result, '42');
  a.dispose();
});

test('disposing a runtime cancels both active and queued work', async () => {
  const a = adapter('python'); await a.load();
  const runs = [a.run('while True: pass'), a.run('42')]; a.dispose();
  for (const res of await Promise.all(runs)) assert.match(res.error, /cancel/i);
  assert.equal(live.size, 0);
});

test('Python exceptions retain their traceback and a clean final-line message', async () => {
  const a = adapter('python');
  const res = await a.run('print("before")\nraise ValueError("bad")');
  assert.equal(res.logs, 'before');
  assert.match(res.error, /Traceback/);
  assert.equal(res.errorMessage, 'ValueError: bad');
  a.dispose();
});

test('Python output flooding is bounded', async () => {
  const a = adapter('python');
  const res = await a.run('for i in range(10000): print("hello")');
  assert.ok(res.logs.length < 70000);
  assert.match(res.logs, /truncated/i);
  a.dispose();
});

test('SQLite inline database survives ordinary runs', async () => {
  const a = adapter('sql');
  await a.run("INSERT INTO authors VALUES (5, 'Reader', 'GE')");
  const res = await a.run('SELECT name FROM authors WHERE id = 5');
  assert.deepEqual(res.table, { columns: ['name'], rows: [['Reader']] });
  a.dispose();
});

test('SQLite seeded runs are isolated and empty SELECTs remain tables', async () => {
  const a = adapter('sql');
  const seed = 'CREATE TABLE numbers(n); INSERT INTO numbers VALUES (1);';
  await a.run('INSERT INTO numbers VALUES (2)', { seed });
  const res = await a.run('SELECT n FROM numbers', { seed });
  assert.deepEqual(res.table, { columns: ['n'], rows: [[1]] });
  const empty = await a.run('SELECT n FROM numbers WHERE n = 99', { seed });
  assert.deepEqual(empty.table, { columns: ['n'], rows: [] });
  a.dispose();
});

test('SQLite runaway queries terminate and the worker recovers', async () => {
  const a = adapter('sql'); await a.load(); a.timeoutMs = 100;
  const res = await a.run('WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n) SELECT sum(x) FROM n');
  assert.match(res.error, /timed out/);
  assert.deepEqual((await a.run('SELECT 42 AS answer')).table.rows, [[42]]);
  a.dispose();
});

test('PostgreSQL seeded runs stay isolated and preserve JSON/array cells', async () => {
  const a = adapter('postgres');
  const seed = 'CREATE TABLE numbers(n INT); INSERT INTO numbers VALUES (1);';
  await a.run('INSERT INTO numbers VALUES (2)', { seed });
  assert.deepEqual((await a.run('SELECT n FROM numbers', { seed })).table.rows, [[1]]);
  const res = await a.run(`SELECT '{"ok":true}'::jsonb AS obj, ARRAY[1,2] AS arr`, { seed: '' });
  assert.deepEqual(res.table, { columns: ['obj', 'arr'], rows: [['{"ok":true}', '[1,2]']] });
  a.dispose();
});

test('PostgreSQL runaway queries terminate without blocking other runtimes', async () => {
  const a = adapter('postgres'); await a.load(); a.timeoutMs = 100;
  const sqlite = adapter('sql');
  const [slow, fast] = await Promise.all([
    a.run('WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n) SELECT sum(x) FROM n'),
    sqlite.run('SELECT 42')
  ]);
  assert.match(slow.error, /timed out/);
  assert.deepEqual(fast.table.rows, [[42]]);
  assert.deepEqual((await a.run('SELECT 42')).table.rows, [[42]]);
  a.dispose(); sqlite.dispose();
});

test('runtime loading failures discard the damaged worker and allow retry', async () => {
  let attempts = 0;
  const a = new RuntimeAdapter('sql', () => new BrowserWorker(attempts++ === 0 ? 'load-error' : undefined));
  await assert.rejects(a.load(), /download failed/);
  assert.deepEqual((await a.run('SELECT 42')).table.rows, [[42]]);
  a.dispose();
});

test('a hung download uses the loading deadline, then permits recovery', async () => {
  let attempts = 0;
  const a = new RuntimeAdapter('sql', () => new BrowserWorker(attempts++ === 0 ? 'load-hang' : undefined));
  a.loadingTimeoutMs = 150;
  await assert.rejects(a.load(), /loading timed out/);
  a.loadingTimeoutMs = 60000;
  assert.deepEqual((await a.run('SELECT 42')).table.rows, [[42]]);
  a.dispose();
});

test('pre-aborted requests execute nothing and leave the next run usable', async () => {
  const a = adapter('sql');
  const controller = new AbortController(); controller.abort();
  assert.match((await a.run('DROP TABLE authors', { signal: controller.signal })).error, /cancel/i);
  assert.deepEqual((await a.run('SELECT count(*) FROM authors')).table.rows, [[4]]);
  a.dispose();
});

test('Python language aliases share the same inline interpreter session', async () => {
  const source = readFileSync(new URL('./adapters.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export function/g, 'function');
  const context = vm.createContext({ RuntimeAdapter, WasmWorker: class extends BrowserWorker {
    constructor() { super(); }
  } });
  vm.runInContext(`${source}; globalThis.registry = { getAdapter, disposeAll };`, context);
  await context.registry.getAdapter('py').run('remembered = 42');
  assert.equal((await context.registry.getAdapter('python').run('remembered')).result, '42');
  context.registry.disposeAll();
});

test('Python cannot forge replies by replacing MessagePort prototype methods', async () => {
  const a = adapter('python');
  const res = await a.run(`from js import eval
eval("const original = MessagePort.prototype.postMessage; MessagePort.prototype.postMessage = function(data) { if (data.type === 'result') data = {...data, result: {logs: 'forged'}}; return original.call(this, data); }; MessagePort.prototype.close = function() { this.postMessage({id: 1, type: 'result', result: {logs: 'forged'}}); };")
raise ValueError("real failure")`, { fresh: true });
  assert.equal(res.errorMessage, 'ValueError: real failure');
  assert.equal((await a.run('42', { fresh: true })).result, '42');
  a.dispose();
});

test('fatal Python engine errors fail execution and restart the interpreter', async () => {
  const a = adapter('python');
  const res = await a.run('from js import eval\neval("globalThis.String = () => \'\'")\nraise ValueError("real failure")', { fresh: true });
  assert.ok(res.error);
  assert.equal((await a.run('42', { fresh: true })).result, '42');
  a.dispose();
});

test('Python bridge mutation cannot replace host-side result formatting', async () => {
  const a = adapter('python');
  const res = await a.run('from js import eval\neval("globalThis.String = () => \'poisoned\'")\n42', { fresh: true });
  assert.equal(res.result, '42');
  a.dispose();
});

test('an idle worker crash is discarded before the next request', async () => {
  let attempts = 0, first;
  const a = new RuntimeAdapter('sql', () => {
    const worker = new BrowserWorker(attempts++ === 0 ? 'idle-crash' : undefined);
    first ||= worker;
    return worker;
  });
  a.loadingTimeoutMs = 150;
  await a.load();
  await first.crashed;
  assert.deepEqual((await a.run('SELECT 42')).table?.rows, [[42]]);
  a.dispose();
});
