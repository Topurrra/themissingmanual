import { error } from '@sveltejs/kit';
import { getPhase } from '$lib/api.js';

export async function load({ fetch, params }) {
  const phase = await getPhase(fetch, params.slug, params.phase);
  if (!phase) throw error(404, 'Phase not found');
  return { phase };
}
