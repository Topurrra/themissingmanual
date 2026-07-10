import { error } from '@sveltejs/kit';
import { getGuide, getPhase } from '$lib/api.js';
import { parseLessonBlock, stripLessonHtml } from '$lib/practice/lessons.js';
import { relatedGuideFor } from '$lib/practice/related-guides/index.js';

export async function load({ fetch, params }) {
  const slug = `practice-${params.module}`;
  const [detail, phase] = await Promise.all([getGuide(fetch, slug), getPhase(fetch, slug, params.phase)]);

  if (!detail || detail.guide.category !== 'practice') throw error(404, 'Module not found');
  if (!phase) throw error(404, 'Lesson not found');

  const lesson = parseLessonBlock(phase.markdown);
  if (!lesson) throw error(404, 'Lesson not found');

  // "Related reading" is a plain client-side lookup (see related-guides/index.js) -
  // fetch the target phase's real title here rather than hardcoding it in the map.
  let related = null;
  const rel = relatedGuideFor(params.module, Number(params.phase));
  if (rel) {
    const [relSlug, relPhaseNo] = rel.split('#');
    const relPhase = await getPhase(fetch, relSlug, relPhaseNo);
    if (relPhase) related = { slug: relSlug, phaseNo: Number(relPhaseNo), title: relPhase.title };
  }

  return {
    lesson,
    lessonHtml: stripLessonHtml(phase.html),
    phase,
    guide: detail.guide,
    phases: detail.phases.filter((p) => p.phase_no > 0),
    related
  };
}
