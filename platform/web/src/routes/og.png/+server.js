import { svgToPng } from '$lib/server/og-render.js';

// Default social-share image (1200x630 PNG) for pages without a page-specific one.
// Rendered from the same brand card as the per-guide /guides/<slug>/og.png.
function brandSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fcfcfd"/>
  <rect width="1200" height="12" fill="#0e7c86"/>
  <text x="80" y="120" fill="#0e7c86" font-size="26" font-weight="600" letter-spacing="4" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">THE MISSING MANUAL</text>
  <text x="80" y="292" fill="#131316" font-size="72" font-weight="700" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">Understand how</text>
  <text x="80" y="376" fill="#131316" font-size="72" font-weight="700" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">software really works.</text>
  <text x="80" y="560" fill="#5c5c66" font-size="28" font-family="IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif">Free, in-depth guides, from how a computer boots to AI.</text>
</svg>`;
}

export function GET() {
  const svg = brandSvg();
  try {
    return new Response(svgToPng(svg), {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' }
    });
  } catch (e) {
    // If rasterizing fails (e.g. no fonts), fall back to the SVG so it never 500s.
    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=300' }
    });
  }
}
