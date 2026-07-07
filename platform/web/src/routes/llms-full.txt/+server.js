import { listGuides, getGuide, getPhase } from '$lib/api.js';

// llms-full.txt (llmstxt.org): the expanded companion to llms.txt - full guide
// text inline instead of just links, for agents that want everything in one fetch.
export async function GET({ fetch, url }) {
  const origin = url.origin;
  const guides = (await listGuides(fetch)) ?? [];

  let out =
    '# The Missing Manual - Full Content\n\n' +
    '> Complete text of every guide, concatenated for extended AI context. See ' +
    `${origin}/llms.txt for a linked index instead.\n\n`;

  for (const g of guides) {
    const detail = await getGuide(fetch, g.slug);
    if (!detail || !detail.guide) continue;
    const { guide, phases } = detail;
    out += `\n\n---\n\n# ${guide.title}\n\n> ${guide.summary}\n`;
    for (const p of phases || []) {
      const ph = await getPhase(fetch, g.slug, p.phase_no);
      if (ph && ph.markdown) out += `\n\n${ph.markdown.trim()}\n`;
    }
  }

  return new Response(out, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=3600' }
  });
}
