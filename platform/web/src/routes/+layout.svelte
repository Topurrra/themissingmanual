<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { levelLabel } from '$lib/difficulty.js';
  import { afterNavigate } from '$app/navigation';
  import { sendPageview } from '$lib/beacon.js';
  import CommandPalette from '$lib/CommandPalette.svelte';
  import HeaderSearch from '$lib/HeaderSearch.svelte';
  import Appearance from '$lib/Appearance.svelte';
  import LofiPlayer from '$lib/LofiPlayer.svelte';
  import PathRail from '$lib/PathRail.svelte';
  import { beginnerMode, setBeginner } from '$lib/beginner-store.js';

  export let data;
  $: nav = data?.nav ?? [];
  $: guidePhases = data?.guidePhases ?? null;
  $: guideTitle = data?.guideTitle ?? null;
  // Flat category + guide lists (derived from nav) feed the right-side path rail.
  $: pathCategories = nav.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }));
  $: pathGuides = nav.flatMap((c) => c.guides);
  $: path = $page.url.pathname;
  $: isHome = path === '/';
  $: isAdmin = path.startsWith('/admin');
  // info pages + the learning-path wizard render centred, no sidebar (like home)
  $: bare = isHome || ['/about', '/contribute', '/rss', '/paths', '/glossary', '/train'].includes(path);
  $: currentGuide = (path.match(/^\/guides\/([^/]+)/) || [])[1] || null;
  // The active phase number on /guides/[slug]/[phase] — null on the guide overview.
  $: currentPhase = (() => {
    const m = path.match(/^\/guides\/[^/]+\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();
  $: currentCategory = (path.match(/^\/categories\/([^/]+)/) || [])[1] || null;

  // ── Public site config (from $page.data.siteConfig via the root layout load).
  // All fields are strings, "" when unset; every consumer has a fallback so an
  // all-empty config renders today's site byte-for-byte.
  $: siteConfig = data?.siteConfig ?? {};

  // Default-on flag rule (shared with the admin toggles): unset/""/"1"/"true" ⇒ ON,
  // only explicit "0"/"false"/"off"/"no" ⇒ off.
  const flagOn = (v) => !['0', 'false', 'off', 'no'].includes(String(v ?? '').trim().toLowerCase());

  $: siteName = (siteConfig.site_name || '').trim() || 'The Missing Manual';
  $: tagline = (siteConfig.tagline || '').trim() || 'Free forever';
  $: announcement = (siteConfig.announcement || '').trim();
  $: lofiOn = flagOn(siteConfig.flag_lofi);

  // Sponsors: parse the JSON string; fall back to the current hardcoded two
  // (KeepITLocal / OMNIS-X) if it's empty/invalid so today's footer is unchanged.
  const SPONSOR_FALLBACK = [
    { name: 'KeepITLocal', url: '#' },
    { name: 'OMNIS-X', url: '#' }
  ];
  $: sponsors = (() => {
    try {
      const parsed = JSON.parse(siteConfig.sponsors || '');
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {}
    return SPONSOR_FALLBACK;
  })();

  // Bespoke per-letter colouring (reuses .spon-* from app.css). Returns the
  // segments for {@html}-free rendering in the markup.
  function sponsorParts(name) {
    if (name === 'KeepITLocal') return { pre: 'Keep', mid: 'IT', midClass: 'spon-it', post: 'Local' };
    if (name === 'OMNIS-X') return { pre: 'OMNIS-', mid: 'X', midClass: 'spon-x', post: '' };
    return null;
  }

  // Social: parse the JSON string {github, x, linkedin, ...}; fall back to the
  // current hardcoded github + linkedin if empty/invalid.
  const SOCIAL_ICONS = {
    github: 'ti-brand-github',
    x: 'ti-brand-x',
    twitter: 'ti-brand-twitter',
    linkedin: 'ti-brand-linkedin',
    mastodon: 'ti-brand-mastodon',
    youtube: 'ti-brand-youtube',
    discord: 'ti-brand-discord',
    bluesky: 'ti-brand-bluesky'
  };
  const SOCIAL_FALLBACK = {
    github: 'https://github.com/your-username',
    linkedin: 'https://www.linkedin.com/in/your-handle'
  };
  $: socialLinks = (() => {
    let obj = null;
    try {
      const parsed = JSON.parse(siteConfig.social || '');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed;
    } catch (e) {}
    const source = obj && Object.values(obj).some((v) => (v || '').trim()) ? obj : SOCIAL_FALLBACK;
    return Object.entries(source)
      .filter(([, url]) => (url || '').trim())
      .map(([key, url]) => ({
        key,
        url,
        icon: SOCIAL_ICONS[key] || 'ti-link',
        label: key.charAt(0).toUpperCase() + key.slice(1)
      }));
  })();

  // Scoped sidebar: the current topic (a category page, or the category that owns
  // the current guide). null on search / other pages → show the full topic list.
  $: activeCat =
    (currentCategory && nav.find((c) => c.slug === currentCategory)) ||
    (currentGuide && nav.find((c) => c.guides.some((g) => g.slug === currentGuide))) ||
    null;
  // Beginner mode filters the sidebar's per-topic guide list. The guide you're
  // currently reading always stays visible, even if it's above beginner level.
  $: visibleCatGuides = (activeCat?.guides ?? []).filter(
    (g) => !$beginnerMode || g.difficulty === 'beginner' || g.slug === currentGuide
  );

  let collapsed = false;
  let palette;
  let kbdLabel = '⌘K';
  // On narrow screens the sidebar is an off-canvas drawer (not a persistent rail).
  const MOBILE_MAX = 920;
  let mobile = false;
  // The drawer is "open" on mobile when the shell is not collapsed.
  $: drawerOpen = mobile && !collapsed && !bare && !isHome && !isAdmin;

  function syncMobile() {
    const m = window.innerWidth <= MOBILE_MAX;
    if (m && !mobile) collapsed = true; // entering mobile → drawer starts closed
    mobile = m;
  }

  onMount(() => {
    mobile = window.innerWidth <= MOBILE_MAX;
    try {
      const s = localStorage.getItem('tmm-sidebar');
      // On mobile always start with the drawer closed regardless of saved desktop state.
      collapsed = mobile ? true : s ? s === 'collapsed' : false;
    } catch (e) {
      collapsed = mobile;
    }
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbdLabel = 'Ctrl+K';
    window.addEventListener('resize', syncMobile);
    return () => window.removeEventListener('resize', syncMobile);
  });

  afterNavigate(({ to }) => {
    // Navigating (e.g. tapping a sidebar link) closes the mobile drawer.
    if (mobile) collapsed = true;
    if (to && !to.url.pathname.startsWith('/admin')) sendPageview(to.url);
  });

  function toggleSidebar() {
    collapsed = !collapsed;
    // Don't persist the mobile drawer state — it's transient, not a layout preference.
    if (!mobile) {
      try { localStorage.setItem('tmm-sidebar', collapsed ? 'collapsed' : 'open'); } catch (e) {}
    }
  }

  function closeDrawer() {
    if (mobile) collapsed = true;
  }
</script>

<svelte:head><title>{siteName}</title></svelte:head>

{#if isAdmin}
  <slot />
{:else}
  {#if announcement}
    <div class="announce-banner" role="status">{announcement}</div>
  {/if}
  {#if $beginnerMode}
    <div class="beginner-banner" role="status">
      <span><i class="ti ti-sparkles" aria-hidden="true"></i> Beginner mode — showing beginner-level guides only.</span>
      <button type="button" on:click={() => setBeginner(false)}>Show everything</button>
    </div>
  {/if}

  <header class="site-header">
    <div class="bar">
      {#if !bare}
        <button class="site-rail-btn" on:click={toggleSidebar}
          aria-label={collapsed ? 'Show sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Show sidebar' : 'Collapse sidebar'}>
          <i class="ti ti-menu-2" aria-hidden="true"></i>
        </button>
      {/if}
      <a href="/" class="brand">{siteName}</a>

      <HeaderSearch>
        <span class="kbd" role="button" tabindex="-1" title="Command palette"
          on:click|preventDefault|stopPropagation={() => palette && palette.show()}>{kbdLabel}</span>
      </HeaderSearch>

      {#if lofiOn}
        <LofiPlayer />
      {/if}
      <Appearance />
    </div>
  </header>

  {#if bare}
    <main class="page-main home"><slot /></main>
  {:else}
    {#if drawerOpen}
      <button class="sidebar-backdrop" on:click={closeDrawer} aria-label="Close menu"></button>
    {/if}
    <div class="shell" class:collapsed>
      <aside class="sidebar">
        <div class="sidebar-head">
          <a href="/" class="all-topics"><i class="ti ti-layout-grid" aria-hidden="true"></i> All topics</a>
        </div>
        <nav class="sidebar-nav">
          {#if currentGuide && guidePhases}
            {#if activeCat}
              <a class="rail-back" href={`/categories/${activeCat.slug}`}><i class="ti ti-chevron-left" aria-hidden="true"></i> {activeCat.name}</a>
            {/if}
            <div class="rail-guide-title">{guideTitle}</div>
            <ul class="nav-items">
              <li><a href={`/guides/${currentGuide}`} class:on={currentPhase === null}
                aria-current={currentPhase === null ? 'page' : undefined}>
                <i class="ti ti-file-text" aria-hidden="true"></i><span class="nav-label">Overview</span></a></li>
              {#each guidePhases.filter((p) => p.phase_no > 0) as p}
                <li><a href={`/guides/${currentGuide}/${p.phase_no}`} class:on={currentPhase === p.phase_no}
                  aria-current={currentPhase === p.phase_no ? 'page' : undefined}>
                  <i class="ti ti-file-text" aria-hidden="true"></i><span class="nav-label">{p.phase_no} · {p.title}</span></a></li>
              {/each}
            </ul>
          {:else if activeCat}
            <div class="rail-topic"><i class={`ti ${activeCat.icon}`} aria-hidden="true"></i> {activeCat.name}</div>
            {#if visibleCatGuides.length}
              <ul class="nav-items">
                {#each visibleCatGuides as g}
                  {@const lvl = levelLabel(g.difficulty)}
                  <li><a href={`/guides/${g.slug}`} class:on={currentGuide === g.slug}
                    class="nav-lvl-row" aria-current={currentGuide === g.slug ? 'page' : undefined}>
                    <i class="ti ti-file-text" aria-hidden="true"></i>
                    <span class="nav-lvl-title">{g.title}</span>
                    <span class="lvl" class:mid={lvl === 'Intermediate'} class:adv={lvl === 'Advanced'}
                      title={lvl} aria-label={lvl}>{lvl[0]}</span>
                  </a></li>
                {/each}
              </ul>
            {:else}
              <div class="nav-soon">Coming soon</div>
            {/if}
          {:else}
            <div class="rail-topic"><i class="ti ti-list" aria-hidden="true"></i> Topics</div>
            <ul class="nav-items">
              {#each nav as c}
                <li><a href={`/categories/${c.slug}`} class:muted={!c.guides.length}
                  class:on={currentCategory === c.slug}>
                  <i class={`ti ${c.icon}`} aria-hidden="true"></i><span class="nav-label">{c.name}</span></a></li>
              {/each}
            </ul>
          {/if}
        </nav>
      </aside>
      <main class="page-main"><slot /></main>
      <PathRail guides={pathGuides} categories={pathCategories} currentSlug={currentGuide} />
    </div>
  {/if}

  <footer class="colophon">
    <div class="colophon-inner">
      <div class="co-top">
        <div class="co-brand">{siteName}</div>
        <div class="sponsors">
          <span class="spon-label">Sponsored by</span>
          <span class="spon-names">
            {#each sponsors as s, i}
              {#if i > 0}<span class="spon-sep" aria-hidden="true">and</span>{/if}
              <a class="spon-name" href={s.url} target="_blank" rel="noopener">
                {#if s.logo}
                  <img src={s.logo} alt={s.name} />
                {:else if sponsorParts(s.name)}
                  {@const p = sponsorParts(s.name)}{p.pre}<span class={p.midClass}>{p.mid}</span>{p.post}
                {:else}
                  {s.name}
                {/if}
              </a>
            {/each}
          </span>
        </div>
      </div>
      <div class="co-line">{tagline}</div>
      <nav>
        <a href="/about">About</a>
        <a href="/glossary">Glossary</a>
        <a href="/train">Train</a>
      </nav>
    </div>
  </footer>

  <CommandPalette bind:this={palette} {nav} />
{/if}

<style>
  /* Slim announcement banner at the very top of the page (above the header).
     Accent-tinted, centered, readable. Hidden entirely when announcement is empty. */
  .announce-banner {
    padding: 0.5rem 1.25rem;
    background: var(--accent-tint);
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    text-align: center;
    font-size: 0.86rem;
    line-height: 1.4;
  }
  /* Beginner-mode indicator — explains why advanced guides are hidden + a way out. */
  .beginner-banner {
    display: flex; align-items: center; justify-content: center; gap: 0.9rem; flex-wrap: wrap;
    padding: 0.5rem 1.25rem;
    background: var(--accent-tint);
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    font-size: 0.86rem; line-height: 1.4;
  }
  .beginner-banner .ti { color: var(--accent); }
  .beginner-banner button {
    font: inherit; font-size: 0.82rem; cursor: pointer;
    background: none; border: 1px solid var(--line); border-radius: 7px;
    padding: 0.2rem 0.6rem; color: var(--muted);
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .beginner-banner button:hover { border-color: var(--accent); color: var(--ink); }
</style>
