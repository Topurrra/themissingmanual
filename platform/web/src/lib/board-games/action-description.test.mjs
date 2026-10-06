import test from 'node:test';
import assert from 'node:assert/strict';
import * as chess from './chess.js';
import * as checkers from './checkers.js';
import { describeAction } from './action-description.js';

test('chess announces an ordinary capture and an en passant capture', () => {
  const before = chess.createState({ initialFen: '4k3/8/8/8/8/8/4q3/4KQ2 w - - 0 1' });
  assert.match(describeAction('chess', before, chess.applyMove(before, { from: 'f1', to: 'e2' })), /White captures.*f1 to e2/);
  const enPassant = chess.createState({ initialFen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1' });
  assert.match(describeAction('chess', enPassant, chess.applyMove(enPassant, { from: 'e5', to: 'd6' })), /White captures.*e5 to d6/);
});
test('checkers announces a capture and a finished result', () => {
  const board = Array(64).fill(0); board[17] = 1; board[26] = -1;
  const before = checkers.createState({ board, turn: 'b' });
  assert.match(describeAction('checkers', before, checkers.applyMove(before, { path: [17, 35] })), /Black captures.*Black wins/);
});
test('a capture that ends chess in a draw announces the result', () => {
  const before = chess.createState({ initialFen: '4k3/8/8/8/8/8/4n3/B3K3 w - - 0 1' });
  assert.match(describeAction('chess', before, chess.applyMove(before, { from: 'e1', to: 'e2' })), /White captures.*Insufficient material/);
});
