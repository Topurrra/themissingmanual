<script>
  export let data;
  $: ({ categories, recent, tracks } = data);
  $: iconFor = Object.fromEntries(categories.map((c) => [c.slug, c.icon]));
  $: totalGuides = categories.reduce((a, c) => a + (c.count || 0), 0);
</script>

<svelte:head><title>The Missing Manual for Developers</title></svelte:head>

<section class="hero">
  <!-- <h1>The manual a senior who <span class="accent">actually cares</span> would hand you.</h1>
  <p class="tagline">Real-world knowledge nobody teaches, explained with zero ego. Not “build a todo app,” not a 1000-page reference. Free forever.</p> -->
  <h1>Learn how things <span class="accent">actually </span> works.</h1>
  <p class="tagline">Clear, practical, and free — forever.</p>
  <div class="hero-stats">
    <span><b>{totalGuides}</b> guide{totalGuides === 1 ? '' : 's'}</span>
    <span><b>{categories.length}</b> topics</span>
    <span><b>{tracks?.length ?? 0}</b> learning paths</span>
    <span><b>Free</b> Forever</span>
  </div>
</section>

{#if tracks && tracks.length}
  <div class="section-head">
    <h2 class="section-eyebrow">Learning paths</h2>
    <a class="section-link" href="/paths">See all paths →</a>
  </div>
  <div class="track-cards">
    {#each tracks as t, i}
      <a class="track-card" href={`/paths/${t.slug}`}>
        <span class="track-index">{String(i + 1).padStart(2, '0')}</span>
        <span class="track-name">{t.name}</span>
        <span class="track-blurb">{t.blurb}</span>
        <span class="track-meta">{t.step_count} steps</span>
      </a>
    {/each}
  </div>
{/if}

<h2 class="section-eyebrow">Browse by topic</h2>
<div class="cat-grid">
  {#each categories as c}
    {#if c.count > 0}
      <a class="cat-card" href={`/categories/${c.slug}`}>
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">{c.count} guide{c.count === 1 ? '' : 's'} →</span>
      </a>
    {:else}
      <div class="cat-card disabled">
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
        <span class="guide-ico" title={g.category}><i class={`ti ${iconFor[g.category] || 'ti-file-text'}`} aria-hidden="true"></i></span>
        <span class="guide-body">
          <a href={`/guides/${g.slug}`}>{g.title}</a>
          <span class="summary">{g.summary}</span>
        </span>
      </li>
    {/each}
  </ul>
{/if}
