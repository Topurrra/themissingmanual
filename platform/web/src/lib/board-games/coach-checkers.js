import * as checkers from './checkers.js';

// The checkers coach's "why". Facts come from the rules (legal jumps, who can be jumped);
// move ratings come from a material search, so "this lets White jump two pieces" is always true.

const FILES = 'abcdefgh';
const KING = 1.5;
const TIMEOUT = Symbol('coach search deadline');
export const squareName = (index) => `${FILES[index % 8]}${8 - Math.floor(index / 8)}`;
export const colorName = (color) => color === 'b' ? 'Black' : 'White';
const owner = (piece) => piece > 0 ? 'b' : 'w';
const other = (color) => color === 'b' ? 'w' : 'b';
const isJump = (path) => Math.abs(path[1] - path[0]) > 9;
const jumpedSquares = (path) => isJump(path) ? path.slice(1).map((to, i) => (path[i] + to) / 2) : [];
const plural = (n, word) => `${n} ${n === 1 ? word : word === 'man' ? 'men' : `${word}s`}`;

export const GUIDE = {
  captures: '/guides/checkers-from-zero/2',
  tactics: '/guides/checkers-from-zero/3',
  strategy: '/guides/checkers-from-zero/4'
};

function material(board, color) {
  return board.reduce((sum, piece) => sum + (piece && owner(piece) === color ? (Math.abs(piece) === 2 ? KING : 1) : 0), 0);
}

// Squares holding `color`'s pieces that the other side could jump if it were their move.
export function jumpable(board, color) {
  const state = checkers.createState({ board, turn: other(color) });
  const squares = new Set();
  for (const move of checkers.legalMoves(state)) for (const square of jumpedSquares(move.path)) squares.add(square);
  return [...squares];
}

export function insights(state, human) {
  const board = checkers.getBoard(state);
  const status = checkers.getStatus(state);
  const myTurn = status.phase === 'playing' && status.turn === human;
  const out = [];

  if (myTurn) {
    const jumps = checkers.legalMoves(state).filter((move) => isJump(move.path));
    if (jumps.length) {
      const targets = [...new Set(jumps.flatMap((move) => jumpedSquares(move.path)))].map(squareName);
      const most = Math.max(...jumps.map((move) => jumpedSquares(move.path).length));
      out.push({
        text: `You must jump: captures are compulsory. You can capture on ${targets.join(', ')}${most > 1 ? `, up to ${plural(most, 'piece')} in one move` : ''}.`,
        guide: GUIDE.captures
      });
    }
  }

  const exposed = jumpable(board, human).map(squareName);
  if (exposed.length) {
    out.push({
      text: exposed.length === 1
        ? `Your piece on ${exposed[0]} can be jumped next turn.`
        : `Your pieces on ${exposed.join(', ')} can be jumped next turn.`,
      guide: GUIDE.tactics
    });
  }

  const backRow = human === 'b' ? 0 : 7;
  const guards = board.filter((piece, i) => piece && owner(piece) === human && Math.abs(piece) === 1 && Math.floor(i / 8) === backRow).length;
  const enemyMen = board.filter((piece) => piece && owner(piece) !== human && Math.abs(piece) === 1).length;
  if (guards === 0 && enemyMen > 0) {
    out.push({ text: `Your back row is empty, so ${colorName(other(human))}'s men can crown more easily.`, guide: GUIDE.strategy });
  }

  const count = (color, kind) => board.filter((piece) => piece && owner(piece) === color && Math.abs(piece) === kind).length;
  const mine = `${plural(count(human, 1), 'man')}${count(human, 2) ? ` and ${plural(count(human, 2), 'king')}` : ''}`;
  const theirs = `${plural(count(other(human), 1), 'man')}${count(other(human), 2) ? ` and ${plural(count(other(human), 2), 'king')}` : ''}`;
  out.push({ text: `You have ${mine} against ${theirs}.`, guide: null });
  return out;
}

// "gives check and forks the king" reads better than a comma list.
function joinIdeas(parts) {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

export function describeMove(state, action) {
  const me = state.turn;
  const before = checkers.getBoard(state);
  const next = checkers.applyMove(state, action);
  const after = checkers.getBoard(next);
  const path = action.path;
  const ideas = [];
  const add = (text, guide) => ideas.push({ text, guide });

  const taken = jumpedSquares(path).length;
  if (taken) add(`jumps ${plural(taken, 'piece')}`, taken > 1 ? GUIDE.tactics : GUIDE.captures);
  const end = path.at(-1);
  if (Math.abs(before[path[0]]) === 1 && Math.abs(after[end]) === 2) add('crowns a king', GUIDE.strategy);

  const exposedBefore = new Set(jumpable(before, me));
  const exposedAfter = new Set(jumpable(after, me));
  if (exposedBefore.has(path[0]) && !exposedAfter.has(end)) add('moves a threatened piece to safety', GUIDE.tactics);
  if (exposedAfter.has(end) && !taken) add(`leaves the piece on ${squareName(end)} open to a jump`, GUIDE.tactics);
  const newlyExposed = [...exposedAfter].filter((sq) => sq !== end && !exposedBefore.has(sq));
  if (newlyExposed.length) add(`leaves ${newlyExposed.map(squareName).join(', ')} open to a jump`, GUIDE.tactics);

  return { move: path.map(squareName).join(' to '), ideas, text: joinIdeas(ideas.map((i) => i.text)), guide: ideas[0]?.guide ?? null };
}

function search(state, depth, deadline, alpha, beta) {
  if (performance.now() >= deadline) throw TIMEOUT;
  const status = checkers.getStatus(state);
  if (status.phase !== 'playing') {
    return { score: status.winner === 'draw' ? 0 : status.winner === state.turn ? 100 : -100, best: null };
  }
  const board = checkers.getBoard(state);
  if (depth === 0) return { score: material(board, state.turn) - material(board, other(state.turn)), best: null };
  let best = null;
  let bestScore = -Infinity;
  for (const move of checkers.legalMoves(state)) {
    const score = -search(checkers.applyMove(state, move), depth - 1, deadline, -beta, -alpha).score;
    if (score > bestScore) { bestScore = score; best = move; }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return { score: bestScore, best };
}

// Iterative deepening under a time budget; the deepest finished search wins.
export function analyze(state, budgetMs = 300) {
  const deadline = performance.now() + budgetMs;
  let result = null;
  for (let depth = 1; depth <= 12; depth++) {
    try { result = { ...search(state, depth, deadline, -Infinity, Infinity), depth }; }
    catch (error) { if (error !== TIMEOUT) throw error; break; }
  }
  return result ?? { ...search(state, 1, Infinity, -Infinity, Infinity), depth: 1 };
}

export function rate(loss) {
  return loss >= 1.9 ? 'blunder' : loss >= 0.9 ? 'mistake' : loss >= 0.4 ? 'inaccuracy' : 'good';
}

// Review the player's move: rating, what it allowed, and the better move if there was one.
export function review(before, action, budgetMs = 300) {
  const me = before.turn;
  const after = checkers.applyMove(before, action);
  const bestBefore = analyze(before, budgetMs);
  const played = describeMove(before, action);
  if (checkers.getStatus(after).phase !== 'playing') {
    return { rating: 'best', text: `${played.move} ends the game.`, guide: played.guide };
  }
  const reply = analyze(after, budgetMs);
  const loss = bestBefore.score - (-reply.score);
  const isBest = JSON.stringify(bestBefore.best?.path) === JSON.stringify(action.path);
  const rating = isBest ? 'best' : rate(loss);
  if (rating === 'best' || rating === 'good') {
    return { rating, text: `${played.move}${played.text ? ` ${played.text}` : ''}.`, guide: played.guide };
  }
  const answer = reply.best ? jumpedSquares(reply.best.path).length : 0;
  const why = answer ? `it lets ${colorName(other(me))} jump ${plural(answer, 'piece')}` : 'it gives away material a few moves later';
  const better = describeMove(before, bestBefore.best);
  return {
    rating,
    text: `${played.move}: ${why}. Better was ${better.move}${better.text ? `, which ${better.text}` : ''}.`,
    guide: better.guide ?? GUIDE.tactics
  };
}
