import { getPhase } from '$lib/api.js';
import { svgToPng } from '$lib/server/og-render.js';

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

  const titleLines = wrap(title, 26, 2);
  const titleTspans = titleLines
    .map((l, i) => `<text x="80" y="${218 + i * 58}" fill="#131316" font-size="48" font-weight="700" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">${esc(l)}</text>`)
    .join('');

  const sumStartY = 218 + titleLines.length * 58 + 44;
  const sumLines = wrap(summary, 48, 4);
  const sumTspans = sumLines
    .map((l, i) => `<text x="80" y="${sumStartY + i * 38}" fill="#5c5c66" font-size="26" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">${esc(l)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fcfcfd"/>
  <rect width="1200" height="12" fill="#0e7c86"/>
  <text x="80" y="120" fill="#0e7c86" font-size="26" font-weight="600" letter-spacing="4" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">THE MISSING MANUAL &#183; TIL</text>
  ${titleTspans}
  ${sumTspans}
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
