<script>
  import { page } from '$app/stores';
  import Seo from '$lib/Seo.svelte';

  $: is404 = $page.status === 404;
</script>

<Seo title={`${$page.status} - The Missing Manual`} description="Page not found on The Missing Manual." />

<div class="err-wrap">
  <p class="err-code">{$page.status}</p>
  <h1>{is404 ? "This page doesn't exist." : 'Something went wrong.'}</h1>
  <p class="err-sub">
    {is404
      ? 'The guide may have moved, or the link is stale. Everything we have is a search away.'
      : 'Try again in a moment - or head somewhere that works.'}
  </p>
  <div class="err-actions">
    <a class="err-btn primary" href="/">Browse all topics</a>
    <a class="err-btn" href="/practice">Practice</a>
    <a class="err-btn" href="/cheat-sheet">Cheat sheets</a>
  </div>
  <p class="err-hint">Tip: press <span class="k">/</span> anywhere to search every guide.</p>
</div>

<style>
  .err-wrap {
    max-width: 560px;
    margin: 12vh auto 4rem;
    padding: 0 1.2rem;
    text-align: center;
  }
  .err-code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin: 0 0 0.4rem;
  }
  .err-wrap h1 {
    font-family: var(--font-display);
    font-size: 1.6rem;
    margin: 0 0 0.6rem;
    color: var(--ink);
  }
  .err-sub {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0 0 1.4rem;
  }
  .err-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;
  }
  .err-btn {
    display: inline-block;
    padding: 0.55rem 1rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    text-decoration: none;
    font-size: 0.9rem;
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .err-btn:hover { border-color: var(--accent); background: var(--accent-tint); }
  .err-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .err-btn.primary:hover { background: var(--accent-strong); }
  .err-hint { color: var(--faint); font-size: 0.82rem; }
  .err-hint .k {
    font-family: var(--font-mono);
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 0.05rem 0.35rem;
  }
</style>
