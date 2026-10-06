/* global importScripts, createMarcher */
// Classic worker: Emscripten's MODULARIZE build exposes createMarcher through importScripts.
const base = '/games/engines/marcher/';
let enginePromise;

function simdSupported() {
  return WebAssembly.validate(new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0,
    3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11
  ]));
}

function engine() {
  if (!enginePromise) {
    const scalar = !simdSupported();
    importScripts(base + (scalar ? 'marcher-scalar.js' : 'marcher.js'));
    enginePromise = createMarcher({ locateFile: name => base + (scalar && name === 'marcher.wasm' ? 'marcher-scalar.wasm' : name) });
  }
  return enginePromise;
}

function masks(board) {
  let p1 = 0n, p2 = 0n, p1k = 0n, p2k = 0n;
  for (let index = 0; index < 64; index++) {
    const bit = 1n << BigInt(index);
    if (board[index] === -1) p1 |= bit;
    else if (board[index] === 1) p2 |= bit;
    else if (board[index] === -2) p1k |= bit;
    else if (board[index] === 2) p2k |= bit;
  }
  return [p1, p2, p1k, p2k];
}

function search(module, board, turn, budgetMs, depth, forced) {
  module._wasm_search(...masks(board), turn === 'w' ? 1 : 2,
    Math.max(0.05, Math.min(1, budgetMs / 1000)), depth, forced);
  const ptr = module._wasm_result_ptr() >> 2;
  return [module.HEAP32[ptr], module.HEAP32[ptr + 1]];
}

function applyJump(board, from, to) {
  const next = board.slice();
  let piece = next[from];
  next[from] = 0;
  if (Math.abs(to - from) > 9) next[(from + to) / 2] = 0;
  if (Math.abs(piece) === 1 && (Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)) piece *= 2;
  next[to] = piece;
  return next;
}

function selectedRoute(module, job) {
  if (job.legalPaths.length === 1) return job.legalPaths[0];
  const depth = job.difficulty === 'easy' ? 8 : job.difficulty === 'medium' ? 20 : 40;
  const budget = Math.max(50, Math.min(1000, job.budgetMs ?? 1000)) / job.legalPaths.length;
  let bestPath, bestReply = Infinity;
  for (const path of job.legalPaths) {
    let board = job.board;
    for (let i = 1; i < path.length; i++) board = applyJump(board, path[i - 1], path[i]);
    search(module, board, job.turn === 'w' ? 'b' : 'w', budget, depth, -1);
    const opponentEval = module.HEAP32[(module._wasm_result_ptr() >> 2) + 2];
    if (opponentEval < bestReply) { bestReply = opponentEval; bestPath = path; }
  }
  return bestPath;
}

function route(module, job) {
  const depth = job.difficulty === 'easy' ? 8 : job.difficulty === 'medium' ? 20 : 40;
  const deadline = performance.now() + Math.max(50, Math.min(1000, job.budgetMs ?? 1000));
  let board = job.board;
  let prefix = [];
  for (let step = 0; step < 12; step++) {
    const remaining = Math.max(50, deadline - performance.now());
    const [from, to] = search(module, board, job.turn, remaining, depth,
      prefix.length ? prefix.at(-1) : -1);
    const nextPrefix = prefix.length ? [...prefix, to] : [from, to];
    const candidates = job.legalPaths.filter(path => nextPrefix.every((square, i) => path[i] === square));
    if (!candidates.length) throw new Error(`Marcher proposed an illegal step ${from} to ${to}`);
    if (prefix.length && from !== prefix.at(-1)) throw new Error('Marcher changed piece during forced capture');
    prefix = nextPrefix;
    if (candidates.some(path => path.length === prefix.length)) return prefix;
    board = applyJump(board, from, to);
  }
  throw new Error('Marcher capture route exceeded board limit');
}

onmessage = async ({ data: job }) => {
  try {
    const module = await engine();
    postMessage({ id: job.id, revision: job.revision, stage: 'ready' });
    const path = job.kind === 'hint' && job.selection != null ? selectedRoute(module, job) : route(module, job);
    postMessage({ id: job.id, revision: job.revision, result: {
      action: { path },
      explanation: `${path.join(' to ')} ${path.length > 2 || Math.abs(path[1] - path[0]) > 9 ? 'takes the required capture route' : 'plays a legal move'}. Marcher searched this position.`
    } });
  } catch (error) {
    postMessage({ id: job?.id, revision: job?.revision, error: { message: error?.message || String(error) } });
  }
};
