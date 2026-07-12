<script>
  import { highlight, guardSearchSubmit } from '$lib/search.js';
  import { page } from '$app/stores';
  import AskPanel from '$lib/AskPanel.svelte';
  import Seo from '$lib/Seo.svelte';
  import { sendSearchResult } from '$lib/beacon.js';
  export let data;
  $: ({ q, hits, suggestion, cmdHits, cmdFirst } = data);
  $: askEnabled = $page.data.askEnabled;

  // Record the search once its result count is known (replaces the old
  // count-less beacon in lib/beacon.js's sendPageview) - guarded so a query
  // is only ever recorded once even as unrelated props re-run this block.
  let recordedFor = null;
  $: if (q && recordedFor !== q) {
    recordedFor = q;
    sendSearchResult(q, hits.length);
  }

  let copied = '';
  function copy(t) {
    try {
      navigator.clipboard.writeText(t);
      copied = t;
      setTimeout(() => { if (copied === t) copied = ''; }, 1200);
    } catch (e) {}
  }
</script>

<Seo
  title={q ? `Search: ${q} - The Missing Manual` : 'Search - The Missing Manual'}
  description="Search The Missing Manual's developer guides, cheat sheets, and glossary." />

<h1>Search</h1>
<form method="GET" action="/search" class="search-field page-search" on:submit={guardSearchSubmit}>
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" aria-label="Search guides" />
</form>

{#if q}
  {#if askEnabled}<AskPanel query={q} />{/if}
  {#if suggestion}
    <p class="did-you-mean">Did you mean <a href="/search?q={encodeURIComponent(suggestion)}">{suggestion}</a>?</p>
  {/if}

  <div class="results-wrap" class:cmds-first={cmdFirst}>
    {#if cmdHits.length}
      <section class="cmd-results">
        <h2 class="cmd-h"><i class="ti ti-terminal-2" aria-hidden="true"></i> Commands</h2>
        <ul class="cmd-list">
          {#each cmdHits as c}
            <li class="cmd-row">
              <a class="cmd-name" href={`/cheat-sheet?q=${encodeURIComponent(c.cmd)}`} title="Open in the cheat sheet"><code>{c.cmd}</code></a>
              <span class="cmd-tool">{c.tool}</span>
              <span class="cmd-desc">{c.desc}</span>
              <span class="cmd-ex">
                <code>{c.example}</code>
                <button class="cmd-copy" class:done={copied === c.example} on:click={() => copy(c.example)} aria-label="Copy example">
                  <i class={`ti ${copied === c.example ? 'ti-check' : 'ti-copy'}`} aria-hidden="true"></i>
                </button>
              </span>
            </li>
          {/each}
        </ul>
        <a class="cmd-all" href="/cheat-sheet">Browse the full cheat sheet →</a>
      </section>
    {/if}

    <section class="guide-results">
      <p class="count">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”.</p>
      <ul class="results">
        {#each hits as h}
          <li>
            <a href={`/guides/${h.guide_slug}/${h.phase_no}`}>{@html highlight(h.title, q)}</a>
            {#if h.snippet}
              <span class="snippet">{@html h.snippet}</span>
            {:else}
              <span class="summary">{@html highlight(h.summary, q)}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  </div>
{/if}

<style>
  .did-you-mean { color: var(--muted); font-size: 0.95rem; margin: 0.2rem 0 0.6rem; }
  .did-you-mean a { color: var(--accent); font-weight: 600; }
  .snippet { display: block; color: var(--muted); font-size: 0.9rem; margin-top: 3px; line-height: 1.5; }
  .snippet :global(b) { color: var(--accent); font-weight: 600; }

  /* Commands sit after guides by default; for command-shaped queries they jump first. */
  .results-wrap { display: flex; flex-direction: column; gap: 1.4rem; }
  .results-wrap.cmds-first .cmd-results { order: -1; }

  .cmd-h {
    display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-family: var(--font-mono);
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--faint); font-weight: 600; margin: 0 0 0.6rem;
  }
  .cmd-h .ti { font-size: 15px; color: var(--accent); }
  .cmd-list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .cmd-row {
    display: grid; grid-template-columns: minmax(120px, max-content) 1fr; gap: 0.1rem 0.8rem;
    align-items: baseline; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line);
  }
  .cmd-row:last-child { border-bottom: 0; }
  .cmd-row:hover { background: var(--surface); }
  .cmd-name code { font-family: var(--font-mono); font-size: 0.86rem; color: var(--accent-strong); white-space: nowrap; }
  .cmd-tool {
    grid-column: 2; font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--faint);
  }
  .cmd-desc { grid-column: 2; color: var(--body); font-size: 0.92rem; line-height: 1.5; }
  .cmd-ex { grid-column: 2; margin-top: 0.2rem; }
  .cmd-ex code {
    font-family: var(--font-mono); font-size: 0.82rem; color: var(--ink); background: var(--surface);
    border: 1px solid var(--line); border-radius: 7px; padding: 0.15rem 0.4rem; word-break: break-word;
  }
  .cmd-copy { cursor: pointer; border: 0; background: none; color: var(--faint); padding: 0.1rem 0.25rem; border-radius: 6px; margin-left: 0.25rem; }
  .cmd-copy:hover { color: var(--accent); background: var(--accent-tint); }
  .cmd-copy.done { color: #2e9e6b; }
  .cmd-copy .ti { font-size: 14px; vertical-align: -2px; }
  .cmd-all { display: inline-block; margin-top: 0.6rem; font-family: var(--font-mono); font-size: 0.78rem; color: var(--muted); }
  .cmd-all:hover { color: var(--accent); }
</style>
