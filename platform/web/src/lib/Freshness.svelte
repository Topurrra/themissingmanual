<script>
  import { t } from '$lib/i18n/index.js';
  import { hreflangOf } from '$lib/i18n/locales.js';
  // Shows when a page was last updated, and flags content that may be stale.
  export let date = ''; // ISO "yyyy-mm-dd" from frontmatter `updated`
  export let staleDays = 365;
  export let lang = 'en';
  $: d = date ? new Date(date + 'T00:00:00') : null;
  $: valid = d && !isNaN(d.getTime());
  $: ageDays = valid ? Math.floor((Date.now() - d.getTime()) / 86400000) : 0;
  $: stale = valid && ageDays > staleDays;
  // English keeps the reader's own locale format; a translated page uses its language's.
  $: label = valid ? d.toLocaleDateString(lang === 'en' ? undefined : hreflangOf(lang), { year: 'numeric', month: 'short', day: 'numeric' }) : '';
</script>

{#if valid}
  <span class="freshness" class:stale title={stale ? t(lang, 'toolbar.stale_title') : t(lang, 'toolbar.updated_title', { date: label })}>
    <i class="ti ti-history" aria-hidden="true"></i>
    {#if stale}{t(lang, 'toolbar.updated', { date: label })} · {t(lang, 'toolbar.may_be_stale')}{:else}{t(lang, 'toolbar.updated', { date: label })}{/if}
  </span>
{/if}

<style>
  .freshness { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); }
  .freshness .ti { font-size: 14px; }
  .freshness.stale { color: #c0563c; }
</style>
