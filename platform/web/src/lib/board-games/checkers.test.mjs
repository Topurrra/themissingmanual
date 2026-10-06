import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, restoreState, getBoard, getStatus, applyMove, undo,
  legalMoves, resign, claimDraw, getCoach
} from './checkers.js';

function fixture(pieces, turn = 'w') {
  const board = Array(64).fill(0);
  for (const [index, piece] of pieces) board[index] = piece;
  return createState({ board, turn });
}

test('opening has twelve pieces per colour and black moves first', () => {
  const state = createState();
  const board = getBoard(state);
  assert.equal(board.filter(x => x === 1).length, 12);
  assert.equal(board.filter(x => x === -1).length, 12);
  assert.equal(getStatus(state).turn, 'b');
  assert.equal(legalMoves(state).length, 7);
  board[1] = 0;
  assert.equal(getBoard(state)[1], 1);
});

test('men move forward one diagonal and kings move one diagonal either way', () => {
  const men = fixture([[42, -1], [21, 1]]);
  assert.deepEqual(legalMoves(men).map(x => x.path), [[42, 33], [42, 35]]);
  assert.throws(() => applyMove(men, { path: [42, 49] }), /illegal/i);
  const king = fixture([[26, -2], [53, 2]]);
  assert.deepEqual(legalMoves(king).map(x => x.path).sort((a, b) => a[1] - b[1]), [[26, 17], [26, 19], [26, 33], [26, 35]]);
  assert.throws(() => applyMove(king, { path: [26, 44] }), /illegal/i);
});

test('capture is mandatory, both branches are legal, and quiet moves are rejected', () => {
  const state = fixture([[42, -1], [33, 1], [35, 1], [3, 1]]);
  assert.deepEqual(legalMoves(state).map(x => x.path), [[42, 24], [42, 28]]);
  assert.throws(() => applyMove(state, { path: [42, 51] }), /illegal/i);
  assert.equal(getBoard(applyMove(state, { path: [42, 24] }))[33], 0);
  assert.equal(getBoard(applyMove(state, { path: [42, 28] }))[35], 0);
});

test('complete multi-jump is required and undo restores its captured men', () => {
  const state = fixture([[42, -1], [35, 1], [21, 1]]);
  assert.deepEqual(legalMoves(state).map(x => x.path), [[42, 28, 14]]);
  assert.throws(() => applyMove(state, { path: [42, 28] }), /illegal/i);
  const next = applyMove(state, { path: [42, 28, 14] });
  assert.equal(getBoard(next)[14], -1);
  assert.equal(getBoard(next)[35], 0);
  assert.equal(getBoard(next)[21], 0);
  assert.deepEqual(getBoard(undo(next)), getBoard(state));
  assert.equal(getStatus(next).winner, 'w');
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(next))), next);
  assert.deepEqual(getBoard(state).filter(Boolean).length, 3);
});

test('crowning ends a capture turn even if the new king could jump back', () => {
  const state = fixture([[17, -1], [10, 1], [12, 1]]);
  assert.deepEqual(legalMoves(state).map(x => x.path), [[17, 3]]);
  assert.throws(() => applyMove(state, { path: [17, 3, 21] }), /illegal/i);
  assert.equal(getBoard(applyMove(state, { path: [17, 3] }))[3], -2);
});

test('opponent with no remaining piece or legal move loses', () => {
  assert.equal(getStatus(applyMove(fixture([[42, -1], [35, 1]]), { path: [42, 28] })).winner, 'w');
  const blocked = fixture([[1, 1], [8, -1], [10, -1], [19, -1]], 'b');
  assert.deepEqual(legalMoves(blocked), []);
  assert.equal(getStatus(blocked).winner, 'w');
});

test('third board-plus-turn occurrence offers a claim without ending play', () => {
  let state = fixture([[10, 2], [53, -2]], 'b');
  const cycle = [[10, 19], [53, 44], [19, 10], [44, 53]];
  for (let n = 0; n < 2; n++) for (const path of cycle) state = applyMove(state, { path });
  assert.equal(getStatus(state).phase, 'playing');
  assert.deepEqual(getStatus(state).claims, ['repetition']);
  assert.equal(getStatus(claimDraw(state, 'repetition')).winner, 'draw');
  assert.throws(() => claimDraw(createState(), 'repetition'), /claim/i);
});

test('eighty plies without man advance or capture offers forty-move claim', () => {
  let state = fixture([[10, 2], [53, -2]], 'b');
  const cycle = [[10, 19], [53, 44], [19, 10], [44, 53]];
  for (let n = 0; n < 20; n++) for (const path of cycle) state = applyMove(state, { path });
  assert.equal(getStatus(state).phase, 'playing');
  assert.ok(getStatus(state).claims.includes('forty-move'));
  assert.equal(getStatus(claimDraw(state, 'forty-move')).winner, 'draw');
  const reset = applyMove(fixture([[42, -1], [10, 2]], 'w'), { path: [42, 33] });
  assert.equal(reset.noProgress, 0);
});

test('restore rejects invalid board squares, piece counts and tampered move history', () => {
  const bad = createState();
  assert.throws(() => restoreState({ ...bad, board: Array(63).fill(0) }), /board/i);
  const light = [...bad.board]; light[0] = 1;
  assert.throws(() => restoreState({ ...bad, board: light }), /board|square/i);
  assert.throws(() => createState({ board: Array(64).fill(1) }), /board|piece/i);
  const moved = applyMove(bad, { path: [17, 24] });
  assert.throws(() => restoreState({ ...moved, moves: [[17, 26]] }), /history|move/i);
  assert.throws(() => restoreState({ ...moved, board: bad.board }), /history|board/i);
  assert.throws(() => restoreState({ ...moved, board: undefined }), /history|board/i);
  assert.throws(() => restoreState({ ...moved, noProgress: -1 }), /history|progress/i);
  for (const start of [null, 1, 'opening', {}, { board: bad.start.board }, { turn: 'b' }]) {
    assert.throws(() => restoreState({ ...bad, start }), /history|start|board|turn/i);
  }
});

test('resignation finishes play and coach exposes legal routes', () => {
  const state = fixture([[42, -1], [35, 1], [21, 1]]);
  assert.deepEqual(getCoach(state, 42).moves.map(x => x.path), [[42, 28, 14]]);
  assert.equal(getStatus(resign(state, 'w')).winner, 'b');
  assert.throws(() => resign(state, 'b'), /resign/i);
  assert.throws(() => applyMove(resign(state, 'w'), { path: [42, 28, 14] }), /finished|illegal/i);
});
