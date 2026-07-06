import { error } from '@sveltejs/kit';
import { getGuide, getPhase } from '$lib/api.js';
import { buildEpub } from '$lib/server/epub.js';

// On-demand EPUB build: getGuide() only returns phase summaries (title,
// difficulty), not full content, so each real phase needs its own getPhase()
// call for the actual html. Guides are a handful of phases - fine for a rare,
// explicit download action, not a hot path.
export async function GET({ fetch, params }) {
  const detail = await getGuide(fetch, params.slug);
  if (!detail) throw error(404, 'Guide not found');
  const { guide, phases } = detail;

  const realPhases = phases.filter((p) => p.phase_no > 0).sort((a, b) => a.phase_no - b.phase_no);
  const fetched = await Promise.all(realPhases.map((p) => getPhase(fetch, params.slug, p.phase_no)));
  const chapters = fetched
    .filter(Boolean)
    .map((p) => ({ id: `phase-${p.phase_no}`, title: p.title, html: p.html }));
  if (!chapters.length) throw error(404, 'Guide has no readable phases');

  const epub = buildEpub({ title: guide.title, author: 'The Missing Manual', slug: params.slug, chapters });
  return new Response(epub, {
    headers: {
      'content-type': 'application/epub+zip',
      'content-disposition': `attachment; filename="${params.slug}.epub"`,
      'cache-control': 'public, max-age=3600'
    }
  });
}
