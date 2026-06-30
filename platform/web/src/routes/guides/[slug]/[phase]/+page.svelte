<script>
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';
  import Seo from '$lib/Seo.svelte';
  import { quizFor, parseQuizBlock } from '$lib/quizzes.js';
  import Freshness from '$lib/Freshness.svelte';
  import ReaderTools from '$lib/ReaderTools.svelte';
  import Glossary from '$lib/Glossary.svelte';
  import Playgrounds from '$lib/Playgrounds.svelte';
  import ReaderTTS from '$lib/ReaderTTS.svelte';
  import Quiz from '$lib/Quiz.svelte';
  import Mermaid from '$lib/Mermaid.svelte';
  import RunnableCode from '$lib/RunnableCode.svelte';
  import FeedbackWidget from '$lib/FeedbackWidget.svelte';
  export let data;
  $: phase = data.phase;

  const flagOn = (v) => !['0', 'false', 'off', 'no'].includes(String(v ?? '').trim().toLowerCase());
  $: siteConfig = $page.data.siteConfig ?? {};
  $: runnableOn = flagOn(siteConfig.flag_runnable);
  $: mermaidOn = flagOn(siteConfig.flag_mermaid);

  $: trackQ = $page.url.searchParams.get('track');
  $: q = trackQ ? `?track=${trackQ}` : '';

  $: slug = phase.guide_slug;
  $: phases = $page.data.guidePhases ?? [];
  $: realPhases = phases.filter((p) => p.phase_no > 0);
  $: prevPhase = realPhases.find((p) => p.phase_no === phase.phase_no - 1) ?? null;
  $: nextPhase = realPhases.find((p) => p.phase_no === phase.phase_no + 1) ?? null;
  $: prevIsOverview = !!slug && !prevPhase && phase.phase_no === 1;
  $: showOverview = !!slug && phase.phase_no > 1;
  $: hasFooterNav = !!(prevPhase || prevIsOverview || nextPhase || showOverview);
  $: isLastPhase = phase.phase_no > 0 && !nextPhase;

  // SEO/AEO structured data: the phase as an Article, a breadcrumb, and — when the
  // phase has quiz questions — a FAQPage (answer-engine friendly).
  $: origin = siteOrigin($page.url.origin);
  $: guideTitle = $page.data.guideTitle ?? slug;
  $: mdQuiz = parseQuizBlock(phase.markdown);
  $: quiz = mdQuiz && mdQuiz.length ? mdQuiz : quizFor(slug, phase.phase_no);
  $: faq = quiz;
  $: jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: phase.title, description: phase.summary,
      author: { '@type': 'Organization', name: 'The Missing Manual' },
      publisher: { '@type': 'Organization', name: 'The Missing Manual' },
      mainEntityOfPage: `${origin}/guides/${slug}/${phase.phase_no}`,
      isPartOf: { '@type': 'Article', name: guideTitle, url: `${origin}/guides/${slug}` }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: guideTitle, item: `${origin}/guides/${slug}` },
        { '@type': 'ListItem', position: 3, name: phase.title, item: `${origin}/guides/${slug}/${phase.phase_no}` }
      ]
    },
    ...(faq.length
      ? [{
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: faq.map((qq) => ({
            '@type': 'Question', name: qq.q,
            acceptedAnswer: { '@type': 'Answer', text: qq.choices[qq.answer] }
          }))
        }]
      : [])
  ];
</script>

<Seo title={`${phase.title} — The Missing Manual`} description={phase.summary} type="article" image={`/guides/${slug}/og.svg`} {jsonld} />

<div class="crumb">
  <a href={`/guides/${phase.guide_slug}${q}`}>← Back to guide</a>
  <span>/</span>
  <span>Phase {phase.phase_no}</span>
</div>
<div style="margin: 0.1rem 0 1.2rem;"><Freshness date={phase.updated} /></div>

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <ReaderTTS />
{/key}

<article class="reader" class:has-phasenav={hasFooterNav}>
  {@html phase.html}

  {#key `${phase.guide_slug}/${phase.phase_no}`}
    <Quiz guideSlug={phase.guide_slug} phaseNo={phase.phase_no} isLast={isLastPhase} questions={quiz} />
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
  <Playgrounds />
  {#if mermaidOn}<Mermaid />{/if}
  {#if runnableOn}<RunnableCode />{/if}
{/key}
