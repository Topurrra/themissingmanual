import { getGuide, getPhase } from '$lib/api.js';

// /guides/<slug> or /guides/<slug>/<phase>
const GUIDE_RE = /^\/guides\/([^/]+?)(?:\/(\d+))?\/?$/;

// Serve markdown only when the client explicitly prefers it and is NOT a browser
// (browsers always send text/html in Accept). This keeps HTML the default.
function prefersMarkdown(accept) {
  if (!accept) return false;
  return /text\/markdown/i.test(accept) && !/text\/html/i.test(accept);
}

async function guideToMarkdown(fetch, slug) {
  const detail = await getGuide(fetch, slug);
  if (!detail || !detail.guide) return null;
  const { guide, phases } = detail;
  let out = `# ${guide.title}\n\n> ${guide.summary}\n`;
  for (const p of phases || []) {
    const ph = await getPhase(fetch, slug, p.phase_no);
    if (ph && ph.markdown) out += `\n\n---\n\n${ph.markdown.trim()}\n`;
  }
  return out;
}

export async function handle({ event, resolve }) {
  const { url, request } = event;
  const accept = request.headers.get('accept') || '';
  const m = url.pathname.match(GUIDE_RE);

  // ── Markdown for Agents: content-negotiated markdown for guide pages.
  if (m && request.method === 'GET' && prefersMarkdown(accept)) {
    try {
      let md = null;
      if (m[2]) {
        const ph = await getPhase(event.fetch, m[1], Number(m[2]));
        md = ph && ph.markdown ? ph.markdown : null;
      } else {
        md = await guideToMarkdown(event.fetch, m[1]);
      }
      if (md != null) {
        return new Response(md, {
          headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'x-markdown-tokens': String(Math.ceil(md.length / 4)),
            vary: 'Accept',
            'cache-control': 'max-age=3600'
          }
        });
      }
    } catch (e) {
      // fall through to the normal HTML response
    }
  }

  const response = await resolve(event);

  // ── RFC 8288 Link headers for agent discovery (HTML responses only).
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    const o = url.origin;
    const links = [
      `<${o}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
      `<${o}/llms.txt>; rel="describedby"; type="text/plain"`
    ];
    if (m) links.push(`<${o}${url.pathname}>; rel="alternate"; type="text/markdown"`);
    response.headers.append('link', links.join(', '));
    response.headers.append('vary', 'Accept');
  }
  return response;
}
