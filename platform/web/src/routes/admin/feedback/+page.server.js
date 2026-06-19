import { adminJson } from '$lib/server/adminApi.js';

// Loads the reader-feedback inbox (newest-first) from the admin API, forwarding
// the browser's cookie for auth. The +layout.server.js guard handles redirecting
// unauthenticated requests to /admin/login before this runs.
export async function load({ request }) {
  const items = (await adminJson(request.headers.get('cookie'), '/feedback?limit=100', [])) ?? [];
  return { items };
}
