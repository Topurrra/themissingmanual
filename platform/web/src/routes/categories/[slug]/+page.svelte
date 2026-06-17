<script>
  import { groupByLevel } from '$lib/difficulty.js';
  export let data;
  $: ({ category, guides } = data);
  $: groups = groupByLevel(guides);
</script>

<svelte:head><title>{category.name} — The Missing Manual</title></svelte:head>

<p class="nav-foot"><a href="/">← All topics</a></p>
<h1>{category.name}</h1>
<p class="tagline">{category.blurb}</p>

{#if guides.length === 0}
  <p class="cat-empty">Guides for {category.name} are on the way. In the meantime, browse what's live from the home page.</p>
{:else}
  <div class="cat-page">
    <aside class="cat-side">
      {#each groups as grp}
        <h3>{grp.level}</h3>
        <ul>
          {#each grp.guides as g}
            <li><a href={`/guides/${g.slug}`}>{g.title}</a></li>
          {/each}
        </ul>
      {/each}
    </aside>
    <div class="cat-main">
      {#each groups as grp}
        <h3>{grp.level}</h3>
        {#each grp.guides as g}
          <div class="level-group">
            <a href={`/guides/${g.slug}`} style="font-family:var(--font-display);font-weight:600;font-size:1.1rem;">{g.title}</a>
            <span class="summary">{g.summary}</span>
          </div>
        {/each}
      {/each}
    </div>
  </div>
{/if}
