// Word-search generator for /train. Pure + framework-free so it can be unit-checked
// (see wordsearch.test.mjs). Places each word in one of 8 directions (incl. reversed
// via the negative directions), allowing shared-letter overlaps, then fills the rest
// with random letters.
import { rand } from './games.js';

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function tryBuild(words, size) {
  const grid = new Array(size * size).fill('');
  const placements = [];
  // Longest first packs better.
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let attempt = 0; attempt < 250 && !placed; attempt++) {
      const [dr, dc] = DIRS[rand(0, 7)];
      const r0 = rand(0, size - 1), c0 = rand(0, size - 1);
      const rEnd = r0 + dr * (word.length - 1), cEnd = c0 + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
      const cells = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const k = (r0 + dr * i) * size + (c0 + dc * i);
        if (grid[k] && grid[k] !== word[i]) { ok = false; break; }
        cells.push(k);
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[cells[i]] = word[i];
      placements.push({ word, cells });
      placed = true;
    }
    if (!placed) return null; // crowded grid - caller retries from scratch
  }
  return { grid, placements };
}

// words: array of strings (any case/punctuation). size: grid dimension.
// Returns { size, grid:[size*size], placements:[{word, cells:[idx]}], words:[placed] }.
export function makeWordSearch(words, size) {
  const clean = [...new Set(words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')))]
    .filter((w) => w.length >= 3 && w.length <= size);
  let built = null;
  for (let t = 0; t < 60 && !built; t++) built = tryBuild(clean, size);
  if (!built) built = { grid: new Array(size * size).fill(''), placements: [] };
  for (let k = 0; k < built.grid.length; k++) if (!built.grid[k]) built.grid[k] = ALPHA[rand(0, 25)];
  return { size, grid: built.grid, placements: built.placements, words: built.placements.map((p) => p.word) };
}

// Curated single-word term packs (A–Z only; kept <= 11 so they fit a 12-grid).
export const WS_PACKS = [
  { id: 'git', name: 'Git', words: ['COMMIT', 'BRANCH', 'MERGE', 'REBASE', 'STASH', 'REMOTE', 'CLONE', 'REFLOG', 'CONFLICT', 'CHECKOUT'] },
  { id: 'web', name: 'Web & HTTP', words: ['COOKIE', 'HEADER', 'REQUEST', 'RESPONSE', 'SESSION', 'BROWSER', 'CACHE', 'REDIRECT', 'PAYLOAD', 'DOMAIN'] },
  { id: 'data', name: 'Databases', words: ['QUERY', 'INDEX', 'SCHEMA', 'PRIMARY', 'FOREIGN', 'COLUMN', 'ROLLBACK', 'TRIGGER', 'CURSOR', 'MIGRATE'] },
  { id: 'sec', name: 'Security', words: ['CIPHER', 'HASHING', 'TOKEN', 'EXPLOIT', 'FIREWALL', 'MALWARE', 'PHISHING', 'INJECTION', 'ENCRYPT', 'BREACH'] },
  { id: 'ai', name: 'AI & ML', words: ['NEURON', 'TENSOR', 'GRADIENT', 'TRAINING', 'EMBEDDING', 'INFERENCE', 'DATASET', 'OVERFIT', 'FEATURE', 'CLUSTER'] },
  { id: 'prog', name: 'Programming', words: ['FUNCTION', 'VARIABLE', 'POINTER', 'COMPILER', 'RUNTIME', 'BOOLEAN', 'INTEGER', 'RECURSION', 'ITERATOR', 'CLOSURE'] }
];
