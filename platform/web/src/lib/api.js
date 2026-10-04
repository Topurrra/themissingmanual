// Server-side only. The Rust API base; override with API_BASE env in production.
const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

async function getJson(fetch, path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) return null;
  return await res.json();
}

// `lang` (optional): a registered locale code asks for the translated version;
// absent or 'en' is the English response, unchanged.
const langQ = (lang, sep = '?') => (lang && lang !== 'en' ? `${sep}lang=${encodeURIComponent(lang)}` : '');

export const listGuides = (fetch) => getJson(fetch, '/api/guides');
// Batched: each guide with its phase list, in one call (for the JNE catalog).
export const listGuidesWithPhases = (fetch) => getJson(fetch, '/api/guides?phases=1');
export const getGuide = (fetch, slug, lang) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}${langQ(lang)}`);
export const getPhase = (fetch, slug, phase, lang) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}/${phase}${langQ(lang)}`);
// Registered locales, each with its published translated guide slugs.
export const listLocales = (fetch) => getJson(fetch, '/api/locales');
export const search = (fetch, q, lang) => getJson(fetch, `/api/search?q=${encodeURIComponent(q)}${langQ(lang, '&')}`);
export const listCategories = (fetch) => getJson(fetch, '/api/categories');
export const getCategory = (fetch, slug) => getJson(fetch, `/api/categories/${encodeURIComponent(slug)}`);
export const getBacklog = (fetch) => getJson(fetch, '/api/backlog');
