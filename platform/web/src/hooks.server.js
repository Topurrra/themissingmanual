import { getGuide, getPhase } from '$lib/api.js';
import { apiCatalog, skillsIndex, OPENAPI, SKILL_MD } from '$lib/agent-endpoints.js';
import { checkAndSend } from '$lib/server/push.js';

// The comeback-loop send job: periodically check for subscriptions whose
// "check back" time has arrived and send a review reminder. Guarded against
// double-starting (SvelteKit's dev server re-imports this module on file
// changes, which would otherwise stack up multiple intervals).
if (!globalThis.__tmmPushInterval) {
  globalThis.__tmmPushInterval = setInterval(() => { checkAndSend().catch(() => {}); }, 15 * 60 * 1000);
}

// /guides/<slug> or /guides/<slug>/<phase>
const GUIDE_RE = /^\/guides\/([^/]+?)(?:\/(\d+))?\/?$/;

function prefersMarkdown(accept) {
  if (!accept) return false;
  return /text\/markdown/i.test(accept) && !/text\/html/i.test(accept);
}

function json(obj, type = 'application/json') {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'max-age=3600' }
  });
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
  const p = url.pathname;

  // ── Agent-discovery endpoints (served here because SvelteKit's router skips
  // dot-directories like /.well-known).
  if (request.method === 'GET') {
    if (p === '/.well-known/api-catalog') return json(apiCatalog(url.origin), 'application/linkset+json');
    if (p === '/openapi.json') return json(OPENAPI, 'application/openapi+json');
    if (p === '/api/health')
      return json({ status: 'ok', service: 'the-missing-manual', time: new Date().toISOString() });
    if (p === '/.well-known/agent-skills/index.json') return json(skillsIndex(url.origin));
    if (p === '/.well-known/agent-skills/use-the-missing-manual/SKILL.md')
      return new Response(SKILL_MD, {
        headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'max-age=3600' }
      });
    if (p === '/.well-known/security.txt') {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      const body =
        `Contact: mailto:topurianika96@gmail.com\n` +
        `Expires: ${expires.toISOString()}\n` +
        `Preferred-Languages: en\n` +
        `Canonical: ${url.origin}/.well-known/security.txt\n`;
      return new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=3600' }
      });
    }
  }

  const m = p.match(GUIDE_RE);

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
      `<${o}/llms.txt>; rel="describedby"; type="text/plain"`,
      `<${o}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`
    ];
    if (m) links.push(`<${o}${url.pathname}>; rel="alternate"; type="text/markdown"`);
    response.headers.append('link', links.join(', '));
    response.headers.append('vary', 'Accept');
  }

  // ── Security headers on every response (CSP itself is handled by SvelteKit's
  // kit.csp config in svelte.config.js, which merges its nonce into whatever
  // Content-Security-Policy header ends up here).
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}
