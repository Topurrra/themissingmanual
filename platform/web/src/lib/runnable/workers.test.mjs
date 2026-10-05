import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Worker, MessageChannel } from 'node:worker_threads';
import test from 'node:test';

const adapterSource = readFileSync(new URL('./adapters.js', import.meta.url), 'utf8');
const workerSource = readFileSync(new URL('./js-worker.js', import.meta.url), 'utf8');
const live = new Set();

// Exercise the real execution script on a separate thread; bridge only the
// browser Worker transport, which Node does not provide.
class BrowserWorker {
  constructor() {
    this.worker = new Worker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.self = globalThis;
      globalThis.postMessage = (data) => parentPort.postMessage(data);
      ${workerSource}
      parentPort.on('message', ({ data, ports }) => self.onmessage({ data, ports }));
    `, { eval: true });
    live.add(this);
    this.worker.on('message', (data) => this.onmessage?.({ data }));
    this.worker.on('error', (err) => this.onerror?.({ message: err.message }));
  }
  postMessage(data, ports = []) { this.worker.postMessage({ data, ports }, ports); }
  terminate() { live.delete(this); this.worker.terminate(); }
}

function adapter() {
  const source = adapterSource.slice(adapterSource.indexOf('class JsAdapter {'), adapterSource.indexOf('// Python -'));
  const context = vm.createContext({ JsWorker: BrowserWorker, MessageChannel, setTimeout, clearTimeout });
  vm.runInContext(`${source}; globalThis.Adapter = JsAdapter;`, context);
  return new context.Adapter();
}

test.afterEach(() => { for (const worker of live) worker.terminate(); });

test('overlapping blocks each receive their own result', async () => {
  const a = adapter(); a.timeoutMs = 500;
  const [first, second] = await Promise.all([a.run('21 * 2'), a.run('7 * 3')]);
  assert.equal(first.result, '42');
  assert.equal(second.result, '21');
  assert.equal(live.size, 0);
});

test('globals cannot leak into the next block', async () => {
  const a = adapter();
  await a.run('var remembered = 42; remembered');
  assert.equal((await a.run('typeof remembered')).result, 'undefined');
});

test('awaits returned promises and captures logs before settlement', async () => {
  const res = await adapter().run('new Promise(resolve => setTimeout(() => { console.log("later"); resolve(42); }, 10))');
  assert.equal(res.result, '42');
  assert.equal(res.logs, 'later');
});

test('promise rejection is a structured execution error', async () => {
  const res = await adapter().run('Promise.reject(new Error("nope"))');
  assert.equal(res.errorMessage, 'Error: nope');
});

test('a runaway run times out without poisoning later executions', async () => {
  const a = adapter(); a.timeoutMs = 150;
  assert.match((await a.run('while (true) {}')).error, /timed out/);
  assert.equal((await a.run('42')).result, '42');
  assert.equal(live.size, 0);
});

test('an unresolved promise is subject to the same hard timeout', async () => {
  const a = adapter(); a.timeoutMs = 150;
  assert.match((await a.run('new Promise(() => {})')).error, /timed out/);
  assert.equal(live.size, 0);
});

test('dispose settles every active run as cancellation', async () => {
  const a = adapter(); a.timeoutMs = 150;
  const runs = [a.run('while (true) {}'), a.run('while (true) {}')];
  a.dispose();
  for (const result of await Promise.all(runs)) assert.match(result.error, /cancel/i);
  assert.equal(live.size, 0);
});

test('aborting a run does not cancel a different block', async () => {
  const a = adapter(); a.timeoutMs = 500;
  const controller = new AbortController();
  const cancelled = a.run('while (true) {}', { signal: controller.signal });
  const other = a.run('42');
  controller.abort();
  assert.match((await cancelled).error, /cancel/i);
  assert.equal((await other).result, '42');
});

test('pre-aborted runs never execute', async () => {
  const controller = new AbortController(); controller.abort();
  assert.match((await adapter().run('42', { signal: controller.signal })).error, /cancel/i);
  assert.equal(live.size, 0);
});

test('console flooding produces bounded output', async () => {
  const res = await adapter().run('for (let i=0; i<10000; i++) console.log("hello");');
  assert.ok(res.logs.length < 70000);
  assert.match(res.logs, /truncated/i);
});

test('syntax errors preserve captured output and a clean error message', async () => {
  const res = await adapter().run('console.log("before"); throw new TypeError("bad")');
  assert.equal(res.logs, 'before');
  assert.equal(res.errorMessage, 'TypeError: bad');
  assert.match(res.error, /TypeError: bad/);
});

function runners(a) {
  const source = readFileSync(new URL('../practice/runners.js', import.meta.url), 'utf8')
    .replace(/^import .*getAdapter.*;$/m, '').replace(/export async function/g, 'async function');
  const context = vm.createContext({ getAdapter: () => a, performance });
  vm.runInContext(`${source}; globalThis.runners = { runLesson, gradeLesson };`, context);
  return context.runners;
}

test('practice run propagates cancellation to the execution worker', async () => {
  const a = adapter(); a.timeoutMs = 150;
  const controller = new AbortController();
  const promise = runners(a).runLesson({ language: 'js' }, 'while (true) {}', { signal: controller.signal });
  controller.abort();
  assert.match((await promise).error, /cancel/i);
  assert.equal(live.size, 0);
});

test('cancelled grading does not execute later tests', async () => {
  const a = adapter(); a.timeoutMs = 150;
  const controller = new AbortController(); controller.abort();
  const lesson = { language: 'js', tests: [{ name: 'first', code: '42' }, { name: 'second', code: '42' }] };
  const result = await runners(a).gradeLesson(lesson, '', { signal: controller.signal });
  assert.equal(result.passed, false);
  assert.match(result.detail, /cancel/i);
  assert.equal(live.size, 0);
});

test('throwing a symbol cannot be reported as a successful execution', async () => {
  const res = await adapter().run('throw Symbol("bad")');
  assert.equal(res.errorMessage, 'Symbol(bad)');
  assert.equal(res.error, 'Symbol(bad)');
});

test('user-posted failure messages cannot replace the runtime error', async () => {
  const res = await adapter().run('self.postMessage({__id:1, ok:false, logs:[]}); throw new Error("real failure")');
  assert.equal(res.errorMessage, 'Error: real failure');
});

test('user code cannot forge successful completion on the public worker channel', async () => {
  const a = adapter(); a.timeoutMs = 150;
  const res = await a.run('self.postMessage({__id:1, ok:true, logs:[], result:"42"}); while(true){}');
  assert.match(res.error, /timed out/);
  assert.equal(res.result, undefined);
});

test('TypeScript and JavaScript runs do not cancel one another', async () => {
  const a = adapter();
  const source = readFileSync(new URL('./typescript-adapter.js', import.meta.url), 'utf8')
    .replace(/^import .*getAdapter.*;$/m, '')
    .replace('export class TypeScriptAdapter', 'class TypeScriptAdapter')
    .replace("await import('sucrase')", 'await loadSucrase()');
  const context = vm.createContext({ getAdapter: () => a, loadSucrase: () => import('sucrase') });
  vm.runInContext(`${source}; globalThis.TS = TypeScriptAdapter;`, context);
  const ts = new context.TS();
  const first = a.run('new Promise(resolve => setTimeout(() => resolve(42), 100))');
  const [jsResult, tsResult] = await Promise.all([first, ts.run('const answer: number = 21; answer')]);
  assert.equal(jsResult.result, '42');
  assert.equal(tsResult.result, '21');
});

test('practice Python tests request fresh namespaces on every run', async () => {
  const calls = [];
  const a = { load: async () => {}, run: async (_code, opts) => { calls.push(opts); return { logs: '' }; } };
  await runners(a).runLesson({ language: 'python' }, 'x = 1');
  await runners(a).gradeLesson({ language: 'python', tests: [{ name: 'one', code: 'assert True' }, { name: 'two', code: 'assert True' }] }, 'x = 1');
  assert.equal(calls.length, 3);
  assert.ok(calls.every((opts) => opts.fresh === true));
});

test('SQL grading propagates cancellation to both isolated query runs', async () => {
  const calls = [];
  const a = { load: async () => {}, run: async (_code, opts) => {
    calls.push(opts); return { table: { columns: ['n'], rows: [[1]] } };
  } };
  const controller = new AbortController();
  await runners(a).gradeLesson({ language: 'sql', check: 'rows', setup: 'seed', solution: 'SELECT 1' }, 'SELECT 1', { signal: controller.signal });
  assert.equal(calls.length, 2);
  assert.ok(calls.every((opts) => opts.signal === controller.signal && opts.seed === 'seed'));
});

test('JavaScript cannot forge a reply by replacing the MessagePort method', async () => {
  const res = await adapter().run(`const original = MessagePort.prototype.postMessage;
MessagePort.prototype.postMessage = function(data) { return original.call(this, {...data, ok: true, logs: [], result: '42'}); };
throw new Error('real failure');`);
  assert.equal(res.errorMessage, 'Error: real failure');
  assert.equal(res.result, undefined);
});
