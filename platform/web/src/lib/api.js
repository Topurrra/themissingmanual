// Server-side only. The Rust API base; override with API_BASE env in production.
const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

async function getJson(fetch, path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) return null;
  return await res.json();
}

export const listGuides = (fetch) => getJson(fetch, '/api/guides');
// Batched: each guide with its phase list, in one call (for the JNE catalog).
export const listGuidesWithPhases = (fetch) => getJson(fetch, '/api/guides?phases=1');
export const getGuide = (fetch, slug) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}`);
export const getPhase = (fetch, slug, phase) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}/${phase}`);
export const search = (fetch, q) => getJson(fetch, `/api/search?q=${encodeURIComponent(q)}`);
export const listCategories = (fetch) => getJson(fetch, '/api/categories');
export const getCategory = (fetch, slug) => getJson(fetch, `/api/categories/${encodeURIComponent(slug)}`);
export const getBacklog = (fetch) => getJson(fetch, '/api/backlog');
