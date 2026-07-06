import { getPhase } from '$lib/api.js';
import { svgToPng } from '$lib/server/og-render.js';
import { LOGO_DATA_URI } from '$lib/server/til-logo.js';

// "Today I learned" shareable card: title + the phase's summary (already-required
// frontmatter - no new authoring convention). Same brand template as the guide
// og.png card, rasterized the same way.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function wrap(text, chars, maxLines) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > chars && line) { lines.push(line); line = w; }
    else line = (line ? line + ' ' : '') + w;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

export async function GET({ fetch, params }) {
  const phase = await getPhase(fetch, params.slug, Number(params.phase));
  const title = phase?.title || 'The Missing Manual';
  const summary = phase?.summary || '';
  const FONT = 'IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif';

  // Dark card: pops in light-mode social feeds, where most sharing happens.
  // Layout flows top-down; a 3-line title steals a summary line so the footer
  // never collides.
  const titleLines = wrap(title, 32, 3);
  const titleTspans = titleLines
    .map((l, i) => `<text x="96" y="${292 + i * 62}" fill="#f2f2f4" font-size="52" font-weight="700" font-family="${FONT}">${esc(l)}</text>`)
    .join('');

  const sumStartY = 292 + (titleLines.length - 1) * 62 + 58;
  const sumLines = wrap(summary, 60, titleLines.length >= 3 ? 2 : 3);
  const sumTspans = sumLines
    .map((l, i) => `<text x="96" y="${sumStartY + i * 38}" fill="#9aa2ab" font-size="25" font-family="${FONT}">${esc(l)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glowTR" cx="1" cy="0" r="1">
      <stop offset="0" stop-color="#17a2ae" stop-opacity="0.28"/>
      <stop offset="0.65" stop-color="#17a2ae" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowBL" cx="0" cy="1" r="0.9">
      <stop offset="0" stop-color="#17a2ae" stop-opacity="0.10"/>
      <stop offset="0.7" stop-color="#17a2ae" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0f1113"/>
  <rect width="1200" height="630" fill="url(#glowTR)"/>
  <rect width="1200" height="630" fill="url(#glowBL)"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#16181c" stroke="#2a2e33" stroke-width="1.5"/>
  <image href="${LOGO_DATA_URI}" x="96" y="102" width="48" height="48"/>
  <text x="164" y="133" fill="#8b929a" font-size="22" font-weight="600" letter-spacing="2" font-family="${FONT}">THE MISSING MANUAL</text>
  <text x="96" y="230" fill="#1db6c3" font-size="23" font-weight="700" letter-spacing="5" font-family="${FONT}">TODAY I LEARNED</text>
  ${titleTspans}
  ${sumTspans}
  <text x="96" y="546" fill="#1db6c3" font-size="24" font-weight="600" font-family="${FONT}">themissingmanual.dev</text>
  <text x="1104" y="546" fill="#6b7280" font-size="22" text-anchor="end" font-family="${FONT}">Free &#183; no account needed</text>
</svg>`;
  try {
    return new Response(svgToPng(svg), {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' }
    });
  } catch (e) {
    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=300' }
    });
  }
}
