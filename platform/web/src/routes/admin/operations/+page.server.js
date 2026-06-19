import { adminJson } from '$lib/server/adminApi.js';

// Loads the system-status snapshot from the admin API, forwarding the browser's
// cookie for auth. The +layout.server.js guard handles redirecting unauthenticated
// requests to /admin/login before this runs. Defaults every field safely so the
// page renders even if the API returns a partial (or empty) object.
export async function load({ request }) {
  const status = (await adminJson(request.headers.get('cookie'), '/status', {})) ?? {};
  const guides = status.guides ?? {};
  return {
    version: status.version ?? null,
    dbSizeBytes: status.dbSizeBytes ?? null,
    guides: {
      total: guides.total ?? 0,
      published: guides.published ?? 0,
      draft: guides.draft ?? 0
    },
    categories: status.categories ?? null
  };
}
