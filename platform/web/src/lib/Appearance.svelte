<script>
  import { onMount } from 'svelte';

  // Shared appearance control: theme (system/light/dark) + font picker + quick
  // dark-mode toggle. Persists to localStorage (tmm-theme / tmm-font); app.html
  // applies the saved values before first paint, this just drives the UI + writes.
  const FONTS = [
    { id: 'IBM Plex Sans', name: 'IBM Plex', vibe: 'Technical · default' },
    { id: 'Inter', name: 'Inter', vibe: 'Clean, neutral · ★★★★★' },
    { id: 'Geist', name: 'Geist', vibe: 'Modern, precise · ★★★★★' },
    { id: 'Sora', name: 'Sora', vibe: 'Friendly, distinct · ★★★★☆' },
    { id: 'DM Sans', name: 'DM Sans', vibe: 'Elegant, soft · ★★★★☆' },
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', vibe: 'Premium, editorial · ★★★★☆' }
  ];

  let open = false;
  let theme = 'system';
  let font = 'IBM Plex Sans';

  onMount(() => {
    try {
      const t = localStorage.getItem('tmm-theme');
      theme = t === 'dark' || t === 'light' ? t : 'system';
      const f = localStorage.getItem('tmm-font');
      if (f) font = f;
    } catch (e) {}
  });

  function applyTheme(next) {
    theme = next;
    try {
      if (next === 'system') {
        localStorage.removeItem('tmm-theme');
        document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        localStorage.setItem('tmm-theme', next);
        document.documentElement.dataset.theme = next;
      }
    } catch (e) {}
  }
  function quickToggle() {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }
  function applyFont(id) {
    font = id;
    const stack = `"${id}", system-ui, -apple-system, "Segoe UI", sans-serif`;
    document.documentElement.style.setProperty('--font-display', stack);
    document.documentElement.style.setProperty('--font-body', stack);
    try { localStorage.setItem('tmm-font', id); } catch (e) {}
  }
  function onKeydown(e) { if (e.key === 'Escape') open = false; }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="bar-right">
  <div class="settings-wrap">
    <button class="icon-btn" on:click={() => (open = !open)} aria-label="Appearance" aria-expanded={open} title="Appearance">
      <i class="ti ti-settings" aria-hidden="true"></i>
    </button>
    {#if open}
      <button class="pop-backdrop" tabindex="-1" aria-hidden="true" on:click={() => (open = false)}></button>
      <div class="settings-pop" role="dialog" aria-label="Appearance">
        <p class="settings-label">Theme</p>
        <div class="seg">
          <button class:on={theme === 'light'} on:click={() => applyTheme('light')}>Light</button>
          <button class:on={theme === 'dark'} on:click={() => applyTheme('dark')}>Dark</button>
          <button class:on={theme === 'system'} on:click={() => applyTheme('system')}>System</button>
        </div>
        <p class="settings-label" style="margin-top:0.9rem">Font</p>
        <div class="font-list">
          {#each FONTS as f}
            <button class="font-opt" class:on={font === f.id} style={`font-family:'${f.id}',sans-serif`} on:click={() => applyFont(f.id)}>
              <span class="fo-name">{f.name}</span>
              <span class="fo-vibe">{f.vibe}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  <button class="icon-btn theme-toggle" on:click={quickToggle} aria-label="Toggle dark mode" title="Toggle dark mode">
    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  </button>
</div>
