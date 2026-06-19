<script>
  import { page } from '$app/stores';
  export let data;
  $: ({ guide, phases } = data);
  // Preserve learning-path context: when the guide was reached from a path it
  // carries ?track=<slug>; keep it on the guide's own phase links so the
  // learning-path sidebar persists while reading. Other links (home) drop it.
  $: trackQ = $page.url.searchParams.get('track');
  $: q = trackQ ? `?track=${trackQ}` : '';
</script>

<svelte:head><title>{guide.title}</title></svelte:head>

<div class="crumb"><a href="/">All topics</a> <span>/</span> <span>{guide.title}</span></div>
<h1 class="page-title">{guide.title}</h1>
<p class="tagline">{guide.summary}</p>

<ol class="phases">
  {#each phases.filter((p) => p.phase_no > 0) as p}
    <li>
      <a href={`/guides/${guide.slug}/${p.phase_no}${q}`}>{p.title}</a>
      <span class="summary">{p.summary}</span>
    </li>
  {/each}
</ol>
