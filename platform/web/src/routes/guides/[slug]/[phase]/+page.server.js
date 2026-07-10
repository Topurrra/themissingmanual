import { error, redirect } from '@sveltejs/kit';
import { getPhase } from '$lib/api.js';
import { practiceLessonFor } from '$lib/practice/related-guides/index.js';

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
  return { phase, practice };
}
