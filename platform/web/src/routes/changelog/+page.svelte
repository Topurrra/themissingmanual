<script>
  import { CHANGELOG, formatMonth } from '$lib/changelog.js';
  import Seo from '$lib/Seo.svelte';
</script>

<Seo
  title="What's New - The Missing Manual"
  description="Recent additions and improvements to The Missing Manual - new guides, topics, themes, and features, newest first." />

<header class="cl-intro">
  <span class="eyebrow">Changelog</span>
  <h1>What's new</h1>
  <p class="tagline">Recent additions and improvements - newest first.</p>
</header>

{#each CHANGELOG as release}
  <section class="cl-release">
    <h2 class="cl-date">{formatMonth(release.date)}</h2>
    <ul class="cl-list">
      {#each release.items as item}
        <li>{item}</li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  .cl-intro { margin-bottom: 1.8rem; }
  .cl-intro h1 { margin: 0.5rem 0 0.6rem; }

  .cl-release { margin-bottom: 1.8rem; }
  .cl-date {
    font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent);
    margin: 0 0 0.7rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--line);
  }
  .cl-list { margin: 0; padding-left: 1.15rem; }
  .cl-list li { color: var(--body); line-height: 1.7; margin: 0 0 0.5rem; }
  .cl-list li::marker { color: var(--faint); }
</style>
