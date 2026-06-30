import { listGuides, listCategories, getGuide } from '$lib/api.js';

// XML sitemap: static pages + every category + every guide overview + every phase.
// Each phase is its own citable answer page, so we list them all rather than relying
// on crawlers to follow links — better for search indexing and AI answer engines.
export async function GET({ fetch, url }) {
  const origin = url.origin;
  const guides = (await listGuides(fetch)) ?? [];
  const cats = (await listCategories(fetch)) ?? [];
  const entries = ['/', '/paths', '/glossary', '/cheat-sheet', '/about', '/train', '/contribute'].map((loc) => ({ loc }));
  for (const c of cats) entries.push({ loc: `/categories/${c.slug}` });
  for (const g of guides) entries.push({ loc: `/guides/${g.slug}`, lastmod: g.updated });
  // Phase URLs. The API serializes these at its SQLite mutex and the response is
  // cached an hour, so the per-guide fan-out is cheap enough to skip a bulk endpoint.
  // ponytail: phase lastmod falls back to the guide's (no per-phase date in PhaseRef).
  const details = await Promise.all(guides.map((g) => getGuide(fetch, g.slug).catch(() => null)));
  details.forEach((d, i) => {
    for (const p of d?.phases ?? []) {
      entries.push({ loc: `/guides/${guides[i].slug}/${p.phase_no}`, lastmod: guides[i].updated });
    }
  });
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map((e) => `  <url><loc>${esc(origin + e.loc)}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod)}</lastmod>` : ''}</url>`)
      .join('\n') +
    '\n</urlset>\n';
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'max-age=3600' }
  });
}
