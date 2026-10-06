import * as chess from './chess.js';
import * as checkers from './checkers.js';
import * as go from './go.js';

const RULES = { chess, checkers, go };
const CHESS_VALUE = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
const TIMEOUT = Symbol('search deadline');

function value(game, state, colour) {
  const status = game.getStatus(state);
  if (status.phase === 'finished') return status.winner === colour ? 10000 : status.winner === 'draw' ? 0 : -10000;
  if (game === chess) return chess.getBoard(state).reduce((sum, piece) =>
    sum + (piece ? (piece.color === colour ? 1 : -1) * CHESS_VALUE[piece.type] : 0), 0);
  return checkers.getBoard(state).reduce((sum, piece) =>
    sum + (piece ? (piece > 0 ? 'b' : 'w') === colour ? Math.abs(piece) === 2 ? 1.7 : 1 : Math.abs(piece) === 2 ? -1.7 : -1 : 0), 0);
}

function search(game, state, depth, colour, deadline, alpha = -Infinity, beta = Infinity) {
  if (performance.now() >= deadline) throw TIMEOUT;
  if (depth === 0 || game.getStatus(state).phase !== 'playing') return value(game, state, colour);
  const maximizing = game.getStatus(state).turn === colour;
  let best = maximizing ? -Infinity : Infinity;
  for (const action of game.legalMoves(state)) {
    const score = search(game, game.applyMove(state, action), depth - 1, colour, deadline, alpha, beta);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function selectedMoves(gameName, moves, selection) {
  if (selection == null) return moves;
  if (gameName === 'chess') {
    const from = typeof selection === 'string' ? selection : selection?.from;
    return moves.filter((move) => move.from === from);
  }
  if (gameName === 'checkers') {
    const prefix = Number.isInteger(selection) ? [selection] : Array.isArray(selection) ? selection : [];
    return moves.filter((move) => prefix.every((square, index) => move.path[index] === square));
  }
  if (gameName === 'go' && Number.isInteger(selection)) return moves.filter((move) => move.point === selection);
  return moves;
}

function goChoice(state, moves, allowPass) {
  const own = state.turn === 'b' ? 1 : 2;
  const enemy = own === 1 ? 2 : 1;
  let best = moves[0], bestScore = -Infinity;
  for (const action of moves) {
    if (action.pass) continue;
    const next = go.applyMove(state, action);
    const captured = state.board.filter((cell, point) => cell === enemy && next.board[point] === 0).length;
    const row = Math.floor(action.point / 9), col = action.point % 9;
    const adjacent = [action.point - 9, action.point + 9, action.point - 1, action.point + 1]
      .filter((point) => point >= 0 && point < 81 && Math.abs(Math.floor(point / 9) - row) + Math.abs(point % 9 - col) === 1);
    const friends = adjacent.filter((point) => state.board[point] === own).length;
    const foes = adjacent.filter((point) => state.board[point] === enemy).length;
    const score = captured * 20 + friends * 2 + foes + Math.min(row, 8 - row, col, 8 - col) * 0.1;
    if (score > bestScore) { best = action; bestScore = score; }
  }
  if (allowPass && state.passes === 1 && bestScore < 2) return { pass: true };
  return best;
}

function explanationFor(gameName, state, action, next, hint) {
  let detail;
  if (gameName === 'chess') {
    const before = chess.getBoard(state);
    const after = chess.getBoard(next);
    const enemy = chess.getStatus(state).turn === 'w' ? 'b' : 'w';
    const captured = before.filter((piece) => piece?.color === enemy).length -
      after.filter((piece) => piece?.color === enemy).length;
    const status = chess.getStatus(next);
    const reason = status.phase === 'finished' && status.winner !== 'draw' ? 'finishes the game' :
      status.message === 'Check' ? 'gives check' :
        captured ? 'captures a piece' :
          action.promotion ? `promotes to ${action.promotion}` : 'plays a legal move';
    detail = `${action.from} to ${action.to}${action.promotion ? ` (${action.promotion})` : ''} ${reason}`;
  } else if (gameName === 'checkers') {
    const captured = action.path.some((point, index) => index > 0 && Math.abs(point - action.path[index - 1]) > 9);
    const reason = captured ? 'takes the required capture route' : 'plays a legal move';
    detail = `${action.path.join(' to ')} ${reason}`;
  } else if (action.pass) {
    detail = 'pass leaves the board unchanged and moves toward score review';
  } else {
    const enemy = state.turn === 'b' ? 2 : 1;
    const captured = state.board.filter((cell, point) => cell === enemy && next.board[point] === 0).length;
    const liberties = go.getGroup(next, action.point).liberties.length;
    detail = `point ${action.point} ${captured ? `captures ${captured} stone${captured === 1 ? '' : 's'}` : `leaves the new group with ${liberties} liberties`}`;
  }
  return `${detail}. ${hint ? 'This is a limited-search practice suggestion.' : 'Practice opponent; search is limited to the current time budget.'}`;
}

export function chooseAction(gameName, rawState, { selection = null, budgetMs = 1000, difficulty = 'easy', hint = false } = {}) {
  const game = RULES[gameName];
  if (!game) throw new Error('Unsupported game');
  const state = game.restoreState(rawState);
  if (game.getStatus(state).phase !== 'playing') throw new Error('Game is not in play');
  const legal = game.legalMoves(state);
  const moves = hint ? selectedMoves(gameName, legal, selection) : legal;
  if (!moves.length) throw new Error('No legal action for this selection');
  const deadline = performance.now() + Math.max(1, Math.min(1000, Number.isFinite(budgetMs) ? budgetMs : 1000));
  let action = moves[0];
  if (gameName === 'go') action = goChoice(state, moves, !hint);
  else {
    const colour = game.getStatus(state).turn;
    const depth = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    let bestScore = -Infinity;
    for (const move of moves) {
      try {
        const score = search(game, game.applyMove(state, move), depth - 1, colour, deadline);
        if (score > bestScore) { bestScore = score; action = move; }
      } catch (error) {
        if (error !== TIMEOUT) throw error;
        break;
      }
    }
  }
  // Validate the final suggestion against the restored position before returning it.
  const next = game.applyMove(state, action);
  return { action, explanation: explanationFor(gameName, state, action, next, hint) };
}
