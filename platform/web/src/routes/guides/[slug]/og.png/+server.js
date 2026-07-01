import { getGuide } from '$lib/api.js';
import { svgToPng } from '$lib/server/og-render.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Greedy word-wrap to ~chars per line, capped at maxLines (last line ellipsised).
function wrap(text, chars = 20, maxLines = 3) {
  const words = text.split(/\s+/);
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
  const detail = await getGuide(fetch, params.slug);
  const title = detail?.guide?.title || 'The Missing Manual';
  const lines = wrap(title, 20, 3);
  const startY = 300 - (lines.length - 1) * 38;
  const tspans = lines
    .map((l, i) => `<text x="80" y="${startY + i * 76}" fill="#131316" font-size="64" font-weight="700" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">${esc(l)}</text>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fcfcfd"/>
  <rect width="1200" height="12" fill="#0e7c86"/>
  <text x="80" y="120" fill="#0e7c86" font-size="26" font-weight="600" letter-spacing="4" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">THE MISSING MANUAL</text>
  ${tspans}
  <text x="80" y="560" fill="#5c5c66" font-size="28" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">Everything you were supposed to already know.</text>
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
