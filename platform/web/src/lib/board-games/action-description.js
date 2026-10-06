import { getGame } from './registry.js';

const sideName = side => side === 'w' ? 'White' : 'Black';

export function describeAction(game, before, after) {
  const rules = getGame(game).rules;
  const status = rules.getStatus(after);
  const boardBefore = rules.getBoard(before);
  const boardAfter = rules.getBoard(after);
  const mover = sideName(rules.getStatus(before).turn);
  let action = '';
  let captured = 0;
  if (game === 'chess') {
    const move = after.history.at(-1);
    const enemy = rules.getStatus(before).turn === 'w' ? 'b' : 'w';
    captured = boardBefore.filter(piece => piece?.color === enemy).length - boardAfter.filter(piece => piece?.color === enemy).length;
    action = `${move.from} to ${move.to}${move.promotion ? `, promoted to ${move.promotion.toUpperCase()}` : ''}`;
  } else if (game === 'checkers') {
    const path = after.moves.at(-1);
    const enemy = rules.getStatus(before).turn === 'w' ? 1 : -1;
    captured = boardBefore.filter(piece => piece * enemy > 0).length - boardAfter.filter(piece => piece * enemy > 0).length;
    action = path.join(' to ');
  } else if (game === 'go') {
    const point = boardAfter.findIndex((stone, index) => stone && !boardBefore[index]);
    const enemy = rules.getStatus(before).turn === 'w' ? 1 : 2;
    captured = boardBefore.filter(stone => stone === enemy).length - boardAfter.filter(stone => stone === enemy).length;
    action = point < 0 ? 'passes' : `plays ${'ABCDEFGHJ'[point % 9]}${9 - Math.floor(point / 9)}`;
  }
  const played = captured ? `${mover} captures ${captured} ${game === 'go' ? 'stone' : 'piece'}${captured === 1 ? '' : 's'} with ${action}.` : `${mover} ${action}.`;
  if (status.phase === 'finished') {
    const result = status.winner === 'draw' ? `${status.message}, draw` : /wins/i.test(status.message) ? status.message : `${status.message}, ${sideName(status.winner)} wins`;
    return `${played} ${result}.`;
  }
  return `${played}${status.message === 'Check' ? ' Check.' : ''}`;
}
