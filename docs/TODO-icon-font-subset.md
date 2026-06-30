# TODO: subset / self-host the Tabler icon font (perf)

**Status:** deferred (recorded 2026-07-01). Not urgent — render-blocking is already fixed.

## Problem
The site pulls the full Tabler icon webfont from jsDelivr:

```html
<!-- platform/web/src/app.html -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css" ... />
```

That ships **all ~5,900 icons (~447 KiB woff2 + ~37 KiB CSS)** but we use only ~40.
Lighthouse (mobile) flags it three ways:
- Render-blocking request (mitigated — we now load it `media="print" → all`, so it no longer blocks paint).
- Unused CSS (~35 KiB).
- Cache lifetime / transfer weight (the 447 KiB font on first load).

## Fix (when we get to it)
Self-host a **subsetted** font with only the glyphs we use:
1. Enumerate used icons: `grep -rho 'ti-[a-z0-9-]\+' platform/web/src | sort -u`.
2. Generate a subset woff2 (e.g. `pyftsubset` from fonttools, or `@tabler/icons` build) containing only those glyphs + a matching `@font-face` / `.ti-*` CSS.
3. Drop both into `platform/web/static/`, point `app.html` at the local files, add `font-display: swap` and a long `Cache-Control`.

Expected result: ~447 KiB → ~10–20 KiB, the jsDelivr round-trip disappears, and all three Lighthouse findings clear.

## Alternative
Replace icon-font usage with inline SVGs (Tabler ships SVGs) — bigger refactor, only worth it if we also want per-icon styling/animation.
