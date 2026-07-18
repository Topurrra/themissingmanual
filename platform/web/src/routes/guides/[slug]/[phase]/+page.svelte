<script>
  import { onMount, onDestroy } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { startScrollTracking, stopScrollTracking } from '$lib/scroll.js';
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
  import Scenarios from '$lib/Scenarios.svelte';
  import ReaderTTS from '$lib/ReaderTTS.svelte';
  import Quiz from '$lib/Quiz.svelte';
  import RecallPrompt from '$lib/RecallPrompt.svelte';
  import Discussion from '$lib/Discussion.svelte';
  import RunnableCode from '$lib/RunnableCode.svelte';
  import FeedbackWidget from '$lib/FeedbackWidget.svelte';
  import Annotations from '$lib/Annotations.svelte';
  export let data;
  $: phase = data.phase;
  $: practice = data.practice;
  $: related = data.related ?? [];
  // Discussion pilot: only on guides named in GISCUS_GUIDES ("*" = all).
  $: giscus = $page.data.giscus;
  $: discussionOn = !!giscus && (giscus.guides.includes('*') || giscus.guides.includes(phase.guide_slug));

  const flagOn = (v) => !['0', 'false', 'off', 'no'].includes(String(v ?? '').trim().toLowerCase());
  $: siteConfig = $page.data.siteConfig ?? {};
  $: runnableOn = flagOn(siteConfig.flag_runnable);

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

  // Read-depth tracking: (re)start on every phase navigation, reset per pageview.
  let articleEl;
  afterNavigate(() => {
    startScrollTracking(articleEl, $page.url.pathname);
  });
  onDestroy(() => stopScrollTracking());

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
      isAccessibleForFree: true,
      // Recency/trust signal for AI answer engines; same date the Freshness badge shows.
      ...(phase.updated ? { dateModified: phase.updated } : {})
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
{#if practice}
  <p class="pr-try-practice"><a href={`/practice/${practice.module}/${practice.phaseNo}`}>Try it in Practice →</a></p>
{/if}
<div style="margin: 0.1rem 0 1.2rem;"><Freshness date={phase.updated} /></div>
{#if phase.source_file}
  <p class="pr-edit-link">
    <a href={`https://github.com/Topurrra/themissingmanual/edit/main/${phase.source_file}`} target="_blank" rel="noopener noreferrer">Edit this page on GitHub →</a>
  </p>
{/if}

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <ReaderTTS />
{/key}

<article class="reader" class:has-phasenav={hasFooterNav} use:noTranslateCode={phase.html} bind:this={articleEl}>
  {@html phase.html}

  {#key `${phase.guide_slug}/${phase.phase_no}`}
    {#if quiz.length}
      <RecallPrompt summary={phase.summary} />
    {/if}
    <Quiz guideSlug={phase.guide_slug} phaseNo={phase.phase_no} isLast={isLastPhase} questions={quiz} />
    {#if exerciseItems}
      <Exercise guideSlug={phase.guide_slug} phaseNo={phase.phase_no} items={exerciseItems} />
    {/if}
    <ShareTil guideSlug={phase.guide_slug} phaseNo={phase.phase_no} />
  {/key}

  {#if related.length}
    <aside class="related" aria-label="Related guides">
      <p class="related-head">Related guides</p>
      <ul class="related-list">
        {#each related as r}
          <li>
            <a href={`/guides/${r.slug}/${r.phaseNo}`}>
              <span class="related-title">{r.title}</span>
              {#if r.summary}<span class="related-sum">{r.summary}</span>{/if}
            </a>
          </li>
        {/each}
      </ul>
    </aside>
  {/if}

  {#if discussionOn}
    <Discussion config={giscus} />
  {/if}

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
  <Scenarios />
  {#if runnableOn}<RunnableCode />{/if}
{/key}

<style>
  .related {
    margin: 2.2rem 0 0;
    padding-top: 1.4rem;
    border-top: 1px solid var(--line);
  }
  .related-head {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 0.7rem;
  }
  .related-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.6rem;
  }
  .related-list a {
    display: block;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raise);
    text-decoration: none;
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .related-list a:hover { border-color: var(--accent); background: var(--accent-tint-2); }
  .related-title {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.35;
  }
  .related-sum {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--muted);
  }

  .pr-try-practice {
    margin: 0 0 1.2rem;
    font-size: 0.82rem;
  }
  .pr-try-practice a {
    color: var(--muted);
  }
  .pr-try-practice a:hover {
    color: var(--accent);
  }
  .pr-edit-link {
    margin: 0 0 1.2rem;
    font-size: 0.82rem;
  }
  .pr-edit-link a {
    color: var(--muted);
  }
  .pr-edit-link a:hover {
    color: var(--accent);
  }
</style>
