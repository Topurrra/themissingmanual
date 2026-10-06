import test from 'node:test';
import assert from 'node:assert/strict';
import { countSolutions, createState, restoreState, getBoard, getStatus, applyMove, applyDeduction, undo, nextDeduction, generatePuzzle } from './sudoku.js';

const solved = [...'534678912672195348198342567859761423426853791713924856961537284287419635345286179'].map(Number);
const oneBlank = solved.slice(); oneBlank[0] = 0;

test('solution counter respects uniqueness and early limit', () => {
  assert.equal(countSolutions(oneBlank, 2), 1);
  assert.equal(countSolutions(Array(81).fill(0), 2), 2);
});

test('duplicate givens and invalid completed grids are rejected', () => {
  const duplicate = oneBlank.slice(); duplicate[0] = 6;
  assert.throws(() => createState({ puzzle: { givens: duplicate, solution: solved, difficulty: 'easy' } }), /invalid|duplicate/i);
  assert.equal(countSolutions(duplicate), 0);
  const state = createState({ puzzle: { givens: oneBlank, solution: solved, difficulty: 'easy' } });
  const invalid = structuredClone(state); invalid.grid = solved.slice(); invalid.grid[0] = 6;
  assert.throws(() => restoreState(invalid), /invalid|duplicate/i);
});

test('given cells are immutable; notes, erase and undo round trip', () => {
  const state = createState({ puzzle: { givens: oneBlank, solution: solved, difficulty: 'easy' } });
  assert.throws(() => applyMove(state, { index: 1, value: 0 }), /given/i);
  const noted = applyMove(state, { index: 0, toggleNote: 5 });
  assert.deepEqual(noted.notes[0], [5]);
  assert.equal(getBoard(noted)[0], 0);
  const filled = applyMove(noted, { index: 0, value: 5 });
  assert.equal(getStatus(filled).phase, 'finished');
  const erased = applyMove(filled, { index: 0, value: 0 });
  assert.equal(getStatus(erased).phase, 'playing');
  assert.equal(getBoard(undo(erased))[0], 5);
  assert.deepEqual(undo(noted), state);
});

test('a naked single explains its forced value', () => {
  const state = createState({ puzzle: { givens: oneBlank, solution: solved, difficulty: 'easy' } });
  const hint = nextDeduction(state);
  assert.equal(hint.technique, 'naked-single');
  assert.equal(hint.index, 0);
  assert.equal(hint.value, 5);
  assert.match(hint.explanation, /5/);
});

test('generated puzzles are uniquely solvable and declare a logical rating', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const puzzle = generatePuzzle(difficulty, 1234);
    assert.equal(puzzle.difficulty, difficulty);
    assert.equal(countSolutions(puzzle.givens, 2), 1);
    assert.equal(puzzle.givens.length, 81);
    assert.equal(puzzle.solution.length, 81);
    assert.ok(puzzle.givens.some((v) => v === 0));
    for (let i = 0; i < 81; i++) if (puzzle.givens[i]) assert.equal(puzzle.givens[i], puzzle.solution[i]);
  }
});

test('a hidden single identifies the only position for a digit in a unit', () => {
  const grid = [...'034600000002005008108000007000061020000800091700000800000000004080019000040000000'].map(Number);
  const hint = nextDeduction({ grid });
  assert.equal(hint.technique, 'hidden-single');
  assert.equal(hint.index, 27);
  assert.equal(hint.value, 8);
  assert.match(hint.explanation, /8/);
});

test('locked candidates remove a digit from the line outside its box', () => {
  const grid = [...'504000000600000008100040000800700023020000000013000000060000000007010000300206000'].map(Number);
  const hint = nextDeduction({ grid });
  assert.equal(hint.technique, 'locked-candidates');
  assert.deepEqual(hint.cells, [11, 20]);
  assert.deepEqual(hint.candidates, [{ index: 56, removed: [2] }]);
  assert.match(hint.explanation, /2.*box/);
});

test('a naked pair removes its two digits from another cell in the unit', () => {
  const grid = [...'000608900000105000000002000050001000000050000013000006000500004280010600000080079'].map(Number);
  const hint = nextDeduction({ grid });
  assert.equal(hint.technique, 'naked-pair');
  assert.deepEqual(hint.cells, [70, 71]);
  assert.deepEqual(hint.candidates, [
    { index: 65, removed: [5] },
    { index: 66, removed: [3] },
    { index: 68, removed: [3] }
  ]);
  assert.match(hint.explanation, /3 and 5/);
});

test('a full grid with a duplicate is not solved', () => {
  const grid = solved.slice(); grid[0] = 6;
  assert.equal(getStatus({ grid }).phase, 'playing');
});

test('applying a candidate elimination advances hints without filling a cell', () => {
  const grid = [...'504000000600000008100040000800700023020000000013000000060000000007010000300206000'].map(Number);
  const state = { givens: Array(81).fill(0), solution: solved, difficulty: 'hard', grid, notes: Array.from({ length: 81 }, () => []), eliminations: Array.from({ length: 81 }, () => []), history: [] };
  const hint = nextDeduction(state);
  assert.equal(hint.technique, 'locked-candidates');
  const after = applyDeduction(state, hint);
  assert.deepEqual(after.grid, grid);
  assert.deepEqual(after.eliminations[56], [2]);
  assert.notDeepEqual(nextDeduction(after), hint);
  assert.deepEqual(state.eliminations[56], []);
  assert.deepEqual(undo(after), state);
});

test('generated difficulty matches a complete advancing technique trace', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    let state = createState({ puzzle: generatePuzzle(difficulty, 1234) });
    const used = new Set();
    for (let step = 0; step < 500 && getStatus(state).phase !== 'finished'; step++) {
      const hint = nextDeduction(state);
      assert.ok(hint, `${difficulty} stalled at step ${step}`);
      used.add(hint.technique);
      state = hint.value ? applyMove(state, { index: hint.index, value: hint.value }) : applyDeduction(state, hint);
    }
    assert.equal(getStatus(state).phase, 'finished', `${difficulty} did not finish`);
    if (difficulty === 'easy') assert.deepEqual([...used], ['naked-single']);
    if (difficulty === 'medium') {
      assert.ok(used.has('hidden-single') || used.has('locked-candidates'));
      assert.equal(used.has('naked-pair'), false, 'medium puzzle required a hard technique');
    }
    if (difficulty === 'hard') assert.ok(used.has('naked-pair'));
  }
});

test('restore rejects duplicate notes inside undo history', () => {
  const state = createState({ puzzle: { givens: oneBlank, solution: solved, difficulty: 'easy' } });
  const record = applyMove(state, { index: 0, toggleNote: 4 });
  record.history[0].notes[0] = [4, 4];
  assert.throws(() => restoreState(record), /invalid history|notes/i);
});

test('candidate eliminations survive JSON restoration and forged removals are rejected', () => {
  let state = createState({ puzzle: generatePuzzle('hard', 1234) });
  for (let step = 0; step < 200; step++) {
    const hint = nextDeduction(state);
    assert.ok(hint);
    if (!hint.value) {
      const after = applyDeduction(state, hint);
      const restored = restoreState(JSON.parse(JSON.stringify(after)));
      assert.deepEqual(nextDeduction(restored), nextDeduction(after));
      assert.deepEqual(undo(restored), state);
      const forged = structuredClone(after);
      const target = hint.candidates[0].index;
      forged.eliminations[target].push(forged.solution[target]);
      assert.throws(() => restoreState(forged), /invalid eliminations/);
      forged.eliminations[target].pop();
      forged.eliminations[target].push([1, 2, 3, 4, 5, 6, 7, 8, 9].find((v) => v !== forged.solution[target] && !after.eliminations[target].includes(v)));
      assert.throws(() => restoreState(forged), /invalid eliminations/);
      return;
    }
    state = applyMove(state, { index: hint.index, value: hint.value });
  }
  assert.fail('hard puzzle yielded no elimination');
});


