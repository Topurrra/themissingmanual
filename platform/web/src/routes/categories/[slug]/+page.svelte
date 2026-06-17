<script>
  import { groupByLevel } from '$lib/difficulty.js';
  export let data;
  $: ({ category, guides } = data);
  $: groups = groupByLevel(guides);
</script>

<svelte:head><title>{category.name} — The Missing Manual</title></svelte:head>

<h1>{category.name}</h1>
<p class="tagline">{category.blurb}</p>

{#if guides.length === 0}
  <p class="cat-empty">Guides for {category.name} are on the way. In the meantime, browse what's live from the home page.</p>
{:else}
  {#each groups as grp}
    <h2 class="level-head">{grp.level}</h2>
    {#each grp.guides as g}
      <div class="guide-row">
        <a class="guide-link" href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </div>
    {/each}
  {/each}
{/if}
