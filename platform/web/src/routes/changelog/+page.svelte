<script>
  import { CHANGELOG, formatMonth } from '$lib/changelog.js';
  import Seo from '$lib/Seo.svelte';
</script>

<Seo
  title="What's New - The Missing Manual"
  description="Recent additions and improvements to The Missing Manual - new guides, topics, themes, and features, newest first." />

<div class="cl">
  <header class="cl-intro">
    <span class="eyebrow">Changelog</span>
    <h1>What's new</h1>
    <p class="cl-sub">New guides, topics, and features - newest first.</p>
  </header>

  {#each CHANGELOG as release}
    <section class="cl-release">
      <div class="cl-when">{formatMonth(release.date)}</div>
      <ul class="cl-items">
        {#each release.items as item}
          <li class="cl-item">
            <span class="cl-tag cl-{item.tag.toLowerCase()}">{item.tag}</span>
            <span class="cl-text">
              {#if item.href}<a href={item.href}>{item.text}</a>{:else}{item.text}{/if}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .cl { max-width: 760px; margin: 0 auto; }
  .cl-intro { margin-bottom: 2.4rem; }
  .cl-intro h1 { margin: 0.5rem 0 0.5rem; }
  .cl-sub { color: var(--muted); font-size: 0.95rem; margin: 0; }

  /* Each release: a date column on the left, the changes on the right; hairline
     between releases. Stacks to one column on mobile. */
  .cl-release {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1.4rem 2rem;
    padding: 1.8rem 0;
    border-top: 1px solid var(--line);
  }
  .cl-when {
    font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600;
    letter-spacing: 0.04em; color: var(--faint); padding-top: 0.2rem;
  }

  .cl-items { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.95rem; }
  .cl-item { display: flex; gap: 0.75rem; align-items: baseline; }
  .cl-text { color: var(--body); line-height: 1.6; }
  .cl-text a { color: var(--accent); font-weight: 500; }
  .cl-text a:hover { text-decoration: underline; }

  /* Tag chip - mono micro-label, fixed width so the text lines up. */
  .cl-tag {
    flex: none; width: 78px; box-sizing: border-box; text-align: center;
    font-family: var(--font-mono); font-size: 0.62rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.22rem 0.5rem; border-radius: 999px;
    position: relative; top: -1px;
  }
  .cl-new { color: var(--accent-strong); background: var(--accent-tint); }
  .cl-improved { color: var(--muted); background: var(--surface); border: 1px solid var(--line); }

  @media (max-width: 640px) {
    .cl-release { grid-template-columns: 1fr; gap: 0.9rem; padding: 1.4rem 0; }
    .cl-when { padding-top: 0; }
  }
</style>
