<script>
  export let data;
  $: phase = data.phase;
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<p><a href={`/guides/${phase.guide_slug}`}>← Back to guide</a></p>
<article class="reader">
  {@html phase.html}
</article>
