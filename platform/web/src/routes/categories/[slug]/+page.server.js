import { error } from '@sveltejs/kit';
import { getCategory } from '$lib/api.js';

export async function load({ fetch, params }) {
  const detail = await getCategory(fetch, params.slug);
  if (!detail) throw error(404, 'Category not found');
  return detail; // { category, guides }
}
