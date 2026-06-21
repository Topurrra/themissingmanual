import { env } from '$env/dynamic/public';

// Configured public origin, e.g. https://themissingmanual.dev (no trailing slash).
// Empty when PUBLIC_SITE_URL is unset.
export const SITE_URL = (env.PUBLIC_SITE_URL || '').replace(/\/+$/, '');

// Prefer the configured site URL — required for correct absolute URLs in
// prerendered/SSG output. Fall back to the request origin for SSR/dev. During
// prerendering the request origin is a placeholder (sveltekit-prerender); in that
// case return '' so callers emit root-relative URLs rather than a bogus host.
export function siteOrigin(fallback = '') {
  if (SITE_URL) return SITE_URL;
  if (!fallback || fallback.includes('sveltekit-prerender')) return '';
  return fallback;
}
