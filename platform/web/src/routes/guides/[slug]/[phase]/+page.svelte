<script>
  import { page } from '$app/stores';
  import ReaderTools from '$lib/ReaderTools.svelte';
  import Glossary from '$lib/Glossary.svelte';
  import ReaderTTS from '$lib/ReaderTTS.svelte';
  import Quiz from '$lib/Quiz.svelte';
  import Mermaid from '$lib/Mermaid.svelte';
  import RunnableCode from '$lib/RunnableCode.svelte';
  import FeedbackWidget from '$lib/FeedbackWidget.svelte';
  export let data;
  $: phase = data.phase;

  // Default-on flag rule (same as the layout/admin toggles): unset/""/"1"/"true" ⇒ ON,
  // only explicit "0"/"false"/"off"/"no" ⇒ off. When off we simply don't mount the
  // enhancer; the underlying <pre> still renders as plain content.
  const flagOn = (v) => !['0', 'false', 'off', 'no'].includes(String(v ?? '').trim().toLowerCase());
  $: siteConfig = $page.data.siteConfig ?? {};
  $: runnableOn = flagOn(siteConfig.flag_runnable);
  $: mermaidOn = flagOn(siteConfig.flag_mermaid);

  // Preserve learning-path context: when the guide was reached from a path it
  // carries ?track=<slug>; keep it on this guide's own overview/phase links so
  // the learning-path sidebar persists while moving between phases.
  $: trackQ = $page.url.searchParams.get('track');
  $: q = trackQ ? `?track=${trackQ}` : '';

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
  // Last real phase of the guide → finishing its quiz completes the guide.
  $: isLastPhase = phase.phase_no > 0 && !nextPhase;
</script>

<svelte:head><title>{phase.title}</title></svelte:head>

<div class="crumb">
  <a href={`/guides/${phase.guide_slug}${q}`}>← Back to guide</a>
  <span>/</span>
  <span>Phase {phase.phase_no}</span>
</div>

<article class="reader" class:has-phasenav={hasFooterNav}>
  {@html phase.html}

  {#key `${phase.guide_slug}/${phase.phase_no}`}
    <Quiz guideSlug={phase.guide_slug} phaseNo={phase.phase_no} isLast={isLastPhase} />
  {/key}

  {#if hasFooterNav}
    <nav class="reader-nav phasenav" aria-label="Phase navigation">
      {#if prevPhase}
        <a class="prev" href={`/guides/${slug}/${prevPhase.phase_no}${q}`}>
          <span class="rn-label">← Previous</span>
          <span class="rn-title">{prevPhase.title}</span>
        </a>
      {:else if prevIsOverview}
        <a class="prev" href={`/guides/${slug}${q}`}>
          <span class="rn-label">← Overview</span>
          <span class="rn-title">{$page.data.guideTitle ?? 'Guide overview'}</span>
        </a>
      {:else}
        <span class="rn-spacer" aria-hidden="true"></span>
      {/if}

      {#if showOverview}
        <a class="overview" href={`/guides/${slug}${q}`}>
          <span class="rn-label">Guide</span>
          <span class="rn-title">Overview</span>
        </a>
      {/if}

      {#if nextPhase}
        <a class="next" href={`/guides/${slug}/${nextPhase.phase_no}${q}`}>
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
  <FeedbackWidget guideSlug={phase.guide_slug} phaseNo={phase.phase_no} />
  <ReaderTools />
  <Glossary />
  <ReaderTTS />
  {#if mermaidOn}<Mermaid />{/if}
  {#if runnableOn}<RunnableCode />{/if}
{/key}
