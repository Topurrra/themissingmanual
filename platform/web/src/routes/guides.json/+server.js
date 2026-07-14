import { json } from '@sveltejs/kit';
import { listGuidesWithPhases, listCategories } from '$lib/api.js';
import { guardJne } from '$lib/server/jneGuard.js';

// Structured catalog for JNE's Learn dock: categories -> guides -> phases, each
// guide carrying its `updated` date for cache revalidation. Mirrors the
// grouping/ordering of llms.txt. Uses the batched /api/guides?phases=1 (one call,
// no N+1). Guarded: optional JNE key + per-IP rate limit.
export async function GET(event) {
  const blocked = guardJne(event, { requireKey: true, max: 60 });
  if (blocked) return blocked;

  const { fetch } = event;
  const guides = ((await listGuidesWithPhases(fetch)) ?? []).filter((g) => g.category !== 'practice');
  const cats = (await listCategories(fetch)) ?? [];
  const name = Object.fromEntries(cats.map((c) => [c.slug, c.name]));

  const byCat = {};
  for (const g of guides) (byCat[g.category] ||= []).push(g);

  const seen = new Set();
  const order = [...cats.map((c) => c.slug), ...Object.keys(byCat)].filter(
    (s) => byCat[s] && !seen.has(s) && seen.add(s)
  );

  const categories = order.map((slug) => ({
    slug,
    name: name[slug] || slug,
    guides: byCat[slug].map((g) => ({
      slug: g.slug,
      title: g.title,
      summary: g.summary,
      difficulty: g.difficulty,
      updated: g.updated,
      phases: (g.phases ?? []).map((p) => ({ no: p.phase_no, title: p.title }))
    }))
  }));

  return json(
    { generated: new Date().toISOString(), categories },
    { headers: { 'cache-control': 'max-age=3600' } }
  );
}
