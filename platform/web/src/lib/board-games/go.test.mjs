import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, restoreState, getBoard, getStatus, applyMove, undo,
  legalMoves, resign, getGroup, toggleDeadGroup, score, resumePlay,
  acceptScore, getCoach
} from './go.js';

function setup(black, white, turn = 'b') {
  const board = Array(81).fill(0);
  for (const point of black) board[point] = 1;
  for (const point of white) board[point] = 2;
  return createState({ board, turn });
}

test('connected edge stones share only orthogonal liberties', () => {
  const state = setup([0, 1], [9, 10]);
  assert.deepEqual(getGroup(state, 0), { stones: [0, 1], liberties: [2] });
  assert.deepEqual(getGroup(state, 80), { stones: [], liberties: [] });
});

test('one move captures two distinct groups and creates liberties', () => {
  const state = setup([22, 30, 32, 48, 50, 58], [31, 49]);
  const next = applyMove(state, { point: 40 });
  assert.equal(getBoard(state)[40], 0);
  assert.equal(getBoard(next)[31], 0);
  assert.equal(getBoard(next)[49], 0);
  assert.equal(getBoard(next)[40], 1);
  assert.deepEqual(getGroup(next, 40).liberties, [31, 39, 41, 49]);
});

test('self-capture is illegal but capture into a surrounded point is legal', () => {
  const state = setup([], [31, 39, 41, 49]);
  assert.throws(() => applyMove(state, { point: 40 }), /suicide|libert/i);
  assert.equal(getBoard(state)[40], 0);
  const ko = setup([31, 39, 49], [32, 40, 42, 50]);
  assert.equal(getBoard(applyMove(ko, { point: 41 }))[40], 0);
});

test('ordinary ko and older-position superko prohibit board repetition', () => {
  const ko = setup([31, 39, 49], [32, 40, 42, 50]);
  const captured = applyMove(ko, { point: 41 });
  assert.throws(() => applyMove(captured, { point: 40 }), /ko|repeat/i);
  let later = applyMove(captured, { pass: true });
  later = applyMove(later, { pass: true });
  later = resumePlay(later);
  assert.throws(() => applyMove(later, { point: 40 }), /ko|repeat/i);
  assert.equal(getBoard(undo(captured))[40], 2);
  assert.equal(getBoard(applyMove(undo(captured), { point: 41 }))[40], 0);
});

test('three separated kos cannot complete an older six-move board cycle', () => {
  let state = setup(
    [1, 9, 19, 7, 15, 17, 25, 55, 63, 73],
    [2, 10, 12, 20, 6, 14, 24, 56, 64, 66, 74]
  );
  const original = getBoard(state);
  for (const point of [11, 16, 65, 10, 15]) state = applyMove(state, { point });
  assert.notDeepEqual(getBoard(state), original);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
  assert.throws(() => applyMove(state, { point: 64 }), /superko|repeat/i);
});

test('passes remain legal, two passes enter review, and undo restores turn/history', () => {
  let state = createState();
  state = applyMove(state, { pass: true });
  assert.equal(getStatus(state).turn, 'w');
  state = applyMove(state, { pass: true });
  assert.equal(getStatus(state).phase, 'review');
  assert.equal(score(state).blackTotal, 0);
  assert.equal(score(state).whiteTotal, 7.5);
  assert.equal(getStatus(undo(state)).phase, 'playing');
  assert.equal(getStatus(undo(state)).turn, 'w');
  assert.equal(getStatus(resumePlay(state)).phase, 'playing');
});

test('neutral areas score zero and captures are not prisoner points', () => {
  const neutral = setup([0], [2]);
  const totals = score(neutral);
  assert.deepEqual(totals, {
    blackStones: 1, blackTerritory: 0, whiteStones: 1,
    whiteTerritory: 0, komi: 7.5, blackTotal: 1, whiteTotal: 8.5
  });
  const captured = applyMove(setup([1, 9, 11], [10, 80]), { point: 19 });
  assert.equal(score(captured).blackStones, 4);
  assert.equal(score(captured).blackTerritory, 2);
  assert.equal(score(captured).blackTotal, 6);
});

test('dead groups are reviewed manually and final acceptance fixes the winner', () => {
  let state = setup([31, 39, 41], [40, 80]);
  state = applyMove(state, { pass: true });
  state = applyMove(state, { pass: true });
  assert.equal(getStatus(state).phase, 'review');
  const dead = toggleDeadGroup(state, 40);
  assert.equal(getBoard(dead)[40], 2);
  assert.equal(score(dead).whiteStones, 1);
  assert.equal(score(state).whiteStones, 2);
  assert.equal(score(toggleDeadGroup(dead, 40)).whiteStones, 2);
  const finished = acceptScore(dead);
  assert.equal(getStatus(finished).phase, 'finished');
  assert.equal(getStatus(finished).winner, 'w');
});

test('resignation, legal moves, coach and restore use the shared interface', () => {
  const state = createState();
  assert.equal(getBoard(state).length, 81);
  assert.equal(legalMoves(state).length, 82);
  assert.equal(typeof getCoach(state).message, 'string');
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(restoreState({ ...state, ignored: 'outside the rule state' }), state);
  assert.throws(() => restoreState({ board: [1] }), /board|state/i);
  assert.throws(() => restoreState({ ...state, positions: ['0'.repeat(81), '1'.repeat(81)] }), /history|position/i);
  assert.equal(getStatus(resign(state, 'b')).winner, 'w');
});

test('restore rejects a forged many-stone transition despite matching position keys', () => {
  const state = applyMove(createState(), { point: 0 });
  const forged = structuredClone(state);
  forged.board = Array(81).fill(1);
  forged.positions[1] = forged.board.join('');
  assert.throws(() => restoreState(forged), /transition|history/i);
  const second = applyMove(state, { point: 1 });
  const forgedMiddle = structuredClone(second);
  forgedMiddle.past[1].turn = 'b';
  assert.throws(() => restoreState(forgedMiddle), /transition|history/i);
});

test('restore accepts legal moves, review marking, resumed play and accepted score', () => {
  let state = setup([31, 39, 41], [40, 80]);
  state = applyMove(state, { point: 0 });
  state = applyMove(state, { pass: true });
  state = applyMove(state, { pass: true });
  state = toggleDeadGroup(state, 40);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
  const resumed = resumePlay(state);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(resumed))), resumed);
  const moved = applyMove(resumed, { point: 2 });
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(moved))), moved);
  const finished = acceptScore(state);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(finished))), finished);
});
