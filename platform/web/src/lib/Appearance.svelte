<script>
  import { onMount } from 'svelte';
  import { lofiEnabled, setLofiEnabled, syncLofiEnabled } from '$lib/lofi-store.js';
  import { beginnerMode, setBeginner, syncBeginner } from '$lib/beginner-store.js';
  import { focusTrap } from '$lib/focusTrap.js';

  // Shared appearance control: theme (system/light/dark) + font picker + quick
  // dark-mode toggle + lofi-player master switch + beginner mode. Persists to
  // localStorage; app.html applies the saved theme/font before first paint.
  const FONTS = [
    { id: 'IBM Plex Sans', name: 'IBM Plex', vibe: 'Technical · default' },
    { id: 'Inter', name: 'Inter', vibe: 'Clean, neutral · ★★★★★' },
    { id: 'Geist', name: 'Geist', vibe: 'Modern, precise · ★★★★★' },
    { id: 'Sora', name: 'Sora', vibe: 'Friendly, distinct · ★★★★☆' },
    { id: 'DM Sans', name: 'DM Sans', vibe: 'Elegant, soft · ★★★★☆' },
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', vibe: 'Premium, editorial · ★★★★☆' },
    { id: 'Atkinson Hyperlegible', name: 'Atkinson Hyperlegible', vibe: 'High-legibility · easier to read' }
  ];

  // Theme swatches (bg + accent drive the little preview chip). `dark` flags which
  // set data-mode="dark" (drives the sun/moon icon + dark-only polish).
  const THEMES = [
    { id: 'system', name: 'System', bg: 'linear-gradient(135deg,#fcfcfd 0 50%,#101012 50% 100%)', accent: '#0e7c86' },
    { id: 'light', name: 'Light', bg: '#fcfcfd', accent: '#0e7c86' },
    { id: 'dark', name: 'Dark', bg: '#101012', accent: '#4d969c' },
    { id: 'sepia', name: 'Sepia', bg: '#f4ecd8', accent: '#b06a2c' },
    { id: 'nord', name: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { id: 'contrast', name: 'Contrast Light', bg: '#ffffff', accent: '#0a5560' },
    { id: 'contrast-dark', name: 'Contrast Dark', bg: '#000000', accent: '#5fd0e0' }
  ];
  const DARK_THEMES = { dark: 1, nord: 1, dracula: 1, 'contrast-dark': 1 };

  let open = false;
  let theme = 'light';
  let font = 'IBM Plex Sans';

  $: lofiOn = $lofiEnabled;
  $: beginnerOn = $beginnerMode;

  onMount(() => {
    try {
      const t = localStorage.getItem('tmm-theme');
      theme = THEMES.some((x) => x.id === t) ? t : 'light';
      const f = localStorage.getItem('tmm-font');
      if (f) font = f;
    } catch (e) {}
    syncLofiEnabled();
    syncBeginner();
  });

  function applyTheme(next) {
    theme = next;
    const root = document.documentElement;
    try {
      if (next === 'system') {
        localStorage.setItem('tmm-theme', 'system'); // persist so System survives reload (unset now = light)
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.dataset.theme = dark ? 'dark' : 'light';
        root.dataset.mode = dark ? 'dark' : 'light';
      } else {
        localStorage.setItem('tmm-theme', next);
        root.dataset.theme = next;
        root.dataset.mode = DARK_THEMES[next] ? 'dark' : 'light';
      }
    } catch (e) {}
  }
  function quickToggle() {
    const cur = document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
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

  // The header has a backdrop-filter, which makes any position:fixed descendant
  // positioned relative to the HEADER (a containing block) instead of the viewport,
  // clipping the drawer. Portal it to <body> so fixed positioning works.
  function portal(node) {
    document.body.appendChild(node);
    return { destroy() { if (node.parentNode) node.parentNode.removeChild(node); } };
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="bar-right">
  <div class="settings-wrap">
    <button class="icon-btn" on:click={() => (open = !open)} aria-label="Appearance" aria-expanded={open} title="Appearance">
      <i class="ti ti-settings" aria-hidden="true"></i>
    </button>
    {#if open}
    <div use:portal>
      <button class="settings-scrim" tabindex="-1" aria-hidden="true" on:click={() => (open = false)}></button>
      <div class="settings-drawer" role="dialog" aria-modal="true" aria-label="Appearance" use:focusTrap>
        <div class="settings-drawer-head">
          <h2>Appearance</h2>
          <button class="settings-x" on:click={() => (open = false)} aria-label="Close settings"><i class="ti ti-x" aria-hidden="true"></i></button>
        </div>

        <p class="settings-label">Theme</p>
        <div class="theme-grid">
          {#each THEMES as t}
            <button class="theme-opt" class:on={theme === t.id} on:click={() => applyTheme(t.id)} aria-pressed={theme === t.id}>
              <span class="theme-sw" style={`background:${t.bg}`}><span class="theme-dot" style={`background:${t.accent}`}></span></span>
              <span>{t.name}</span>
            </button>
          {/each}
        </div>

        <p class="settings-label" style="margin-top:1rem">Font</p>
        <div class="font-list">
          {#each FONTS as f}
            <button class="font-opt" class:on={font === f.id} style={`font-family:'${f.id}',sans-serif`} on:click={() => applyFont(f.id)}>
              <span class="fo-name">{f.name}</span>
              <span class="fo-vibe">{f.vibe}</span>
            </button>
          {/each}
        </div>

        <p class="settings-label" style="margin-top:1rem">Beginner mode</p>
        <div class="seg">
          <button class:on={beginnerOn} on:click={() => setBeginner(true)}>On</button>
          <button class:on={!beginnerOn} on:click={() => setBeginner(false)}>Off</button>
        </div>
        <p class="settings-hint">Shows beginner-level guides only.</p>

        <p class="settings-label" style="margin-top:1rem">Lofi player</p>
        <div class="seg">
          <button class:on={lofiOn} on:click={() => setLofiEnabled(true)}>On</button>
          <button class:on={!lofiOn} on:click={() => setLofiEnabled(false)}>Off</button>
        </div>
      </div>
    </div>
    {/if}
  </div>
</div>
