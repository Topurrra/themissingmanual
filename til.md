# TIL Cards — how they work, and how to change them

"TIL" (Today I Learned) cards are the shareable image + link a reader gets
from the **"Share what you learned"** button at the bottom of a phase. This
doc walks through the whole pipeline and how to change each piece.

---

## 1. The pieces

Four files, each doing one job:

| File | Job |
|---|---|
| `platform/web/src/routes/guides/[slug]/[phase]/til.png/+server.js` | Builds the actual image, on request |
| `platform/web/src/lib/server/og-render.js` | Shared SVG-to-PNG rasterizer (also used by the regular per-guide OG image) |
| `platform/web/src/lib/ShareTil.svelte` | The button + popover UI shown in the reader |
| `platform/web/src/routes/guides/[slug]/[phase]/+page.svelte` | Mounts `<ShareTil>` — right after the exercise block, inside the phase's `{#key}` block |

Nothing here needs new frontmatter — the card is built from `phase.title` and
`phase.summary`, which every phase already has.

---

## 2. How the image is built

Hitting `/guides/<slug>/<phase>/til.png` runs `til.png/+server.js`:

1. **Fetch the phase.** `getPhase(fetch, params.slug, Number(params.phase))`
   — same API call the page itself uses.
2. **Word-wrap the text.** A small local `wrap(text, chars, maxLines)`
   helper breaks `title` into up to 2 lines (26 chars/line) and `summary`
   into up to 4 lines (48 chars/line), adding a trailing `…` if it had to
   cut off text past the last line.
3. **Build a raw SVG string by hand:**
   ```js
   const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
     <rect width="1200" height="630" fill="#fcfcfd"/>
     <rect width="1200" height="12" fill="#0e7c86"/>
     <text x="80" y="120" fill="#0e7c86" font-size="26" font-weight="600" letter-spacing="4" ...>THE MISSING MANUAL &#183; TIL</text>
     ${titleTspans}
     ${sumTspans}
   </svg>`;
   ```
4. **Rasterize it to PNG** via `svgToPng(svg)` (see below) and return it with
   `content-type: image/png`. If rasterizing throws for any reason, it falls
   back to returning the raw SVG instead of a 500 — the route never hard-fails.

`svgToPng()` (`og-render.js`) uses `@resvg/resvg-js`:

```js
const r = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' }
});
return r.render().asPng();
```

Two things worth knowing before you touch this:

- **`fitTo: { mode: 'width', value: 1200 }`** always scales the *output* to
  1200px wide, proportionally. The SVG's own `width`/`height`/`viewBox`
  (`1200 630` today) define the coordinate space everything is positioned
  in — if you change those, keep them consistent with each other or your
  layout math will be off relative to the final raster.
- **This renders with no browser** — it's a headless SVG rasterizer running
  server-side, using whatever fonts are installed on the machine
  (`loadSystemFonts: true`), falling back to DejaVu Sans if the requested
  font isn't found. That's why the SVG's `font-family` list has fallbacks
  (`IBM Plex Sans, DejaVu Sans, Arial, Helvetica, sans-serif`) — don't
  remove them, or text may not render at all on a server that doesn't have
  IBM Plex Sans installed (e.g. inside the Docker image, vs. your local OS).

---

## 3. How to change the visual design

Everything is in the `svg` template string in `til.png/+server.js` — it's
hand-written SVG, so change it like you'd change any SVG:

- **Colors.** `#fcfcfd` (background), `#0e7c86` (the top bar + eyebrow
  text), `#131316` (title), `#5c5c66` (summary) — these are literal hex
  values, not CSS variables (there's no "theme" for a static generated
  image — pick one look). They currently match the site's light-theme
  palette in `app.css` (`--bg`, `--accent`, `--ink`, `--muted`).
- **The top bar.** `<rect width="1200" height="12" fill="#0e7c86"/>` —
  change `height="12"` to make it thicker/thinner, or move its `y` if you
  want it elsewhere.
- **The eyebrow text.** `"THE MISSING MANUAL &#183; TIL"` — literal string,
  change it directly. `letter-spacing="4"` controls the tracked-out look.
  the `&#183;` is a middle-dot (`·`) — escaped because it's inside an XML
  attribute-free text node built via template string, use `esc()` (already
  imported/defined in the file) if you ever interpolate raw title/summary
  text into an attribute instead of a text node.
- **Font sizes / positions.** `font-size="48"` (title), `font-size="26"`
  (summary), and the `x`/`y` coordinates on each `<text>` — title lines
  start at `y=218` and step down by `58` per line; summary starts at
  `sumStartY = 218 + titleLines.length * 58 + 44` (i.e., right after
  wherever the title actually ended) and steps by `38` per line. If you
  change a line-height number, change it in both the layout math and the
  `y` step so lines don't overlap.

## 4. How to change what text shows

Right now it's just `phase.title` + `phase.summary` — both already-required
frontmatter, which is why no new authoring convention was needed. If you
want to show something else (e.g. the guide's category, or difficulty):

1. Check what fields `getPhase()` actually returns — it comes from
   `platform/web/src/lib/api.js`, backed by the Rust `Phase`/`GuideSummary`
   structs. Any field already serialized there is available on `phase`
   inside the route with no backend change.
2. Add a new `<text>` element (or extend a `wrap()` call) the same way
   `titleTspans`/`sumTspans` are built.

## 5. How to change the share popover (`ShareTil.svelte`)

This is a normal Svelte component — edit and Vite hot-reloads it:

- **Button label/icon.** The `<button class="til-btn">` — text is `"Share
  what you learned"`, icon is `ti-share-2` (Tabler Icons class).
- **Popover contents.** The `<div class="til-pop">` holds the image preview
  (`<img src={imgUrl}>`), a **Copy link** action (`copyLink()`), and a
  **Download image** action (`downloadImg()`). Add a new action by adding
  another `<button class="til-action">` and its handler function, following
  the same pattern.
- **The tagged share link:**
  ```js
  $: tilUrl = `${pageUrl}?utm_source=til-card&utm_medium=social&utm_campaign=learn`;
  ```
  This is the URL "Copy link" puts on the clipboard — the query params
  follow the exact convention in `MARKETING-BRIEF.md`. If you change
  `utm_source`, the new value is what will show up as the source name in
  Admin analytics (see below) — keep it a short, stable, lowercase slug.
- **The image URL** is just `/guides/<slug>/<phase>/til.png` — the route
  from section 2.

## 6. How the analytics tagging works

`platform/web/src/lib/beacon.js` reads `utm_source` off the page URL on
every page view:

```js
const source = (url.searchParams.get('utm_source') || '').slice(0, 64);
```

...and sends it up with the page-view beacon. **Admin → Analytics → Traffic
by source** groups on that value. So: anyone who clicks a link copied from
the Share popover lands on the page with `?utm_source=til-card...`, and
that visit shows up under `til-card` in Traffic by source automatically —
no extra wiring needed if you keep using the same `utm_source` value. If you
add a *new* share action with a different source tag, it'll show up as its
own row.

---

## 7. How to test a change

1. **The image alone** — open `/guides/<slug>/<phase>/til.png` directly in
   a browser tab. Should render immediately as a PNG (or SVG if `svgToPng`
   fell back). Fastest way to iterate on the visual design.
2. **The full flow** — open a real phase, click "Share what you learned",
   confirm the popover shows the right image, "Copy link" puts the tagged
   URL on the clipboard, and "Download image" saves the PNG.
3. **The analytics tag** — visit a URL with `?utm_source=til-card...` once,
   then check Admin → Analytics → Traffic by source for a `til-card` row.

---

## 8. Common pitfalls

- **Cache header.** The route sets `cache-control: public, max-age=86400` —
  a previously-shared image URL can keep showing the *old* design for up to
  24h after you change the template, both in browsers and on social
  platforms that cache link previews. Append a throwaway query string
  (`?v=2`) while testing to bypass this.
- **Long titles/summaries.** `wrap()` truncates with `…` once it hits
  `maxLines` — if a phase's title is unusually long, check the card doesn't
  cut it off somewhere awkward.
- **SVG/PNG size mismatch.** If you change the SVG's `width`/`height`, keep
  `viewBox` and the `fitTo` value in `og-render.js` in mind — they're what
  actually determines the final pixel size and layout scale.
