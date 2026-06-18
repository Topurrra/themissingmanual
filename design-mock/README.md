# Design mock — The Missing Manual (premium refine)

A **review-only** mock. Nothing here touches `platform/web`. Open the HTML files
directly in a browser (double-click) — no build step.

```
design-mock/
  index.html      Landing            (real categories, tracks, guide)
  category.html   Version Control    listing + collapsible sidebar
  guide.html      Guide overview     (the 3 real phases)
  reader.html     Phase 1 reader     real prose + progress bar + resume-reading
  search.html     Search results     real query over the git guide
  about.html      About page         (linked from the footer)
  contribute.html Contribute page    (linked from the footer)
  rss.html        Subscribe / RSS    (linked from the footer)
  mock.css        The refined design system (shared)
  mock.js         Theme · font · sidebar · ⌘K · footer · resume-reading (shared)
```

These mirror the live routes 1-to-1 so you can compare side by side:
`/` · `/categories/version-control` · `/guides/git-explained-like-a-human` ·
`/guides/git-explained-like-a-human/1` · `/search`.

Try:
- **`⌘K` / `Ctrl-K`** (or click the chip in the search box, or press `/`) — opens a
  **command palette**: type and it filters guides, phases, topics and paths live;
  Enter / click jumps straight there. The header search box itself still works the
  old way — type and submit to land on the search page.
- **Settings gear** → pick a **theme** *and* a **font** on the fly (IBM Plex, Inter,
  Geist, Sora, DM Sans, Plus Jakarta Sans). Both persist on this device.
- **Collapse the sidebar** (rail button). On a topic/guide page the sidebar is
  **scoped to that topic only** — no 7-category wall of distraction.
- Resize narrow for the mobile drawer.

## Real data

Pulled straight from the backend so it's a true comparison, not lorem ipsum:
- **7 topics** from `platform/core/src/categories.rs` (Programming Languages,
  Version Control, DevOps & Infra, Databases, Architecture, Performance, Security).
  Only Version Control is live (1 guide); the rest show *Coming soon*.
- **2 learning paths** from `platform/core/src/tracks.rs` (Backend Developer — 6
  steps; DevOps Engineer — 4 steps).
- **The one real guide** — *Git, Explained Like You're a Human* — with its 3 real
  phase titles/summaries, and Phase 1's actual prose in `reader.html`.

## Direction

Per your call: **refine, don't reinvent.** Keeps the `DESIGN.md` soul —
minimal-technical, teal accent, reading-first, no gradients/blobs/3D — and executes
it at a premium level. **Fonts: IBM Plex Sans + JetBrains Mono**, matching the live
app, so the comparison isolates layout/UX changes (not a font swap).

## The bugs, and the fix for each

### 1. Sidebar wouldn't collapse (desktop)
The live collapse logic lives **only** inside `@media (max-width: 900px)` in
[`app.css`](../platform/web/src/app.css). On desktop, toggling `collapsed` changed
a class nothing listened to — so the sidebar stayed put *and* the floating expand
button appeared at the same time.

**Fix (`mock.css`):** animate the sidebar's `width` (a plain length — reliably
interpolable; `grid-template-columns` is not, across engines), with an `auto` grid
track that follows it:
```css
.shell { display: grid; grid-template-columns: auto 1fr; }
.sidebar { width: var(--rail); transition: width .3s, opacity .24s, padding .3s; }
.shell.collapsed .sidebar { width: 0; opacity: 0; padding-inline: 0; border-color: transparent; pointer-events: none; }
```
To port: add a desktop `.shell.collapsed` rule (the app has none outside the media
query). The Svelte `toggleSidebar()` already sets the class.

### 2. Search border looked broken on click
Two focus treatments stacked: a soft ring on `.search-field:focus-within` **plus** a
hard 2px offset outline on `.search-field input:focus-visible`
([`app.css:200`](../platform/web/src/app.css)). Doubled, misaligned border.

**Fix:** one treatment on the wrapper, none on the inner input:
```css
.search-field:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
.search-field input:focus-visible { outline: none; }
```

### 3. Landing pinned to the left
[`.page-main.home`](../platform/web/src/app.css) sets `max-width: 1080px` but never
centers it.

**Fix:** `.page-main.home { max-width: 1080px; margin: 0 auto; }`

### 4. Fonts vs. DESIGN.md (worth a decision)
Heads-up, not fixed here per your choice: [`DESIGN.md`](../DESIGN.md) specifies
**Bricolage Grotesque + Geist**, but [`app.html`](../platform/web/src/app.html)
loads **IBM Plex Sans**. You chose to keep IBM Plex, so this mock matches the app —
but `DESIGN.md` is now out of sync with what ships. Worth reconciling the doc (or
the app) at some point so they agree.

### 5. Collapse felt janky
The reading column changed width *and* re-centred instantly while the sidebar slid.
Now the column is a **stable 880px**, centred with `justify-self`, so collapsing is
one smooth synchronised slide.

## Premium polish added (all within DESIGN.md)
- **Command palette** (`⌘K` / `Ctrl-K`) with live fuzzy matching over guides, phases,
  topics and paths — the fast way to get anywhere.
- **On-the-fly font picker** in Settings (6 options), alongside the theme control.
- **Scoped sidebars** — a topic/guide page shows only its own contents; the shared
  chrome is just *All topics* + collapse.
- **Topic icons** on the Newly-added list (reusing each category's icon).
- **Resume reading** on guide pages — a one-tap "Save my place" button (bottom-right)
  drops a marker anchored to the *paragraph* you're on (so it survives font/zoom
  changes); on return a gentle "Continue reading — <section>" prompt scrolls you
  back. Tap the button again at the marked line to clear it.
- **About / Contribute / RSS** pages, reachable from the footer and the palette.
- Tighter type scale and hierarchy; mono micro-labels.
- Eyebrow labels with a hairline tick; section headers with a trailing rule.
- Cards lift + border-to-accent on hover (no gradients); one clean focus ring.
- Reading-progress hairline + numbered phases + prev/next nav on the reader.
- A colophon footer with **GitHub + LinkedIn** icons — set your URLs once in the
  `SOCIAL` object at the top of `mock.js` and all pages update (the live app has no footer).
- Considered `::selection`, scrollbar, smooth theme transition.

## What I deliberately did NOT do
No 3D/Spline, no hero video, no gradients, no maximalist motion. For a text-first
developer library, calm and readable *is* the premium move.

## If you like it
Say the word and I'll port the fixes + polish into the real Svelte components and
`app.css` (scoped carefully — `app.css` is global, so generic class names collide;
see the teal-header incident). Nothing is applied until you ask.
