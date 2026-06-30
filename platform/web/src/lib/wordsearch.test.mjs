// Self-check for the word-search generator: `node src/lib/wordsearch.test.mjs`.
// Proves every pack word actually gets placed and that each placement's cells
// spell the word in a straight, contiguous line — the things that, if broken,
// make a word literally unfindable.
import { makeWordSearch, WS_PACKS } from './wordsearch.js';
import assert from 'node:assert';

const SIZE = 12;

function isLine(cells, size) {
  if (cells.length < 2) return true;
  const rc = cells.map((k) => [Math.floor(k / size), k % size]);
  const dr = Math.sign(rc[1][0] - rc[0][0]);
  const dc = Math.sign(rc[1][1] - rc[0][1]);
  for (let i = 1; i < rc.length; i++) {
    if (rc[i][0] !== rc[0][0] + dr * i || rc[i][1] !== rc[0][1] + dc * i) return false;
  }
  return true;
}

for (const pack of WS_PACKS) {
  for (let iter = 0; iter < 300; iter++) {
    const ws = makeWordSearch(pack.words, SIZE);
    const expected = [...new Set(pack.words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')))];
    assert.equal(ws.words.length, expected.length, `${pack.id}: placed ${ws.words.length}/${expected.length} words`);
    assert.equal(ws.grid.length, SIZE * SIZE, `${pack.id}: grid wrong size`);
    assert.ok(ws.grid.every((c) => /^[A-Z]$/.test(c)), `${pack.id}: grid has a non-letter / blank cell`);
    for (const p of ws.placements) {
      assert.ok(isLine(p.cells, SIZE), `${pack.id}: "${p.word}" cells not a straight line`);
      assert.equal(p.cells.map((k) => ws.grid[k]).join(''), p.word, `${pack.id}: "${p.word}" cells don't spell it`);
    }
  }
}

console.log('wordsearch.test.mjs — all checks passed');
