import { error, redirect } from '@sveltejs/kit';
import { getPhase, search } from '$lib/api.js';
import { practiceLessonFor } from '$lib/practice/related-guides/index.js';

// Related guides via the existing Tantivy search: query on this phase's title +
// tags, drop hits from the same guide, dedupe to one entry per guide. Wayfinding
// for readers (the next thing to learn) and internal links for SEO, from
// infrastructure that already exists - no new index, no precomputed graph.
async function relatedGuides(fetch, phase) {
  try {
    const q = [phase.title, ...(phase.tags || [])].join(' ').slice(0, 100);
    const hits = (await search(fetch, q)) || [];
    const seen = new Set([phase.guide_slug]);
    const out = [];
    for (const h of hits) {
      // practice-* guide routes redirect to /practice; the PracticeIde link on the
      // page already covers that surface - keep related to real reading guides.
      if (h.guide_slug.startsWith('practice-')) continue;
      if (seen.has(h.guide_slug)) continue;
      seen.add(h.guide_slug);
      out.push({ slug: h.guide_slug, phaseNo: h.phase_no, title: h.title, summary: h.summary });
      if (out.length === 4) break;
    }
    return out;
  } catch {
    return []; // related links are a bonus, never a reason to fail the page
  }
}

export async function load({ fetch, params }) {
  // ponytail: practice guide slugs are always `practice-<module>` (fixed by the
  // /practice contract), so redirect on the slug alone instead of an extra
  // getGuide() call on this hot path; if that convention ever loosens, gate on
  // guide.category instead.
  if (params.slug.startsWith('practice-')) {
    throw redirect(302, `/practice/${params.slug.slice('practice-'.length)}/${params.phase}`);
  }
  const phase = await getPhase(fetch, params.slug, params.phase);
  if (!phase) throw error(404, 'Phase not found');
  const practice = practiceLessonFor(params.slug, Number(params.phase));
  const related = await relatedGuides(fetch, phase);
  return { phase, practice, related };
}
