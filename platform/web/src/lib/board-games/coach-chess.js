import { Chess } from 'chess.js';

// The chess coach's "why": plain-language ideas computed from the rules, never guessed.
// Every sentence here is a literal fact about the position (attacked, defended, legal
// capture, check), so the coach cannot mislead the way a language model could.

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const other = (color) => color === 'w' ? 'b' : 'w';
export const colorName = (color) => color === 'w' ? 'White' : 'Black';

// Each idea points at the phase of Chess From Zero that teaches it.
export const GUIDE = {
  mate: '/guides/chess-from-zero/3',
  special: '/guides/chess-from-zero/2',
  tactics: '/guides/chess-from-zero/4',
  opening: '/guides/chess-from-zero/5'
};

export function fenOf(state) {
  const game = new Chess(state.initialFen);
  for (const move of state.history) game.move(move);
  return game.fen();
}

function pieces(game, color) {
  return game.board().flat().filter((piece) => piece && piece.color === color);
}

function cheapestAttacker(game, square, byColor) {
  const attackers = game.attackers(square, byColor);
  if (!attackers.length) return null;
  return attackers.map((sq) => game.get(sq).type).sort((a, b) => VALUE[a] - VALUE[b])[0];
}

// Pieces of `color` that are attacked and either undefended or attacked by something cheaper.
export function loosePieces(game, color) {
  const enemy = other(color);
  const loose = [];
  for (const piece of pieces(game, color)) {
    if (piece.type === 'k') continue;
    const attacker = cheapestAttacker(game, piece.square, enemy);
    if (!attacker) continue;
    const defended = game.attackers(piece.square, color).length > 0;
    if (!defended || VALUE[attacker] < VALUE[piece.type]) {
      loose.push({ square: piece.square, type: piece.type, attacker, defended });
    }
  }
  return loose.sort((a, b) => VALUE[b.type] - VALUE[a.type]);
}

// Legal captures by the side to move that win material outright.
export function winningCaptures(game) {
  if (game.isGameOver()) return [];
  const me = game.turn();
  const found = [];
  for (const move of game.moves({ verbose: true })) {
    if (!move.captured) continue;
    const defended = game.attackers(move.to, other(me)).length > 0;
    const gain = VALUE[move.captured] - VALUE[move.piece];
    if (!defended || gain > 0) found.push({ move, free: !defended, gain: defended ? gain : VALUE[move.captured] });
  }
  return found.sort((a, b) => b.gain - a.gain);
}

function list(items) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

// What a move does, as short phrases ("wins the bishop for free", "forks the king and rook").
// "gives check and forks the king" reads better than a comma list.
function joinIdeas(parts) {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

export function describeMove(fen, action) {
  const game = new Chess(fen);
  const me = game.turn();
  const enemy = other(me);
  const looseBefore = loosePieces(game, me).map((p) => p.square);
  const move = game.move(action);
  const ideas = [];
  const add = (text, guide) => ideas.push({ text, guide });

  if (game.isCheckmate()) add('delivers checkmate', GUIDE.mate);
  else if (game.isCheck()) add('gives check', GUIDE.tactics);

  if (move.captured) {
    const recapture = game.attackers(move.to, enemy).length > 0;
    if (!recapture) add(`wins the ${NAME[move.captured]} for free`, GUIDE.tactics);
    else if (VALUE[move.captured] > VALUE[move.piece]) add(`takes a ${NAME[move.captured]} with a ${NAME[move.piece]}, winning material even if it is recaptured`, GUIDE.tactics);
    else if (VALUE[move.captured] === VALUE[move.piece]) add(`trades ${NAME[move.piece]} for ${NAME[move.captured]}`, GUIDE.tactics);
    else add(`takes the ${NAME[move.captured]} on ${move.to}`, GUIDE.tactics);
  }

  // Fork: the moved piece now attacks two or more targets worth hitting.
  const targets = pieces(game, enemy).filter((piece) =>
    game.attackers(piece.square, me).includes(move.to) &&
    (piece.type === 'k' || VALUE[piece.type] > VALUE[move.piece] ||
      game.attackers(piece.square, enemy).length === 0))
    .sort((a, b) => VALUE[b.type] - VALUE[a.type]);
  if (targets.length >= 2) {
    add(`forks the ${list(targets.map((t) => `${NAME[t.type]}${t.type === 'k' ? '' : ` on ${t.square}`}`))}`, GUIDE.tactics);
  }

  if (move.promotion) add(`promotes to a ${NAME[move.promotion]}`, GUIDE.special);
  if (move.flags.includes('k') || move.flags.includes('q')) add('castles, moving the king to safety and connecting the rooks', GUIDE.opening);

  const backRank = me === 'w' ? '1' : '8';
  if (game.moveNumber() <= 12 && (move.piece === 'n' || move.piece === 'b') && move.from[1] === backRank) {
    add(`develops the ${NAME[move.piece]} off the back rank`, GUIDE.opening);
  }
  if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to) && game.moveNumber() <= 12) {
    add('claims space in the center', GUIDE.opening);
  }

  // Rescues: the moved piece escaped, or another loose piece is now covered.
  const looseAfter = new Set(loosePieces(game, me).map((p) => p.square));
  if (looseBefore.includes(move.from) && !looseAfter.has(move.to)) {
    add(`moves the ${NAME[move.piece]} out of danger`, GUIDE.tactics);
  }
  const covered = looseBefore.filter((sq) => sq !== move.from && !looseAfter.has(sq));
  if (covered.length) add(`protects the ${list(covered.map((sq) => `${NAME[game.get(sq).type]} on ${sq}`))}`, GUIDE.tactics);

  return { san: move.san, ideas, text: joinIdeas(ideas.map((i) => i.text)), guide: ideas[0]?.guide ?? null };
}

// Things the player should notice right now, from their own side's point of view.
export function insights(fen, human) {
  const game = new Chess(fen);
  const out = [];
  const enemy = other(human);
  const myTurn = game.turn() === human && !game.isGameOver();

  if (myTurn && game.isCheck()) out.push({ text: 'Your king is in check. This move must get it out of check.', guide: GUIDE.special });

  for (const piece of loosePieces(game, human).slice(0, 2)) {
    out.push({
      text: piece.defended
        ? `Your ${NAME[piece.type]} on ${piece.square} is attacked by a ${NAME[piece.attacker]}, which is worth less.`
        : `Your ${NAME[piece.type]} on ${piece.square} is attacked and has no defender.`,
      guide: GUIDE.tactics
    });
  }

  if (myTurn) {
    for (const { move, free } of winningCaptures(game).slice(0, 2)) {
      out.push({
        text: free
          ? `You can take the ${NAME[move.captured]} on ${move.to}. Nothing defends it.`
          : `Your ${NAME[move.piece]} on ${move.from} can take the ${NAME[move.captured]} on ${move.to}, a more valuable piece.`,
        guide: GUIDE.tactics
      });
    }
  }

  if (game.moveNumber() <= 12) {
    const home = human === 'w' ? ['b1', 'g1', 'c1', 'f1'] : ['b8', 'g8', 'c8', 'f8'];
    const undeveloped = home.filter((sq) => {
      const piece = game.get(sq);
      return piece && piece.color === human && (piece.type === 'n' || piece.type === 'b');
    }).length;
    if (game.moveNumber() >= 4 && undeveloped >= 2) {
      out.push({ text: `${undeveloped} of your knights and bishops are still on their starting squares.`, guide: GUIDE.opening });
    }
    const kingHome = human === 'w' ? 'e1' : 'e8';
    const king = game.get(kingHome);
    const rights = game.getCastlingRights(human);
    if (game.moveNumber() >= 6 && king?.type === 'k' && king.color === human && (rights.k || rights.q)) {
      out.push({ text: 'Your king is still in the center. Castling soon makes it safer.', guide: GUIDE.opening });
    }
  }

  const material = (color) => pieces(game, color).reduce((sum, p) => sum + (p.type === 'k' ? 0 : VALUE[p.type]), 0);
  const diff = material(human) - material(enemy);
  out.push({ text: diff === 0 ? 'Material is even.' : `You are ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} point${Math.abs(diff) === 1 ? '' : 's'} of material.`, guide: null });
  return out;
}

// Engine scores -> one comparable centipawn number, then to a win chance (Lichess formula),
// so a big score swing in an already-won position is not mislabelled a blunder.
export function scoreToCp(score) {
  if (score?.mate != null) return Math.sign(score.mate || 1) * (10000 - Math.abs(score.mate) * 10);
  return score?.cp ?? 0;
}
export function winChance(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}
export function rateMove(beforeCp, afterCp) {
  const drop = winChance(beforeCp) - winChance(afterCp);
  return drop >= 30 ? 'blunder' : drop >= 20 ? 'mistake' : drop >= 10 ? 'inaccuracy' : 'good';
}

// An engine score for `povColor`, in words.
export function evaluationText(score, povColor, sideToMove) {
  const sign = povColor === sideToMove ? 1 : -1;
  if (score?.mate != null) {
    const mate = score.mate * sign;
    if (mate === 0) return 'Checkmate.';
    return mate > 0 ? `You have a forced checkmate in ${Math.abs(mate)}.` : `Your opponent has a forced checkmate in ${Math.abs(mate)}.`;
  }
  const cp = (score?.cp ?? 0) * sign;
  const pawns = (Math.abs(cp) / 100).toFixed(1);
  if (Math.abs(cp) < 40) return 'The position is roughly equal.';
  const who = cp > 0 ? 'You are' : 'Your opponent is';
  const how = Math.abs(cp) < 120 ? 'slightly better' : Math.abs(cp) < 300 ? 'clearly better' : 'winning';
  return `${who} ${how} (about ${pawns} pawn${pawns === '1.0' ? '' : 's'} of advantage).`;
}
