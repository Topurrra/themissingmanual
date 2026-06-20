import { listCategories, listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  // GuideSummary carries no date yet, so order deterministically by title.
  // "Newly added" becomes true recency once guide summaries carry `updated` (future).
  const recent = [...guides].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 6);
  // Full guide list is also returned so the landing CTA can compute path progress.
  return { categories, recent, guides };
}
