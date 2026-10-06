import { Chess, DEFAULT_POSITION } from 'chess.js';

const SQUARE = /^[a-h][1-8]$/;
const PROMOTION = /^[qrbn]$/;

function checkedFen(initialFen) {
  if (typeof initialFen !== 'string') throw new Error('Invalid initial chess position');
  try {
    return new Chess(initialFen).fen();
  } catch (error) {
    throw new Error(`Invalid initial chess position: ${error.message}`);
  }
}

function checkedMove(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action) ||
      !SQUARE.test(action.from) || !SQUARE.test(action.to) ||
      (action.promotion !== undefined && !PROMOTION.test(action.promotion))) {
    throw new Error('Illegal chess move');
  }
  return action.promotion === undefined
    ? { from: action.from, to: action.to }
    : { from: action.from, to: action.to, promotion: action.promotion };
}

function replay(state) {
  const game = new Chess(state.initialFen);
  for (const action of state.history) {
    try {
      game.move(checkedMove(action));
    } catch {
      throw new Error('Invalid chess history: illegal move');
    }
  }
  return game;
}

function isFivefold(state, game) {
  if (!game.isThreefoldRepetition()) return false;
  const target = game.hash();
  const replayed = new Chess(state.initialFen);
  let occurrences = Number(replayed.hash() === target);
  for (const action of state.history) {
    replayed.move(action);
    if (replayed.hash() === target && ++occurrences >= 5) return true;
  }
  return false;
}

function automaticDraw(state, game) {
  if (game.isCheckmate()) return false;
  return Number(game.fen().split(' ')[4]) >= 150 || isFivefold(state, game);
}

function claimsFor(state, game) {
  if (game.isCheckmate() || game.isStalemate() || game.isInsufficientMaterial() ||
      automaticDraw(state, game)) return [];
  const claims = [];
  if (game.isThreefoldRepetition()) claims.push('threefold');
  if (game.isDrawByFiftyMoves()) claims.push('fifty-move');
  return claims;
}

function terminal(state, game) {
  return Boolean(state.outcome) || game.isCheckmate() || game.isStalemate() ||
    game.isInsufficientMaterial() || automaticDraw(state, game);
}

function validateOutcome(state, game, outcome) {
  if (outcome === undefined) return undefined;
  if (!outcome || typeof outcome !== 'object' || Array.isArray(outcome)) {
    throw new Error('Invalid chess outcome');
  }
  if (outcome.type === 'claim' && typeof outcome.claim === 'string' &&
      Object.keys(outcome).length === 2 && claimsFor(state, game).includes(outcome.claim)) {
    return { type: 'claim', claim: outcome.claim };
  }
  if (outcome.type === 'resign' && (outcome.loser === 'w' || outcome.loser === 'b') &&
      Object.keys(outcome).length === 2 && !terminal(state, game)) {
    return { type: 'resign', loser: outcome.loser };
  }
  throw new Error('Invalid chess outcome');
}

export function createState(options = {}) {
  const initialFen = checkedFen(options.initialFen ?? DEFAULT_POSITION);
  return { initialFen, history: [] };
}

export function restoreState(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      !Array.isArray(record.history)) {
    throw new Error('Invalid chess state');
  }
  const state = { initialFen: checkedFen(record.initialFen), history: [] };
  const game = new Chess(state.initialFen);
  for (const raw of record.history) {
    if (terminal(state, game)) throw new Error('Invalid chess history: game already finished');
    const action = checkedMove(raw);
    try {
      game.move(action);
    } catch {
      throw new Error('Invalid chess history: illegal move');
    }
    state.history.push(action);
  }
  const outcome = validateOutcome(state, game, record.outcome);
  if (outcome) state.outcome = outcome;
  return state;
}

export function getBoard(state) {
  return replay(state).board().flat().map((piece) => piece
    ? { square: piece.square, color: piece.color, type: piece.type }
    : null);
}

export function getStatus(state) {
  const game = replay(state);
  const turn = game.turn();
  let winner = null;
  let message = `${turn === 'w' ? 'White' : 'Black'} to move`;
  if (state.outcome?.type === 'resign') {
    winner = state.outcome.loser === 'w' ? 'b' : 'w';
    message = `${state.outcome.loser === 'w' ? 'White' : 'Black'} resigned`;
  } else if (state.outcome?.type === 'claim') {
    winner = 'draw';
    message = 'Draw claimed';
  } else if (game.isCheckmate()) {
    winner = turn === 'w' ? 'b' : 'w';
    message = 'Checkmate';
  } else if (game.isStalemate()) {
    winner = 'draw';
    message = 'Stalemate';
  } else if (game.isInsufficientMaterial()) {
    winner = 'draw';
    message = 'Insufficient material';
  } else if (automaticDraw(state, game)) {
    winner = 'draw';
    message = 'Automatic draw';
  } else if (game.isCheck()) {
    message = 'Check';
  }
  return {
    phase: winner ? 'finished' : 'playing', turn, winner,
    claims: winner ? [] : claimsFor(state, game), message
  };
}

export function legalMoves(state) {
  const game = replay(state);
  if (terminal(state, game)) return [];
  return game.moves({ verbose: true }).map(({ from, to, promotion }) =>
    promotion ? { from, to, promotion } : { from, to });
}

export function applyMove(state, rawAction) {
  const game = replay(state);
  if (terminal(state, game)) throw new Error('Illegal chess move: game is finished');
  const action = checkedMove(rawAction);
  try {
    game.move(action);
  } catch {
    throw new Error('Illegal chess move');
  }
  return { initialFen: state.initialFen, history: [...state.history, action] };
}

export function undo(state) {
  const valid = restoreState(state);
  if (valid.outcome) return { initialFen: valid.initialFen, history: valid.history };
  if (valid.history.length === 0) return valid;
  return { initialFen: valid.initialFen, history: valid.history.slice(0, -1) };
}

export function claimDraw(state, claim) {
  const game = replay(state);
  if (state.outcome || !claimsFor(state, game).includes(claim)) {
    throw new Error('Invalid chess draw claim');
  }
  return { initialFen: state.initialFen, history: [...state.history], outcome: { type: 'claim', claim } };
}

export function resign(state, colour) {
  if (colour !== 'w' && colour !== 'b') throw new Error('Invalid chess colour');
  const game = replay(state);
  if (terminal(state, game)) throw new Error('Cannot resign a finished chess game');
  return { initialFen: state.initialFen, history: [...state.history], outcome: { type: 'resign', loser: colour } };
}

export function getCoach(state, selection = null) {
  const game = replay(state);
  const board = game.board().flat();
  const enemy = game.turn() === 'w' ? 'b' : 'w';
  const captures = terminal(state, game) ? [] : game.moves({ verbose: true })
    .filter((move) => move.captured)
    .map(({ from, to, promotion }) => promotion ? { from, to, promotion } : { from, to });
  const threats = board.filter((piece) => piece?.color === game.turn() &&
    game.isAttacked(piece.square, enemy)).map((piece) => piece.square);
  return { check: game.isCheck(), captures, threats, selected: selection };
}
