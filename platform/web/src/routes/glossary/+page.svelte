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
  const pretty = (s) => s.replace(/-/g, ' ');
</script>

<Seo
  title="Glossary - The Missing Manual"
  description="Plain-language definitions for the developer terms used across The Missing Manual guides."
  jsonld={termSet} />

<header class="gloss-intro">
  <span class="eyebrow">Reference</span>
  <h1>Glossary</h1>
  <p class="tagline">Plain-language definitions for the terms used across the guides - {glossary.length} and counting. Each term links to the guide it comes from.</p>
</header>

<div class="gloss-search">
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" bind:value={q} placeholder="Search terms…" aria-label="Search glossary" />
</div>

{#if filtered.length === 0}
  <p class="gloss-empty">No terms match “{q}”.</p>
{:else}
  {#each groups as [letter, items]}
    <section class="gloss-group">
      <h2 class="gloss-letter">{letter}</h2>
      <dl class="gloss-list">
        {#each items as e}
          <div class="gloss-row" id={e.slug}>
            <dt class="gloss-term">{e.term}</dt>
            <dd class="gloss-def">{e.def}</dd>
            <dd class="gloss-from"><a href={`/guides/${e.guide}`}>From {pretty(e.guide)} →</a></dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}
{/if}

<style>
  .gloss-intro { margin-bottom: 1.6rem; }
  .gloss-intro h1 { margin: 0.5rem 0 0.6rem; }

  .gloss-search {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--line); border-radius: 12px; padding: 0.6rem 0.9rem;
    background: var(--raise); margin-bottom: 2rem; max-width: 460px;
  }
  .gloss-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .gloss-search .ti { color: var(--faint); font-size: 18px; }
  .gloss-search input { flex: 1; border: 0; outline: none; background: none; font: inherit; color: var(--ink); }

  .gloss-group { margin-bottom: 1.8rem; }
  .gloss-letter {
    font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.1em;
    color: var(--accent); margin: 0 0 0.6rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--line);
  }
  .gloss-list { margin: 0; }
  .gloss-row { padding: 0.8rem 0; border-bottom: 1px solid var(--line); scroll-margin-top: 80px; }
  .gloss-row:target { background: var(--accent-tint); border-radius: 8px; padding-left: 0.6rem; padding-right: 0.6rem; }
  .gloss-term { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--ink); margin: 0 0 0.25rem; }
  .gloss-def { margin: 0; color: var(--body); line-height: 1.6; }
  .gloss-from { margin: 0.4rem 0 0; }
  .gloss-from a {
    font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted);
    text-transform: capitalize;
  }
  .gloss-from a:hover { color: var(--accent); }
  .gloss-empty { color: var(--muted); }
</style>
