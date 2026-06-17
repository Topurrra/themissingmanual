<script>
  import '../../app.css';
  import { page } from '$app/stores';

  $: path = $page.url.pathname;
  $: bare = path === '/admin/login';

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { href: '/admin/content', label: 'Content', icon: 'ti-files' },
    { href: '/admin/categories', label: 'Categories', icon: 'ti-category' }
  ];
  function active(href) {
    return href === '/admin' ? path === '/admin' : path.startsWith(href);
  }
</script>

{#if bare}
  <slot />
{:else}
  <div class="admin">
    <header class="admin-bar">
      <a href="/admin" class="admin-brand">The Missing Manual <span>admin</span></a>
      <nav class="admin-nav">
        {#each nav as n}
          <a href={n.href} class:on={active(n.href)}><i class={`ti ${n.icon}`} aria-hidden="true"></i> {n.label}</a>
        {/each}
      </nav>
      <form method="POST" action="/admin/login?/logout" class="admin-logout">
        <button type="submit"><i class="ti ti-logout" aria-hidden="true"></i> Logout</button>
      </form>
    </header>
    <main class="admin-main"><slot /></main>
  </div>
{/if}
