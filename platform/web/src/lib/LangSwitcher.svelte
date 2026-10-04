<script>
  // Language switcher for guide overview + phase pages. Renders only when the guide
  // is published in at least one locale; links each language to this same page.
  import { LOCALES, localePath } from '$lib/i18n/locales.js';
  import { t } from '$lib/i18n/index.js';

  export let lang = 'en';
  export let path = ''; // the English path of this page, e.g. /guides/git-from-zero/2
  export let translations = []; // locale codes this guide is published in

  $: options = [
    { code: 'en', name: t(lang, 'lang.english'), hreflang: 'en' },
    ...LOCALES.filter((l) => translations.includes(l.code))
  ];
</script>

{#if translations.length}
  <nav class="i18n-switch" aria-label={t(lang, 'lang.label')}>
    <i class="ti ti-language" aria-hidden="true"></i>
    <span class="i18n-switch-label">{t(lang, 'lang.label')}:</span>
    {#each options as o}
      {#if o.code === lang}
        <span class="i18n-switch-on" aria-current="page" lang={o.hreflang}>{o.name}</span>
      {:else}
        <a href={localePath(o.code, path)} hreflang={o.hreflang} lang={o.hreflang}>{o.name}</a>
      {/if}
    {/each}
  </nav>
{/if}

<style>
  .i18n-switch {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.45rem;
    margin: 0 0 1rem; font-size: 0.82rem; color: var(--muted);
  }
  .i18n-switch .ti { font-size: 15px; color: var(--faint); }
  .i18n-switch-label { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.09em; text-transform: uppercase; }
  .i18n-switch a, .i18n-switch-on {
    border: 1px solid var(--line); border-radius: 999px; padding: 0.15rem 0.65rem;
  }
  .i18n-switch a { color: var(--muted); text-decoration: none; transition: border-color 0.15s var(--ease), color 0.15s var(--ease); }
  .i18n-switch a:hover { border-color: var(--accent); color: var(--accent); }
  .i18n-switch-on { color: var(--ink); background: var(--surface); font-weight: 600; }
</style>
