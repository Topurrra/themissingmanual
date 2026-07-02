<script>
  import { onMount } from 'svelte';
  import { CATEGORY_ORDER } from '$lib/pathgen.js';
  import { guideStatuses, categoryMastery, reviewDueByGuide } from '$lib/skillmap.js';

  export let categories = [];
  export let guides = [];

  let rows = [];

  onMount(() => {
    const statuses = guideStatuses(guides);
    const due = reviewDueByGuide();
    const known = CATEGORY_ORDER.filter((c) => categories.some((x) => x.slug === c));
    const extra = categories.map((c) => c.slug).filter((s) => !CATEGORY_ORDER.includes(s));
    rows = [...known, ...extra].map((slug) => categories.find((c) => c.slug === slug)).map((cat) => {
      const m = categoryMastery(cat.slug, guides, statuses);
      const dueCount = guides
        .filter((g) => g.category === cat.slug)
        .reduce((n, g) => n + (due[g.slug]?.due || 0), 0);
      return { ...cat, ...m, dueCount };
    });
  });
</script>

<div class="skg-grid">
  {#each rows as r (r.slug)}
    <a class="skg-card" href="/categories/{r.slug}">
      <div class="skg-top">
        <i class="ti {r.icon}" aria-hidden="true"></i>
        <span class="skg-name">{r.name}</span>
      </div>
      <div class="skg-pct">{r.pct}%</div>
      <div class="skg-bar"><span class="skg-bar-fill" style="width:{r.pct}%"></span></div>
      <div class="skg-foot">
        <span>{r.done}/{r.total} done</span>
        {#if r.dueCount}<span class="skg-due"><i class="ti ti-cards" aria-hidden="true"></i> {r.dueCount} due</span>{/if}
      </div>
    </a>
  {:else}
    <p class="skg-empty">Nothing tracked yet - finish a quiz or exercise and it shows up here.</p>
  {/each}
</div>

<style>
  .skg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; }
  .skg-card {
    display: flex; flex-direction: column; gap: 0.3rem; text-decoration: none; color: inherit;
    background: var(--raise); border: 1px solid var(--line); border-radius: 14px; padding: 1rem 1.1rem;
    transition: border-color 0.15s var(--ease);
  }
  .skg-card:hover { border-color: var(--accent); }
  .skg-top { display: flex; align-items: center; gap: 0.5rem; }
  .skg-top .ti { color: var(--accent); font-size: 17px; }
  .skg-name { font-size: 0.85rem; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .skg-pct { font-family: var(--font-display); font-size: 1.6rem; font-weight: 600; color: var(--ink); margin-top: 0.2rem; }
  .skg-bar { height: 6px; border-radius: 999px; background: var(--surface); overflow: hidden; margin: 0.15rem 0 0.2rem; }
  .skg-bar-fill { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
  .skg-foot { display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; color: var(--muted); }
  .skg-due { display: inline-flex; align-items: center; gap: 0.25rem; color: var(--accent); font-family: var(--font-mono); }
  .skg-empty { color: var(--muted); grid-column: 1 / -1; }
</style>
