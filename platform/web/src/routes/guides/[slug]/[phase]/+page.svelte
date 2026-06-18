<script>
  import ReaderTools from '$lib/ReaderTools.svelte';
  export let data;
  $: phase = data.phase;
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<div class="crumb">
  <a href={`/guides/${phase.guide_slug}`}>← Back to guide</a>
  <span>/</span>
  <span>Phase {phase.phase_no}</span>
</div>

<article class="reader">
  {@html phase.html}
</article>

<ReaderTools />
