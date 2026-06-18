<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  export let nav = []; // [{ slug, name, icon, guides: [] }]

  let open = false;
  let q = '';
  let live = []; // guide/phase hits from the search API
  let active = 0;
  let inputEl;
  let timer;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const PAGES = [
    { title: 'Home', type: 'Page', icon: 'ti-home', url: '/' },
    { title: 'About', type: 'Page', icon: 'ti-info-circle', url: '/about' },
    { title: 'Contribute', type: 'Page', icon: 'ti-pencil', url: '/contribute' },
    { title: 'Subscribe via RSS', type: 'Page', icon: 'ti-rss', url: '/rss' }
  ];

  function matches(text, query) {
    if (!query) return true;
    const hay = text.toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  }

  // static entries (topics + pages), filtered by the query
  $: topics = nav
    .filter((c) => matches(c.name, q))
    .map((c) => ({
      title: c.name,
      type: 'Topic',
      icon: c.icon || 'ti-folder',
      url: `/categories/${c.slug}`,
      soon: !(c.guides && c.guides.length),
      group: 'Topics'
    }));
  $: pages = PAGES.filter((p) => matches(p.title, q)).map((p) => ({ ...p, group: 'Pages' }));
  $: guideHits = live.map((h) => ({
    title: h.title,
    type: 'Guide',
    icon: 'ti-file-text',
    url: `/guides/${h.guide_slug}/${h.phase_no}`,
    group: 'Guides'
  }));
  $: items = [...guideHits, ...topics, ...pages];
  $: if (active >= items.length) active = Math.max(0, items.length - 1);

  // grouped view for rendering (keeps the flat index in `items`)
  $: grouped = items.reduce((acc, it, i) => {
    const last = acc[acc.length - 1];
    if (!last || last.group !== it.group) acc.push({ group: it.group, rows: [{ it, i }] });
    else last.rows.push({ it, i });
    return acc;
  }, []);

  async function runSearch(query) {
    if (!query.trim()) { live = []; return; }
    try {
      const res = await fetch(`/search.json?q=${encodeURIComponent(query)}`);
      if (!res.ok) { live = []; return; }
      const data = await res.json();
      live = data.hits || [];
    } catch (e) { live = []; }
  }

  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(q), 140);
    active = 0;
  }

  export function show() {
    open = true;
    q = '';
    live = [];
    active = 0;
    setTimeout(() => inputEl && inputEl.focus(), 10);
  }
  function close() { open = false; }

  function choose(i) {
    const it = items[i];
    if (!it) return;
    if (it.soon) { close(); return; }
    close();
    goto(it.url);
  }

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open ? close() : show(); return; }
    if (open && e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!open && e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) { e.preventDefault(); show(); }
  }
  function onInputKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="cmdk-backdrop" hidden={!open} on:click|self={close} role="presentation">
  <div class="cmdk" role="dialog" aria-label="Search">
    <div class="cmdk-top">
      <i class="ti ti-search" aria-hidden="true"></i>
      <!-- svelte-ignore a11y-autofocus -->
      <input
        class="cmdk-input"
        type="text"
        placeholder="Search guides, topics, pages…"
        aria-label="Search"
        bind:this={inputEl}
        bind:value={q}
        on:input={onInput}
        on:keydown={onInputKey}
      />
      <span class="cmdk-esc">esc</span>
    </div>

    <div class="cmdk-list">
      {#if items.length === 0}
        <div class="cmdk-empty">No matches for “{q}”.</div>
      {:else}
        {#each grouped as g}
          <div class="cmdk-group">{g.group}</div>
          {#each g.rows as row}
            <div
              class="cmdk-item"
              class:active={row.i === active}
              class:soon={row.it.soon}
              role="button"
              tabindex="-1"
              on:mousemove={() => (active = row.i)}
              on:click={() => choose(row.i)}
            >
              <i class={`ti ${row.it.icon}`} aria-hidden="true"></i>
              <div class="ci-body">
                <div class="ci-title">{row.it.title}</div>
                <div class="ci-type">{row.it.type}</div>
              </div>
              {#if row.it.soon}<span class="cmdk-soon">soon</span>{/if}
              <i class="ti ti-corner-down-left ci-go" aria-hidden="true"></i>
            </div>
          {/each}
        {/each}
      {/if}
    </div>

    <div class="cmdk-foot">
      <span><span class="k">↑</span><span class="k">↓</span> navigate</span>
      <span><span class="k">↵</span> open</span>
      <span><span class="k">{isMac ? '⌘' : 'Ctrl'} K</span> toggle</span>
    </div>
  </div>
</div>
