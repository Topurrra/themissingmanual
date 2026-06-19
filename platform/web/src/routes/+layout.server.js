import { listCategories, listGuides, getGuide, listTracks, getTrack } from '$lib/api.js';

export async function load({ fetch, url }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  const nav = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    guides: guides.filter((g) => g.category === c.slug)
  }));

  // On a guide/phase page, fetch that guide's phases so the sidebar can show them.
  let guidePhases = null;
  let guideTitle = null;
  const guideSlug = (url.pathname.match(/^\/guides\/([^/]+)/) || [])[1] || null;
  if (guideSlug) {
    const detail = await getGuide(fetch, guideSlug);
    if (detail) {
      guidePhases = detail.phases ?? [];
      guideTitle = detail.guide?.title ?? null;
    }
  }

  // On a learning-paths page, fetch the tracks list (sidebar) and — on a specific
  // track — that track's resolved roadmap (matching the choice-form query so the
  // sidebar steps mirror the main column).
  let tracks = null;
  let activeTrackSlug = null;
  let trackRoadmap = null;
  if (url.pathname === '/paths' || url.pathname.startsWith('/paths/')) {
    tracks = (await listTracks(fetch)) ?? [];
    activeTrackSlug = (url.pathname.match(/^\/paths\/([^/]+)/) || [])[1] || null;
    if (activeTrackSlug) {
      const detail = await getTrack(fetch, activeTrackSlug, url.search);
      trackRoadmap = detail?.roadmap ?? null;
    }
  }

  return { nav, guidePhases, guideTitle, tracks, activeTrackSlug, trackRoadmap };
}
