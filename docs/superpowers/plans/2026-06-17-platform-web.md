# web Implementation Plan (Platform — Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `web`, a SvelteKit reading + search front-end that consumes the `server` API, with server-rendered pages (good for SEO, no CORS).

**Architecture:** A SvelteKit app at `platform/web`. **All data loading is server-side** (`+page.server.js` load functions call the Rust API over an absolute base URL), so the browser never calls the API directly — no CORS, and pages are SSR'd. Four routes: home (guide list + search box), guide overview, phase reader (`{@html}`), and search results. Search is a plain GET form to `/search?q=` (server-rendered results) — interactive client-side search is a later enhancement.

**Tech Stack:** SvelteKit 2, Svelte 5, Vite, `@sveltejs/adapter-node`, Node 22. Talks to the Plan-2 server.

**Source spec:** `docs/superpowers/specs/2026-06-17-platform-web-first-design.md` (§3 web).

---

## Conventions & verification model

- This is a front-end, so the "test" per task is **build + render verification**, not unit TDD: `npm --prefix platform/web run build` must succeed, and an **integration smoke** (both servers up, `curl` the SSR'd HTML, grep for expected content) proves the API wiring. This is the honest frontend analog of TDD — a task isn't done until the page actually renders the right content.
- Commits: conventional, with the Co-Authored-By trailer (second `-m`), as in Plans 1–2.
- **Toolchain note:** exact SvelteKit/Vite/adapter versions resolve via npm. If a config detail differs from what's written here (the fast-moving part), adjust against the `npm run build` error — same expected tuning as Tantivy/axum in earlier plans. Route code (`+page.server.js`, `+page.svelte`) uses version-stable SvelteKit concepts.
- Run `npm` with `--prefix platform/web` (never `cd`).

## File Structure

```
/platform/web/
  package.json            scripts + deps
  svelte.config.js        adapter-node
  vite.config.js          sveltekit plugin
  .gitignore              node_modules, .svelte-kit, build
  src/
    app.html              shell
    app.css               global readable styles
    lib/api.js            API base URL + fetch helpers (server-side)
    routes/
      +layout.svelte      header (logo + search box) + slot
      +page.server.js     load guide list
      +page.svelte        home
      search/
        +page.server.js   load search results from ?q=
        +page.svelte      results
      guides/[slug]/
        +page.server.js   load guide + phases
        +page.svelte      overview
        [phase]/
          +page.server.js load one phase
          +page.svelte    reader ({@html})
```

---

## Task 0: SvelteKit project that builds

**Files:** create `platform/web/package.json`, `svelte.config.js`, `vite.config.js`, `.gitignore`, `src/app.html`, `src/routes/+page.svelte`; modify root `.gitignore`.

- [ ] **Step 1: Create `platform/web/package.json`**

```json
{
  "name": "web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^5",
    "@sveltejs/kit": "^2",
    "@sveltejs/vite-plugin-svelte": "^4",
    "svelte": "^5",
    "vite": "^5"
  }
}
```

- [ ] **Step 2: Create `platform/web/svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
};
```

- [ ] **Step 3: Create `platform/web/vite.config.js`**

```js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
```

- [ ] **Step 4: Create `platform/web/src/app.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5: Create a placeholder home** — `platform/web/src/routes/+page.svelte`

```svelte
<h1>The Missing Manual</h1>
<p>Coming together.</p>
```

- [ ] **Step 6: Create `platform/web/.gitignore`**

```gitignore
node_modules/
.svelte-kit/
build/
```

- [ ] **Step 7: Add web build dirs to the root `.gitignore`** — append to `/.gitignore`:

```gitignore
# Web (SvelteKit)
platform/web/node_modules/
platform/web/.svelte-kit/
platform/web/build/
```

- [ ] **Step 8: Install and build**

Run: `npm --prefix platform/web install`
Then: `npm --prefix platform/web run build`
Expected: install completes; `vite build` finishes with `✓ built`. (If versions in Step 1 don't resolve, install the latest compatible set — e.g. let `npm install` pick them — and re-run; fix any config mismatch against the build error.)

- [ ] **Step 9: Commit**

```bash
git add platform/web/package.json platform/web/svelte.config.js platform/web/vite.config.js platform/web/src platform/web/.gitignore .gitignore platform/web/package-lock.json
git commit -m "chore: scaffold SvelteKit web app (builds, placeholder home)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: API helpers + home route

**Files:** create `platform/web/src/lib/api.js`, `src/routes/+page.server.js`; modify `src/routes/+page.svelte`.

- [ ] **Step 1: Create the API helper** — `platform/web/src/lib/api.js`

```js
// Server-side only. The Rust API base; override with API_BASE env in production.
const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

async function getJson(fetch, path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) return null;
  return await res.json();
}

export const listGuides = (fetch) => getJson(fetch, '/api/guides');
export const getGuide = (fetch, slug) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}`);
export const getPhase = (fetch, slug, phase) => getJson(fetch, `/api/guides/${encodeURIComponent(slug)}/${phase}`);
export const search = (fetch, q) => getJson(fetch, `/api/search?q=${encodeURIComponent(q)}`);
```

- [ ] **Step 2: Load guides server-side** — `platform/web/src/routes/+page.server.js`

```js
import { listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const guides = await listGuides(fetch);
  return { guides: guides ?? [] };
}
```

- [ ] **Step 3: Render the home page** — replace `platform/web/src/routes/+page.svelte`

```svelte
<script>
  export let data;
</script>

<svelte:head><title>The Missing Manual for Developers</title></svelte:head>

<h1>The Missing Manual for Developers</h1>
<p class="tagline">The stuff nobody teaches — explained like a battle-hardened friend.</p>

<h2>Guides</h2>
<ul class="guides">
  {#each data.guides as g}
    <li>
      <a href={`/guides/${g.slug}`}>{g.title}</a>
      <span class="summary">{g.summary}</span>
    </li>
  {/each}
</ul>
```

- [ ] **Step 4: Verify build**

Run: `npm --prefix platform/web run build`
Expected: `✓ built` with no errors.

- [ ] **Step 5: Commit**

```bash
git add platform/web/src && git commit -m "feat: web home page lists guides from the API" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Guide overview + phase reader routes

**Files:** create `src/routes/guides/[slug]/+page.server.js`, `+page.svelte`, `src/routes/guides/[slug]/[phase]/+page.server.js`, `+page.svelte`.

- [ ] **Step 1: Guide loader** — `platform/web/src/routes/guides/[slug]/+page.server.js`

```js
import { error } from '@sveltejs/kit';
import { getGuide } from '$lib/api.js';

export async function load({ fetch, params }) {
  const detail = await getGuide(fetch, params.slug);
  if (!detail) throw error(404, 'Guide not found');
  return detail; // { guide, phases }
}
```

- [ ] **Step 2: Guide overview** — `platform/web/src/routes/guides/[slug]/+page.svelte`

```svelte
<script>
  export let data;
  $: ({ guide, phases } = data);
</script>

<svelte:head><title>{guide.title}</title></svelte:head>

<p><a href="/">← All guides</a></p>
<h1>{guide.title}</h1>
<p class="tagline">{guide.summary}</p>

<ol class="phases">
  {#each phases.filter((p) => p.phase_no > 0) as p}
    <li>
      <a href={`/guides/${guide.slug}/${p.phase_no}`}>{p.title}</a>
      <span class="summary">{p.summary}</span>
    </li>
  {/each}
</ol>
```

- [ ] **Step 3: Phase loader** — `platform/web/src/routes/guides/[slug]/[phase]/+page.server.js`

```js
import { error } from '@sveltejs/kit';
import { getPhase } from '$lib/api.js';

export async function load({ fetch, params }) {
  const phase = await getPhase(fetch, params.slug, params.phase);
  if (!phase) throw error(404, 'Phase not found');
  return { phase };
}
```

- [ ] **Step 4: Phase reader** — `platform/web/src/routes/guides/[slug]/[phase]/+page.svelte`

```svelte
<script>
  export let data;
  $: phase = data.phase;
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<p><a href={`/guides/${phase.guide_slug}`}>← Back to guide</a></p>
<article class="reader">
  {@html phase.html}
</article>
```

- [ ] **Step 5: Verify build**

Run: `npm --prefix platform/web run build`
Expected: `✓ built`.

- [ ] **Step 6: Commit**

```bash
git add platform/web/src && git commit -m "feat: guide overview and phase reader pages" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Search route

**Files:** create `src/routes/search/+page.server.js`, `src/routes/search/+page.svelte`.

- [ ] **Step 1: Search loader** — `platform/web/src/routes/search/+page.server.js`

```js
import { search } from '$lib/api.js';

export async function load({ fetch, url }) {
  const q = url.searchParams.get('q') ?? '';
  if (!q.trim()) return { q, hits: [] };
  const hits = await search(fetch, q);
  return { q, hits: hits ?? [] };
}
```

- [ ] **Step 2: Search results page** — `platform/web/src/routes/search/+page.svelte`

```svelte
<script>
  export let data;
  $: ({ q, hits } = data);
</script>

<svelte:head><title>{q ? `Search: ${q}` : 'Search'}</title></svelte:head>

<h1>Search</h1>
<form method="GET" action="/search" class="searchbar">
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" autofocus />
  <button type="submit">Search</button>
</form>

{#if q}
  <p class="count">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”.</p>
  <ul class="results">
    {#each hits as h}
      <li>
        <a href={`/guides/${h.guide_slug}/${h.phase_no}`}>{h.title}</a>
        <span class="summary">{h.summary}</span>
      </li>
    {/each}
  </ul>
{/if}
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix platform/web run build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add platform/web/src && git commit -m "feat: server-rendered search results page" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Layout, search-in-header, and readable styling

**Files:** create `src/routes/+layout.svelte`, `src/app.css`.

- [ ] **Step 1: Global styles** — `platform/web/src/app.css`

```css
:root { --ink: #1a1a1a; --muted: #666; --accent: #2563eb; --bg: #fff; --line: #e5e7eb; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: var(--bg);
  font: 17px/1.7 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 1rem 1.25rem 4rem; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.tagline { color: var(--muted); font-size: 1.05rem; }
.summary { display: block; color: var(--muted); font-size: 0.92rem; }
ul.guides, ol.phases, ul.results { list-style: none; padding: 0; }
ul.guides li, ol.phases li, ul.results li { padding: 0.6rem 0; border-bottom: 1px solid var(--line); }
ul.guides a, ol.phases a, ul.results a { font-weight: 600; }
.site-header { border-bottom: 1px solid var(--line); }
.site-header .bar { max-width: 760px; margin: 0 auto; padding: 0.8rem 1.25rem;
  display: flex; gap: 1rem; align-items: center; justify-content: space-between; }
.searchbar { display: flex; gap: 0.5rem; }
.searchbar input { flex: 1; padding: 0.5rem 0.7rem; border: 1px solid var(--line); border-radius: 6px; font: inherit; }
.searchbar button { padding: 0.5rem 0.9rem; border: 0; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }
/* Reader: render the guide HTML legibly */
.reader pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; }
.reader code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; }
.reader table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.reader th, .reader td { border: 1px solid var(--line); padding: 0.5rem 0.7rem; text-align: left; }
.reader blockquote { border-left: 3px solid var(--accent); margin: 1rem 0; padding: 0.2rem 1rem; color: #374151; background: #f8fafc; }
.reader h2 { margin-top: 2rem; }
```

- [ ] **Step 2: Layout with header search** — `platform/web/src/routes/+layout.svelte`

```svelte
<script>
  import '../app.css';
</script>

<header class="site-header">
  <div class="bar">
    <a href="/" style="font-weight:700">The Missing Manual</a>
    <form method="GET" action="/search" class="searchbar" style="max-width:380px;flex:1">
      <input type="search" name="q" placeholder="Search… e.g. undo a commit" />
      <button type="submit">Go</button>
    </form>
  </div>
</header>

<main>
  <slot />
</main>
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix platform/web run build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add platform/web/src && git commit -m "feat: site layout, header search, readable guide styling" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: End-to-end integration smoke + final verification

**Files:** none (verification only) — plus a `platform/web/README.md` run note.

- [ ] **Step 1: Start the API server (background)**

Run: `platform/target/debug/server.exe > /tmp/srv.log 2>&1 &`
(If the binary is stale, first `cargo build --manifest-path platform/Cargo.toml -p server`.)

- [ ] **Step 2: Start the SvelteKit dev server (background) and wait**

Run:
```bash
npm --prefix platform/web run dev > /tmp/web.log 2>&1 &
sleep 6
```

- [ ] **Step 3: Verify the SSR'd pages contain real content from the API**

Run:
```bash
echo "HOME:";   curl -s http://localhost:5173/ | grep -o "Git, Explained You.re a Human\|Git, Explained" | head -1
echo "SEARCH:"; curl -s "http://localhost:5173/search?q=undo%20a%20commit" | grep -o "When It Breaks" | head -1
echo "READER:"; curl -s "http://localhost:5173/guides/git-explained-like-a-human/1" | grep -o "Mental Model" | head -1
```
Expected: each line prints its match — the home lists the guide, search returns the Phase-3 result, the reader renders Phase 1. (Vite dev's SSR runs the `+page.server.js` loaders, which fetch the running Rust API.)

- [ ] **Step 4: Stop the background servers**

Run: `kill %1 %2 2>/dev/null; pkill -f "server.exe" 2>/dev/null; true`

- [ ] **Step 5: Add a run note** — `platform/web/README.md`

```markdown
# web — The Missing Manual front-end (SvelteKit)

Server-rendered reading + search UI over the `server` API.

## Run (dev)
1. Start the API: `cargo run --manifest-path ../Cargo.toml -p server`  (serves :3000)
2. Start the web app: `npm run dev`  (serves :5173, SSR loaders call the API)

Set `API_BASE` to point at a non-default API origin in production.
```

- [ ] **Step 6: Commit**

```bash
git add platform/web/README.md && git commit -m "docs: web run instructions + verified end-to-end SSR against the API" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- `npm --prefix platform/web run build` succeeds.
- With the API + SvelteKit dev servers running, the home page lists the guide, `/guides/<slug>` shows the phases, `/guides/<slug>/<n>` renders the guide HTML, and `/search?q=` returns the right results — all server-rendered (view-source shows the content).
- No client-side calls to the Rust API (no CORS needed); the path to prerendering (SEO) and a Tauri static build is open for later.

## Self-Review

**Spec coverage:** Implements spec §3 web (SvelteKit, SSR for SEO, consumes the API), the four user-facing surfaces (browse/read/search), reusing the Plan-2 endpoints. Prerendering and the Tauri desktop wrap remain explicitly future (spec §10–11). 
**Placeholders:** none — every step has the real file contents and exact commands. The one flagged variable is the npm-resolved SvelteKit version (Task 0), which is genuine ecosystem drift, not a gap.
**Type/contract consistency:** `lib/api.js` returns the API's JSON shapes verbatim — `GuideSummary {slug,title,summary}`, `GuideDetail {guide,phases:[{phase_no,title,summary}]}`, `Phase {…,html}`, `SearchHit {guide_slug,phase_no,title,summary}` — and every `+page.svelte` reads exactly those fields. Routes match the server's `:slug`/`:phase` params.
