<script>
  export let data;
  $: phase = data.phase;
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<p class="nav-foot"><a href={`/guides/${phase.guide_slug}`}>← Back to guide</a></p>
<div class="meta-eyebrow">{phase.guide_slug.replace(/-/g, ' ')} · phase {phase.phase_no}</div>
<article class="reader">
  {@html phase.html}
</article>
