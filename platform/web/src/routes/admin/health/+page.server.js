import { fail } from '@sveltejs/kit';
import { adminApi, adminJson } from '$lib/server/adminApi.js';

// Loads the content-health report from the admin API, forwarding the browser's
// cookie for auth. The +layout.server.js guard handles redirecting unauthenticated
// requests to /admin/login before this runs. Defaults to empty arrays on failure.
export async function load({ request }) {
  const report =
    (await adminJson(request.headers.get('cookie'), '/health-check', {})) ?? {};
  return {
    broken_links: report.broken_links ?? [],
    missing_assets: report.missing_assets ?? [],
    orphaned_assets: report.orphaned_assets ?? []
  };
}

export const actions = {
  // Delete every orphaned asset. The backend recomputes the orphan set itself,
  // so nothing referenced can be removed. load() re-runs after, refreshing the table.
  deleteOrphans: async ({ request }) => {
    const res = await adminApi(request.headers.get('cookie'), '/orphaned-assets', {
      method: 'DELETE'
    });
    if (!res.ok) return fail(res.status, { error: 'Could not delete orphaned assets.' });
    const { deleted = 0 } = await res.json();
    return { deleted };
  }
};
