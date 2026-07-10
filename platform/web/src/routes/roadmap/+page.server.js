import { listCategories, listGuides } from '$lib/api.js';

// Same shape as routes/paths/+page.server.js: the map/skills views are generated
// client-side from these two lists (plus localStorage), so they work offline after
// first load and pick up new guides automatically.
export async function load({ fetch }) {
  // The practice category has its own hub, not a roadmap/skills shelf.
  const categories = ((await listCategories(fetch)) ?? []).filter((c) => c.slug !== 'practice');
  const guides = (await listGuides(fetch)) ?? [];
  const withCounts = categories
    .map((c) => ({ ...c, count: guides.filter((g) => g.category === c.slug).length }))
    .filter((c) => c.count > 0);
  return { categories: withCounts, guides };
}
