import { error } from '@sveltejs/kit';
import { getTrack } from '$lib/api.js';

export async function load({ fetch, params, url }) {
  const detail = await getTrack(fetch, params.track, url.search);
  if (!detail) throw error(404, 'Track not found');
  return detail; // { track, dimensions, roadmap, choices }
}
