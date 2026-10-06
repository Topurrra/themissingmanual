const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const cells = Array.from({ length: 81 }, (_, i) => i);
const rows = Array.from({ length: 9 }, (_, r) => cells.filter((i) => Math.floor(i / 9) === r));
const columns = Array.from({ length: 9 }, (_, c) => cells.filter((i) => i % 9 === c));
const boxes = Array.from({ length: 9 }, (_, b) => cells.filter((i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3) === b));
const units = [...rows, ...columns, ...boxes];
const peers = cells.map((i) => [...new Set(units.filter((u) => u.includes(i)).flat())].filter((j) => j !== i));
const boxOf = (i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
// Hints name places the way a player reads the grid, not by internal index.
const place = (i) => `row ${rowOf(i) + 1}, column ${colOf(i) + 1}`;
const unitName = (u) => u < 9 ? `row ${u + 1}` : u < 18 ? `column ${u - 8}` : `box ${u - 17}`;

function assertGrid(grid, name = 'grid') {
  if (!Array.isArray(grid) || grid.length !== 81 || grid.some((v) => !Number.isInteger(v) || v < 0 || v > 9)) throw new Error(`${name} must have 81 digits from 0 to 9`);
}

function valid(grid) {
  return units.every((u) => { const values = u.map((i) => grid[i]).filter(Boolean); return new Set(values).size === values.length; });
}
function candidates(grid, i) {
  if (grid[i]) return [];
  const used = new Set(peers[i].map((j) => grid[j]));
  return DIGITS.filter((d) => !used.has(d));
}
export function countSolutions(grid, limit = 2) {
  assertGrid(grid);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be positive');
  if (!valid(grid)) return 0;
  const work = grid.slice();
  let found = 0;
  function search() {
    if (found >= limit) return;
    let target = -1; let choices = null;
    for (const i of cells) if (!work[i]) {
      const opts = candidates(work, i);
      if (!opts.length) return;
      if (choices === null || opts.length < choices.length) { target = i; choices = opts; if (opts.length === 1) break; }
    }
    if (target === -1) { found++; return; }
    for (const value of choices) { work[target] = value; search(); work[target] = 0; if (found >= limit) return; }
  }
  search();
  return found;
}
function validatePuzzle(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') throw new Error('puzzle required');
  assertGrid(puzzle.givens, 'givens'); assertGrid(puzzle.solution, 'solution');
  if (!valid(puzzle.givens) || !valid(puzzle.solution) || puzzle.solution.includes(0)) throw new Error('invalid puzzle grid');
  for (const i of cells) if (puzzle.givens[i] && puzzle.givens[i] !== puzzle.solution[i]) throw new Error('invalid given');
  if (countSolutions(puzzle.givens, 2) !== 1) throw new Error('puzzle must have one solution');
  if (!['easy', 'medium', 'hard'].includes(puzzle.difficulty)) throw new Error('invalid difficulty');
}
export function createState(options = {}) {
  const puzzle = options.puzzle ?? generatePuzzle(options.difficulty ?? 'easy', options.seed ?? 1);
  validatePuzzle(puzzle);
  return { givens: puzzle.givens.slice(), solution: puzzle.solution.slice(), difficulty: puzzle.difficulty, grid: puzzle.givens.slice(), notes: Array.from({ length: 81 }, () => []), eliminations: emptyEliminations(), history: [] };
}
const emptyEliminations = () => Array.from({ length: 81 }, () => []);
function validateNotes(notes) {
  return Array.isArray(notes) && notes.length === 81 && notes.every((n) => Array.isArray(n) && n.every((v) => DIGITS.includes(v)) && new Set(n).size === n.length);
}
function validateEliminations(eliminations, grid, solution) {
  if (!Array.isArray(eliminations) || eliminations.length !== 81 || !eliminations.every((list, i) =>
    Array.isArray(list) && list.every((v) => DIGITS.includes(v) && !grid[i] && v !== solution[i]) && new Set(list).size === list.length)) return false;
  const remaining = eliminations.map((list) => new Set(list));
  if (remaining.every((set) => !set.size)) return true;
  const possible = initialCandidates(grid);
  for (let step = 0; step < 500; step++) {
    const hint = deduction(grid, possible);
    if (!hint || hint.value) return false;
    for (const { index, removed } of hint.candidates) for (const value of removed) {
      if (!remaining[index].delete(value)) return false;
      possible[index].delete(value);
    }
    if (remaining.every((set) => !set.size)) return true;
  }
  return false;
}
function snapshot(state) {
  return { grid: state.grid.slice(), notes: state.notes.map((n) => n.slice()), eliminations: (state.eliminations ?? emptyEliminations()).map((n) => n.slice()) };
}
export function restoreState(record) {
  if (!record || typeof record !== 'object') throw new Error('invalid Sudoku record');
  validatePuzzle(record);
  assertGrid(record.grid);
  if (!valid(record.grid)) throw new Error('invalid grid: duplicate value');
  if (!validateNotes(record.notes)) throw new Error('invalid notes');
  const eliminations = record.eliminations ?? emptyEliminations();
  if (!validateEliminations(eliminations, record.grid, record.solution)) throw new Error('invalid eliminations');
  if (!Array.isArray(record.history)) throw new Error('invalid history');
  for (const i of cells) if (record.givens[i] && record.grid[i] !== record.givens[i]) throw new Error('given cell changed');
  const history = record.history.map((step) => {
    assertGrid(step.grid, 'history grid');
    const removed = step.eliminations ?? emptyEliminations();
    if (!valid(step.grid) || !validateNotes(step.notes) || !validateEliminations(removed, step.grid, record.solution)) throw new Error('invalid history');
    for (const i of cells) if (record.givens[i] && step.grid[i] !== record.givens[i]) throw new Error('invalid history given');
    return { grid: step.grid.slice(), notes: step.notes.map((n) => n.slice()), eliminations: removed.map((n) => n.slice()) };
  });
  return { givens: record.givens.slice(), solution: record.solution.slice(), difficulty: record.difficulty, grid: record.grid.slice(), notes: record.notes.map((n) => n.slice()), eliminations: eliminations.map((n) => n.slice()), history };
}
export const getBoard = (state) => state.grid.slice();
export function getStatus(state) {
  const finished = !state.grid.includes(0) && valid(state.grid);
  return { phase: finished ? 'finished' : 'playing', turn: 'player', winner: finished ? 'player' : null, claims: [], message: finished ? 'Puzzle solved' : 'Fill the grid' };
}
export function applyMove(state, action) {
  if (!action || !Number.isInteger(action.index) || action.index < 0 || action.index >= 81) throw new Error('invalid cell index');
  const { index } = action;
  if (state.givens[index]) throw new Error('cannot edit a given cell');
  const hasValue = Object.hasOwn(action, 'value');
  const hasNote = Object.hasOwn(action, 'toggleNote');
  if (hasValue === hasNote) throw new Error('supply one value or note');
  if (hasValue && (!Number.isInteger(action.value) || action.value < 0 || action.value > 9)) throw new Error('invalid value');
  if (hasNote && !DIGITS.includes(action.toggleNote)) throw new Error('invalid note');
  const next = { ...state, grid: state.grid.slice(), notes: state.notes.map((n) => n.slice()), eliminations: (state.eliminations ?? emptyEliminations()).map((n) => n.slice()), history: [...state.history, snapshot(state)] };
  if (hasValue) {
    next.grid[index] = action.value;
    if (!valid(next.grid)) throw new Error('invalid move: duplicate value');
    if (action.value) next.notes[index] = [];
    if (action.value !== state.grid[index]) next.eliminations = emptyEliminations();
  } else {
    const note = action.toggleNote;
    next.notes[index] = next.notes[index].includes(note) ? next.notes[index].filter((n) => n !== note) : [...next.notes[index], note].sort();
  }
  return next;
}
export function undo(state) {
  if (!state.history.length) return state;
  const previous = state.history.at(-1);
  return { ...state, grid: previous.grid.slice(), notes: previous.notes.map((n) => n.slice()), eliminations: (previous.eliminations ?? emptyEliminations()).map((n) => n.slice()), history: state.history.slice(0, -1) };
}
function initialCandidates(grid) { return cells.map((i) => new Set(candidates(grid, i))); }
function deduction(grid, possible) {
  for (const i of cells) if (!grid[i] && possible[i].size === 1) {
    const value = [...possible[i]][0];
    return { technique: 'naked-single', cells: [i], index: i, value, explanation: `The cell at ${place(i)} can only contain ${value}.` };
  }
  for (const [u, unit] of units.entries()) for (const value of DIGITS) {
    if (unit.some((i) => grid[i] === value)) continue;
    const places = unit.filter((i) => !grid[i] && possible[i].has(value));
    if (places.length === 1) return { technique: 'hidden-single', cells: unit.slice(), index: places[0], value, explanation: `${value} has only one place left in ${unitName(u)}: ${place(places[0])}.` };
  }
  for (const box of boxes) for (const value of DIGITS) {
    const places = box.filter((i) => !grid[i] && possible[i].has(value));
    if (places.length < 2) continue;
    for (const groupOf of [rowOf, colOf]) {
      if (!places.every((i) => groupOf(i) === groupOf(places[0]))) continue;
      const unit = groupOf === rowOf ? rows[groupOf(places[0])] : columns[groupOf(places[0])];
      const removed = unit.filter((i) => boxOf(i) !== boxOf(places[0]) && !grid[i] && possible[i].has(value));
      if (removed.length) return { technique: 'locked-candidates', cells: places, candidates: removed.map((index) => ({ index, removed: [value] })), explanation: `${value} is confined to one line of a box, so remove it from the rest of that line.` };
    }
  }
  for (const unit of units) {
    const pairs = unit.filter((i) => !grid[i] && possible[i].size === 2);
    for (let a = 0; a < pairs.length; a++) for (let b = a + 1; b < pairs.length; b++) {
      const left = [...possible[pairs[a]]];
      if (!left.every((v) => possible[pairs[b]].has(v))) continue;
      const removed = unit.filter((i) => i !== pairs[a] && i !== pairs[b] && !grid[i]).map((index) => ({ index, removed: left.filter((v) => possible[index].has(v)) })).filter((item) => item.removed.length);
      if (removed.length) return { technique: 'naked-pair', cells: [pairs[a], pairs[b]], candidates: removed, explanation: `${left.join(' and ')} occupy these two cells, so remove them from other cells in the unit.` };
    }
  }
  return null;
}
export function nextDeduction(state) {
  if (!valid(state.grid)) return null;
  const possible = initialCandidates(state.grid);
  for (const i of cells) for (const value of state.eliminations?.[i] ?? []) possible[i].delete(value);
  return deduction(state.grid, possible);
}
export function applyDeduction(state, hint) {
  const current = nextDeduction(state);
  if (!current || current.value || JSON.stringify(current) !== JSON.stringify(hint)) throw new Error('invalid candidate deduction');
  const next = { ...state, eliminations: (state.eliminations ?? emptyEliminations()).map((n) => n.slice()), history: [...state.history, snapshot(state)] };
  for (const { index, removed } of current.candidates) {
    next.eliminations[index] = [...new Set([...next.eliminations[index], ...removed])].sort();
  }
  return next;
}
function ratePuzzle(givens) {
  const grid = givens.slice(); const possible = initialCandidates(grid);
  let rank = 0;
  for (let steps = 0; steps < 500; steps++) {
    if (!grid.includes(0)) return ['easy', 'medium', 'hard'][rank];
    const hint = deduction(grid, possible);
    if (!hint) return null;
    rank = Math.max(rank, { 'naked-single': 0, 'hidden-single': 1, 'locked-candidates': 1, 'naked-pair': 2 }[hint.technique]);
    if (hint.value) {
      grid[hint.index] = hint.value; possible[hint.index].clear();
      for (const peer of peers[hint.index]) possible[peer].delete(hint.value);
    } else for (const change of hint.candidates) for (const value of change.removed) possible[change.index].delete(value);
  }
  return null;
}
function random(seed) {
  let value = (Number(seed) >>> 0) || 1;
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}
function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}
const BASE = [...'534678912672195348198342567859761423426853791713924856961537284287419635345286179'].map(Number);
function permutedSolution(rng) {
  const digits = shuffle(DIGITS.slice(), rng);
  const bands = shuffle([0, 1, 2], rng);
  const stacks = shuffle([0, 1, 2], rng);
  const rowMap = bands.flatMap((b) => shuffle([0, 1, 2], rng).map((r) => b * 3 + r));
  const colMap = stacks.flatMap((b) => shuffle([0, 1, 2], rng).map((c) => b * 3 + c));
  return cells.map((i) => digits[BASE[rowMap[rowOf(i)] * 9 + colMap[colOf(i)]] - 1]);
}
const FALLBACK = {
  easy: { givens: '160094000309000018000000306580230100201000080004000500450080039013050742006023800', solution: '168394275329567418745812396587239164231645987694178523452781639813956742976423851' },
  medium: { givens: '100094000300000018000000306580230100200000000004000500450080000003050702006020800', solution: '168394275329567418745812396587239164231645987694178523452781639813956742976423851' },
  hard: { givens: '083100007720003069000000030109080005000000700030004000000000820008091000000278014', solution: '683129457724853169591467238179682345462935781835714692917546823248391576356278914' }
};
export function generatePuzzle(difficulty = 'easy', seed = 1) {
  if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('invalid difficulty');
  const rng = random(seed);
  for (let attempt = 0; attempt < 80; attempt++) {
    const solution = permutedSolution(rng); const givens = solution.slice();
    let best = null;
    for (const i of shuffle(cells.slice(), rng)) {
      const old = givens[i]; givens[i] = 0;
      if (countSolutions(givens, 2) !== 1) { givens[i] = old; continue; }
      const rating = ratePuzzle(givens);
      if (rating === difficulty) best = givens.slice();
    }
    if (best) return { givens: best, solution, difficulty };
  }
  const fallback = FALLBACK[difficulty];
  const givens = [...fallback.givens].map(Number);
  const solution = [...fallback.solution].map(Number);
  if (countSolutions(givens, 2) !== 1 || ratePuzzle(givens) !== difficulty) throw new Error(`invalid ${difficulty} fallback puzzle`);
  return { givens, solution, difficulty };
}
