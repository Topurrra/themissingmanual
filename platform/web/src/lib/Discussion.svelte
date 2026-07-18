<script>
  // Giscus-backed discussion (GitHub Discussions as the store). Strictly opt-in
  // for the learner: collapsed by default, and the third-party giscus script is
  // injected only when the reader opens the section - reading a guide never
  // triggers a giscus/GitHub request. Reading threads needs no login; posting
  // authenticates via GitHub inside the giscus iframe. TMM stores no identity.
  export let config; // { repo, repoId, category, categoryId }

  let mountEl;
  let loaded = false;

  function loadGiscus() {
    if (loaded || !mountEl || !config) return;
    loaded = true;
    const dark = document.documentElement.dataset.mode === 'dark';
    const s = document.createElement('script');
    const attrs = {
      src: 'https://giscus.app/client.js',
      'data-repo': config.repo,
      'data-repo-id': config.repoId,
      'data-category': config.category,
      'data-category-id': config.categoryId,
      'data-mapping': 'pathname', // one thread per guide phase
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': dark ? 'dark' : 'light',
      'data-lang': 'en',
      crossorigin: 'anonymous',
      async: ''
    };
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    mountEl.appendChild(s);
  }
</script>

{#if config}
  <details class="discuss" on:toggle={(e) => e.currentTarget.open && loadGiscus()}>
    <summary class="discuss-head">
      <i class="ti ti-messages" aria-hidden="true"></i>
      <span>Discussion</span>
      <span class="discuss-note">via GitHub - reading needs no account</span>
      <i class="ti ti-chevron-down discuss-chevron" aria-hidden="true"></i>
    </summary>
    <div class="discuss-body" bind:this={mountEl}>
      {#if !loaded}<p class="discuss-loading">Loading discussion…</p>{/if}
    </div>
  </details>
{/if}

<style>
  .discuss {
    margin: 2.2rem 0 0;
    padding: 1.1rem 1.3rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
  }
  .discuss-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    list-style: none;
    user-select: none;
    font-family: var(--font-display);
    font-size: 1.02rem;
    color: var(--ink);
  }
  .discuss-head::-webkit-details-marker { display: none; }
  .discuss-head .ti { color: var(--accent); font-size: 20px; }
  .discuss-note { font-family: var(--font-mono); font-size: 0.7rem; color: var(--muted); }
  .discuss-chevron { margin-left: auto; color: var(--muted) !important; font-size: 18px !important; transition: transform 0.18s var(--ease); }
  details.discuss[open] .discuss-chevron { transform: rotate(180deg); }
  .discuss-body { margin-top: 1rem; }
  .discuss-loading { color: var(--faint); font-size: 0.85rem; margin: 0; }
</style>
