# UI Redesign: Sidebar Shell, IBM Plex, Search & Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan
> task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the centered single-column UI with a docs-style shell — a collapsible left sidebar
(All topics + category→guide nav) beside left-aligned content — on IBM Plex Sans / JetBrains Mono, with a
rearranged header, empty-search guard, search keyword highlighting, and a settings popover.

**Architecture:** SvelteKit. A new root `+layout.server.js` loads the nav (categories + their guides).
`+layout.svelte` renders the header (brand-left / search-center / settings+toggle-right) and, on every
route except `/`, the sidebar shell; `/` stays a full-width landing. All content is left-aligned (no
`margin: 0 auto` column). A new `$lib/search.js` holds the empty-submit guard + match highlighter.

**Tech stack:** SvelteKit 2 / Svelte 5, Tabler icons webfont, IBM Plex Sans + JetBrains Mono (Google
Fonts). Frontend visual work — verification is `npm run build` + live browser checks (this is not TDD).

**Data shapes (confirmed):** categories `{slug,name,icon,blurb,count}`; guides `{slug,title,summary,category,difficulty}`
(`category` = category slug); search hits `{guide_slug,phase_no,title,summary}`.

**Run note (Windows):** start web with `(cd platform/web && npm run dev)`; API with
`cargo run --manifest-path platform/Cargo.toml -p server`. Free squatted ports with `taskkill //F //PID <pid>`.

---

### Task 1: Fonts → IBM Plex Sans + JetBrains Mono

**Files:** Modify `platform/web/src/app.html:9-12`, `platform/web/src/app.css:14-16`

- [ ] **Step 1:** In `app.html`, replace the Google Fonts `<link href=...>` with:
```html
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
```
- [ ] **Step 2:** In `app.css`, set the font vars:
```css
  --font-display: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
```
- [ ] **Step 3:** Soften heading tracking for Plex (it's narrower than Bricolage). In `app.css` `h1,h2,h3` block change `letter-spacing: -0.02em;` → `-0.015em;`.

---

### Task 2: `$lib/search.js` — empty-submit guard + highlighter

**Files:** Create `platform/web/src/lib/search.js`

- [ ] **Step 1:** Create the file:
```js
// Block a GET search form from navigating when the query is empty.
export function guardSearchSubmit(e) {
  const input = e.currentTarget.querySelector('input[name="q"]');
  if (!input || !input.value.trim()) e.preventDefault();
}

// Escape HTML, then wrap case-insensitive query-term matches in <mark>. Returns HTML for {@html}.
export function highlight(text, query) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const safe = esc(text ?? '');
  if (!query || !query.trim()) return safe;
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return safe;
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}
```

---

### Task 3: Nav data — root `+layout.server.js`

**Files:** Create `platform/web/src/routes/+layout.server.js`

- [ ] **Step 1:** Create the file (groups each category with its guides by `g.category === c.slug`):
```js
import { listCategories, listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  const nav = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    guides: guides.filter((g) => g.category === c.slug)
  }));
  return { nav };
}
```
(SvelteKit merges this into every page's `data`; existing pages ignore the extra `nav` key.)

---

### Task 4: The shell — rewrite `+layout.svelte`

**Files:** Modify `platform/web/src/routes/+layout.svelte` (full rewrite)

- [ ] **Step 1:** Replace the file with the header (3 zones), conditional sidebar shell, settings popover,
collapse state, and theme logic (light/dark/system + quick toggle):
```svelte
<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { guardSearchSubmit } from '$lib/search.js';

  export let data;
  $: nav = data?.nav ?? [];
  $: path = $page.url.pathname;
  $: isHome = path === '/';
  $: currentGuide = (path.match(/^\/guides\/([^/]+)/) || [])[1] || null;
  $: currentCategory = (path.match(/^\/categories\/([^/]+)/) || [])[1] || null;

  let collapsed = false;
  let settingsOpen = false;
  let theme = 'system';

  onMount(() => {
    try {
      const s = localStorage.getItem('sidebar');
      collapsed = s ? s === 'collapsed' : window.innerWidth < 900;
      const t = localStorage.getItem('theme');
      theme = t === 'dark' || t === 'light' ? t : 'system';
    } catch (e) {}
  });

  function toggleSidebar() {
    collapsed = !collapsed;
    try { localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'open'); } catch (e) {}
  }

  function applyTheme(next) {
    theme = next;
    try {
      if (next === 'system') {
        localStorage.removeItem('theme');
        document.documentElement.dataset.theme =
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        localStorage.setItem('theme', next);
        document.documentElement.dataset.theme = next;
      }
    } catch (e) {}
  }

  function quickToggleTheme() {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  function onKeydown(e) { if (e.key === 'Escape') settingsOpen = false; }
</script>

<svelte:window on:keydown={onKeydown} />

<header class="site-header">
  <div class="bar">
    <a href="/" class="brand">The Missing Manual</a>

    <form method="GET" action="/search" class="header-search" on:submit={guardSearchSubmit}>
      <div class="search-field">
        <i class="ti ti-search" aria-hidden="true"></i>
        <input type="search" name="q" placeholder="Search… e.g. undo a commit" aria-label="Search guides" />
      </div>
    </form>

    <div class="bar-right">
      <div class="settings-wrap">
        <button class="icon-btn" on:click={() => (settingsOpen = !settingsOpen)}
          aria-label="Settings" aria-expanded={settingsOpen} title="Settings">
          <i class="ti ti-settings" aria-hidden="true"></i>
        </button>
        {#if settingsOpen}
          <button class="pop-backdrop" tabindex="-1" aria-hidden="true" on:click={() => (settingsOpen = false)}></button>
          <div class="settings-pop" role="dialog" aria-label="Settings">
            <p class="settings-label">Theme</p>
            <div class="seg">
              <button class:on={theme === 'light'} on:click={() => applyTheme('light')}>Light</button>
              <button class:on={theme === 'dark'} on:click={() => applyTheme('dark')}>Dark</button>
              <button class:on={theme === 'system'} on:click={() => applyTheme('system')}>System</button>
            </div>
            <p class="settings-soon">More customization coming soon.</p>
          </div>
        {/if}
      </div>
      <button class="icon-btn theme-toggle" on:click={quickToggleTheme}
        aria-label="Toggle dark mode" title="Toggle dark mode">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </div>
  </div>
</header>

{#if isHome}
  <main class="page-main home"><slot /></main>
{:else}
  <div class="shell" class:collapsed>
    <aside class="sidebar">
      <div class="sidebar-head">
        <a href="/" class="all-topics"><i class="ti ti-layout-grid" aria-hidden="true"></i> All topics</a>
        <button class="icon-btn" on:click={toggleSidebar} aria-label="Collapse sidebar" title="Collapse sidebar">
          <i class="ti ti-layout-sidebar-left-collapse" aria-hidden="true"></i>
        </button>
      </div>
      <nav class="sidebar-nav">
        {#each nav as c}
          <div class="nav-cat" class:on={currentCategory === c.slug}>
            <a href={`/categories/${c.slug}`}>{c.name}</a>
          </div>
          {#if c.guides.length}
            <ul class="nav-items">
              {#each c.guides as g}
                <li>
                  <a href={`/guides/${g.slug}`} class:on={currentGuide === g.slug}
                    aria-current={currentGuide === g.slug ? 'page' : undefined}>{g.title}</a>
                </li>
              {/each}
            </ul>
          {:else}
            <div class="nav-soon">Coming soon</div>
          {/if}
        {/each}
      </nav>
    </aside>
    <main class="page-main"><slot /></main>
  </div>
  {#if collapsed}
    <button class="sidebar-expand" on:click={toggleSidebar} aria-label="Show sidebar" title="Show sidebar">
      <i class="ti ti-layout-sidebar-left-expand" aria-hidden="true"></i>
    </button>
  {/if}
{/if}
```

---

### Task 5: Layout & component CSS in `app.css`

**Files:** Modify `platform/web/src/app.css`

- [ ] **Step 1:** Replace the centering rule `main { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 5rem; }`
with shell styles:
```css
/* App shell */
.page-main { padding: 2.4rem 2.6rem 5rem; }
.page-main.home { max-width: 1080px; }
.shell { display: flex; align-items: flex-start; max-width: 1280px; margin: 0 auto; }
.shell .page-main { flex: 1 1 auto; min-width: 0; max-width: 920px; }
.sidebar {
  width: 248px; flex: none; align-self: flex-start;
  position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto;
  border-right: 1px solid var(--line); padding: 1.1rem 0.9rem 2rem;
}
.sidebar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
.all-topics {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-weight: 600; font-size: 0.95rem; color: var(--ink);
}
.all-topics i { font-size: 18px; color: var(--accent); }
.all-topics:hover { color: var(--ink); text-decoration: none; }
.sidebar-nav { font-size: 0.92rem; }
.nav-cat {
  font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.07em; text-transform: uppercase;
  margin: 1rem 0 0.35rem;
}
.nav-cat a { color: var(--faint); }
.nav-cat a:hover { color: var(--ink); text-decoration: none; }
.nav-cat.on a { color: var(--accent); }
.nav-items { list-style: none; padding: 0; margin: 0; }
.nav-items li { margin: 0; }
.nav-items a {
  display: block; padding: 0.28rem 0 0.28rem 0.7rem; color: var(--muted);
  border-left: 2px solid var(--line); line-height: 1.35;
}
.nav-items a:hover { color: var(--ink); text-decoration: none; border-left-color: var(--faint); }
.nav-items a.on { color: var(--accent); font-weight: 500; border-left-color: var(--accent); }
.nav-soon { color: var(--faint); font-size: 0.85rem; padding: 0.1rem 0 0.2rem 0.7rem; }
.sidebar-expand {
  position: fixed; left: 12px; top: 70px; z-index: 25;
  background: var(--bg); border: 1px solid var(--line); color: var(--muted);
  border-radius: 8px; padding: 7px; cursor: pointer; display: inline-flex;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
.sidebar-expand:hover { color: var(--ink); }
.sidebar-expand i { font-size: 18px; }
```
- [ ] **Step 2:** Replace the header `.bar` rule (currently `max-width:720px;margin:0 auto;...space-between`) with
3-zone layout, and add the search field + icon-button + settings popover styles:
```css
.site-header .bar {
  max-width: 1280px; margin: 0 auto; padding: 0.65rem 1.5rem;
  display: flex; gap: 1rem; align-items: center;
}
.header-search { flex: 1 1 0; display: flex; justify-content: center; }
.search-field {
  display: flex; align-items: center; gap: 0.5rem; width: 100%; max-width: 440px;
  border: 1px solid var(--line); border-radius: 9px; background: #fff; padding: 0 0.7rem;
}
.search-field i { color: var(--faint); font-size: 16px; }
.search-field input {
  flex: 1; border: 0; background: none; font: inherit; font-size: 0.95rem;
  color: var(--ink); padding: 0.5rem 0; outline: none;
}
.search-field input::placeholder { color: var(--faint); }
.search-field:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
.bar-right { flex: none; display: flex; align-items: center; gap: 0.5rem; }
.icon-btn {
  background: none; border: 1px solid var(--line); color: var(--muted); cursor: pointer;
  padding: 7px; border-radius: 8px; display: inline-flex; align-items: center;
}
.icon-btn:hover { background: var(--surface); color: var(--ink); }
.icon-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.icon-btn i { font-size: 17px; }
.settings-wrap { position: relative; }
.pop-backdrop { position: fixed; inset: 0; background: transparent; border: 0; z-index: 19; cursor: default; }
.settings-pop {
  position: absolute; right: 0; top: calc(100% + 8px); width: 232px; z-index: 20;
  background: var(--bg); border: 1px solid var(--line); border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.14); padding: 0.9rem;
}
.settings-label { font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); margin: 0 0 0.5rem; }
.seg { display: flex; gap: 4px; }
.seg button {
  flex: 1; padding: 0.4rem 0; border: 1px solid var(--line); background: var(--bg);
  color: var(--muted); border-radius: 7px; font: inherit; font-size: 0.82rem; cursor: pointer;
}
.seg button:hover { color: var(--ink); }
.seg button.on { border-color: var(--accent); color: var(--accent); background: var(--accent-tint); font-weight: 500; }
.settings-soon { font-size: 0.78rem; color: var(--faint); margin: 0.7rem 0 0; }
```
- [ ] **Step 3:** Add `<mark>` styling and the dark-mode search-field background. Append near the dark-mode block:
```css
mark { background: var(--accent-tint); color: inherit; padding: 0 0.12em; border-radius: 3px; }
:root[data-theme="dark"] .search-field { background: var(--surface); }
```
- [ ] **Step 4:** Replace the old responsive header rule (the `@media (max-width: 640px) .site-header .bar { flex-wrap... }`
fragment) and add the mobile shell behavior:
```css
@media (max-width: 900px) {
  .shell { display: block; }
  .sidebar {
    position: fixed; left: 0; top: 56px; bottom: 0; height: auto; width: 264px; z-index: 30;
    background: var(--bg); transform: translateX(-100%); transition: transform 0.2s ease;
  }
  .shell:not(.collapsed) .sidebar { transform: none; box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
  .shell .page-main { max-width: none; }
}
@media (max-width: 640px) {
  body { font-size: 16px; }
  .page-main { padding: 1.75rem 1.15rem 4rem; }
  h1, .reader h1 { font-size: 1.6rem; }
  h2, .reader h2 { font-size: 1.3rem; }
  .header-search { order: 3; flex-basis: 100%; }
  .site-header .bar { flex-wrap: wrap; }
}
```

---

### Task 6: Search page — highlight + empty guard

**Files:** Modify `platform/web/src/routes/search/+page.svelte`

- [ ] **Step 1:** Replace the file:
```svelte
<script>
  import { highlight, guardSearchSubmit } from '$lib/search.js';
  export let data;
  $: ({ q, hits } = data);
</script>

<svelte:head><title>{q ? `Search: ${q}` : 'Search'}</title></svelte:head>

<h1>Search</h1>
<form method="GET" action="/search" class="search-field page-search" on:submit={guardSearchSubmit}>
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" aria-label="Search guides" />
</form>

{#if q}
  <p class="count">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”.</p>
  <ul class="results">
    {#each hits as h}
      <li>
        <a href={`/guides/${h.guide_slug}/${h.phase_no}`}>{@html highlight(h.title, q)}</a>
        <span class="summary">{@html highlight(h.summary, q)}</span>
      </li>
    {/each}
  </ul>
{/if}
```
- [ ] **Step 2:** In `app.css`, give the page search field a sensible width (it reuses `.search-field`):
```css
.page-search { max-width: 480px; margin: 1.2rem 0; }
```

---

### Task 7: Home hero — empty guard + de-center

**Files:** Modify `platform/web/src/routes/+page.svelte`, `platform/web/src/app.css`

- [ ] **Step 1:** In `+page.svelte`, add the import and guard, and convert the hero form to the `.search-field` style:
```svelte
<script>
  import { guardSearchSubmit } from '$lib/search.js';
  export let data;
  $: ({ categories, recent } = data);
</script>
```
- [ ] **Step 2:** Replace the hero `<form>` block with:
```svelte
  <form method="GET" action="/search" class="search-field hero-search" on:submit={guardSearchSubmit}>
    <i class="ti ti-search" aria-hidden="true"></i>
    <input type="search" name="q" placeholder="Search… e.g. how to revert a commit" aria-label="Search guides" />
  </form>
```
- [ ] **Step 3:** In `app.css`, update `.hero` rules so the hero is left-aligned (no centered column). Replace the
existing `.hero-search` rules with:
```css
.hero-search { max-width: 520px; margin-top: 1.3rem; }
```
(The hero already left-aligns now that `.page-main.home` isn't centered; `.hero h1`/`.tagline` keep their `max-width` caps.)

---

### Task 8: Category page — drop in-page sidebar + "All topics" (now global)

**Files:** Modify `platform/web/src/routes/categories/[slug]/+page.svelte`, `platform/web/src/app.css`

- [ ] **Step 1:** Replace the file — remove the `← All topics` line (it's in the global sidebar now) and the
internal `.cat-page`/`.cat-side` second sidebar; keep the difficulty-grouped main listing:
```svelte
<script>
  import { groupByLevel } from '$lib/difficulty.js';
  export let data;
  $: ({ category, guides } = data);
  $: groups = groupByLevel(guides);
</script>

<svelte:head><title>{category.name} — The Missing Manual</title></svelte:head>

<h1>{category.name}</h1>
<p class="tagline">{category.blurb}</p>

{#if guides.length === 0}
  <p class="cat-empty">Guides for {category.name} are on the way. In the meantime, browse what's live from the home page.</p>
{:else}
  {#each groups as grp}
    <h2 class="level-head">{grp.level}</h2>
    {#each grp.guides as g}
      <div class="guide-row">
        <a class="guide-link" href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </div>
    {/each}
  {/each}
{/if}
```
- [ ] **Step 2:** In `app.css`, replace the `.cat-page`/`.cat-side`/`.cat-main` block with the simpler listing styles
(keep `.cat-empty`):
```css
.level-head {
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--muted); font-weight: 400; margin: 1.8rem 0 0.7rem;
}
.guide-row { padding: 0.6rem 0; border-bottom: 1px solid var(--line); }
.guide-link { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; letter-spacing: -0.01em; }
.cat-empty { color: var(--muted); padding: 1.5rem 0; }
```

---

### Task 9: Trim redundant in-page back-links

**Files:** Modify `platform/web/src/routes/guides/[slug]/+page.svelte`

- [ ] **Step 1:** Remove the redundant `<p><a href="/">← All guides</a></p>` line (line 8) — the global sidebar's
"All topics" + category nav covers it. Leave the phase page's "← Back to guide" (within a guide the sidebar
shows guides, not phases, so it stays useful).

---

### Task 10: Build + live verification

- [ ] **Step 1:** Build the web app:
```
(cd platform/web && npm run build)
```
Expected: build completes with no errors.
- [ ] **Step 2:** Start API + web, browse, and verify (headless screenshots): (a) header = brand left-of-center /
search centered / gear + sun-moon right-of-center; (b) a guide & category page show the left sidebar with
"All topics" + categories→guides, current item highlighted; (c) the collapse toggle hides the sidebar and the
floating expand button restores it; (d) computed `body` font-family resolves to "IBM Plex Sans"; (e) submitting
an empty search (header/hero/search page) does NOT navigate to `/search?q=`; (f) a real search shows `<mark>`
highlights on matched terms; (g) the gear opens the settings popover and Light/Dark/System switch `data-theme`
and persist; (h) home is full-width with no sidebar and left-aligned (not a centered column).
- [ ] **Step 3:** Commit:
```
git add -A && git commit -m "feat(web): docs-style sidebar shell, IBM Plex, search highlight + settings"
```

---

## Self-review
- **Spec coverage:** point 1 de-center (T5 `.shell`/`.page-main`, no `margin:auto` column) ✓; point 2 real
  collapsible left sidebar (T4/T5) ✓; point 3 IBM Plex + JetBrains Mono (T1) ✓; point 4 "All topics" in sidebar
  (T4) + removed from category page (T8) ✓; point 5 empty-guard (T2/T6/T7) + highlight (T2/T6) ✓; point 7 header
  3 zones + settings popover + localStorage (T4/T5) ✓. Admin console out of scope ✓.
- **Placeholder scan:** none.
- **Type/name consistency:** `guardSearchSubmit`/`highlight` defined in T2, imported in T4/T6/T7; `nav`
  shape `{slug,name,guides}` from T3 consumed in T4; `currentGuide`/`currentCategory` regex matches route paths.
