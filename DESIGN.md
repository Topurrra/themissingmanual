# Design System — The Missing Manual

This is the working design guide. **Read it before any visual or UI change**, and keep it in
sync when the system evolves. The implemented source of truth is `platform/web/src/app.css`
(global tokens + components) and `platform/web/src/routes/+layout.svelte` (shell, header,
sidebar, palette, footer).

## Product Context
- **What this is:** A free, text-first library of real-world developer knowledge, written like
  advice from a battle-hardened friend.
- **Who it's for:** Junior and mid-level developers drowning in undocumented reality.
- **Project type:** Reading-first, search-first content platform (SvelteKit over a Rust/Tantivy API).
- **The one thing to remember:** "The manual a senior who actually cares would hand you." Calm,
  trustworthy, with a face.

## Aesthetic Direction
- **Direction:** Minimal-technical with editorial restraint. Calm, readable, developer-credible.
- **Decoration:** Minimal. Typography, whitespace, and one accent do the work. **No** gradients
  for their own sake, no decorative blobs, no 3D, no maximalist motion. Premium here = flawless
  execution of restraint, not visual noise.

## Typography
- **All text:** **IBM Plex Sans** (400/500/600/700). Headings use 600–700 with tight negative
  tracking; body is 400 at 17px / 1.7.
- **Code:** **JetBrains Mono** (400/500). Also used as *display* for micro-labels (eyebrows,
  categories, metadata) — uppercase, wide tracking (`0.1em`+).
- **User-selectable body/display font** (Settings → Font), persisted in `localStorage` as
  `tmm-font`. Options: IBM Plex (default), Inter, Geist, Sora, DM Sans, Plus Jakarta Sans. Code
  always stays JetBrains Mono. The choice swaps `--font-display` / `--font-body` at runtime.
- **Loading:** Google Fonts `<link>` in `app.html`; an inline script restores the saved font
  before first paint (no flash). All picker fonts are loaded.
- **Scale:** body 17px/1.7; hero h1 `clamp(2.4rem, 5.2vw, 3.7rem)`, tracking `-0.035em`;
  h1 2rem; h2 1.5rem; h3 1.2rem; tight line-height on headings (≈1.08), generous on body.

## Color
- **Approach:** Restrained. Off-white base, one teal accent. Never pure `#fff`/`#000`.
- **Light** — bg `#fcfcfd` · surface `#f4f4f5` · raise `#ffffff` · ink `#131316` · body `#2c2c33`
  · muted `#5c5c66` · faint `#8a8a93` · line `#e8e8ec` · accent `#0e7c86` · accent-strong `#0a5f67`.
- **Dark** (`:root[data-theme="dark"]`) — bg `#101012` · surface `#1b1b20` · raise `#16161a`
  · ink `#f2f2f4` · body `#c9c9d0` · muted `#9a9aa2` · faint `#6e6e76` · line `#2a2a30`
  · **accent `#4d969c`** · accent-strong `#6fb6bc`.
- **Code block:** bg `#16161a`, text `#e6e6ea`; inline code on `--surface` in accent-strong.
- Theme is `system | light | dark`, persisted as `tmm-theme`; resolved to `data-theme` on `<html>`
  by an inline script before paint.

## Spacing & Layout
- **Reading measure:** `.reader` max-width **720px**. Main column max-width **880px**, centred in
  its track with `justify-self` so collapsing the sidebar is one smooth slide (no width change).
- **Shell:** full-width header + `grid: auto 1fr` shell (sidebar track follows the sidebar's
  animated `width` — never animate `grid-template-columns`, several engines won't).
- **Radius:** 9–10px inputs/buttons, 12px code blocks, 14px cards/popovers, 999px pills.
- **Tokens** for shadows (`--shadow-sm/md/pop`), easing (`--ease`, `--ease-out`), `--rail` (252px).

## Components & patterns (the catalog)
- **Header:** sticky, blurred. Brand wordmark (no logo mark), centred search field with a `⌘K`/`/`
  chip, settings gear (theme + font), quick theme toggle. Full-width (no max-width).
- **Search field:** one focus treatment only — border-accent + soft ring on the *wrapper*; the
  inner `<input>` has `outline: none`. **Never** stack a `:focus-within` ring with an input outline.
- **Command palette (`⌘K` / `Ctrl-K` / `/`):** overlay with live results from the search API plus
  static Topics / Pages entries; arrow-key nav, Enter/click to go. Must respect `[hidden]` — set
  `display:none` on the hidden state so it can close.
- **Scoped sidebar:** on a topic/guide page the sidebar shows **only that topic's** guides (current
  one active); the shared chrome is just *All topics* + collapse. Search shows the full topic list.
  Collapse animates the sidebar `width`; a floating expand button appears when collapsed.
- **Cards** (`.cat-card`, `.track-card`): hairline border, lift + border-to-accent on hover. No
  gradients. **Newly-added** list items carry their category's icon on the left.
- **Reader:** numbered phases, blockquotes with a thin accent rule, code blocks with `--line`
  border, a top **reading-progress** hairline, and **resume reading** (below).
- **Resume reading:** a "Save my place" pill (bottom-right) anchors a marker to the *paragraph*
  you're on (survives font/zoom changes), stored as `tmm-place:<path>`. On return a gentle
  "Continue reading — <section>" prompt scrolls back. Tap again at the marked line to clear.
- **Footer colophon:** brand + "Free forever." + About/Contribute/RSS links + GitHub/LinkedIn icons
  (set the URLs in the layout's `SOCIAL` constant).

## Motion
- Minimal-functional. Link/hover/focus transitions, a smooth sidebar collapse, gentle palette/pill
  reveals. Easing via `--ease` / `--ease-out`. It is a place to read.

## Hard rules (don't regress these)
- **`app.css` is global, not Svelte-scoped.** Generic single-word class names collide silently.
  Namespace component styles (`.admin-*`, `.road-*`, `.cmdk-*`, `.bars .bar` not `.bar`). Grep
  `app.css` *and* markup before adding a rule for a generic name.
- **One focus ring**, never doubled. `:focus-visible` is global; suppress it on inputs that show
  focus on a wrapper (search field, palette input).
- **Don't animate `grid-template-columns`** — animate `width` instead.
- **Centre containers** — every `max-width` block needs `margin: 0 auto` (the landing bug).

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-17 | Teal accent over cobalt/emerald/charcoal | Confident-but-calm, non-generic. |
| 2026-06-18 | Keep **IBM Plex Sans** + JetBrains Mono as the shipped fonts | User's choice over DESIGN's earlier Bricolage+Geist note; add a runtime font picker so readers can change it. |
| 2026-06-18 | Dark accent → `#4d969c` | Softer teal in dark mode. |
| 2026-06-18 | Full-width header/shell; 880px centred reading column | Roomier, and collapsing the rail recentres smoothly. |
| 2026-06-18 | Scoped per-topic sidebar; `⌘K` palette; resume-reading | Less distraction, faster nav, comfortable long-form reading. |
