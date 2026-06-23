<script>
  import { groupByLevel, levelLabel } from '$lib/difficulty.js';
  import { beginnerMode } from '$lib/beginner-store.js';
  export let data;
  $: ({ category, guides } = data);

  // In beginner mode, show only Basic-level guides.
  $: visibleGuides = guides.filter((g) => !$beginnerMode || levelLabel(g.difficulty) === 'Basic');

  // Categories like Frameworks tag guides with a sub-group (a language). When present,
  // section the page by language (ungrouped guides first); otherwise group by level.
  $: hasGroups = visibleGuides.some((g) => g.group);
  $: ungrouped = visibleGuides.filter((g) => !g.group);
  $: langGroups = (() => {
    const out = [];
    const by = new Map();
    for (const g of visibleGuides) {
      if (!g.group) continue;
      let grp = by.get(g.group);
      if (!grp) {
        grp = { name: g.group, guides: [] };
        by.set(g.group, grp);
        out.push(grp);
      }
      grp.guides.push(g);
    }
    return out;
  })();

  $: levelGroups = groupByLevel(visibleGuides);
  const dotClass = (level) => (level === 'Intermediate' ? 'mid' : level === 'Advanced' ? 'adv' : '');
</script>

<svelte:head><title>{category.name} — The Missing Manual</title></svelte:head>

<div class="crumb"><a href="/">All topics</a> <span>/</span> <span>{category.name}</span></div>
<h1 class="page-title">{category.name}</h1>
<p class="tagline">{category.blurb}</p>

{#if guides.length === 0}
  <p class="cat-empty">Guides for {category.name} are on the way. In the meantime, browse what's live from the home page.</p>
{:else if visibleGuides.length === 0}
  <p class="cat-empty">No beginner-level guides in {category.name} yet. Turn off beginner mode (the gear, top right) to see everything here.</p>
{:else if hasGroups}
  {#each ungrouped as g}
    <div class="guide-row">
      <a class="guide-link" href={`/guides/${g.slug}`}>{g.title}</a>
      <span class="summary">{g.summary}</span>
    </div>
  {/each}
  {#each langGroups as grp}
    <h2 class="level-head lang-head">{grp.name} <span class="lang-count">{grp.guides.length}</span></h2>
    {#each grp.guides as g}
      <div class="guide-row">
        <a class="guide-link" href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </div>
    {/each}
  {/each}
{:else}
  {#each levelGroups as grp}
    <h2 class="level-head"><span class={`dot ${dotClass(grp.level)}`}></span> {grp.level}</h2>
    {#each grp.guides as g}
      <div class="guide-row">
        <a class="guide-link" href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </div>
    {/each}
  {/each}
{/if}

<style>
  .lang-head {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .lang-count {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--faint);
  }
</style>
