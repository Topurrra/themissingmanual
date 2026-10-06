import * as chess from './chess.js';
import * as checkers from './checkers.js';
import * as sudoku from './sudoku.js';
import * as go from './go.js';

export const gameIds = ['chess', 'checkers', 'sudoku', 'go'];

const games = {
  chess: { id: 'chess', name: 'Chess', rules: chess },
  checkers: { id: 'checkers', name: 'Checkers', rules: checkers },
  sudoku: { id: 'sudoku', name: 'Sudoku', rules: sudoku },
  go: { id: 'go', name: 'Go', rules: go }
};

export function getGame(id) {
  return Object.hasOwn(games, id) ? games[id] : null;
}
