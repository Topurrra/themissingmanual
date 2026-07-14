import { json } from '@sveltejs/kit';
import { API_BASE } from '$lib/server/adminApi.js';
import { guardJne } from '$lib/server/jneGuard.js';

// Client-callable search proxy for the command palette (the page search is SSR).
// Fetches the API directly (not $lib/api.js's search()) so we can forward the
// `x-search-suggestion` "did you mean" header as a body field for the palette.
// Rate-limited only (no JNE key): TMM's own palette calls this too, so the limit
// is generous enough for interactive typing.
export async function GET(event) {
  const blocked = guardJne(event, { requireKey: false, max: 120 });
  if (blocked) return blocked;

  const { url, fetch } = event;
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ hits: [], suggestion: null });
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  const hits = res.ok ? await res.json() : [];
  const suggestion = res.headers.get('x-search-suggestion'); // string | null
  // Optional `limit` for JNE (default 8, clamped to the axum cap of 20).
  const n = Math.min(Math.max(Number(url.searchParams.get('limit')) || 8, 1), 20);
  return json({ hits: (hits ?? []).slice(0, n), suggestion });
}
