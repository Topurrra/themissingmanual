<script>
  import glossary from '$lib/glossary.json';
  import Seo from '$lib/Seo.svelte';
  import { page } from '$app/stores';
  import { siteOrigin } from '$lib/site.js';

  // DefinedTermSet: the canonical schema for a glossary. Lets AI answer engines
  // and search treat each term as a defined entity sourced here, linked to the
  // guide it comes from. ponytail: emits every definition once more as JSON-LD -
  // acceptable on this one reference page; trim to name+url if payload bites.
  $: origin = siteOrigin($page.url.origin);
  $: termSet = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'The Missing Manual Glossary',
    url: `${origin}/glossary`,
    hasDefinedTerm: glossary.map((e) => ({
      '@type': 'DefinedTerm',
      name: e.term,
      description: e.def,
      url: `${origin}/guides/${e.guide}`
    }))
  };

  let q = '';
  $: needle = q.trim().toLowerCase();
  $: filtered = needle
    ? glossary.filter((e) => e.term.toLowerCase().includes(needle) || e.def.toLowerCase().includes(needle))
    : glossary;
  $: groups = (() => {
    const m = new Map();
    for (const e of filtered) {
      const ch = e.term[0].toUpperCase();
      const key = /[A-Z]/.test(ch) ? ch : '#';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(e);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  })();
  $: letters = groups.map(([letter]) => letter);
  const pretty = (s) => s.replace(/-/g, ' ');

  function clearSearch() {
    q = '';
  }
</script>

<Seo
  title="Glossary - The Missing Manual"
  description="Plain-language definitions for the developer terms used across The Missing Manual guides."
  jsonld={termSet} />

<header class="gloss-intro">
  <h1>Glossary</h1>
  <p class="tagline">Plain-language definitions for the terms used across the guides - {glossary.length} and counting. Each term links to the guide it comes from.</p>
</header>

<div class="gloss-tools">
  <div class="gloss-search">
    <i class="ti ti-search" aria-hidden="true"></i>
    <input type="search" bind:value={q} placeholder="Search terms and definitions…" aria-label="Search glossary terms and definitions" />
    {#if needle}
      <button class="gloss-clear" type="button" on:click={clearSearch} aria-label="Clear glossary search">Clear</button>
    {/if}
  </div>
  <p class="gloss-results" aria-live="polite">{filtered.length} of {glossary.length} term{glossary.length === 1 ? '' : 's'}</p>

  {#if letters.length > 1}
    <nav class="gloss-jump" aria-label="Jump to glossary letter">
      {#each letters as letter}
        <a href={`#gloss-${letter}`}>{letter}</a>
      {/each}
    </nav>
  {/if}
</div>

{#if filtered.length === 0}
  <div class="gloss-empty" role="status">
    <p>No terms match “{q}”.</p>
    <button type="button" on:click={clearSearch}>Clear search</button>
  </div>
{:else}
  {#each groups as [letter, items]}
    <section class="gloss-group" id={`gloss-${letter}`}>
      <h2 class="gloss-letter">{letter}</h2>
      <dl class="gloss-list">
        {#each items as e}
          <div class="gloss-row" id={e.slug}>
            <dt class="gloss-term"><a href={`#${e.slug}`} aria-label={`Link to ${e.term}`}>{e.term}</a></dt>
            <dd class="gloss-def">{e.def}</dd>
            <dd class="gloss-from"><a href={`/guides/${e.guide}`}>From {pretty(e.guide)} →</a></dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}
{/if}

<style>
  .gloss-intro { max-width: 45rem; margin-bottom: 1.5rem; }
  .gloss-intro h1 { margin: 0 0 0.65rem; font-size: 2.5rem; line-height: 1.06; letter-spacing: -0.035em; }
  .gloss-intro p { margin: 0; }

  .gloss-tools { margin-bottom: 2.5rem; }
  .gloss-search {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--line); border-radius: 10px; padding: 0.75rem 0.9rem;
    background: var(--raise); max-width: 38rem;
  }
  .gloss-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .gloss-search .ti { color: var(--faint); font-size: 18px; }
  .gloss-search input { flex: 1; border: 0; outline: none; background: none; font: inherit; color: var(--ink); }
  .gloss-clear { flex: none; border: 0; border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer; font: 500 0.8rem var(--font-body); padding: 0.3rem 0.35rem; }
  .gloss-clear:hover { background: var(--surface); color: var(--ink); }
  .gloss-results { margin: 0.65rem 0 0; color: var(--muted); font-size: 0.9rem; }
  .gloss-jump { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 1.15rem; }
  .gloss-jump a { align-items: center; border: 1px solid var(--line); border-radius: 6px; color: var(--muted); display: inline-flex; font: 0.75rem var(--font-mono); justify-content: center; min-height: 2rem; min-width: 2rem; padding: 0.15rem; text-decoration: none; }
  .gloss-jump a:hover { border-color: var(--accent); color: var(--accent-strong); }

  .gloss-group { margin-bottom: 2.6rem; scroll-margin-top: 80px; }
  .gloss-letter {
    font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em;
    color: var(--accent); margin: 0; padding: 0 0 0.55rem; border-bottom: 1px solid var(--line);
  }
  .gloss-list { margin: 0; }
  .gloss-row { padding: 1rem 0; border-bottom: 1px solid var(--line); scroll-margin-top: 80px; }
  .gloss-row:target { background: var(--accent-tint); box-shadow: 0 0 0 0.5rem var(--accent-tint); }
  .gloss-term { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; line-height: 1.25; margin: 0 0 0.3rem; }
  .gloss-term a { color: var(--ink); text-decoration: none; }
  .gloss-term a:hover { color: var(--accent-strong); text-decoration: underline; text-underline-offset: 0.16em; }
  .gloss-def { margin: 0; color: var(--body); line-height: 1.62; max-width: 70ch; }
  .gloss-from { margin: 0.5rem 0 0; }
  .gloss-from a {
    font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); text-transform: capitalize;
  }
  .gloss-from a:hover { color: var(--accent); }
  .gloss-empty { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); color: var(--muted); padding: 1.25rem 0; }
  .gloss-empty p { margin: 0 0 0.7rem; }
  .gloss-empty button { border: 1px solid var(--line); border-radius: 8px; background: var(--raise); color: var(--ink); cursor: pointer; font: 500 0.85rem var(--font-body); min-height: 2.25rem; padding: 0.25rem 0.7rem; }
  .gloss-empty button:hover { border-color: var(--accent); color: var(--accent-strong); }

  @media (max-width: 720px) {
    .gloss-intro h1 { font-size: 2.25rem; }
    .gloss-jump { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.25rem; }
    .gloss-jump a { flex: 0 0 2rem; }
  }
</style>
