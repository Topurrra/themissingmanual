<script>
    import { onMount, onDestroy } from "svelte";
    import { afterNavigate } from "$app/navigation";
    import { page } from "$app/stores";
    import { startScrollTracking, stopScrollTracking } from "$lib/scroll.js";
    import { siteOrigin } from "$lib/site.js";
    import { tutorOpen } from "$lib/tutor-store.js";
    import Seo from "$lib/Seo.svelte";
    import { quizFor, parseQuizBlock } from "$lib/quizzes.js";
    import { parseExerciseBlock } from "$lib/exercises.js";
    import Exercise from "$lib/Exercise.svelte";
    import ShareTil from "$lib/ShareTil.svelte";
    import Freshness from "$lib/Freshness.svelte";
    import ReaderTools from "$lib/ReaderTools.svelte";
    import Glossary from "$lib/Glossary.svelte";
    import Playgrounds from "$lib/Playgrounds.svelte";
    import Explainers from "$lib/Explainers.svelte";
    import Scenarios from "$lib/Scenarios.svelte";
    import ReaderTTS from "$lib/ReaderTTS.svelte";
    import Quiz from "$lib/Quiz.svelte";
    import RecallPrompt from "$lib/RecallPrompt.svelte";
    import Discussion from "$lib/Discussion.svelte";
    import RunnableCode from "$lib/RunnableCode.svelte";
    import CodeGroup from "$lib/CodeGroup.svelte";
    import PhaseToc from "$lib/PhaseToc.svelte";
    import FeedbackWidget from "$lib/FeedbackWidget.svelte";
    import Annotations from "$lib/Annotations.svelte";
    import LangSwitcher from "$lib/LangSwitcher.svelte";
    import { t } from "$lib/i18n/index.js";
    import {
        hreflangOf,
        localePath,
        alternatesFor,
    } from "$lib/i18n/locales.js";
    export let data;
    $: phase = data.phase;
    $: practice = data.practice;
    $: related = data.related ?? [];
    // Discussion pilot: only on guides named in GISCUS_GUIDES ("*" = all).
    $: giscus = $page.data.giscus;
    $: discussionOn =
        !!giscus &&
        (giscus.guides.includes("*") ||
            giscus.guides.includes(phase.guide_slug));

    const flagOn = (v) =>
        !["0", "false", "off", "no"].includes(
            String(v ?? "")
                .trim()
                .toLowerCase(),
        );
    $: siteConfig = $page.data.siteConfig ?? {};
    $: runnableOn = flagOn(siteConfig.flag_runnable);

    $: trackQ = $page.url.searchParams.get("track");
    $: q = trackQ ? `?track=${trackQ}` : "";

    $: slug = phase.guide_slug;
    // Translations: `lang` is this page's language; `base` is the guide's URL in it,
    // so the reader's own links (overview, prev/next) stay in the same language.
    $: lang = $page.data.lang ?? "en";
    $: translations = phase.translations ?? [];
    $: enPath = `/guides/${slug}/${phase.phase_no}`;
    $: base = localePath(lang, `/guides/${slug}`);
    $: phases = $page.data.guidePhases ?? [];
    $: realPhases = phases.filter((p) => p.phase_no > 0);
    $: prevPhase =
        realPhases.find((p) => p.phase_no === phase.phase_no - 1) ?? null;
    $: nextPhase =
        realPhases.find((p) => p.phase_no === phase.phase_no + 1) ?? null;
    $: prevIsOverview = !!slug && !prevPhase && phase.phase_no === 1;
    $: showOverview = !!slug && phase.phase_no > 1;
    $: hasFooterNav = !!(
        prevPhase ||
        prevIsOverview ||
        nextPhase ||
        showOverview
    );
    $: isLastPhase = phase.phase_no > 0 && !nextPhase;

    // Homepage "Ask the AI tutor" card links here with ?tutor=1 since the tutor
    // needs a real phase to ground its answers in - auto-open once we land.
    onMount(() => {
        if ($page.url.searchParams.get("tutor") === "1") tutorOpen.set(true);
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
        function apply() {
            node.querySelectorAll("pre, code").forEach((el) => {
                el.translate = false;
            });
        }
        apply();
        return { update: apply };
    }

    // SEO/AEO structured data: the phase as an Article, a breadcrumb, and - when the
    // phase has quiz questions - a FAQPage (answer-engine friendly).
    $: origin = siteOrigin($page.url.origin);
    $: guideTitle = $page.data.guideTitle ?? slug;
    $: mdQuiz = parseQuizBlock(phase.markdown);
    // The keyed English quizzes.js fallback must not leak into a translated page.
    $: quiz =
        mdQuiz && mdQuiz.length
            ? mdQuiz
            : lang === "en"
              ? quizFor(slug, phase.phase_no)
              : [];
    $: exerciseItems = parseExerciseBlock(phase.markdown);
    $: faq = quiz;
    $: hasPlayground = /```playground-\w+/.test(phase.markdown || "");
    $: jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: phase.title,
            description: phase.summary,
            author: { "@type": "Organization", name: "The Missing Manual" },
            publisher: { "@type": "Organization", name: "The Missing Manual" },
            mainEntityOfPage: `${origin}${base}/${phase.phase_no}`,
            isPartOf: {
                "@type": "Article",
                name: guideTitle,
                url: `${origin}${base}`,
            },
            ...(translations.length ? { inLanguage: hreflangOf(lang) } : {}),
            isAccessibleForFree: true,
            // Recency/trust signal for AI answer engines; same date the Freshness badge shows.
            ...(phase.updated ? { dateModified: phase.updated } : {}),
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: `${origin}/`,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: guideTitle,
                    item: `${origin}${base}`,
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: phase.title,
                    item: `${origin}${base}/${phase.phase_no}`,
                },
            ],
        },
        ...(faq.length
            ? [
                  {
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: faq.map((qq) => ({
                          "@type": "Question",
                          name: qq.q,
                          acceptedAnswer: {
                              "@type": "Answer",
                              text: qq.choices[qq.answer],
                          },
                      })),
                  },
                  {
                      "@context": "https://schema.org",
                      "@type": "Quiz",
                      about: { "@type": "Thing", name: phase.title },
                      educationalLevel: phase.difficulty || undefined,
                      isAccessibleForFree: true,
                      hasPart: faq.map((qq) => ({
                          "@type": "Question",
                          name: qq.q,
                          acceptedAnswer: {
                              "@type": "Answer",
                              text: qq.choices[qq.answer],
                          },
                      })),
                  },
              ]
            : []),
        ...(hasPlayground
            ? [
                  {
                      "@context": "https://schema.org",
                      "@type": "WebApplication",
                      name: `${phase.title} - interactive playground`,
                      applicationCategory: "EducationalApplication",
                      operatingSystem: "Any (runs in browser)",
                      isAccessibleForFree: true,
                      offers: {
                          "@type": "Offer",
                          price: "0",
                          priceCurrency: "USD",
                      },
                      url: `${origin}${base}/${phase.phase_no}`,
                  },
              ]
            : []),
    ];
</script>

<Seo
    title={`${phase.title} - The Missing Manual`}
    description={phase.summary}
    type="article"
    image={`/guides/${slug}/og.png`}
    keywords={phase.synonyms}
    {jsonld}
    alternates={alternatesFor(origin, enPath, translations)}
/>

<div class="crumb">
    <a href={`${base}${q}`}>{t(lang, "crumb.back_to_guide")}</a>
    <span>/</span>
    <span>{t(lang, "crumb.phase", { n: phase.phase_no })}</span>
</div>
<LangSwitcher {lang} path={enPath} {translations} />
{#if phase.stale}
    <p class="i18n-stale" role="note">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        <span
            >{t(lang, "stale.text", { date: phase.english_updated })}
            <a href={enPath} hreflang="en">{t(lang, "stale.link")}</a></span
        >
    </p>
{/if}
{#if practice}
    <p class="pr-try-practice">
        <a href={`/practice/${practice.module}/${practice.phaseNo}`}
            >Try it in Practice →</a
        >
    </p>
{/if}
<!-- Phase toolbar: freshness + listen on the left, edit-on-GitHub pushed to the right,
     all on one row (wraps on narrow screens). ReaderTTS is keyed so it resets per phase. -->
<div class="phase-toolbar">
    <!-- A translation shows the English date it was made from, not the English page's. -->
    <Freshness
        date={lang === "en" ? phase.updated : phase.source_updated}
        {lang}
    />
    {#key `${lang}/${phase.guide_slug}/${phase.phase_no}`}
        <ReaderTTS {lang} />
    {/key}
    {#if phase.source_file}
        <a
            class="edit-btn"
            href={`https://github.com/Topurrra/themissingmanual/edit/main/${phase.source_file}`}
            target="_blank"
            rel="noopener noreferrer"
            title={t(lang, "toolbar.edit_title")}
        >
            <i class="ti ti-brand-github" aria-hidden="true"></i>
            <span>{t(lang, "toolbar.edit")}</span>
        </a>
    {/if}
</div>

<aside class="annotation-tip" aria-label="Highlights and private notes">
    <i class="ti ti-highlight" aria-hidden="true"></i>
    <div>
        <p>
            Select a few words in this guide to highlight them or add a private
            note.
        </p>
        <details>
            <summary>How to use highlights and notes</summary>
            <ol>
                <li>Select a few words or a short sentence with your mouse.</li>
                <li>
                    Choose a color from the toolbar to highlight it, or choose
                    the note icon, write your note, and click Save.
                </li>
                <li>
                    Click a highlighted passage later to edit its note, change
                    its color, or remove it.
                </li>
            </ol>
            <p class="annotation-tip-storage">
                Highlights and notes are saved only in this browser. Clearing
                browser data removes them.
            </p>
        </details>
    </div>
</aside>

<article
    class="reader"
    class:has-phasenav={hasFooterNav}
    use:noTranslateCode={phase.html}
    bind:this={articleEl}
>
    <PhaseToc html={phase.html} {lang} />
    {@html phase.html}

    {#key `${lang}/${phase.guide_slug}/${phase.phase_no}`}
        {#if quiz.length}
            <RecallPrompt summary={phase.summary} />
        {/if}
        <Quiz
            guideSlug={phase.guide_slug}
            phaseNo={phase.phase_no}
            isLast={isLastPhase}
            questions={quiz}
            {lang}
        />
        {#if exerciseItems}
            <Exercise
                guideSlug={phase.guide_slug}
                phaseNo={phase.phase_no}
                items={exerciseItems}
            />
        {/if}
        <ShareTil guideSlug={phase.guide_slug} phaseNo={phase.phase_no} />
    {/key}

    {#if related.length}
        <aside class="related" aria-label={t(lang, "related.head")}>
            <p class="related-head">{t(lang, "related.head")}</p>
            <ul class="related-list">
                {#each related as r}
                    <li>
                        <a href={r.href}>
                            <span class="related-title">{r.title}</span>
                            {#if r.summary}<span class="related-sum"
                                    >{r.summary}</span
                                >{/if}
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
        <nav class="reader-nav phasenav" aria-label={t(lang, "nav.aria")}>
            {#if prevPhase}
                <a class="prev" href={`${base}/${prevPhase.phase_no}${q}`}>
                    <span class="rn-label">{t(lang, "nav.previous")}</span>
                    <span class="rn-title">{prevPhase.title}</span>
                </a>
            {:else if prevIsOverview}
                <a class="prev" href={`${base}${q}`}>
                    <span class="rn-label">{t(lang, "nav.overview")}</span>
                    <span class="rn-title"
                        >{$page.data.guideTitle ??
                            t(lang, "nav.guide_overview")}</span
                    >
                </a>
            {:else}
                <span class="rn-spacer" aria-hidden="true"></span>
            {/if}

            {#if showOverview}
                <a class="overview" href={`${base}${q}`}>
                    <span class="rn-label">{t(lang, "nav.guide")}</span>
                    <span class="rn-title">{t(lang, "nav.overview_title")}</span
                    >
                </a>
            {/if}

            {#if nextPhase}
                <a class="next" href={`${base}/${nextPhase.phase_no}${q}`}>
                    <span class="rn-label">{t(lang, "nav.next")}</span>
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
    <CodeGroup />
    {#if runnableOn}<RunnableCode />{/if}
{/key}

<style>
    .annotation-tip {
        display: flex;
        align-items: flex-start;
        gap: 0.7rem;
        max-width: 720px;
        padding: 0.9rem 0;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.6;
    }
    .annotation-tip > .ti {
        color: var(--accent-strong);
        flex: none;
        margin-top: 0.15rem;
        font-size: 1.1rem;
    }
    .annotation-tip p {
        margin: 0;
    }
    .annotation-tip summary {
        cursor: pointer;
        color: var(--accent-strong);
        font-weight: 500;
        margin-top: 0.3rem;
        padding: 0.2rem 0;
    }
    .annotation-tip ol {
        margin: 0.6rem 0;
        padding-left: 1.25rem;
    }
    .annotation-tip li + li {
        margin-top: 0.4rem;
    }
    .annotation-tip .annotation-tip-storage {
        font-size: 0.85rem;
    }
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
        transition:
            border-color 0.15s var(--ease),
            background 0.15s var(--ease);
    }
    .related-list a:hover {
        border-color: var(--accent);
        background: var(--accent-tint-2);
    }
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

    .i18n-stale {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin: 0 0 1.2rem;
        padding: 0.6rem 0.85rem;
        border: 1px solid var(--line);
        border-left: 3px solid var(--warn, #c0563c);
        border-radius: 10px;
        background: var(--surface);
        font-size: 0.86rem;
        line-height: 1.5;
        color: var(--body);
    }
    .i18n-stale .ti {
        font-size: 16px;
        color: var(--warn, #c0563c);
        margin-top: 0.15rem;
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
    .phase-toolbar {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        flex-wrap: wrap;
        margin: 0.1rem 0 1.4rem;
    }
    /* ReaderTTS ships a 24px bottom margin for its standalone use; drop it here so the
     row stays tight and vertically centered. */
    .phase-toolbar :global(.tts) {
        margin: 0;
    }
    /* Edit link becomes a subtle outline button, pushed to the far right of the row. */
    .edit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--muted);
        font-size: 0.8rem;
        text-decoration: none;
        transition:
            border-color 0.15s var(--ease),
            color 0.15s var(--ease);
    }
    .edit-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
    }
</style>
