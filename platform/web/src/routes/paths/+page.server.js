import { listCategories, listGuides } from '$lib/api.js';

// The path is generated on the client from these two lists, so the page works
// offline after first load and new guides appear in paths with no other change.
export async function load({ fetch }) {
  // Practice lessons have their own hub (/practice) - keep them out of the wizard's
  // interest chips AND the guide pool, or pathgen appends unlisted categories as
  // straggler path steps.
  const categories = ((await listCategories(fetch)) ?? []).filter((c) => c.slug !== 'practice');
  const guides = ((await listGuides(fetch)) ?? []).filter((g) => g.category !== 'practice');
  // Only offer interest chips for categories that actually have guides.
  const withCounts = categories
    .map((c) => ({ ...c, count: guides.filter((g) => g.category === c.slug).length }))
    .filter((c) => c.count > 0);
  return { categories: withCounts, guides };
}
