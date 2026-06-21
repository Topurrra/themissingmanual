<script>
  // Shows when a page was last updated, and flags content that may be stale.
  export let date = ''; // ISO "yyyy-mm-dd" from frontmatter `updated`
  export let staleDays = 365;
  $: d = date ? new Date(date + 'T00:00:00') : null;
  $: valid = d && !isNaN(d.getTime());
  $: ageDays = valid ? Math.floor((Date.now() - d.getTime()) / 86400000) : 0;
  $: stale = valid && ageDays > staleDays;
  $: label = valid ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
</script>

{#if valid}
  <span class="freshness" class:stale title={stale ? 'This guide may be out of date — verify against current tools.' : `Last updated ${label}`}>
    <i class="ti ti-history" aria-hidden="true"></i>
    {#if stale}Updated {label} · may be out of date{:else}Updated {label}{/if}
  </span>
{/if}

<style>
  .freshness { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); }
  .freshness .ti { font-size: 14px; }
  .freshness.stale { color: #c0563c; }
</style>
