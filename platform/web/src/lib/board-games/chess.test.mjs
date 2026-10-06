import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyMove, claimDraw, createState, getBoard, getCoach, getStatus,
  legalMoves, resign, restoreState, undo
} from './chess.js';

const play = (state, moves) => moves.reduce(applyMove, state);
const snapshot = (state) => ({
  board: getBoard(state), moves: legalMoves(state), status: getStatus(state)
});

test('opening exposes 20 legal moves and a8-to-h1 board cells', () => {
  const state = createState();
  assert.equal(legalMoves(state).length, 20);
  const board = getBoard(state);
  assert.equal(board.length, 64);
  assert.deepEqual(board[0], { square: 'a8', color: 'b', type: 'r' });
  assert.equal(board[16], null);
  assert.deepEqual(board[63], { square: 'h1', color: 'w', type: 'r' });
  assert.equal(getStatus(state).turn, 'w');
});

test('illegal moves throw without changing the original state', () => {
  const state = createState();
  const before = structuredClone(state);
  assert.throws(() => applyMove(state, { from: 'e2', to: 'e5' }), /illegal/i);
  assert.deepEqual(state, before);
  assert.deepEqual(snapshot(state), snapshot(restoreState(before)));
});

test("Fool's Mate is a black checkmate", () => {
  const state = play(createState(), [
    { from: 'f2', to: 'f3' }, { from: 'e7', to: 'e5' },
    { from: 'g2', to: 'g4' }, { from: 'd8', to: 'h4' }
  ]);
  assert.equal(getStatus(state).phase, 'finished');
  assert.equal(getStatus(state).winner, 'b');
  assert.deepEqual(legalMoves(state), []);
  assert.equal(undo(state).history.length, 3);
});

test('a position without legal moves or check is stalemate', () => {
  const state = createState({ initialFen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1' });
  assert.deepEqual(legalMoves(state), []);
  assert.equal(getStatus(state).phase, 'finished');
  assert.equal(getStatus(state).winner, 'draw');
});

test('castling through an attacked square is rejected', () => {
  const state = createState({ initialFen: 'r3k2r/5r2/8/8/8/8/8/R3K2R w KQkq - 0 1' });
  assert.throws(() => applyMove(state, { from: 'e1', to: 'g1' }), /illegal/i);
  assert.ok(legalMoves(state).some((move) => move.from === 'e1' && move.to === 'c1'));
});

test('valid en passant captures the pawn and survives restoration', () => {
  const before = play(createState(), [
    { from: 'e2', to: 'e4' }, { from: 'a7', to: 'a6' },
    { from: 'e4', to: 'e5' }, { from: 'd7', to: 'd5' }
  ]);
  const restored = restoreState(JSON.parse(JSON.stringify(before)));
  assert.deepEqual(snapshot(restored), snapshot(before));
  const captured = applyMove(restored, { from: 'e5', to: 'd6' });
  assert.equal(getBoard(captured).find((piece) => piece?.square === 'd5'), undefined);
  assert.deepEqual(getBoard(captured).find((piece) => piece?.square === 'd6'), {
    square: 'd6', color: 'w', type: 'p'
  });
  assert.deepEqual(snapshot(restoreState(JSON.parse(JSON.stringify(undo(captured))))), snapshot(before));
});

for (const promotion of ['q', 'r', 'b', 'n']) {
  test(`${promotion} promotion creates the chosen piece`, () => {
    const state = createState({ initialFen: '7k/P7/8/8/8/8/8/7K w - - 0 1' });
    const moved = applyMove(state, { from: 'a7', to: 'a8', promotion });
    assert.deepEqual(getBoard(moved)[0], { square: 'a8', color: 'w', type: promotion });
  });
}

test('threefold repetition is claimable and only ends when claimed', () => {
  const cycle = [
    { from: 'g1', to: 'f3' }, { from: 'g8', to: 'f6' },
    { from: 'f3', to: 'g1' }, { from: 'f6', to: 'g8' }
  ];
  const state = play(createState(), [...cycle, ...cycle]);
  assert.equal(getStatus(state).phase, 'playing');
  assert.ok(getStatus(state).claims.includes('threefold'));
  assert.deepEqual(snapshot(restoreState(JSON.parse(JSON.stringify(state)))), snapshot(state));
  const claimed = claimDraw(state, 'threefold');
  assert.equal(getStatus(claimed).winner, 'draw');
  assert.equal(getStatus(claimed).phase, 'finished');
  assert.equal(getStatus(state).phase, 'playing');
  assert.throws(() => claimDraw(createState(), 'threefold'), /claim/i);
  const afterUndo = undo(state);
  assert.equal(getStatus(afterUndo).claims.includes('threefold'), false);
  assert.deepEqual(snapshot(restoreState(JSON.parse(JSON.stringify(afterUndo)))), snapshot(afterUndo));
});

test('fifty-move rule is a claim, not an automatic result', () => {
  const state = createState({ initialFen: '1k6/8/8/8/8/8/8/R6K w - - 100 1' });
  assert.equal(getStatus(state).phase, 'playing');
  assert.ok(getStatus(state).claims.includes('fifty-move'));
  assert.equal(getStatus(claimDraw(state, 'fifty-move')).winner, 'draw');
});

test('fifth occurrence ends automatically while the fourth is only claimable', () => {
  const cycle = [
    { from: 'g1', to: 'f3' }, { from: 'g8', to: 'f6' },
    { from: 'f3', to: 'g1' }, { from: 'f6', to: 'g8' }
  ];
  const fourth = play(createState(), [...cycle, ...cycle, ...cycle]);
  assert.equal(getStatus(fourth).phase, 'playing');
  assert.ok(getStatus(fourth).claims.includes('threefold'));
  const fifth = play(fourth, cycle);
  assert.equal(getStatus(fifth).phase, 'finished');
  assert.equal(getStatus(fifth).winner, 'draw');
  assert.deepEqual(getStatus(fifth).claims, []);
  assert.deepEqual(legalMoves(fifth), []);
  assert.deepEqual(snapshot(restoreState(JSON.parse(JSON.stringify(fifth)))), snapshot(fifth));
  assert.throws(() => applyMove(fifth, { from: 'e2', to: 'e4' }), /finished/i);
  assert.equal(getStatus(undo(fifth)).phase, 'playing');
});

test('150th halfmove ends automatically and restored history cannot continue', () => {
  const before = createState({ initialFen: '1k6/8/8/8/8/8/8/R6K w - - 149 76' });
  assert.equal(getStatus(before).phase, 'playing');
  assert.ok(getStatus(before).claims.includes('fifty-move'));
  const drawn = applyMove(before, { from: 'a1', to: 'a2' });
  assert.equal(getStatus(drawn).phase, 'finished');
  assert.equal(getStatus(drawn).winner, 'draw');
  assert.deepEqual(getStatus(drawn).claims, []);
  assert.deepEqual(legalMoves(drawn), []);
  assert.deepEqual(snapshot(restoreState(JSON.parse(JSON.stringify(drawn)))), snapshot(drawn));
  assert.throws(() => applyMove(drawn, { from: 'b8', to: 'c7' }), /finished/i);
  assert.throws(() => restoreState({ ...drawn, history: [...drawn.history, { from: 'b8', to: 'c7' }] }), /finished/i);
  assert.equal(getStatus(undo(drawn)).phase, 'playing');
});

test('checkmate on the 150th halfmove takes precedence over automatic draw', () => {
  const before = createState({ initialFen: '7k/5K2/6Q1/8/8/8/8/8 w - - 149 76' });
  const mated = applyMove(before, { from: 'g6', to: 'g7' });
  assert.equal(getStatus(mated).phase, 'finished');
  assert.equal(getStatus(mated).winner, 'w');
  assert.equal(getStatus(mated).message, 'Checkmate');
});

test('castling history round-trips board, rights, legal moves and undo', () => {
  const state = play(createState(), [
    { from: 'e2', to: 'e4' }, { from: 'e7', to: 'e5' },
    { from: 'g1', to: 'f3' }, { from: 'b8', to: 'c6' },
    { from: 'f1', to: 'c4' }, { from: 'g8', to: 'f6' },
    { from: 'e1', to: 'g1' }
  ]);
  const restored = restoreState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(snapshot(restored), snapshot(state));
  assert.deepEqual(snapshot(undo(restored)), snapshot(undo(state)));
  assert.equal(getBoard(restored).find((piece) => piece?.square === 'g1')?.type, 'k');
  assert.equal(getBoard(restored).find((piece) => piece?.square === 'f1')?.type, 'r');
});

test('restore rejects a forged history and resign validates the mover', () => {
  assert.throws(() => restoreState({ initialFen: createState().initialFen, history: [{ from: 'e2', to: 'e5' }] }), /invalid|illegal/i);
  assert.throws(() => restoreState({ ...createState(), outcome: { type: 'claim', claim: 'threefold' } }), /outcome/i);
  assert.throws(() => resign(createState(), 'player'), /colour|color/i);
  assert.equal(getStatus(resign(createState(), 'w')).winner, 'b');
});

test('coach identifies check, captures, threats and a selected square', () => {
  const state = play(createState(), [{ from: 'e2', to: 'e4' }, { from: 'd7', to: 'd5' }]);
  const coach = getCoach(state, 'e4');
  assert.equal(coach.selected, 'e4');
  assert.equal(coach.check, false);
  assert.ok(coach.captures.some((move) => move.from === 'e4' && move.to === 'd5'));
  assert.ok(Array.isArray(coach.threats));
});
