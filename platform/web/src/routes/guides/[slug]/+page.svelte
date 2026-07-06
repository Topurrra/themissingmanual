<script>
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';
  import Seo from '$lib/Seo.svelte';
  export let data;
  $: ({ guide, phases } = data);
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
      mainEntityOfPage: `${origin}/guides/${guide.slug}`,
      isAccessibleForFree: true
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: guide.title, item: `${origin}/guides/${guide.slug}` }
      ]
    }
  ];
</script>

<Seo title={`${guide.title} - The Missing Manual`} description={guide.summary} type="article" image={`/guides/${guide.slug}/og.png`} keywords={guide.synonyms} {jsonld} />

<div class="crumb"><a href="/">All topics</a> <span>/</span> <span>{guide.title}</span></div>
<h1 class="page-title">{guide.title}</h1>
<p class="tagline">{guide.summary}</p>
<a class="epub-dl" href={`/guides/${guide.slug}/epub`} download>
  <i class="ti ti-book-2" aria-hidden="true"></i> Download EPUB
</a>

<ol class="phases">
  {#each phases.filter((p) => p.phase_no > 0) as p}
    <li>
      <a href={`/guides/${guide.slug}/${p.phase_no}${q}`}>{p.title}</a>
      {#if p.summary && p.summary !== guide.summary}<span class="summary">{p.summary}</span>{/if}
    </li>
  {/each}
</ol>

<style>
  .epub-dl {
    display: inline-flex; align-items: center; gap: 0.4rem; margin: 0.9rem 0 1.2rem;
    font-size: 0.88rem; color: var(--muted); border: 1px solid var(--line);
    border-radius: 999px; padding: 0.35rem 0.8rem; transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .epub-dl:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
  .epub-dl .ti { font-size: 16px; }
</style>
