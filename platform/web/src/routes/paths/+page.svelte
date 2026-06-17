<script>
  export let data;
  $: ({ tracks } = data);
</script>

<svelte:head><title>Learning paths — The Missing Manual</title></svelte:head>

<h1>Learning paths</h1>
<p class="tagline">Pick a path, make a few choices, and get the roadmap a senior who actually cares would hand you.</p>

<div class="track-cards">
  {#each tracks as t}
    <a class="track-card" href={`/paths/${t.slug}`}>
      <span class="track-name">{t.name}</span>
      <span class="track-blurb">{t.blurb}</span>
      <span class="track-meta">{t.step_count} steps · {t.categories.length} areas</span>
    </a>
  {:else}
    <p class="cat-empty">Paths are on the way.</p>
  {/each}
</div>
