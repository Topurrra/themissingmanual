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

  export let data;
  $: nav = data?.nav ?? [];
  $: guidePhases = data?.guidePhases ?? null;
  $: guideTitle = data?.guideTitle ?? null;
  $: tracks = data?.tracks ?? null;
  $: activeTrackSlug = data?.activeTrackSlug ?? null;
  $: trackRoadmap = data?.trackRoadmap ?? null;
  $: path = $page.url.pathname;
  // On any learning-paths page (list or a specific track) the sidebar shows paths.
  $: isPaths = path === '/paths' || path.startsWith('/paths/');
  $: isHome = path === '/';
  $: isAdmin = path.startsWith('/admin');
  // info pages render centred, no sidebar (like home)
  $: bare = isHome || ['/about', '/contribute', '/rss'].includes(path);
  $: currentGuide = (path.match(/^\/guides\/([^/]+)/) || [])[1] || null;
  // The active phase number on /guides/[slug]/[phase] — null on the guide overview.
  $: currentPhase = (() => {
    const m = path.match(/^\/guides\/[^/]+\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();
  $: currentCategory = (path.match(/^\/categories\/([^/]+)/) || [])[1] || null;

  // Scoped sidebar: the current topic (a category page, or the category that owns
  // the current guide). null on search / other pages → show the full topic list.
  $: activeCat =
    (currentCategory && nav.find((c) => c.slug === currentCategory)) ||
    (currentGuide && nav.find((c) => c.guides.some((g) => g.slug === currentGuide))) ||
    null;

  // Profiles shown in the footer — edit these.
  const SOCIAL = {
    github: 'https://github.com/your-username',
    linkedin: 'https://www.linkedin.com/in/your-handle'
  };

  // Footer sponsors — drop in real URLs when available. Names use exact brand casing;
  // the per-letter colouring lives in the markup/CSS (`.spon-*`), not here.
  const SPONSORS = [
    { name: 'KeepITLocal', url: '#' },
    { name: 'OMNIS-X', url: '#' }
  ];

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

{#if isAdmin}
  <slot />
{:else}
  <header class="site-header">
    <div class="bar">
      <a href="/" class="brand">The Missing Manual</a>

      <HeaderSearch>
        <span class="kbd" role="button" tabindex="-1" title="Command palette"
          on:click|preventDefault|stopPropagation={() => palette && palette.show()}>{kbdLabel}</span>
      </HeaderSearch>

      <LofiPlayer />
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
          <button class="rail-btn" on:click={toggleSidebar} aria-label="Collapse sidebar" title="Collapse sidebar">
            <i class="ti ti-layout-sidebar-left-collapse" aria-hidden="true"></i>
          </button>
        </div>
        <nav class="sidebar-nav">
          {#if isPaths && tracks}
            <a class="rail-topic" href="/paths"><i class="ti ti-route" aria-hidden="true"></i> Learning paths</a>
            <ul class="nav-items">
              {#each tracks as t}
                <li>
                  <a href={`/paths/${t.slug}`} class:on={activeTrackSlug === t.slug}
                    aria-current={activeTrackSlug === t.slug ? 'page' : undefined}>{t.name}</a>
                  {#if activeTrackSlug === t.slug && trackRoadmap}
                    <ul class="nav-substeps">
                      {#each trackRoadmap as step, i}
                        <li>
                          {#if step.guide}
                            <a href={`/guides/${step.guide.slug}`}>{i + 1}. {step.guide.title}</a>
                          {:else}
                            <span class="substep-soon">{i + 1}. {step.title}<span class="soon-cue">soon</span></span>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else if currentGuide && guidePhases}
            {#if activeCat}
              <a class="rail-back" href={`/categories/${activeCat.slug}`}><i class="ti ti-chevron-left" aria-hidden="true"></i> {activeCat.name}</a>
            {/if}
            <div class="rail-guide-title">{guideTitle}</div>
            <ul class="nav-items">
              <li><a href={`/guides/${currentGuide}`} class:on={currentPhase === null}
                aria-current={currentPhase === null ? 'page' : undefined}>Overview</a></li>
              {#each guidePhases.filter((p) => p.phase_no > 0) as p}
                <li><a href={`/guides/${currentGuide}/${p.phase_no}`} class:on={currentPhase === p.phase_no}
                  aria-current={currentPhase === p.phase_no ? 'page' : undefined}>{p.phase_no} · {p.title}</a></li>
              {/each}
            </ul>
          {:else if activeCat}
            <div class="rail-topic"><i class={`ti ${activeCat.icon}`} aria-hidden="true"></i> {activeCat.name}</div>
            {#if activeCat.guides.length}
              <ul class="nav-items">
                {#each activeCat.guides as g}
                  {@const lvl = levelLabel(g.difficulty)}
                  <li><a href={`/guides/${g.slug}`} class:on={currentGuide === g.slug}
                    class="nav-lvl-row" aria-current={currentGuide === g.slug ? 'page' : undefined}>
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
                  class:on={currentCategory === c.slug}>{c.name}</a></li>
              {/each}
            </ul>
          {/if}
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

  <footer class="colophon">
    <div class="colophon-inner">
      <div>
        <div class="co-brand">The Missing Manual</div>
        <div class="co-line">Free forever.</div>
        <div class="sponsors">
          <span class="spon-label">Sponsored by</span>
          <span class="spon-names">
            <a class="spon-name" href={SPONSORS[0].url} target="_blank" rel="noopener"
              >Keep<span class="spon-it">IT</span>Local</a>
            <span class="spon-sep" aria-hidden="true">and</span>
            <a class="spon-name" href={SPONSORS[1].url} target="_blank" rel="noopener"
              >OMNIS-<span class="spon-x">X</span></a>
          </span>
        </div>
      </div>
      <nav>
        <a href="/about">About</a>
        <a href="/contribute">Contribute</a>
        <a href="/rss.xml">RSS</a>
        <span class="co-social">
          <a href={SOCIAL.github} target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><i class="ti ti-brand-github"></i></a>
          <a href={SOCIAL.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><i class="ti ti-brand-linkedin"></i></a>
        </span>
      </nav>
    </div>
  </footer>

  <CommandPalette bind:this={palette} {nav} />
{/if}
