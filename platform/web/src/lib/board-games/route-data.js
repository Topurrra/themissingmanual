import { gameIds } from './registry.js';

export function resolveGamePage(game, nav = []) {
  if (!gameIds.includes(game)) throw new Error('Game not found');
  return { game, guides:nav.find(category => category.slug === 'games')?.guides ?? [] };
}
