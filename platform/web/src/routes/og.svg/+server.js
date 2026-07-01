// Default social-share image (1200x630) for pages without a page-specific one.
// Matches the per-guide /guides/<slug>/og.svg brand card. Seo.svelte falls back
// to this when no `image` is passed, so every page gets a share preview.
export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fcfcfd"/>
  <rect width="1200" height="12" fill="#0e7c86"/>
  <text x="80" y="120" fill="#0e7c86" font-size="26" font-weight="600" letter-spacing="4" font-family="JetBrains Mono, monospace">THE MISSING MANUAL</text>
  <text x="80" y="292" fill="#131316" font-size="72" font-weight="700" font-family="IBM Plex Sans, Segoe UI, system-ui, sans-serif">Understand how</text>
  <text x="80" y="376" fill="#131316" font-size="72" font-weight="700" font-family="IBM Plex Sans, Segoe UI, system-ui, sans-serif">software really works.</text>
  <text x="80" y="560" fill="#5c5c66" font-size="28" font-family="IBM Plex Sans, Segoe UI, system-ui, sans-serif">Free, in-depth guides, from how a computer boots to AI.</text>
</svg>`;
  return new Response(svg, {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400' }
  });
}
