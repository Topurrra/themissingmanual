import { gameIds } from './registry.js';

// Each game page links its own guide first, then the shared "how computers play" guide,
// instead of every Strategy Games guide (a chess player has no use for the Sudoku guide here).
const ownGuide = { chess: 'chess-from-zero', checkers: 'checkers-from-zero', sudoku: 'sudoku-from-zero', go: 'go-the-board-game' };
const sharedGuides = ['how-computers-play-games'];

export function resolveGamePage(game, nav = []) {
  if (game === 'go' || !gameIds.includes(game)) throw new Error('Game not found');
  const all = nav.find(category => category.slug === 'games')?.guides ?? [];
  const wanted = [ownGuide[game], ...sharedGuides];
  return { game, guides: wanted.map(slug => all.find(guide => guide.slug === slug)).filter(Boolean) };
}
