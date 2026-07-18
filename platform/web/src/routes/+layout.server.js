import { listCategories, listGuides, getGuide } from '$lib/api.js';
import { API_BASE } from '$lib/server/adminApi.js';
import { isAskEnabled } from '$lib/server/aisearch.js';
import { isTutorEnabled } from '$lib/server/tutor.js';

// Public site config (PUBLIC endpoint). All fields are strings; "" when unset.
// On any failure we return an all-empty object so the layout's fallbacks render
// today's site unchanged.
const EMPTY_SITE_CONFIG = {
  site_name: '',
  tagline: '',
  sponsors: '',
  social: '',
  announcement: '',
  flag_lofi: '',
  flag_runnable: '',
  lofi_tracks: ''
};

async function getSiteConfig(fetch) {
  try {
    const res = await fetch(`${API_BASE}/api/site-config`);
    if (!res.ok) return { ...EMPTY_SITE_CONFIG };
    return await res.json();
  } catch {
    return { ...EMPTY_SITE_CONFIG };
  }
}

// Giscus discussion pilot (GitHub Discussions-backed comments). Activates only
// when the env config exists; GISCUS_GUIDES is a comma list of pilot guide slugs
// ("*" = every guide). Values come from giscus.app after installing the giscus
// app on the repo and enabling Discussions.
function giscusConfig() {
  const { GISCUS_REPO, GISCUS_REPO_ID, GISCUS_CATEGORY, GISCUS_CATEGORY_ID, GISCUS_GUIDES } = process.env;
  if (!GISCUS_REPO || !GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) return null;
  return {
    repo: GISCUS_REPO,
    repoId: GISCUS_REPO_ID,
    category: GISCUS_CATEGORY || 'General',
    categoryId: GISCUS_CATEGORY_ID,
    guides: (GISCUS_GUIDES || '').split(',').map((s) => s.trim()).filter(Boolean)
  };
}

export async function load({ fetch, url }) {
  const siteConfig = await getSiteConfig(fetch);
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

  return { nav, guidePhases, guideTitle, siteConfig, askEnabled: isAskEnabled(), tutorEnabled: isTutorEnabled(), giscus: giscusConfig() };
}
