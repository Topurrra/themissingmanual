import { error, redirect } from '@sveltejs/kit';
import { getCategory } from '$lib/api.js';

export async function load({ fetch, params }) {
  // The practice category has its own hub, not a reader category page.
  if (params.slug === 'practice') throw redirect(302, '/practice');
  const detail = await getCategory(fetch, params.slug);
  if (!detail) throw error(404, 'Category not found');
  return detail; // { category, guides }
}
