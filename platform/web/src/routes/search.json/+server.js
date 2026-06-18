import { json } from '@sveltejs/kit';
import { search } from '$lib/api.js';

// Client-callable search proxy for the command palette (the page search is SSR).
export async function GET({ url, fetch }) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ hits: [] });
  const hits = (await search(fetch, q)) ?? [];
  return json({ hits: hits.slice(0, 8) });
}
