import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextBoardIndex, focusBoardCell } from './board-interaction.js';

test('arrow keys move through the grid without crossing row edges', () => {
  assert.equal(nextBoardIndex(8, 'ArrowLeft', 8), 8);
  assert.equal(nextBoardIndex(8, 'ArrowRight', 8), 9);
  assert.equal(nextBoardIndex(8, 'ArrowUp', 8), 0);
  assert.equal(nextBoardIndex(8, 'ArrowDown', 8), 16);
  assert.equal(nextBoardIndex(80, 'ArrowDown', 9), 80);
  assert.equal(nextBoardIndex(40, 'Enter', 9), null);
});

test('handled arrow focuses the destination and prevents page scrolling', () => {
  let focused = false;
  let prevented = false;
  const event = {
    key: 'ArrowRight',
    preventDefault() { prevented = true; },
    currentTarget: { parentElement: { querySelector(selector) {
      assert.equal(selector, '[data-index="1"]');
      return { focus() { focused = true; } };
    } } }
  };
  assert.equal(focusBoardCell(event, 0, 8), 1);
  assert.equal(focused, true);
  assert.equal(prevented, true);
});
