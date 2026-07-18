<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { CHEATSHEETS } from '$lib/cheatsheets.js';
  import { focusTrap } from '$lib/focusTrap.js';

  export let nav = []; // [{ slug, name, icon, guides: [] }]

  let open = false;
  let q = '';
  let live = []; // guide/phase hits from the search API
  let suggestion = null; // "did you mean" spelling correction from the API
  let active = 0;
  let inputEl;
  let timer;

  const PAGES = [
    { title: 'Home', type: 'Page', icon: 'ti-home', url: '/' },
    { title: 'About', type: 'Page', icon: 'ti-info-circle', url: '/about' },
    { title: 'Contribute', type: 'Page', icon: 'ti-pencil', url: '/contribute' },
    { title: 'Cheat Sheet', type: 'Page', icon: 'ti-terminal-2', url: '/cheat-sheet' },
    { title: "What's New", type: 'Page', icon: 'ti-sparkles', url: '/changelog' },
    { title: 'Request a Guide', type: 'Page', icon: 'ti-message-plus', url: '/request' },
    { title: 'Practice', type: 'Page', icon: 'ti-keyboard', url: '/practice' },
    { title: 'Subscribe via RSS', type: 'Page', icon: 'ti-rss', url: '/rss.xml', external: true }
  ];

  // Cheat-sheet tools, indexed for ranked matching: tool name/id beats a command
  // name beats deep description text (so "tar" finds tar, not "start"/"restart").
  const CHEAT_INDEX = CHEATSHEETS.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    nme: (s.name + ' ' + s.id).toLowerCase(),
    cmds: s.commands.map((c) => c.cmd.toLowerCase()),
    hay: (s.blurb + ' ' + s.commands.map((c) => `${c.desc} ${c.example}`).join(' ')).toLowerCase()
  }));
  function cheatScore(t, ql) {
    if (t.id === ql || t.name.toLowerCase() === ql) return 100;
    if (t.id.startsWith(ql) || t.name.toLowerCase().startsWith(ql)) return 80;
    if (t.nme.includes(ql)) return 60;
    if (t.cmds.some((c) => c.includes(ql))) return 40;
    if (t.hay.includes(ql)) return 15;
    return 0;
  }

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
  // Cheat-sheet tools surface on any query that matches a tool name or a command.
  $: cheatHits = (() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return CHEAT_INDEX.map((t) => ({ t, s: cheatScore(t, ql) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(({ t }) => ({
        title: `${t.name} cheat sheet`,
        type: 'Cheat',
        icon: t.icon,
        url: `/cheat-sheet?tool=${t.id}`,
        group: 'Cheat Sheet'
      }));
  })();
  $: guideHits = live.map((h) => ({
    title: h.title,
    type: 'Guide',
    icon: 'ti-file-text',
    url: `/guides/${h.guide_slug}/${h.phase_no}`,
    group: 'Guides'
  }));
  $: items = [...guideHits, ...cheatHits, ...topics, ...pages];
  $: if (active >= items.length) active = Math.max(0, items.length - 1);

  // grouped view for rendering (keeps the flat index in `items`)
  $: grouped = items.reduce((acc, it, i) => {
    const last = acc[acc.length - 1];
    if (!last || last.group !== it.group) acc.push({ group: it.group, rows: [{ it, i }] });
    else last.rows.push({ it, i });
    return acc;
  }, []);

  async function runSearch(query) {
    if (!query.trim()) { live = []; suggestion = null; return; }
    try {
      const res = await fetch(`/search.json?q=${encodeURIComponent(query)}`);
      if (!res.ok) { live = []; suggestion = null; return; }
      const data = await res.json();
      live = data.hits || [];
      suggestion = data.suggestion || null;
    } catch (e) { live = []; suggestion = null; }
  }

  // Re-run the palette search with the suggested spelling (in-place, no navigation).
  function applySuggestion() {
    if (!suggestion) return;
    q = suggestion;
    runSearch(q);
    active = 0;
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
    suggestion = null;
    active = 0;
    setTimeout(() => inputEl && inputEl.focus(), 10);
  }
  function close() { open = false; }

  function choose(i) {
    const it = items[i];
    if (!it) return;
    if (it.soon) { close(); return; }
    close();
    // External targets (e.g. the /rss.xml feed endpoint) are server responses,
    // not in-app routes - goto() can't handle them, so do a real navigation.
    if (it.external) window.location.href = it.url;
    else goto(it.url);
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

{#if open}
<div class="cmdk-backdrop" on:click|self={close} role="presentation">
  <div class="cmdk" role="dialog" aria-modal="true" aria-label="Search" use:focusTrap>
    <div class="cmdk-top">
      <i class="ti ti-search" aria-hidden="true"></i>
      <!-- svelte-ignore a11y-autofocus -->
      <input
        class="cmdk-input"
        type="text"
        placeholder="Search guides, topics, pages…"
        aria-label="Search"
        role="combobox"
        aria-expanded="true"
        aria-controls="cmdk-listbox"
        aria-activedescendant={items.length ? `cmdk-opt-${active}` : undefined}
        data-autofocus
        bind:this={inputEl}
        bind:value={q}
        on:input={onInput}
        on:keydown={onInputKey}
      />
      <span class="cmdk-esc">esc</span>
    </div>

    <div class="cmdk-list" id="cmdk-listbox" role="listbox" aria-label="Search results">
      {#if suggestion}
        <button type="button" class="cmdk-suggest" on:click={applySuggestion}>
          <i class="ti ti-arrow-back-up" aria-hidden="true"></i>
          <span>Did you mean <b>{suggestion}</b>?</span>
        </button>
      {/if}
      {#if items.length === 0}
        <div class="cmdk-empty">No matches for “{q}”.</div>
      {:else}
        {#each grouped as g}
          <div class="cmdk-group" role="presentation">{g.group}</div>
          {#each g.rows as row}
            <div
              class="cmdk-item"
              class:active={row.i === active}
              class:soon={row.it.soon}
              role="option"
              id={`cmdk-opt-${row.i}`}
              aria-selected={row.i === active}
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
      <span><span class="k">/</span> toggle</span>
    </div>
  </div>
</div>
{/if}

<style>
  .cmdk-suggest {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    margin: 0.3rem 0 0.1rem;
    padding: 0.5rem 0.7rem;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: 0.86rem;
    text-align: left;
    cursor: pointer;
  }
  .cmdk-suggest:hover { background: var(--accent-tint); }
  .cmdk-suggest .ti { color: var(--accent); font-size: 16px; flex: none; }
  .cmdk-suggest b { color: var(--accent); font-weight: 600; }
</style>
