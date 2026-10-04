<script>
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';
  import Seo from '$lib/Seo.svelte';
  import LangSwitcher from '$lib/LangSwitcher.svelte';
  import { t } from '$lib/i18n/index.js';
  import { hreflangOf, localePath, alternatesFor } from '$lib/i18n/locales.js';
  export let data;
  $: ({ guide, phases } = data);
  // Translations: `lang` is this page's language, `translations` the locales the
  // guide is published in (both [] / 'en' on an untranslated English guide).
  $: lang = data.lang ?? 'en';
  $: translations = data.translations ?? [];
  $: enPath = `/guides/${guide.slug}`;
  $: selfPath = localePath(lang, enPath);
  // Preserve learning-path context: when the guide was reached from a path it
  // carries ?track=<slug>; keep it on the guide's own phase links so the
  // learning-path sidebar persists while reading. Other links (home) drop it.
  $: trackQ = $page.url.searchParams.get('track');
  $: q = trackQ ? `?track=${trackQ}` : '';

  $: origin = siteOrigin($page.url.origin);
  $: jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: guide.title, description: guide.summary,
      author: { '@type': 'Organization', name: 'The Missing Manual' },
      publisher: { '@type': 'Organization', name: 'The Missing Manual' },
      mainEntityOfPage: `${origin}${selfPath}`,
      ...(translations.length ? { inLanguage: hreflangOf(lang) } : {}),
      isAccessibleForFree: true
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: guide.title, item: `${origin}${selfPath}` }
      ]
    }
  ];
</script>

<Seo title={`${guide.title} - The Missing Manual`} description={guide.summary} type="article" image={`/guides/${guide.slug}/og.png`} keywords={guide.synonyms} {jsonld} alternates={alternatesFor(origin, enPath, translations)} />

<div class="crumb"><a href="/">{t(lang, 'crumb.all_topics')}</a> <span>/</span> <span>{guide.title}</span></div>
<h1 class="page-title">{guide.title}</h1>
<p class="tagline">{guide.summary}</p>
{#if guide.translators?.length}
  <p class="i18n-byline">
    {t(lang, 'guide.translated_by')}
    {#each guide.translators as h, i}{#if i}, {/if}<a href={`https://github.com/${h}`} target="_blank" rel="noopener noreferrer">@{h}</a>{/each}
  </p>
{/if}
<LangSwitcher {lang} path={enPath} {translations} />
<a class="epub-dl" href={`/guides/${guide.slug}/epub`} download>
  <i class="ti ti-book-2" aria-hidden="true"></i> {t(lang, 'guide.epub')}
</a>

<p class="guide-notes-tip">
  <i class="ti ti-highlight" aria-hidden="true"></i>
  <span>As you read each phase, select text to highlight it or add a private note.</span>
</p>

<ol class="phases">
  {#each phases.filter((p) => p.phase_no > 0) as p}
    <li>
      <a href={`${selfPath}/${p.phase_no}${q}`}>{p.title}</a>
      {#if p.summary && p.summary !== guide.summary}<span class="summary">{p.summary}</span>{/if}
    </li>
  {/each}
</ol>

<style>
  .guide-notes-tip { display: flex; align-items: flex-start; gap: 0.6rem; margin: 0.2rem 0 1.4rem; max-width: 65ch; color: var(--muted); font-size: 0.9rem; line-height: 1.6; }
  .guide-notes-tip .ti { color: var(--accent-strong); margin-top: 0.1rem; flex: none; font-size: 1.1rem; }
  .epub-dl {
    display: inline-flex; align-items: center; gap: 0.4rem; margin: 0.9rem 0 1.2rem;
    font-size: 0.88rem; color: var(--muted); border: 1px solid var(--line);
    border-radius: 999px; padding: 0.35rem 0.8rem; transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .epub-dl:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
  .epub-dl .ti { font-size: 16px; }
  .i18n-byline { margin: 0.4rem 0 0.8rem; font-size: 0.88rem; color: var(--muted); }
</style>
