<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';
  import { tutorOpen } from '$lib/tutor-store.js';
  import Seo from '$lib/Seo.svelte';
  import { quizFor, parseQuizBlock } from '$lib/quizzes.js';
  import { parseExerciseBlock } from '$lib/exercises.js';
  import Exercise from '$lib/Exercise.svelte';
  import ShareTil from '$lib/ShareTil.svelte';
  import Freshness from '$lib/Freshness.svelte';
  import ReaderTools from '$lib/ReaderTools.svelte';
  import Glossary from '$lib/Glossary.svelte';
  import Playgrounds from '$lib/Playgrounds.svelte';
  import Explainers from '$lib/Explainers.svelte';
  import ReaderTTS from '$lib/ReaderTTS.svelte';
  import Quiz from '$lib/Quiz.svelte';
  import Mermaid from '$lib/Mermaid.svelte';
  import RunnableCode from '$lib/RunnableCode.svelte';
  import FeedbackWidget from '$lib/FeedbackWidget.svelte';
  import Annotations from '$lib/Annotations.svelte';
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

  // Homepage "Ask the AI tutor" card links here with ?tutor=1 since the tutor
  // needs a real phase to ground its answers in - auto-open once we land.
  onMount(() => {
    if ($page.url.searchParams.get('tutor') === '1') tutorOpen.set(true);
  });

  // Code blocks are commands/syntax, not prose - Google Translate should leave
  // them as-is. Re-runs on every phase nav since `html` is the action param.
  function noTranslateCode(node, html) {
    function apply() { node.querySelectorAll('pre, code').forEach((el) => { el.translate = false; }); }
    apply();
    return { update: apply };
  }

  // SEO/AEO structured data: the phase as an Article, a breadcrumb, and - when the
  // phase has quiz questions - a FAQPage (answer-engine friendly).
  $: origin = siteOrigin($page.url.origin);
  $: guideTitle = $page.data.guideTitle ?? slug;
  $: mdQuiz = parseQuizBlock(phase.markdown);
  $: quiz = mdQuiz && mdQuiz.length ? mdQuiz : quizFor(slug, phase.phase_no);
  $: exerciseItems = parseExerciseBlock(phase.markdown);
  $: faq = quiz;
  $: hasPlayground = /```playground-\w+/.test(phase.markdown || '');
  $: jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: phase.title, description: phase.summary,
      author: { '@type': 'Organization', name: 'The Missing Manual' },
      publisher: { '@type': 'Organization', name: 'The Missing Manual' },
      mainEntityOfPage: `${origin}/guides/${slug}/${phase.phase_no}`,
      isPartOf: { '@type': 'Article', name: guideTitle, url: `${origin}/guides/${slug}` },
      isAccessibleForFree: true
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
      ? [
          {
            '@context': 'https://schema.org', '@type': 'FAQPage',
            mainEntity: faq.map((qq) => ({
              '@type': 'Question', name: qq.q,
              acceptedAnswer: { '@type': 'Answer', text: qq.choices[qq.answer] }
            }))
          },
          {
            '@context': 'https://schema.org', '@type': 'Quiz',
            about: { '@type': 'Thing', name: phase.title },
            educationalLevel: phase.difficulty || undefined,
            isAccessibleForFree: true,
            hasPart: faq.map((qq) => ({
              '@type': 'Question', name: qq.q,
              acceptedAnswer: { '@type': 'Answer', text: qq.choices[qq.answer] }
            }))
          }
        ]
      : []),
    ...(hasPlayground
      ? [{
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: `${phase.title} - interactive playground`,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any (runs in browser)',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          url: `${origin}/guides/${slug}/${phase.phase_no}`
        }]
      : [])
  ];
</script>

<Seo title={`${phase.title} - The Missing Manual`} description={phase.summary} type="article" image={`/guides/${slug}/og.png`} keywords={phase.synonyms} {jsonld} />

<div class="crumb">
  <a href={`/guides/${phase.guide_slug}${q}`}>← Back to guide</a>
  <span>/</span>
  <span>Phase {phase.phase_no}</span>
</div>
<div style="margin: 0.1rem 0 1.2rem;"><Freshness date={phase.updated} /></div>

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <ReaderTTS />
{/key}

<article class="reader" class:has-phasenav={hasFooterNav} use:noTranslateCode={phase.html}>
  {@html phase.html}

  {#key `${phase.guide_slug}/${phase.phase_no}`}
    <Quiz guideSlug={phase.guide_slug} phaseNo={phase.phase_no} isLast={isLastPhase} questions={quiz} />
    {#if exerciseItems}
      <Exercise guideSlug={phase.guide_slug} phaseNo={phase.phase_no} items={exerciseItems} />
    {/if}
    <ShareTil guideSlug={phase.guide_slug} phaseNo={phase.phase_no} />
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
  <Annotations guideSlug={phase.guide_slug} phaseNo={phase.phase_no} />
  <ReaderTools />
  <Glossary />
  <Playgrounds />
  <Explainers />
  {#if mermaidOn}<Mermaid />{/if}
  {#if runnableOn}<RunnableCode />{/if}
{/key}
