import { chooseAction } from './opponents.js';
import * as sudoku from './sudoku.js';

export function handleJob(job) {
  if (!job || typeof job !== 'object') throw new Error('Invalid game job');
  const { game, kind } = job;
  if (game === 'sudoku') {
    if (kind === 'puzzle') {
      return { puzzle: sudoku.generatePuzzle(job.difficulty ?? 'easy', job.seed ?? 1) };
    }
    if (kind === 'hint') {
      const state = sudoku.restoreState(job.state);
      const deduction = sudoku.nextDeduction(state);
      if (!deduction) throw new Error('No available Sudoku deduction');
      return { deduction, explanation: deduction.explanation };
    }
    throw new Error('Unsupported Sudoku job');
  }
  if (kind === 'move' || kind === 'hint') {
    return chooseAction(game, job.state, {
      selection: job.selection, difficulty: job.difficulty, budgetMs: job.budgetMs,
      hint: kind === 'hint'
    });
  }
  throw new Error('Unsupported game job');
}

if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('message', ({ data: job }) => {
    try {
      self.postMessage({id:job?.id,revision:job?.revision,stage:'ready'});
      self.postMessage({ id: job?.id, revision: job?.revision, result: handleJob(job) });
    } catch (error) {
      self.postMessage({ id: job?.id, revision: job?.revision, error: { message: error.message } });
    }
  });
}
