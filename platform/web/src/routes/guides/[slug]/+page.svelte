<script>
  export let data;
  $: ({ guide, phases } = data);
</script>

<svelte:head><title>{guide.title}</title></svelte:head>

<p><a href="/">← All guides</a></p>
<h1>{guide.title}</h1>
<p class="tagline">{guide.summary}</p>

<ol class="phases">
  {#each phases.filter((p) => p.phase_no > 0) as p}
    <li>
      <a href={`/guides/${guide.slug}/${p.phase_no}`}>{p.title}</a>
      <span class="summary">{p.summary}</span>
    </li>
  {/each}
</ol>
