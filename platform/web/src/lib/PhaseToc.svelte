<script>
  // "On this page" - an in-flow table of contents built from the phase's own
  // headings (comrak stamps stable ids on a nested `<a class="anchor" id>`).
  // Ported from the taste-kit TOC rail: a left-border rail, muted links, accent
  // on hover.
  //
  // Headings are parsed from the `html` STRING (deterministic, re-derives whenever
  // the phase changes), NOT scanned from the live DOM - scanning raced the
  // in-place {@html} swap and read the previous phase's content. Jumping still
  // targets the real DOM (same ids), so scrollIntoView works.
  //
  // In-flow (top of the reading column), not a sticky right rail: TMM's shell has
  // no right-rail track, so a floating rail would be real layout surgery. Shows
  // only when a phase has >= 3 headings.

  export let html = '';

  function parseHeadings(src) {
    if (!src || typeof DOMParser === 'undefined') return []; // SSR-safe
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const out = [];
    for (const h of doc.querySelectorAll('h2, h3')) {
      const anchor = h.querySelector('a[id]');
      const id = anchor ? anchor.id : h.id;
      const label = h.textContent.trim();
      if (!id || !label) continue;
      const entry = { id, label, children: [] };
      if (h.tagName === 'H3' && out.length) out[out.length - 1].children.push(entry);
      else out.push(entry);
    }
    return out;
  }

  $: items = parseHeadings(html);
  $: total = items.reduce((n, i) => n + 1 + i.children.length, 0);

  // SvelteKit's client router intercepts same-page `#hash` clicks and updates the
  // URL without scrolling, so drive the scroll ourselves. The id sits on an inline
  // `<a class="anchor">`; scroll the heading that wraps it. scroll-margin-top on
  // the heading clears the sticky header.
  function jump(e, id) {
    e.preventDefault();
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    const target = el ? el.closest('h2, h3') || el : null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      history.replaceState(null, '', `#${id}`);
    } catch (err) {}
  }
</script>

{#if total >= 3}
  <details class="phase-toc" open>
    <summary>On this page</summary>
    <nav aria-label="On this page">
      <ul class="toc-list">
        {#each items as it}
          <li>
            <a href={`#${it.id}`} on:click={(e) => jump(e, it.id)}>{it.label}</a>
            {#if it.children.length}
              <ul class="toc-sub">
                {#each it.children as c}
                  <li><a href={`#${c.id}`} on:click={(e) => jump(e, c.id)}>{c.label}</a></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
  </details>
{/if}

<style>
  .phase-toc {
    margin: 0 0 1.8rem;
    padding: 0.2rem 0 0.2rem 0.9rem;
    border-left: 2px solid var(--line);
  }
  .phase-toc > summary {
    cursor: pointer;
    list-style: none;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted);
    user-select: none;
  }
  .phase-toc > summary::-webkit-details-marker {
    display: none;
  }
  .phase-toc > summary::after {
    /* Unicode escapes, not the raw glyphs: a CSS chunk decoded as Latin-1 in
       production mojibakes the raw U+25B8/U+25BE bytes. Escapes are pure ASCII. */
    content: " \25B8"; /* right-pointing small triangle, collapsed state */
    color: var(--faint);
  }
  .phase-toc[open] > summary::after {
    content: " \25BE"; /* down-pointing small triangle, expanded state */
  }
  .toc-list,
  .toc-sub {
    list-style: none;
    margin: 0.6rem 0 0;
    padding: 0;
  }
  .toc-list a {
    display: block;
    padding: 0.18rem 0;
    font-size: 0.88rem;
    line-height: 1.4;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.15s var(--ease);
  }
  .toc-list a:hover {
    color: var(--accent);
  }
  .toc-sub {
    margin: 0.1rem 0 0.2rem 0.9rem;
    padding-left: 0.7rem;
    border-left: 1px solid var(--line);
  }
  .toc-sub a {
    font-size: 0.84rem;
    color: var(--faint);
  }

  /* Anchor jumps land via scrollIntoView on the heading; the offset must clear the
     sticky header (57px) plus a little breathing room. */
  :global(.reader h2),
  :global(.reader h3) {
    scroll-margin-top: 72px;
  }
</style>
