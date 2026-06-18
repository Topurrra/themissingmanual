<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { guardSearchSubmit } from '$lib/search.js';
  import { afterNavigate } from '$app/navigation';
  import { sendPageview } from '$lib/beacon.js';
  import CommandPalette from '$lib/CommandPalette.svelte';
  import Appearance from '$lib/Appearance.svelte';

  export let data;
  $: nav = data?.nav ?? [];
  $: path = $page.url.pathname;
  $: isHome = path === '/';
  $: isAdmin = path.startsWith('/admin');
  // info pages render centred, no sidebar (like home)
  $: bare = isHome || ['/about', '/contribute', '/rss'].includes(path);
  $: currentGuide = (path.match(/^\/guides\/([^/]+)/) || [])[1] || null;
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

  let collapsed = false;
  let palette;
  let kbdLabel = '⌘K';

  onMount(() => {
    try {
      const s = localStorage.getItem('tmm-sidebar');
      collapsed = s ? s === 'collapsed' : window.innerWidth < 920;
    } catch (e) {}
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbdLabel = 'Ctrl K';
  });

  afterNavigate(({ to }) => {
    if (to && !to.url.pathname.startsWith('/admin')) sendPageview(to.url);
  });

  function toggleSidebar() {
    collapsed = !collapsed;
    try { localStorage.setItem('tmm-sidebar', collapsed ? 'collapsed' : 'open'); } catch (e) {}
  }
</script>

{#if isAdmin}
  <slot />
{:else}
  <header class="site-header">
    <div class="bar">
      <a href="/" class="brand">The Missing Manual</a>

      <form method="GET" action="/search" class="header-search" on:submit={guardSearchSubmit}>
        <div class="search-field">
          <i class="ti ti-search" aria-hidden="true"></i>
          <input type="search" name="q" placeholder="Search… e.g. undo a commit" aria-label="Search guides" />
          <span class="kbd" role="button" tabindex="-1" title="Command palette"
            on:click|preventDefault|stopPropagation={() => palette && palette.show()}>{kbdLabel}</span>
        </div>
      </form>

      <Appearance />
    </div>
  </header>

  {#if bare}
    <main class="page-main home"><slot /></main>
  {:else}
    <div class="shell" class:collapsed>
      <aside class="sidebar">
        <div class="sidebar-head">
          <a href="/" class="all-topics"><i class="ti ti-layout-grid" aria-hidden="true"></i> All topics</a>
          <button class="rail-btn" on:click={toggleSidebar} aria-label="Collapse sidebar" title="Collapse sidebar">
            <i class="ti ti-layout-sidebar-left-collapse" aria-hidden="true"></i>
          </button>
        </div>
        <nav class="sidebar-nav">
          {#if activeCat}
            <div class="rail-topic"><i class={`ti ${activeCat.icon}`} aria-hidden="true"></i> {activeCat.name}</div>
            {#if activeCat.guides.length}
              <ul class="nav-items">
                {#each activeCat.guides as g}
                  <li><a href={`/guides/${g.slug}`} class:on={currentGuide === g.slug}
                    aria-current={currentGuide === g.slug ? 'page' : undefined}>{g.title}</a></li>
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
      </div>
      <nav>
        <a href="/about">About</a>
        <a href="/contribute">Contribute</a>
        <a href="/rss">RSS</a>
        <span class="co-social">
          <a href={SOCIAL.github} target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><i class="ti ti-brand-github"></i></a>
          <a href={SOCIAL.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><i class="ti ti-brand-linkedin"></i></a>
        </span>
      </nav>
    </div>
  </footer>

  <CommandPalette bind:this={palette} {nav} />
{/if}
