<script>
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';

  export let title = '';
  export let description = '';
  export let type = 'website';   // 'article' for guides
  export let image = '';          // absolute or root-relative og image
  export let jsonld = null;       // object or array → injected as ld+json
  export let keywords = '';       // string, or array (e.g. a guide/phase's synonyms)

  $: keywordsStr = Array.isArray(keywords) ? keywords.filter(Boolean).join(', ') : keywords;

  $: origin = siteOrigin($page.url.origin);
  $: canonical = origin + $page.url.pathname;
  // Fall back to the site-wide brand card so every page has a share image.
  $: ogImage = image
    ? (image.startsWith('http') ? image : origin + image)
    : origin + '/og.png';
  // Build the ld+json script as a string (closing tag split so it can't terminate
  // this component's own <script> block).
  $: ld = jsonld ? '<scr' + 'ipt type="application/ld+json">' + JSON.stringify(jsonld) + '</scr' + 'ipt>' : '';
</script>

<svelte:head>
  {#if title}<title>{title}</title>{/if}
  {#if description}<meta name="description" content={description} />{/if}
  {#if keywordsStr}<meta name="keywords" content={keywordsStr} />{/if}
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonical} />
  {#if title}<meta property="og:title" content={title} />{/if}
  {#if description}<meta property="og:description" content={description} />{/if}
  {#if ogImage}<meta property="og:image" content={ogImage} />{/if}
  <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
  {#if title}<meta name="twitter:title" content={title} />{/if}
  {#if description}<meta name="twitter:description" content={description} />{/if}
  {#if ogImage}<meta name="twitter:image" content={ogImage} />{/if}
  {#if ld}{@html ld}{/if}
</svelte:head>
