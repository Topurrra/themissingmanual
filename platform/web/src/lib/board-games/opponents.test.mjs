import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import * as chess from './chess.js';
import * as checkers from './checkers.js';
import * as go from './go.js';
import * as sudoku from './sudoku.js';
import { handleJob } from './worker.js';

const fixture = new URL('./test-fixtures/game-worker.mjs', import.meta.url);
const request = (job) => new Promise((resolve, reject) => {
  const worker = new Worker(fixture, { type: 'module' });
  worker.once('message', (reply) => { worker.terminate(); resolve(reply); });
  worker.once('error', (error) => { worker.terminate(); reject(error); });
  worker.postMessage({ id: 19, revision: 7, ...job });
});

for (const [name, rules] of [['chess', chess], ['checkers', checkers], ['go', go]]) {
  test(`${name} real worker returns legal moves and bounded hints`, async () => {
    const state = rules.createState();
    const move = await request({ game: name, kind: 'move', state, budgetMs: 30 });
    assert.equal(move.id, 19);
    assert.equal(move.revision, 7);
    assert.ok(rules.legalMoves(state).some((candidate) => JSON.stringify(candidate) === JSON.stringify(move.result.action)));
    assert.equal(rules.getStatus(rules.applyMove(state, move.result.action)).phase, 'playing');
    assert.match(move.result.explanation, /./);
    const hint = await request({ game: name, kind: 'hint', state, budgetMs: 30 });
    assert.ok(rules.legalMoves(state).some((candidate) => JSON.stringify(candidate) === JSON.stringify(hint.result.action)));
    assert.match(hint.result.explanation, /suggest|limited|practice/i);
    const location = name === 'chess'
      ? `${hint.result.action.from} to ${hint.result.action.to}`
      : name === 'checkers' ? hint.result.action.path.join(' to ')
        : hint.result.action.pass ? 'pass' : `point ${hint.result.action.point}`;
    assert.ok(hint.result.explanation.includes(location), `${name} hint should name ${location}`);
  });
}

test('selected Go point remains the hint after the opponent passes', async () => {
  const state = go.applyMove(go.createState(), { pass: true });
  const hint = await request({ game: 'go', kind: 'hint', state, selection: 0 });
  assert.deepEqual(hint.result.action, { point: 0 });
  assert.match(hint.result.explanation, /point 0/);
});

test('Sudoku puzzle job creates a unique puzzle and hint gives an actual deduction', async () => {
  const puzzleReply = await request({ game: 'sudoku', kind: 'puzzle', difficulty: 'easy', seed: 17 });
  assert.equal(sudoku.countSolutions(puzzleReply.result.puzzle.givens, 2), 1);
  const state = sudoku.createState({ puzzle: puzzleReply.result.puzzle });
  const hint = await request({ game: 'sudoku', kind: 'hint', state });
  assert.deepEqual(hint.result.deduction, sudoku.nextDeduction(state));
  assert.equal(hint.result.explanation, hint.result.deduction.explanation);
});

test('beginner Go opponent takes an available capture', async () => {
  const board = Array(81).fill(0);
  board[1] = 2;
  board[0] = 1;
  board[2] = 1;
  const state = go.createState({ board, turn: 'b' });
  const reply = await request({ game: 'go', kind: 'move', state });
  assert.deepEqual(reply.result.action, { point: 10 });
  assert.equal(go.applyMove(state, reply.result.action).board[1], 0);
  assert.match(reply.result.explanation, /point 10/);
  assert.match(reply.result.explanation, /capture/i);
});

test('forced chess and checkers captures are named in their explanations', async () => {
  const chessState = chess.createState({ initialFen: '4k3/8/8/8/8/8/4q3/4KQ2 w - - 0 1' });
  const chessReply = await request({ game: 'chess', kind: 'move', state: chessState });
  assert.match(chessReply.result.explanation, /captures/i);
  assert.ok(chessReply.result.explanation.includes(`${chessReply.result.action.from} to ${chessReply.result.action.to}`));

  const board = Array(64).fill(0);
  board[17] = 1;
  board[26] = -1;
  const checkersState = checkers.createState({ board, turn: 'b' });
  const checkersReply = await request({ game: 'checkers', kind: 'move', state: checkersState });
  assert.deepEqual(checkersReply.result.action.path, [17, 35]);
  assert.match(checkersReply.result.explanation, /capture/i);
});

test('invalid state and unsupported jobs return structured errors', async () => {
  const invalid = await request({ game: 'chess', kind: 'move', state: {} });
  assert.match(invalid.error.message, /invalid/i);
  const unsupported = await request({ game: 'sudoku', kind: 'move', state: sudoku.createState() });
  assert.match(unsupported.error.message, /unsupported/i);
});

test('search runs off the main thread and keeps a heartbeat active', async () => {
  let ticks = 0;
  const interval = setInterval(() => ticks++, 5);
  try {
    const reply = await request({ game: 'chess', kind: 'move', state: chess.createState(), budgetMs: 300 });
    assert.ok(reply.result.action);
    assert.ok(ticks > 0);
  } finally { clearInterval(interval); }
});

test('job handler enforces the 1000ms budget cap', () => {
  const start = performance.now();
  const result = handleJob({ game: 'chess', kind: 'move', state: chess.createState(), budgetMs: 100000 });
  assert.ok(result.action);
  assert.ok(performance.now() - start < 2500);
});
