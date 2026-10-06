import { error } from '@sveltejs/kit';
import { resolveGamePage } from '$lib/board-games/route-data.js';
export async function load({ params, parent }) {
  const { nav = [] } = await parent();
  try { return resolveGamePage(params.game, nav); }
  catch { error(404, 'Game not found'); }
}
