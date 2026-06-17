import { search } from '$lib/api.js';

export async function load({ fetch, url }) {
  const q = url.searchParams.get('q') ?? '';
  if (!q.trim()) return { q, hits: [] };
  const hits = await search(fetch, q);
  return { q, hits: hits ?? [] };
}
