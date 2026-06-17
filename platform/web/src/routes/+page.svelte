<script>
  export let data;
</script>

<svelte:head><title>The Missing Manual for Developers</title></svelte:head>

<h1>The Missing Manual for Developers</h1>
<p class="tagline">The stuff nobody teaches — explained like a battle-hardened friend.</p>

<h2>Guides</h2>
<ul class="guides">
  {#each data.guides as g}
    <li>
      <a href={`/guides/${g.slug}`}>{g.title}</a>
      <span class="summary">{g.summary}</span>
    </li>
  {/each}
</ul>
