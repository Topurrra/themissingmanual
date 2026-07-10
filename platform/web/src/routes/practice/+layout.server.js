import { getCategory, getGuide } from '$lib/api.js';

// Single source of module data for every /practice page (hub, module overview,
// lesson IDE) - SvelteKit merges this into each child route's `data` automatically.
// getCategory() already returns published-only guides ordered by `order`
// frontmatter, so no client-side sort is needed. GuideSummary has no phase list,
// so fetch each module's detail too - v1 has at most 3 modules, well within an
// "≤3 extra calls" budget.
export async function load({ fetch }) {
  const detail = await getCategory(fetch, 'practice');
  const guides = detail?.guides ?? [];

  const modules = await Promise.all(
    guides.map(async (g) => {
      const gd = await getGuide(fetch, g.slug);
      const lessons = (gd?.phases ?? [])
        .filter((p) => p.phase_no > 0)
        .map((p) => ({ phase_no: p.phase_no, title: p.title }));
      return {
        slug: g.slug,
        module: g.slug.replace(/^practice-/, ''),
        title: g.title,
        summary: g.summary,
        difficulty: g.difficulty,
        lessons
      };
    })
  );

  return { modules };
}
