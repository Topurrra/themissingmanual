const SIZE = 81;
const KOMI = 7.5;

function neighbours(point) {
  const row = Math.floor(point / 9);
  const column = point % 9;
  const result = [];
  if (row > 0) result.push(point - 9);
  if (column > 0) result.push(point - 1);
  if (column < 8) result.push(point + 1);
  if (row < 8) result.push(point + 9);
  return result;
}

function validBoard(board) {
  return Array.isArray(board) && board.length === SIZE && board.every((cell) => cell === 0 || cell === 1 || cell === 2);
}

function key(board) {
  return board.join('');
}

function group(board, point) {
  const colour = board[point];
  if (!colour) return { stones: [], liberties: [] };
  const stones = new Set([point]);
  const liberties = new Set();
  const queue = [point];
  for (let index = 0; index < queue.length; index++) {
    for (const next of neighbours(queue[index])) {
      if (board[next] === 0) liberties.add(next);
      else if (board[next] === colour && !stones.has(next)) {
        stones.add(next);
        queue.push(next);
      }
    }
  }
  return {
    stones: [...stones].sort((a, b) => a - b),
    liberties: [...liberties].sort((a, b) => a - b)
  };
}

function snapshot(state) {
  const { board, turn, phase, passes, dead, winner, reason, positions } = state;
  return { board: [...board], turn, phase, passes, dead: [...dead], winner, reason, positions: [...positions] };
}

function nextState(state, changes) {
  return { ...state, ...changes, past: [...state.past, snapshot(state)] };
}

function other(turn) {
  return turn === 'b' ? 'w' : 'b';
}

function ensureState(state) {
  if (!state || !validBoard(state.board)) throw new Error('Invalid Go state board');
  if (state.turn !== 'b' && state.turn !== 'w') throw new Error('Invalid Go state turn');
  if (!['playing', 'review', 'finished'].includes(state.phase)) throw new Error('Invalid Go state phase');
  if (!Number.isInteger(state.passes) || state.passes < 0 || state.passes > 2) throw new Error('Invalid Go state passes');
  if (!Array.isArray(state.dead) || state.dead.some((point) => !Number.isInteger(point) || point < 0 || point >= SIZE || state.board[point] === 0) || new Set(state.dead).size !== state.dead.length) throw new Error('Invalid Go state dead groups');
  if (![null, 'b', 'w', 'draw'].includes(state.winner)) throw new Error('Invalid Go state winner');
  if (![null, 'score', 'resign'].includes(state.reason)) throw new Error('Invalid Go state reason');
  if (!Array.isArray(state.positions) || !state.positions.length || state.positions.some((position) => typeof position !== 'string' || !/^[012]{81}$/.test(position))) throw new Error('Invalid Go position history');
  if (state.positions.at(-1) !== key(state.board) || new Set(state.positions).size !== state.positions.length) throw new Error('Invalid Go position history');
  if (!Array.isArray(state.past)) throw new Error('Invalid Go undo history');
  for (const item of state.past) {
    ensureState({ ...item, past: [] });
    if (item.positions.length > state.positions.length || item.positions.some((position, index) => position !== state.positions[index])) throw new Error('Invalid Go undo position history');
  }
  if (state.phase === 'playing' && (state.passes > 1 || state.dead.length || state.winner !== null)) throw new Error('Invalid Go playing state');
  if (state.phase === 'review' && (state.passes !== 2 || state.winner !== null)) throw new Error('Invalid Go review state');
  if (state.phase === 'finished' && state.winner === null) throw new Error('Invalid Go finished state');
}

function sameSnapshot(left, right) {
  return JSON.stringify(snapshot(left)) === JSON.stringify(snapshot(right));
}

function completeDeadGroups(state) {
  const dead = new Set(state.dead);
  return state.dead.every((point) => group(state.board, point).stones.every((stone) => dead.has(stone)));
}

function legalTransition(before, after) {
  const source = { ...before, past: [] };
  if (before.phase !== 'finished') {
    for (const colour of ['b', 'w']) {
      if (sameSnapshot(resign(source, colour), after)) return true;
    }
  }
  if (before.phase === 'review') return sameSnapshot(acceptScore(source), after);
  if (before.phase !== 'playing') return false;

  let action;
  if (key(before.board) === key(after.board)) action = { pass: true };
  else {
    const colour = before.turn === 'b' ? 1 : 2;
    const placed = [];
    for (let point = 0; point < SIZE; point++) {
      if (before.board[point] === 0 && after.board[point] === colour) placed.push(point);
    }
    if (placed.length !== 1) return false;
    action = { point: placed[0] };
  }
  try {
    const moved = applyMove(source, action);
    if (sameSnapshot(moved, after)) return true;
    if (moved.phase === 'review' && completeDeadGroups(after)) {
      if (sameSnapshot({ ...moved, dead: after.dead }, after)) return true;
      if (sameSnapshot(resumePlay(moved), after)) return true;
    }
  } catch { /* A forged or illegal move cannot be restored. */ }
  return false;
}

export function createState(options = {}) {
  const board = options.board === undefined ? Array(SIZE).fill(0) : [...options.board];
  const turn = options.turn ?? 'b';
  if (!validBoard(board)) throw new Error('Invalid Go board');
  if (turn !== 'b' && turn !== 'w') throw new Error('Invalid Go turn');
  return { board, turn, phase: 'playing', passes: 0, dead: [], winner: null, reason: null, positions: [key(board)], past: [] };
}

export function restoreState(record) {
  ensureState(record);
  const chain = [...record.past, record];
  const first = chain[0];
  if (!sameSnapshot(createState({ board: first.board, turn: first.turn }), first)) throw new Error('Invalid Go initial history');
  for (let index = 1; index < chain.length; index++) {
    if (!legalTransition(chain[index - 1], chain[index])) throw new Error('Invalid Go history transition');
  }
  return { ...snapshot(record), past: record.past.map((item) => snapshot(item)) };
}

export function getBoard(state) {
  return [...state.board];
}

export function getStatus(state) {
  const message = state.phase === 'review' ? 'Mark dead groups, then accept the score or resume play.'
    : state.phase === 'finished' ? (state.reason === 'resign' ? `${state.winner === 'b' ? 'Black' : 'White'} wins by resignation.` : `${state.winner === 'b' ? 'Black' : 'White'} wins on points.`)
      : `${state.turn === 'b' ? 'Black' : 'White'} to play.`;
  return { phase: state.phase, turn: state.turn, winner: state.winner, claims: [], message };
}

export function getGroup(state, point) {
  if (!Number.isInteger(point) || point < 0 || point >= SIZE) throw new Error('Invalid Go point');
  return group(state.board, point);
}

export function applyMove(state, action) {
  if (state.phase !== 'playing') throw new Error('Go game is not in play');
  if (action?.pass === true && Object.keys(action).length === 1) {
    const passes = state.passes + 1;
    return nextState(state, { turn: other(state.turn), passes, phase: passes === 2 ? 'review' : 'playing' });
  }
  const point = action?.point;
  if (!Number.isInteger(point) || point < 0 || point >= SIZE || Object.keys(action).length !== 1) throw new Error('Invalid Go point');
  if (state.board[point] !== 0) throw new Error('Go point is occupied');
  const board = [...state.board];
  const colour = state.turn === 'b' ? 1 : 2;
  board[point] = colour;
  const checked = new Set();
  for (const next of neighbours(point)) {
    if (board[next] === 0 || board[next] === colour || checked.has(next)) continue;
    const opponent = group(board, next);
    for (const stone of opponent.stones) checked.add(stone);
    if (opponent.liberties.length === 0) for (const stone of opponent.stones) board[stone] = 0;
  }
  if (group(board, point).liberties.length === 0) throw new Error('Go suicide move has no liberties');
  const position = key(board);
  if (state.positions.includes(position)) throw new Error('Go positional superko repeats a board');
  return nextState(state, { board, turn: other(state.turn), passes: 0, positions: [...state.positions, position] });
}

export function legalMoves(state) {
  if (state.phase !== 'playing') return [];
  const moves = [];
  for (let point = 0; point < SIZE; point++) {
    if (state.board[point] !== 0) continue;
    try { applyMove(state, { point }); moves.push({ point }); } catch { /* Illegal point. */ }
  }
  moves.push({ pass: true });
  return moves;
}

export function undo(state) {
  if (!state.past.length) return state;
  const previous = state.past.at(-1);
  return { ...structuredClone(previous), past: structuredClone(state.past.slice(0, -1)) };
}

export function resign(state, colour) {
  if (state.phase === 'finished') throw new Error('Go game is finished');
  if (colour !== 'b' && colour !== 'w') throw new Error('Invalid Go colour');
  return nextState(state, { phase: 'finished', winner: other(colour), reason: 'resign' });
}

export function toggleDeadGroup(state, point) {
  if (state.phase !== 'review') throw new Error('Go dead groups can only be reviewed after two passes');
  const stones = getGroup(state, point).stones;
  if (!stones.length) throw new Error('No Go group at point');
  const dead = new Set(state.dead);
  const marking = !dead.has(point);
  for (const stone of stones) marking ? dead.add(stone) : dead.delete(stone);
  return { ...state, dead: [...dead].sort((a, b) => a - b) };
}

export function score(state) {
  const board = state.board.map((cell, point) => state.dead.includes(point) ? 0 : cell);
  const result = {
    blackStones: board.filter((cell) => cell === 1).length,
    blackTerritory: 0,
    whiteStones: board.filter((cell) => cell === 2).length,
    whiteTerritory: 0,
    komi: KOMI
  };
  const visited = new Set();
  for (let point = 0; point < SIZE; point++) {
    if (board[point] !== 0 || visited.has(point)) continue;
    const area = [point];
    const borders = new Set();
    visited.add(point);
    for (let index = 0; index < area.length; index++) {
      for (const next of neighbours(area[index])) {
        if (board[next]) borders.add(board[next]);
        else if (!visited.has(next)) { visited.add(next); area.push(next); }
      }
    }
    if (borders.size === 1) {
      if (borders.has(1)) result.blackTerritory += area.length;
      else result.whiteTerritory += area.length;
    }
  }
  result.blackTotal = result.blackStones + result.blackTerritory;
  result.whiteTotal = result.whiteStones + result.whiteTerritory + KOMI;
  return result;
}

export function resumePlay(state) {
  if (state.phase !== 'review') throw new Error('Go score is not under review');
  return { ...state, phase: 'playing', passes: 0, dead: [] };
}

export function acceptScore(state) {
  if (state.phase !== 'review') throw new Error('Go score is not under review');
  const totals = score(state);
  return nextState(state, { phase: 'finished', winner: totals.blackTotal > totals.whiteTotal ? 'b' : 'w', reason: 'score' });
}

export function getCoach(state, selection = null) {
  if (state.phase === 'review') return { message: 'Mark any dead groups, then agree on the area score.' };
  if (state.phase === 'finished') return { message: getStatus(state).message };
  if (Number.isInteger(selection) && state.board[selection]) {
    const info = getGroup(state, selection);
    return { message: `${info.stones.length} stone group with ${info.liberties.length} liberties.`, points: info.liberties };
  }
  return { message: 'Surround territory, protect your groups, or pass when the board is settled.' };
}
