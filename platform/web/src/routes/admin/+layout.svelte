<script>
  import '../../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Appearance from '$lib/Appearance.svelte';
  import LofiPlayer from '$lib/LofiPlayer.svelte';

  $: path = $page.url.pathname;
  $: bare = path === '/admin/login';

  // Sidebar nav — everything EXCEPT Settings (Settings lives in the header gear).
  const nav = [
    { href: '/admin', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { href: '/admin/content', label: 'Content', icon: 'ti-files' },
    { href: '/admin/backlog', label: 'Backlog', icon: 'ti-list-search' },
    { href: '/admin/categories', label: 'Categories', icon: 'ti-category' },
    { href: '/admin/analytics', label: 'Analytics', icon: 'ti-chart-bar' },
    { href: '/admin/ai-search', label: 'AI Search', icon: 'ti-sparkles' },
    { href: '/admin/feedback', label: 'Feedback', icon: 'ti-message-2' },
    { href: '/admin/health', label: 'Health', icon: 'ti-stethoscope' },
    { href: '/admin/operations', label: 'Operations', icon: 'ti-server-cog' },
    { href: '/admin/account', label: 'Account', icon: 'ti-user' },
    { href: '/admin/settings', label: 'Settings', icon: 'ti ti-settings' }
  ];
  function active(href) {
    return href === '/admin' ? path === '/admin' : path.startsWith(href);
  }

  let collapsed = false;
  onMount(() => {
    try {
      collapsed = localStorage.getItem('tmm-admin-sidebar') === 'collapsed';
    } catch (e) {}
  });
  function toggleSidebar() {
    collapsed = !collapsed;
    try {
      localStorage.setItem('tmm-admin-sidebar', collapsed ? 'collapsed' : 'open');
    } catch (e) {}
  }
</script>

{#if bare}
  <slot />
{:else}
  <div class="admin">
    <header class="admin-bar">
      <button class="adm-rail-btn" on:click={toggleSidebar}
        aria-label={collapsed ? 'Show sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Show sidebar' : 'Collapse sidebar'}>
        <i class="ti ti-menu-2" aria-hidden="true"></i>
      </button>
      <a href="/admin" class="admin-brand">The Missing Manual <span>admin</span></a>
      <span class="admin-spacer"></span>
      <LofiPlayer />
      <Appearance />
      <form method="POST" action="/admin/login?/logout" class="admin-logout">
        <button type="submit"><i class="ti ti-logout" aria-hidden="true"></i> Logout</button>
      </form>
    </header>
    <div class="adm-shell" class:collapsed>
      <aside class="adm-sidebar">
        <nav class="adm-nav">
          {#each nav as n}
            <a href={n.href} class:on={active(n.href)}
              aria-current={active(n.href) ? 'page' : undefined} title={n.label}>
              <i class={`ti ${n.icon}`} aria-hidden="true"></i>
              <span class="adm-nav-label">{n.label}</span>
            </a>
          {/each}
        </nav>
      </aside>
      <main class="admin-main"><slot /></main>
    </div>
  </div>
{/if}
