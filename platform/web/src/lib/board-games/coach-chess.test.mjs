import test from 'node:test';
import assert from 'node:assert/strict';
import { describeMove, insights, rateMove, evaluationText, scoreToCp, fenOf, GUIDE } from './coach-chess.js';
import * as chess from './chess.js';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

test('a knight fork is named with its targets, and the check comes first', () => {
  const idea = describeMove('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', { from: 'b5', to: 'c7' });
  assert.equal(idea.san, 'Nc7+');
  assert.match(idea.text, /^gives check/);
  assert.match(idea.text, /forks the king and rook on a8/);
  assert.equal(idea.guide, GUIDE.tactics);
});

test('an undefended capture is a free win, a mate is called a mate', () => {
  assert.match(describeMove('4k3/8/8/3b4/8/8/8/3RK3 w - - 0 1', { from: 'd1', to: 'd5' }).text, /wins the bishop for free/);
  const mate = describeMove('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', { from: 'a1', to: 'a8' });
  assert.match(mate.text, /^delivers checkmate/);
  assert.equal(mate.guide, GUIDE.mate);
});

test('opening ideas: development, center, castling', () => {
  assert.match(describeMove(START, { from: 'g1', to: 'f3' }).text, /develops the knight/);
  assert.match(describeMove(START, { from: 'e2', to: 'e4' }).text, /claims space in the center/);
  const italian = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
  assert.match(describeMove(italian, { from: 'e1', to: 'g1' }).text, /castles/);
});

test('a loose piece is reported, with no false alarms in the starting position', () => {
  const tips = insights('4k3/8/8/8/8/5N2/6b1/4K3 w - - 0 1', 'w').map((t) => t.text);
  assert.ok(tips.includes('Your knight on f3 is attacked and has no defender.'), tips.join(' | '));
  const start = insights(START, 'w').map((t) => t.text);
  assert.deepEqual(start, ['Material is even.']);
});

test('free captures are offered to the player whose turn it is', () => {
  const tips = insights('4k3/8/8/3b4/8/8/8/3RK3 w - - 0 1', 'w').map((t) => t.text);
  assert.ok(tips.includes('You can take the bishop on d5. Nothing defends it.'), tips.join(' | '));
  assert.ok(tips.some((t) => /You are up 2 points/.test(t)));
});

test('saving a threatened piece is recognised', () => {
  const idea = describeMove('4k3/8/8/8/8/5N2/6b1/4K3 w - - 0 1', { from: 'f3', to: 'd4' });
  assert.match(idea.text, /moves the knight out of danger/);
});

test('move ratings use win chance, so won positions are not over-punished', () => {
  assert.equal(rateMove(0, -500), 'blunder');
  assert.equal(rateMove(0, -350), 'mistake');
  assert.equal(rateMove(0, 0), 'good');
  assert.equal(rateMove(1000, 800), 'good');
  assert.equal(rateMove(scoreToCp({ mate: 2 }), 0), 'blunder');
});

test('evaluations are phrased from the player point of view', () => {
  assert.equal(evaluationText({ cp: 150 }, 'w', 'w'), 'You are clearly better (about 1.5 pawns of advantage).');
  assert.equal(evaluationText({ cp: 150 }, 'b', 'w'), 'Your opponent is clearly better (about 1.5 pawns of advantage).');
  assert.equal(evaluationText({ mate: -3 }, 'w', 'b'), 'You have a forced checkmate in 3.');
  assert.equal(evaluationText({ cp: 10 }, 'w', 'w'), 'The position is roughly equal.');
});

test('fenOf replays the game state', () => {
  const state = chess.applyMove(chess.createState(), { from: 'e2', to: 'e4' });
  assert.equal(fenOf(state).split(' ')[0], 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
});
