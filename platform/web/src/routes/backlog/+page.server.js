import { getBacklog } from '$lib/api.js';

// Public "what should we write next?" - reader-submitted guide requests only,
// pre-sorted by vote count on the server (failed searches are admin-only now).
export async function load({ fetch }) {
  const report = (await getBacklog(fetch)) ?? { items: [] };
  return { items: report.items ?? [] };
}
