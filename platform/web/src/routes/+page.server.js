import { listCategories, listGuides, listTracks } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  const tracks = (await listTracks(fetch)) ?? [];
  // GuideSummary carries no date yet, so order deterministically by title.
  // "Newly added" becomes true recency once guide summaries carry `updated` (future).
  const recent = [...guides].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 6);
  return { categories, recent, tracks };
}
