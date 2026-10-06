<script>
  // Switches between the two halves of the training area. They are separate routes
  // (/train and /games), so this is page navigation (links + aria-current), styled
  // like the Additional Info tabs rather than an ARIA tablist.
  export let active = 'train';
  const tabs = [
    { id: 'train', href: '/train', label: 'Brain workouts', icon: 'ti-brain' },
    { id: 'games', href: '/games', label: 'Board games', icon: 'ti-chess-knight' }
  ];
</script>

<nav class="train-tabs" aria-label="Training area">
  {#each tabs as tab}
    <a href={tab.href} aria-current={active === tab.id ? 'page' : undefined}>
      <i class={`ti ${tab.icon}`} aria-hidden="true"></i>{tab.label}
    </a>
  {/each}
</nav>

<style>
  .train-tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--line); margin-bottom: 2rem; }
  .train-tabs a { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 48px; padding: 0.7rem 0.5rem; border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--muted); font-size: 0.95rem; font-weight: 500; text-decoration: none; }
  .train-tabs a:hover { color: var(--ink); }
  .train-tabs a[aria-current="page"] { color: var(--accent-strong); border-bottom-color: var(--accent-strong); }
  @media (max-width: 640px) {
    .train-tabs { gap: 0.75rem; margin-bottom: 1.5rem; }
    .train-tabs a { flex: 1; justify-content: center; padding-right: 0.25rem; padding-left: 0.25rem; }
  }
</style>
