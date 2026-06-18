import { listCategories, listGuides, getGuide } from '$lib/api.js';

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

  return { nav, guidePhases, guideTitle };
}
