import test from 'node:test';
import assert from 'node:assert/strict';
import * as checkers from './checkers.js';
import { insights, jumpable, describeMove, review, analyze, squareName, GUIDE } from './coach-checkers.js';

// index = row * 8 + col; Black (1) moves down the rows, White (-1) moves up.
const at = (row, col) => row * 8 + col;
function position(pieces, turn) {
  const board = Array(64).fill(0);
  for (const [row, col, piece] of pieces) board[at(row, col)] = piece;
  return checkers.createState({ board, turn });
}

test('a forced capture is explained with its target square', () => {
  const state = position([[2, 1, 1], [3, 2, -1], [7, 0, -1]], 'b');
  const tips = insights(state, 'b').map((t) => t.text);
  assert.ok(tips[0].startsWith('You must jump: captures are compulsory. You can capture on c5'), tips[0]);
});

test('a piece the opponent can jump next turn is flagged', () => {
  const state = position([[3, 2, 1], [4, 3, -1], [0, 1, 1]], 'b');
  assert.deepEqual(jumpable(checkers.getBoard(state), 'b'), [at(3, 2)]);
  assert.ok(insights(state, 'b').some((t) => t.text === `Your piece on ${squareName(at(3, 2))} can be jumped next turn.`));
});

test('walking into a jump is reviewed as a mistake, with the safe alternative', () => {
  const state = position([[2, 1, 1], [0, 1, 1], [4, 3, -1], [7, 0, -1]], 'b');
  const bad = checkers.legalMoves(state).find((m) => m.path[1] === at(3, 2));
  const result = review(state, bad, 400);
  // Losing the man also lets White's piece run toward crowning, so the search may call it a blunder.
  assert.ok(['mistake', 'blunder'].includes(result.rating), result.text);
  assert.match(result.text, /lets White jump 1 piece/);
  assert.match(result.text, /Better was b6 to a5/);
});

test('a quiet safe move is not criticised and a capture is described', () => {
  const state = position([[2, 1, 1], [0, 1, 1], [4, 3, -1], [7, 0, -1]], 'b');
  const safe = checkers.legalMoves(state).find((m) => m.path[1] === at(3, 0));
  assert.ok(['best', 'good'].includes(review(state, safe, 400).rating));
  const jump = position([[2, 1, 1], [3, 2, -1], [7, 0, -1]], 'b');
  const idea = describeMove(jump, checkers.legalMoves(jump)[0]);
  assert.match(idea.text, /^jumps 1 piece/);
  assert.equal(idea.guide, GUIDE.captures);
});

test('the search finds a winning double jump', () => {
  const state = position([[2, 1, 1], [3, 2, -1], [5, 4, -1], [7, 6, -1]], 'b');
  const { best } = analyze(state, 300);
  assert.equal(best.path.length, 3);
  assert.match(describeMove(state, best).text, /jumps 2 pieces/);
});

test('an empty back row is pointed out, and men are counted correctly', () => {
  const state = position([[3, 2, 1], [6, 5, -1]], 'b');
  const tips = insights(state, 'b').map((t) => t.text);
  assert.ok(tips.includes("Your back row is empty, so White's men can crown more easily."), tips.join(' | '));
  assert.ok(tips.includes('You have 1 man against 1 man.'), tips.join(' | '));
});
