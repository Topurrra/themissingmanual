import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker as NodeWorker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createState, legalMoves, applyMove } from './checkers.js';
import { chooseAction } from './opponents.js';
import { MarcherTransport } from './marcher-client.js';

const workerPath = fileURLToPath(new URL('../../../static/games/engines/marcher/adapter-worker.js', import.meta.url));
const enginePath = fileURLToPath(new URL('../../../static/games/engines/marcher/marcher.js', import.meta.url));
const wasmPath = fileURLToPath(new URL('../../../static/games/engines/marcher/marcher.wasm', import.meta.url));
const scalarEnginePath = fileURLToPath(new URL('../../../static/games/engines/marcher/marcher-scalar.js', import.meta.url));
const scalarWasmPath = fileURLToPath(new URL('../../../static/games/engines/marcher/marcher-scalar.wasm', import.meta.url));

class TestWorker {
  constructor(scalar = false) {
    this.worker = new NodeWorker(`
      const { parentPort } = require('node:worker_threads');
      const { readFileSync } = require('node:fs');
      ${scalar ? 'WebAssembly.validate = () => false;' : ''}
      globalThis.postMessage = message => parentPort.postMessage(message);
      globalThis.importScripts = () => {
        eval(readFileSync(${JSON.stringify(scalar ? scalarEnginePath : enginePath)}, 'utf8') + '; globalThis.createMarcher = createMarcher');
        const original = globalThis.createMarcher;
        globalThis.createMarcher = options => original({ ...options, locateFile: () => ${JSON.stringify(scalar ? scalarWasmPath : wasmPath)} });
      };
      eval(readFileSync(${JSON.stringify(workerPath)}, 'utf8'));
      parentPort.on('message', data => globalThis.onmessage({ data }));
    `, { eval: true });
  }
  addEventListener(type, listener) {
    if (type === 'message') this.worker.on('message', data => listener({ data }));
    else if (type === 'error') this.worker.on('error', listener);
  }
  removeEventListener() {}
  postMessage(data) { this.worker.postMessage(data); }
  terminate() { this.worker.terminate(); }
}
class ScalarTestWorker extends TestWorker { constructor() { super(true); } }

async function ask(state, { WorkerClass = TestWorker, ...extras } = {}) {
  const transport = new MarcherTransport({ WorkerClass });
  try {
    const id = 7, revision = 3;
    return await new Promise((resolve, reject) => {
      let ready = false;
      const timer = setTimeout(() => reject(new Error('Marcher timed out')), 10000);
      transport.addEventListener('error', reject);
      transport.addEventListener('message', ({ data }) => {
        if (data.id !== id) return;
        if (data.stage === 'ready') { ready = true; return; }
        clearTimeout(timer);
        if (data.error) reject(new Error(data.error.message));
        else if (!ready) reject(new Error('Marcher result preceded readiness'));
        else resolve(data.result);
      });
      transport.postMessage({ game: 'checkers', kind: 'move', state, budgetMs: 100, difficulty: 'hard', id, revision, ...extras });
    });
  } finally { transport.terminate(); }
}

test('real Marcher WASM returns a legal opening move for both board orientations', async () => {
  const black = createState();
  const b = await ask(black);
  assert.ok(legalMoves(black).some(move => JSON.stringify(move) === JSON.stringify(b.action)));
  const white = createState({ board: black.board, turn: 'w' });
  const w = await ask(white);
  assert.ok(legalMoves(white).some(move => JSON.stringify(move) === JSON.stringify(w.action)));
});

test('a selected-piece hint stays on that piece', async () => {
  const state = createState();
  const result = await ask(state, { kind: 'hint', selection: 17 });
  assert.equal(result.action.path[0], 17);
});

test('real scalar WASM fallback returns a legal move', async () => {
  const state = createState();
  const result = await ask(state, { WorkerClass: ScalarTestWorker });
  assert.ok(legalMoves(state).some(move => JSON.stringify(move) === JSON.stringify(result.action)));
});

test('real Marcher WASM supplies a complete forced multi-capture route', async () => {
  const board = Array(64).fill(0);
  board[17] = 1; board[26] = -1; board[44] = -1;
  const result = await ask(createState({ board, turn: 'b' }));
  assert.deepEqual(result.action.path, [17, 35, 53]);
});

test('real Marcher WASM stops a capture route upon crowning', async () => {
  const board = Array(64).fill(0);
  board[40] = 1; board[49] = -1;
  const result = await ask(createState({ board, turn: 'b' }));
  assert.deepEqual(result.action.path, [40, 58]);
});

test('white king bitboard can capture backward', async () => {
  const board = Array(64).fill(0);
  board[26] = -2; board[35] = 1;
  const result = await ask(createState({ board, turn: 'w' }));
  assert.deepEqual(result.action.path, [26, 44]);
});

test('Marcher avoids an immediate capture offered by the old shallow search', async () => {
  const board = [
    0,1,0,1,0,1,0,1, 1,0,0,0,0,0,1,0,
    0,0,0,1,0,1,0,1, 0,0,0,0,0,0,0,0,
    0,0,0,-1,0,0,0,-1, -1,0,0,0,0,0,0,0,
    0,0,0,-1,0,0,0,-1, -1,0,-1,0,-1,0,-1,0
  ];
  const state = createState({ board, turn: 'b' });
  const shallow = chooseAction('checkers', state, { difficulty: 'hard' }).action;
  assert.deepEqual(shallow.path, [21, 30]);
  assert.ok(legalMoves(applyMove(state, shallow)).some(move => Math.abs(move.path[1] - move.path[0]) > 9));
  const marcher = (await ask(state)).action;
  assert.ok(legalMoves(state).some(move => JSON.stringify(move) === JSON.stringify(marcher)));
  assert.ok(legalMoves(applyMove(state, marcher)).every(move => Math.abs(move.path[1] - move.path[0]) <= 9));
});
