<script>
  import { guardSearchSubmit } from '$lib/search.js';
  export let data;
  $: ({ categories, recent } = data);
</script>

<svelte:head><title>The Missing Manual for Developers</title></svelte:head>

<section class="hero">
  <h1>The manual a senior who actually cares would hand you.</h1>
  <p class="tagline">Real-world knowledge nobody teaches, explained with zero ego. Not "build a todo app," not a 1000-page reference. Free forever.</p>
  <form method="GET" action="/search" class="search-field hero-search" on:submit={guardSearchSubmit}>
    <i class="ti ti-search" aria-hidden="true"></i>
    <input type="search" name="q" placeholder="Search… e.g. how to revert a commit" aria-label="Search guides" />
  </form>
</section>

<h2 class="section-eyebrow">Browse by topic</h2>
<div class="cat-grid">
  {#each categories as c}
    {#if c.count > 0}
      <a class="cat-card on" href={`/categories/${c.slug}`}>
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">{c.count} guide{c.count === 1 ? '' : 's'} →</span>
      </a>
    {:else}
      <div class="cat-card">
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">Coming soon</span>
      </div>
    {/if}
  {/each}
</div>

{#if recent.length}
  <h2 class="section-eyebrow">Newly added</h2>
  <ul class="guides">
    {#each recent as g}
      <li>
        <a href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </li>
    {/each}
  </ul>
{/if}
