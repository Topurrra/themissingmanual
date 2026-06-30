import { adminJson } from '$lib/server/adminApi.js';

// Loads the "content backlog" - dead/low-hit searches over a rolling window -
// from the admin API, forwarding the browser's cookie for auth. The window in
// days comes from the URL (?days=N), defaulting to 30. The +layout.server.js
// guard handles redirecting unauthenticated requests to /admin/login first.
export async function load({ request, url }) {
  const days = url.searchParams.get('days') ?? '30';
  const report =
    (await adminJson(request.headers.get('cookie'), `/backlog?days=${days}`, { days, items: [] })) ?? {};
  return {
    days: report.days ?? days,
    items: report.items ?? []
  };
}
