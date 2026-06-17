<script>
  import { highlight, guardSearchSubmit } from '$lib/search.js';
  export let data;
  $: ({ q, hits } = data);
</script>

<svelte:head><title>{q ? `Search: ${q}` : 'Search'}</title></svelte:head>

<h1>Search</h1>
<form method="GET" action="/search" class="search-field page-search" on:submit={guardSearchSubmit}>
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" aria-label="Search guides" />
</form>

{#if q}
  <p class="count">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”.</p>
  <ul class="results">
    {#each hits as h}
      <li>
        <a href={`/guides/${h.guide_slug}/${h.phase_no}`}>{@html highlight(h.title, q)}</a>
        <span class="summary">{@html highlight(h.summary, q)}</span>
      </li>
    {/each}
  </ul>
{/if}
