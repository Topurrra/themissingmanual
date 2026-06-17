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
