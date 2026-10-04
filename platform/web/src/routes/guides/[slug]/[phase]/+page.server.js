import { error, redirect } from '@sveltejs/kit';
import { getPhase, listLocales, search } from '$lib/api.js';
import { localePath } from '$lib/i18n/locales.js';
import { practiceLessonFor } from '$lib/practice/related-guides/index.js';

// Related guides via the existing Tantivy search: query on this phase's title +
// tags, drop hits from the same guide, dedupe to one entry per guide. Wayfinding
// for readers (the next thing to learn) and internal links for SEO, from
// infrastructure that already exists - no new index, no precomputed graph.
// On a translated phase the locale's index (only phases published in it) is
// searched first and those hits link to their translated counterpart; the
// English index (tags are English) tops the list up, linking to the translated
// guide when it is published in the locale, else to the English one.
async function relatedGuides(fetch, phase, lang) {
  try {
    const q = [phase.title, ...(phase.tags || [])].join(' ').slice(0, 100);
    const hits = (await search(fetch, q, lang)) || [];
    let published = new Set();
    if (lang !== 'en') {
      const en = (await search(fetch, (phase.tags || []).join(' ').slice(0, 100) || phase.title)) || [];
      const loc = ((await listLocales(fetch)) || []).find((l) => l.code === lang);
      published = new Set(loc?.guides ?? []);
      hits.push(...en);
    }
    const seen = new Set([phase.guide_slug]);
    const out = [];
    for (const h of hits) {
      // practice-* guide routes redirect to /practice; the PracticeIde link on the
      // page already covers that surface - keep related to real reading guides.
      if (h.guide_slug.startsWith('practice-')) continue;
      if (seen.has(h.guide_slug)) continue;
      seen.add(h.guide_slug);
      const translated = lang === 'en' || published.has(h.guide_slug);
      // English hits carry English titles; link the English page unless translated.
      out.push({ href: localePath(translated ? lang : 'en', `/guides/${h.guide_slug}/${h.phase_no}`), title: h.title, summary: h.summary });
      if (out.length === 4) break;
    }
    return out;
  } catch {
    return []; // related links are a bonus, never a reason to fail the page
  }
}

export async function load({ fetch, params, locals, url }) {
  const lang = locals.lang ?? 'en';
  url.pathname; // track the URL so a locale-prefix-only navigation reruns this load
  // ponytail: practice guide slugs are always `practice-<module>` (fixed by the
  // /practice contract), so redirect on the slug alone instead of an extra
  // getGuide() call on this hot path; if that convention ever loosens, gate on
  // guide.category instead.
  if (params.slug.startsWith('practice-')) {
    throw redirect(302, `/practice/${params.slug.slice('practice-'.length)}/${params.phase}`);
  }
  const phase = await getPhase(fetch, params.slug, params.phase, lang);
  // Not published in this locale (yet): the English phase is the fallback.
  if (!phase && lang !== 'en') throw redirect(307, `/guides/${params.slug}/${params.phase}`);
  if (!phase) throw error(404, 'Phase not found');
  const practice = practiceLessonFor(params.slug, Number(params.phase));
  const related = await relatedGuides(fetch, phase, lang);
  return { phase, practice, related };
}
