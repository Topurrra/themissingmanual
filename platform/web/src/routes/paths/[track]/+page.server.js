import { redirect } from '@sveltejs/kit';

// The server-side tracks feature (curated /paths/<track> detail pages) was
// removed in favor of generating roadmaps client-side from categories+guides.
// Google indexed the old track URLs (backend-developer, devops-engineer,
// computer-foundations, observability-on-call, data-engineer, ship-it) while
// they were live; they now 404 with no replacement page, so permanently
// redirect any /paths/<track> hit to the /paths overview instead of leaving
// a dead link in search results.
export function load() {
  throw redirect(301, '/paths');
}
