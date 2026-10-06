const directions = {
  1: [[1, -1], [1, 1]],
  2: [[1, -1], [1, 1], [-1, -1], [-1, 1]],
  [-1]: [[-1, -1], [-1, 1]],
  [-2]: [[1, -1], [1, 1], [-1, -1], [-1, 1]]
};

const other = turn => turn === 'b' ? 'w' : 'b';
const owner = piece => piece > 0 ? 'b' : 'w';
const square = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8 ? row * 8 + col : -1;
const signature = (board, turn) => JSON.stringify([board, turn]);

function checkBoard(board) {
  if (!Array.isArray(board) || board.length !== 64) throw new Error('Invalid checkers board length');
  let black = 0;
  let white = 0;
  for (let index = 0; index < 64; index++) {
    const piece = board[index];
    const row = Math.floor(index / 8);
    const col = index % 8;
    if (![0, 1, 2, -1, -2].includes(piece)) throw new Error('Invalid checkers board piece');
    if (piece && (row + col) % 2 !== 1) throw new Error('Piece on light square');
    if (piece === 1 && row === 7 || piece === -1 && row === 0) throw new Error('Uncrowned man on king row');
    if (piece > 0) black++;
    if (piece < 0) white++;
  }
  if (black > 12 || white > 12) throw new Error('Too many pieces on board');
}

function checkTurn(turn) {
  if (turn !== 'b' && turn !== 'w') throw new Error('Invalid checkers turn');
}

function openingBoard() {
  const board = Array(64).fill(0);
  for (let index = 0; index < 64; index++) {
    const row = Math.floor(index / 8);
    if ((row + index % 8) % 2 !== 1) continue;
    if (row < 3) board[index] = 1;
    if (row > 4) board[index] = -1;
  }
  return board;
}

function captures(board, from, path) {
  const piece = board[from];
  const row = Math.floor(from / 8);
  const col = from % 8;
  const routes = [];
  for (const [dr, dc] of directions[piece]) {
    const mid = square(row + dr, col + dc);
    const to = square(row + dr * 2, col + dc * 2);
    if (mid < 0 || to < 0 || !board[mid] || owner(board[mid]) === owner(piece) || board[to]) continue;
    const next = board.slice();
    next[from] = 0;
    next[mid] = 0;
    const crowned = Math.abs(piece) === 1 && (Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7);
    next[to] = crowned ? piece * 2 : piece;
    const route = [...path, to];
    const more = crowned ? [] : captures(next, to, route);
    routes.push(...(more.length ? more : [route]));
  }
  return routes;
}

function paths(board, turn) {
  const jumps = [];
  const quiet = [];
  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (!piece || owner(piece) !== turn) continue;
    jumps.push(...captures(board, from, [from]));
    const row = Math.floor(from / 8);
    const col = from % 8;
    for (const [dr, dc] of directions[piece]) {
      const to = square(row + dr, col + dc);
      if (to >= 0 && !board[to]) quiet.push([from, to]);
    }
  }
  return jumps.length ? jumps : quiet;
}

function transition(state, path) {
  if (!Array.isArray(path) || !paths(state.board, state.turn).some(move => JSON.stringify(move) === JSON.stringify(path))) {
    throw new Error('Illegal checkers move');
  }
  const board = state.board.slice();
  let piece = board[path[0]];
  board[path[0]] = 0;
  let captured = false;
  for (let n = 1; n < path.length; n++) {
    const from = path[n - 1];
    const to = path[n];
    if (Math.abs(to - from) > 9) {
      board[(from + to) / 2] = 0;
      captured = true;
    }
  }
  const to = path.at(-1);
  if (Math.abs(piece) === 1 && (Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)) piece *= 2;
  board[to] = piece;
  const turn = other(state.turn);
  return {
    ...state,
    board,
    turn,
    moves: [...state.moves, path.slice()],
    noProgress: captured || Math.abs(state.board[path[0]]) === 1 ? 0 : state.noProgress + 1,
    positions: [...state.positions, signature(board, turn)]
  };
}

export function createState(options = {}) {
  const board = options.board === undefined ? openingBoard() : options.board;
  const turn = options.turn === undefined ? 'b' : options.turn;
  checkBoard(board);
  checkTurn(turn);
  const copy = board.slice();
  return {
    start: { board: copy.slice(), turn },
    board: copy,
    turn,
    moves: [],
    noProgress: 0,
    positions: [signature(copy, turn)],
    result: null
  };
}

export function getBoard(state) {
  return state.board.slice();
}

export function legalMoves(state) {
  return state.result ? [] : paths(state.board, state.turn).map(path => ({ path }));
}

export function getStatus(state) {
  if (state.result) return { phase: 'finished', turn: state.turn, winner: state.result.winner, claims: [], message: state.result.message };
  if (!paths(state.board, state.turn).length) {
    const winner = other(state.turn);
    return { phase: 'finished', turn: state.turn, winner, claims: [], message: `${winner === 'b' ? 'Black' : 'White'} wins` };
  }
  const current = signature(state.board, state.turn);
  const claims = [];
  if (state.positions.filter(position => position === current).length >= 3) claims.push('repetition');
  if (state.noProgress >= 80) claims.push('forty-move');
  return { phase: 'playing', turn: state.turn, winner: null, claims, message: `${state.turn === 'b' ? 'Black' : 'White'} to move` };
}

export function applyMove(state, action) {
  if (getStatus(state).phase !== 'playing') throw new Error('Game is finished');
  return transition(state, action?.path);
}

export function claimDraw(state, claim) {
  if (!getStatus(state).claims.includes(claim)) throw new Error('Invalid draw claim');
  return { ...state, result: { winner: 'draw', reason: claim, message: 'Draw claimed' } };
}

export function resign(state, colour) {
  if (getStatus(state).phase !== 'playing' || colour !== state.turn) throw new Error('Invalid resignation');
  const winner = other(colour);
  return { ...state, result: { winner, reason: 'resign', colour, message: `${winner === 'b' ? 'Black' : 'White'} wins by resignation` } };
}

export function undo(state) {
  if (state.result) return { ...state, result: null };
  if (!state.moves.length) return state;
  return replay(state.start, state.moves.slice(0, -1));
}

function replay(start, moves) {
  let rebuilt = createState(start);
  for (const path of moves) {
    if (getStatus(rebuilt).phase !== 'playing') throw new Error('Invalid checkers history after game end');
    try { rebuilt = transition(rebuilt, path); }
    catch { throw new Error('Invalid checkers move history'); }
  }
  return rebuilt;
}

export function restoreState(record) {
  const start = record?.start;
  if (!record || typeof record !== 'object' || !start || typeof start !== 'object' ||
      Array.isArray(start) || Object.getPrototypeOf(start) !== Object.prototype ||
      !Object.hasOwn(start, 'board') || !Object.hasOwn(start, 'turn') ||
      !Array.isArray(record.moves) ||
      !['board', 'turn', 'noProgress', 'positions', 'result'].every(key => Object.hasOwn(record, key) && record[key] !== undefined)) {
    throw new Error('Invalid checkers history record');
  }
  let rebuilt = replay(record.start, record.moves);
  for (const key of ['board', 'turn', 'noProgress', 'positions']) {
    if (JSON.stringify(record[key]) !== JSON.stringify(rebuilt[key])) throw new Error(`Invalid checkers history ${key}`);
  }
  if (record.result !== null && record.result !== undefined) {
    const result = record.result;
    if (result.reason === 'resign' && ['b', 'w'].includes(result.colour) && getStatus(rebuilt).phase === 'playing') {
      rebuilt = resign(rebuilt, result.colour);
    } else if (['repetition', 'forty-move'].includes(result.reason) && getStatus(rebuilt).claims.includes(result.reason)) {
      rebuilt = claimDraw(rebuilt, result.reason);
    } else throw new Error('Invalid checkers history result');
    if (JSON.stringify(record.result) !== JSON.stringify(rebuilt.result)) throw new Error('Invalid checkers history result');
  }
  return rebuilt;
}

export function getCoach(state, selection = null) {
  const moves = legalMoves(state).filter(move => selection === null ||
    (Number.isInteger(selection) ? move.path[0] === selection :
      Array.isArray(selection) && selection.every((index, at) => move.path[at] === index)));
  return {
    moves,
    mandatoryCapture: legalMoves(state).some(move => move.path.length > 2 || Math.abs(move.path[1] - move.path[0]) > 9),
    message: moves.length ? 'Choose a complete legal route.' : 'No legal route for this selection.'
  };
}
