import { listCategories, listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  // "Newly added" = most recently updated guides. `updated` is an ISO date, so a
  // string compare is chronological; ties fall back to title for stability.
  const recent = [...guides]
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || a.title.localeCompare(b.title))
    .slice(0, 6);
  // Full guide list is also returned so the landing CTA can compute path progress.
  return { categories, recent, guides };
}
