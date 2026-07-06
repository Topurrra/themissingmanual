import { getBacklog } from '$lib/api.js';

// Public "what should we write next?" - failed/low-hit searches plus reader-submitted
// guide requests, merged and pre-sorted by vote count on the server.
export async function load({ fetch }) {
  const report = (await getBacklog(fetch)) ?? { days: 30, items: [] };
  return { days: report.days, items: report.items };
}
