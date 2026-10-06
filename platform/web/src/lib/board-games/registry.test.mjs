import assert from 'node:assert/strict';
import test from 'node:test';
import { gameIds, getGame } from './registry.js';

test('all four game IDs resolve to a complete rule API', () => {
  assert.deepEqual(gameIds, ['chess', 'checkers', 'sudoku', 'go']);
  for (const id of gameIds) {
    const game = getGame(id);
    assert.equal(game.id, id);
    assert.ok(game.name);
    for (const method of ['createState', 'restoreState', 'getBoard', 'getStatus', 'applyMove', 'undo']) {
      assert.equal(typeof game.rules[method], 'function');
    }
  }
  assert.equal(getGame('unknown'), null);
});
