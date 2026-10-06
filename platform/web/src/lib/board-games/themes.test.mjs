import assert from 'node:assert/strict';
import test from 'node:test';
import { getThemes, getTheme, getPieceSets, getPieceUrl, registerTheme, registerPieceSet } from './themes.js';

test('chess offers Classic and Slate palettes and falls back to Classic', () => {
  assert.deepEqual(getThemes('chess').map((theme) => theme.id), ['classic', 'slate']);
  assert.deepEqual(getTheme('chess', 'missing'), getTheme('chess', 'classic'));
  assert.deepEqual([getTheme('chess', 'classic').light, getTheme('chess', 'classic').dark], ['#f0d9b5', '#b58863']);
  assert.deepEqual([getTheme('chess', 'slate').light, getTheme('chess', 'slate').dark], ['#e7edf2', '#7992a3']);
  assert.equal(getTheme('chess', 'slate').vars['--game-square-dark'], '#7992a3');
  assert.equal(getTheme('chess', 'slate').label, 'Slate');
  for (const game of ['checkers', 'sudoku', 'go']) {
    const theme = getTheme(game, 'missing');
    for (const key of ['--game-square-light', '--game-square-dark', '--game-grid', '--game-selected', '--game-legal-move', '--game-board-bg', '--game-piece-light', '--game-piece-dark']) assert.ok(theme.vars[key]);
  }
  assert.equal(getTheme('go', 'classic').vars['--game-board-bg'], '#dcbf85');
  assert.equal(getTheme('sudoku', 'classic').vars['--game-board-bg'], 'var(--bg)');
});

test('a registered palette becomes selectable without touching game rules', () => {
  registerTheme('checkers', { id: 'test-cobalt', name: 'Cobalt', light: '#ddeeff', dark: '#113355' });
  assert.equal(getTheme('checkers', 'test-cobalt').dark, '#113355');
  assert.ok(getThemes('checkers').some((theme) => theme.id === 'test-cobalt'));
});

test('Chessnut resolves each colour and piece to its pinned static asset', () => {
  assert.ok(getPieceSets('chess').some((set) => set.id === 'chessnut'));
  for (const colour of ['w', 'b']) for (const type of ['p', 'n', 'b', 'r', 'q', 'k']) {
    assert.equal(getPieceUrl('chessnut', colour, type), `/games/chess/chessnut/${colour}${type.toUpperCase()}.svg`);
  }
  assert.equal(getPieceUrl('missing', 'w', 'k'), null);
  assert.equal(getPieceSets('chess')[0].assetDirectory, '/games/chess/chessnut');
  assert.equal(getPieceSets('chess')[0].license, 'Apache-2.0');
});

test('a registered local piece set resolves through its asset directory', () => {
  registerPieceSet('chess', { id: 'test-wood', label: 'Wood', assetDirectory: '/games/chess/test-wood', license: 'CC0-1.0' });
  assert.equal(getPieceUrl('test-wood', 'b', 'q'), '/games/chess/test-wood/bQ.svg');
});
