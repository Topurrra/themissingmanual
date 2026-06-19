import { API_BASE } from '$lib/server/adminApi.js';

export async function load({ fetch, url }) {
  const q = url.searchParams.get('q') ?? '';
  if (!q.trim()) return { q, hits: [], suggestion: null };
  // Fetch the API directly (not $lib/api.js's search(), which drops headers) so we
  // can read the `x-search-suggestion` "did you mean" header off the response.
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  const hits = res.ok ? await res.json() : [];
  const suggestion = res.headers.get('x-search-suggestion'); // string | null
  return { q, hits: hits ?? [], suggestion };
}
