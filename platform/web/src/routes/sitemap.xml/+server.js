import { listGuides, listCategories } from '$lib/api.js';

// XML sitemap: static pages + every category + every guide overview. Phase pages
// are reachable from each guide overview, so crawlers find them by following links.
export async function GET({ fetch, url }) {
  const origin = url.origin;
  const guides = (await listGuides(fetch)) ?? [];
  const cats = (await listCategories(fetch)) ?? [];
  const paths = ['/', '/paths', '/glossary', '/about', '/train', '/contribute'];
  for (const c of cats) paths.push(`/categories/${c.slug}`);
  for (const g of guides) paths.push(`/guides/${g.slug}`);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${esc(origin + p)}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'max-age=3600' }
  });
}
