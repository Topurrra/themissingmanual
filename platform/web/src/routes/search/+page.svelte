<script>
  import { highlight, guardSearchSubmit } from '$lib/search.js';
  export let data;
  $: ({ q, hits, suggestion } = data);
</script>

<svelte:head><title>{q ? `Search: ${q}` : 'Search'}</title></svelte:head>

<h1>Search</h1>
<form method="GET" action="/search" class="search-field page-search" on:submit={guardSearchSubmit}>
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" aria-label="Search guides" />
</form>

{#if q}
  {#if suggestion}
    <p class="did-you-mean">Did you mean <a href="/search?q={encodeURIComponent(suggestion)}">{suggestion}</a>?</p>
  {/if}
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
{/if}

<style>
  .did-you-mean {
    color: var(--muted);
    font-size: 0.95rem;
    margin: 0.2rem 0 0.6rem;
  }
  .did-you-mean a {
    color: var(--accent);
    font-weight: 600;
  }
  .snippet {
    display: block;
    color: var(--muted);
    font-size: 0.9rem;
    margin-top: 3px;
    line-height: 1.5;
  }
  .snippet :global(b) {
    color: var(--accent);
    font-weight: 600;
  }
</style>
