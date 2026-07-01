import { Resvg } from '@resvg/resvg-js';

// Rasterize an OG SVG string to a 1200-wide PNG so social platforms (which don't
// render SVG og:images) show the card. Uses system fonts — the Docker runtime
// installs a sans family; local dev uses the OS fonts — with a sans default so
// text always renders. Returns a Buffer.
export function svgToPng(svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' }
  });
  return r.render().asPng();
}
