import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker as Thread } from 'node:worker_threads';
import { GameWorkerClient } from './worker-client.js';

function transport(url) {
  const thread = new Thread(url, { type: 'module' });
  const listeners = new Map();
  return {
    postMessage: (job) => thread.postMessage(job),
    addEventListener(type, fn) {
      const wrapped = type === 'message' ? data => fn({ data }) : error => fn({ message: error.message });
      listeners.set(fn, [type, wrapped]); thread.on(type, wrapped);
    },
    removeEventListener(type, fn) {
      const registered = listeners.get(fn);
      if (registered) thread.off(type, registered[1]);
      listeners.delete(fn);
    },
    terminate: () => thread.terminate()
  };
}
const fixture = new URL('./test-fixtures/transport.mjs', import.meta.url);
const createWorker = () => transport(fixture);

test('worker hard deadline leaves the main thread responsive and permits retry', async () => {
  const client = new GameWorkerClient({ createWorker, timeoutMs: 180 });
  let heartbeat = 0;
  const timer = setInterval(() => heartbeat++, 10);
  await assert.rejects(client.request({ game:'chess', kind:'hang', revision:1 }), /timed out/i);
  clearInterval(timer);
  assert.ok(heartbeat > 5);
  assert.equal((await client.request({ game:'chess', kind:'echo', revision:2 })).revision, 2);
  client.dispose();
});
test('active cancellation, pre-abort and disposal settle jobs', async () => {
  const client = new GameWorkerClient({ createWorker });
  const controller = new AbortController();
  const pending = client.request({ kind:'delay', revision:1 }, { signal:controller.signal });
  controller.abort();
  await assert.rejects(pending, { name:'AbortError' });
  await assert.rejects(client.request({ kind:'echo', revision:1 }, { signal:controller.signal }), { name:'AbortError' });
  const next = client.request({ kind:'delay', revision:1 });
  client.dispose();
  await assert.rejects(next, { name:'AbortError' });
});
test('crashes reject clearly and a new worker retries successfully', async () => {
  const client = new GameWorkerClient({ createWorker });
  await assert.rejects(client.request({ kind:'crash', revision:1 }), /crash/i);
  assert.equal((await client.request({ kind:'echo', revision:2 })).revision, 2);
  client.dispose();
});
test('reply from an old position revision cannot be used', async () => {
  let revision = 1;
  const client = new GameWorkerClient({ createWorker, getRevision: () => revision });
  let markReady;
  const ready=new Promise(resolve=>markReady=resolve);
  const request=client.request({kind:'delay',revision},{onStage:stage=>{if(stage==='thinking')markReady();}});
  await ready;
  revision=2;
  await assert.rejects(request, { name:'AbortError' });
  client.dispose();
});

test('loading has its own deadline before the five-second execution budget', async () => {
  const client = new GameWorkerClient({ createWorker, timeoutMs:40, loadingTimeoutMs:300 });
  const reply=await client.request({kind:'loading',revision:1});
  assert.equal(reply.revision,1);
  client.dispose();
});
test('a loader that never becomes ready times out and can be retried', async () => {
  const client=new GameWorkerClient({createWorker,timeoutMs:50,loadingTimeoutMs:100});
  await assert.rejects(client.request({kind:'loading-hang',revision:1}),/loading.*timed out/i);
  assert.equal((await client.request({kind:'echo',revision:2})).revision,2);
  client.dispose();
});

test('disposing during asynchronous creation terminates the late worker', async () => {
  let deliver;
  let terminated=false;
  const client=new GameWorkerClient({createWorker:()=>new Promise(resolve=>deliver=resolve)});
  const request=client.request({revision:1});
  client.dispose();
  await assert.rejects(request,{name:'AbortError'});
  deliver({terminate(){terminated=true;}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(terminated,true);
});
