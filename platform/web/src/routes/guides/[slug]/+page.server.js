import { error } from '@sveltejs/kit';
import { getGuide } from '$lib/api.js';

export async function load({ fetch, params }) {
  const detail = await getGuide(fetch, params.slug);
  if (!detail) throw error(404, 'Guide not found');
  return detail; // { guide, phases }
}
