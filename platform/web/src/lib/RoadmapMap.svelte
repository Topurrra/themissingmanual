<script>
  import { onMount } from 'svelte';
  import { CATEGORY_ORDER, DIFF_RANK } from '$lib/pathgen.js';
  import { guideStatuses } from '$lib/skillmap.js';

  export let categories = [];
  export let guides = [];

  let statuses = {};
  onMount(() => { statuses = guideStatuses(guides); });

  // Same canonical-order-then-stragglers merge /paths already uses, but over
  // EVERY category (not filtered by a chosen level/interest) - the whole map.
  $: orderedCats = (() => {
    const known = CATEGORY_ORDER.filter((c) => categories.some((x) => x.slug === c));
    const extra = categories.map((c) => c.slug).filter((s) => !CATEGORY_ORDER.includes(s));
    return [...known, ...extra].map((slug) => categories.find((c) => c.slug === slug));
  })();

  function catGuides(slug) {
    return guides
      .filter((g) => g.category === slug)
      .sort((a, b) => (DIFF_RANK[a.difficulty] ?? 9) - (DIFF_RANK[b.difficulty] ?? 9) || a.title.localeCompare(b.title));
  }
  function doneCount(slug) {
    return catGuides(slug).filter((g) => statuses[g.slug] === 'done').length;
  }
</script>

<div class="rmap">
  {#each orderedCats as cat (cat.slug)}
    <section class="rmap-cat">
      <div class="rmap-cat-head">
        <i class="ti {cat.icon}" aria-hidden="true"></i>
        <h2>{cat.name}</h2>
        <span class="rmap-cat-count">{doneCount(cat.slug)}/{cat.count}</span>
      </div>
      <div class="rmap-line">
        {#each catGuides(cat.slug) as g (g.slug)}
          <a class="rmap-node status-{statuses[g.slug] || 'new'}" href="/guides/{g.slug}">
            <span class="rmap-dot" aria-hidden="true">
              {#if statuses[g.slug] === 'done'}<i class="ti ti-check"></i>{/if}
            </span>
            <span class="rmap-node-body">
              <span class="rmap-node-title">{g.title}</span>
              <span class="rmap-node-diff">{g.difficulty}</span>
            </span>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .rmap { display: flex; flex-direction: column; gap: 2.2rem; max-width: 640px; }
  .rmap-cat-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.9rem; }
  .rmap-cat-head .ti { color: var(--accent); font-size: 19px; }
  .rmap-cat-head h2 { margin: 0; font-family: var(--font-display); font-size: 1.05rem; color: var(--ink); }
  .rmap-cat-count {
    margin-left: auto; font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted);
    background: var(--surface); padding: 2px 8px; border-radius: 999px;
  }

  .rmap-line { position: relative; display: flex; flex-direction: column; gap: 2px; padding-left: 6px; }
  .rmap-line::before {
    content: ''; position: absolute; left: 17px; top: 14px; bottom: 14px; width: 1px; background: var(--line);
  }
  .rmap-node {
    position: relative; display: flex; align-items: center; gap: 0.75rem;
    padding: 0.5rem 0.6rem 0.5rem 0; border-radius: 9px; color: var(--body); text-decoration: none;
  }
  .rmap-node:hover { background: var(--surface); }
  .rmap-node:hover .rmap-node-title { color: var(--accent); }
  .rmap-dot {
    position: relative; z-index: 1; flex: none; width: 24px; height: 24px; border-radius: 50%;
    display: inline-grid; place-items: center; background: var(--raise); border: 2px solid var(--line);
    color: var(--muted); font-size: 13px;
  }
  .rmap-node.status-done .rmap-dot { background: var(--accent); border-color: var(--accent); color: #fff; }
  .rmap-node.status-started .rmap-dot { border-color: var(--accent); }
  .rmap-node-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .rmap-node-title {
    font-size: 0.92rem; color: var(--ink); font-weight: 500; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; transition: color 0.15s var(--ease);
  }
  .rmap-node.status-new .rmap-node-title { color: var(--muted); }
  .rmap-node-diff { font-family: var(--font-mono); font-size: 0.68rem; color: var(--faint); text-transform: capitalize; }
</style>
