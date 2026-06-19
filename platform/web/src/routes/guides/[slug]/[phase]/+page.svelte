<script>
  import { page } from '$app/stores';
  import ReaderTools from '$lib/ReaderTools.svelte';
  import Mermaid from '$lib/Mermaid.svelte';
  export let data;
  $: phase = data.phase;

  // Build a structured prev / overview / next footer from the guide's phases
  // (loaded by +layout.server.js as $page.data.guidePhases). This replaces the
  // author-written nav line at the end of the Markdown, which is hidden via CSS.
  $: slug = phase.guide_slug;
  $: phases = $page.data.guidePhases ?? [];
  $: realPhases = phases.filter((p) => p.phase_no > 0); // phase_no 0 is the overview
  $: prevPhase = realPhases.find((p) => p.phase_no === phase.phase_no - 1) ?? null;
  $: nextPhase = realPhases.find((p) => p.phase_no === phase.phase_no + 1) ?? null;
  // On the first phase, the natural "previous" step is the guide overview.
  $: prevIsOverview = !!slug && !prevPhase && phase.phase_no === 1;
  // Show the stand-alone overview card only when it isn't already the prev.
  $: showOverview = !!slug && phase.phase_no > 1;
  $: hasFooterNav = !!(prevPhase || prevIsOverview || nextPhase || showOverview);
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<div class="crumb">
  <a href={`/guides/${phase.guide_slug}`}>← Back to guide</a>
  <span>/</span>
  <span>Phase {phase.phase_no}</span>
</div>

<article class="reader" class:has-phasenav={hasFooterNav}>
  {@html phase.html}

  {#if hasFooterNav}
    <nav class="reader-nav phasenav" aria-label="Phase navigation">
      {#if prevPhase}
        <a class="prev" href={`/guides/${slug}/${prevPhase.phase_no}`}>
          <span class="rn-label">← Previous</span>
          <span class="rn-title">{prevPhase.title}</span>
        </a>
      {:else if prevIsOverview}
        <a class="prev" href={`/guides/${slug}`}>
          <span class="rn-label">← Overview</span>
          <span class="rn-title">{$page.data.guideTitle ?? 'Guide overview'}</span>
        </a>
      {:else}
        <span class="rn-spacer" aria-hidden="true"></span>
      {/if}

      {#if showOverview}
        <a class="overview" href={`/guides/${slug}`}>
          <span class="rn-label">Guide</span>
          <span class="rn-title">Overview</span>
        </a>
      {/if}

      {#if nextPhase}
        <a class="next" href={`/guides/${slug}/${nextPhase.phase_no}`}>
          <span class="rn-label">Next →</span>
          <span class="rn-title">{nextPhase.title}</span>
        </a>
      {:else}
        <span class="rn-spacer" aria-hidden="true"></span>
      {/if}
    </nav>
  {/if}
</article>

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <ReaderTools />
  <Mermaid />
{/key}
