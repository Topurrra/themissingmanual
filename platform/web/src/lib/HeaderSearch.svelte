<script>
  import { goto } from '$app/navigation';
  import { guardSearchSubmit } from '$lib/search.js';

  let q = '';
  let hits = []; // top guide/phase hits from the search API
  let open = false; // dropdown visibility
  let active = -1; // -1 = nothing highlighted (Enter submits to /search)
  let timer;
  let wrapEl;
  let formEl;

  // Show at most 3 instant options under the field.
  $: shown = hits.slice(0, 3);
  $: showDropdown = open && q.trim().length > 0;

  async function runSearch(query) {
    if (!query.trim()) { hits = []; return; }
    try {
      const res = await fetch(`/search.json?q=${encodeURIComponent(query)}`);
      if (!res.ok) { hits = []; return; }
      const data = await res.json();
      hits = data.hits || [];
    } catch (e) { hits = []; }
  }

  function onInput() {
    clearTimeout(timer);
    active = -1;
    open = true;
    const query = q;
    timer = setTimeout(() => runSearch(query), 140);
  }

  function close() { open = false; active = -1; }

  function go(hit) {
    close();
    goto(`/guides/${hit.guide_slug}/${hit.phase_no}`);
  }

  // Full results page — what Enter / the Search button has always done.
  function submitAll() {
    if (!q.trim()) return;
    close();
    goto(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open = true;
      active = Math.min(active + 1, shown.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, -1);
    } else if (e.key === 'Enter') {
      // A highlighted suggestion navigates to it; otherwise fall through to the
      // form submit (guarded) → full /search page.
      if (active >= 0 && shown[active]) {
        e.preventDefault();
        go(shown[active]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  }

  // Close when focus leaves the whole search region (covers blur + outside-click).
  function onFocusOut(e) {
    if (wrapEl && !wrapEl.contains(e.relatedTarget)) close();
  }
</script>

<form
  bind:this={formEl}
  method="GET"
  action="/search"
  class="header-search"
  on:submit={(e) => { guardSearchSubmit(e); if (!e.defaultPrevented) close(); }}
>
  <div class="search-field typeahead-wrap" bind:this={wrapEl} on:focusout={onFocusOut}>
    <i class="ti ti-search" aria-hidden="true"></i>
    <input
      type="search"
      name="q"
      placeholder="Search… e.g. undo a commit"
      aria-label="Search guides"
      role="combobox"
      aria-expanded={showDropdown}
      aria-controls="typeahead-list"
      aria-autocomplete="list"
      autocomplete="off"
      bind:value={q}
      on:input={onInput}
      on:keydown={onKey}
      on:focus={() => { if (q.trim()) open = true; }}
    />
    <slot />

    {#if showDropdown}
      <div class="typeahead-pop" id="typeahead-list" role="listbox" aria-label="Search suggestions">
        {#if shown.length}
          {#each shown as h, i}
            <button
              type="button"
              class="typeahead-hit"
              class:active={i === active}
              role="option"
              aria-selected={i === active}
              on:mousemove={() => (active = i)}
              on:mousedown|preventDefault={() => go(h)}
            >
              <i class="ti ti-file-text" aria-hidden="true"></i>
              <span class="th-body">
                <span class="th-title">{h.title}</span>
                {#if h.snippet}<span class="th-snippet">{@html h.snippet}</span>{/if}
              </span>
            </button>
          {/each}
        {:else}
          <div class="typeahead-empty">No quick matches — press Enter to search.</div>
        {/if}
        <button
          type="button"
          class="typeahead-all"
          class:active={active === -1}
          role="option"
          aria-selected={active === -1}
          on:mousemove={() => (active = -1)}
          on:mousedown|preventDefault={submitAll}
        >
          <i class="ti ti-search" aria-hidden="true"></i>
          <span>Search all results for <b>“{q.trim()}”</b></span>
          <i class="ti ti-arrow-right th-go" aria-hidden="true"></i>
        </button>
      </div>
    {/if}
  </div>
</form>

<style>
  .typeahead-wrap { position: relative; }

  .typeahead-pop {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 60;
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: var(--shadow-pop);
    padding: 0.3rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .typeahead-hit,
  .typeahead-all {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 9px;
    padding: 0.5rem 0.6rem;
    font: inherit;
    text-align: left;
    color: var(--body);
    cursor: pointer;
  }
  .typeahead-hit .ti,
  .typeahead-all .ti { flex: none; font-size: 16px; color: var(--faint); }
  .typeahead-hit.active,
  .typeahead-all.active { background: var(--accent-tint); }
  .typeahead-hit.active .ti { color: var(--accent); }

  .th-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .th-title {
    font-size: 0.9rem; color: var(--ink); font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .th-snippet {
    font-size: 0.78rem; color: var(--muted); line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .th-snippet :global(mark) { background: var(--accent-tint); color: var(--accent-strong); padding: 0 1px; border-radius: 2px; }

  .typeahead-all {
    margin-top: 1px;
    border-top: 1px solid var(--line);
    border-radius: 0 0 9px 9px;
    color: var(--muted);
    font-size: 0.86rem;
  }
  .typeahead-all b { color: var(--ink); font-weight: 600; }
  .typeahead-all.active { color: var(--ink); }
  .typeahead-all .th-go { margin-left: auto; color: var(--accent); }

  .typeahead-empty { padding: 0.6rem; font-size: 0.85rem; color: var(--muted); }
</style>
