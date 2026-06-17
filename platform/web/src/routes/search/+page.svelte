<script>
  export let data;
  $: ({ q, hits } = data);
</script>

<svelte:head><title>{q ? `Search: ${q}` : 'Search'}</title></svelte:head>

<h1>Search</h1>
<form method="GET" action="/search" class="searchbar">
  <input type="search" name="q" value={q} placeholder="e.g. how to revert a commit" autofocus />
  <button type="submit">Search</button>
</form>

{#if q}
  <p class="count">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”.</p>
  <ul class="results">
    {#each hits as h}
      <li>
        <a href={`/guides/${h.guide_slug}/${h.phase_no}`}>{h.title}</a>
        <span class="summary">{h.summary}</span>
      </li>
    {/each}
  </ul>
{/if}
