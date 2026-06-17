# Design Spec — UI Redesign: Sidebar App Shell, IBM Plex, Search & Settings

**Date:** 2026-06-17
**Status:** Design approved by user.
**Golden rule (applies throughout):** free + donation-supported is NOT a license for cheap UX. Every
screen must be elegant, readable, and a pleasure to learn from.
**Scope:** the SvelteKit web UI redesign. The **admin console + analytics is a separate sub-project**
(its own spec, next). Out of scope here.

---

## 1. App shell — collapsible left sidebar

- The root layout renders the **header** on every page, and a **left sidebar** on content pages
  (guide reader, category, search). The **home (`/`) stays a full-width landing** with no sidebar.
- Detect home via `$page.url.pathname === '/'`; render the sidebar+main flex shell on all other paths,
  the full-width landing on `/`.
- **Nav data:** a new `routes/+layout.server.js` loads `/api/categories` and `/api/guides` and builds the
  sidebar nav (categories, each with its guides).
- **De-centering (point 1):** content is **left-aligned** everywhere — no `margin: 0 auto` centered
  column. Content keeps a comfortable reading `max-width` but is aligned to the left of the main area
  (on content pages it sits right of the sidebar; on the home it's left-aligned within padding).

## 2. Sidebar contents (points 2 & 4)

- Top: **All topics** (links to `/`, with an icon) and a **collapse/expand toggle** (a sidebar-collapse
  icon). Collapsed state hides the sidebar and widens content; persisted to `localStorage` (`sidebar`).
- Body: the categories. **Populated** categories list their guides (items) as links; the current
  guide/category is highlighted. **Coming-soon** categories show muted with no items.
- On `< 900px`, the sidebar starts collapsed (off-canvas) and the toggle opens it.

## 3. Fonts (point 3)

- **IBM Plex Sans** for UI + headings (replaces Bricolage Grotesque and Geist); **JetBrains Mono** for
  code (unchanged). Update the Google Fonts `<link>` in `app.html` and the `--font-display`/`--font-body`
  vars in `app.css` to IBM Plex Sans; `--font-mono` stays JetBrains Mono.

## 4. Header (point 7)

- Three zones: **brand left** (left-of-center, padded — not flush), **search centered** (flex center),
  **settings (gear) + theme toggle right** (right-of-center, padded — not flush).
- The quick sun/moon toggle stays for one-click flips; the gear opens the settings panel (§6).

## 5. Search fixes (point 5)

- **Empty search does nothing:** every search form (header, hero, `/search` page) gets an `on:submit`
  guard that calls `preventDefault()` when the trimmed input is empty — no navigation to `/search?q=`.
- **Highlight matches:** on `/search`, wrap occurrences of the query's terms in the result title and
  summary with `<mark>`. A `highlight(text, query)` helper escapes the text, then wraps case-insensitive
  term matches in `<mark>`; rendered via `{@html}`. Style `<mark>` with a teal-tinted background.

## 6. Settings panel (point 7)

- The gear button toggles a small **settings popover**. v1 contents:
  - **Theme**: Light / Dark / System (segmented buttons). "System" clears the `localStorage.theme`
    override and follows the OS; Light/Dark set it explicitly (reusing the existing `data-theme` system).
  - A muted "More customization coming soon" line.
- All preferences persist in `localStorage`. The popover closes on outside-click / Escape.

## 7. Component / file map

```
platform/web/src/app.html                 fonts: IBM Plex Sans + JetBrains Mono
platform/web/src/app.css                   font vars; shell/sidebar/header/settings/mark styles; de-center
platform/web/src/routes/+layout.server.js  (new) load nav (categories + guides)
platform/web/src/routes/+layout.svelte     header (3 zones) + conditional sidebar shell + settings popover + theme logic
platform/web/src/lib/search.js             (new) highlight(text, query) + isEmptyQuery guard helper
platform/web/src/routes/+page.svelte       home: left-aligned (no centered column)
platform/web/src/routes/search/+page.svelte highlight matches; empty-guard on its form
platform/web/src/routes/guides/[slug]/[phase]/+page.svelte  drop the inline back-link eyebrow if redundant with sidebar (keep a minimal one)
```

## 8. Out of scope
Admin console + analytics (separate sub-project). No new backend endpoints needed (the sidebar reuses
`/api/categories` + `/api/guides`).

## 9. Testing
- `npm run build` passes.
- Live browse: header shows brand-left / search-center / gear+toggle-right; the left sidebar is present
  on a guide/category page with "All topics" + categories, and the collapse toggle hides it; computed
  body font is "IBM Plex Sans"; submitting an empty search stays on the page (no `/search?q=` nav); a
  real search shows `<mark>` highlights; the gear opens the settings popover and Theme buttons switch
  `data-theme`.
