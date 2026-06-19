import { adminJson } from '$lib/server/adminApi.js';

// Loads the current site settings from the admin API, forwarding the browser's
// cookie for auth. The +layout.server.js guard handles redirecting unauthenticated
// requests to /admin/login before this runs. Every field defaults to "" so the
// page always renders even if the API call fails.
export async function load({ request }) {
  const s = (await adminJson(request.headers.get('cookie'), '/settings', {})) ?? {};
  return {
    site_name: s.site_name ?? '',
    tagline: s.tagline ?? '',
    announcement: s.announcement ?? '',
    sponsors: s.sponsors ?? '',
    social: s.social ?? '',
    flag_lofi: s.flag_lofi ?? '',
    flag_runnable: s.flag_runnable ?? '',
    flag_mermaid: s.flag_mermaid ?? ''
  };
}
