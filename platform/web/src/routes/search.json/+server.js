import { json } from '@sveltejs/kit';
import { API_BASE } from '$lib/server/adminApi.js';

// Client-callable search proxy for the command palette (the page search is SSR).
// Fetches the API directly (not $lib/api.js's search()) so we can forward the
// `x-search-suggestion` "did you mean" header as a body field for the palette.
export async function GET({ url, fetch }) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ hits: [], suggestion: null });
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  const hits = res.ok ? await res.json() : [];
  const suggestion = res.headers.get('x-search-suggestion'); // string | null
  return json({ hits: (hits ?? []).slice(0, 8), suggestion });
}
