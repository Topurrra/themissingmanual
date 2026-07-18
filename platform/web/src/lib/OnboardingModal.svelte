<script>
  import { onMount, onDestroy } from 'svelte';
  import { setBeginner } from '$lib/beginner-store.js';
  import { focusTrap } from '$lib/focusTrap.js';

  // First-visit only: asks the same question the Settings panel's Beginner
  // mode toggle already answers, just surfaced proactively instead of
  // requiring someone to find it. Skipping (backdrop/Escape/"Skip for now")
  // marks it seen without touching beginnerMode, so the default stays
  // exactly what it already is today (off - full content).
  const SEEN_KEY = 'tmm-onboard-seen';
  let show = false;
  let timer = null;

  onMount(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        timer = setTimeout(() => { show = true; }, 600);
      }
    } catch (e) {}
  });
  onDestroy(() => { if (timer) clearTimeout(timer); });

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    show = false;
  }
  function choose(beginner) {
    setBeginner(beginner);
    dismiss();
  }
  function onKeydown(e) { if (e.key === 'Escape' && show) dismiss(); }
</script>

<svelte:window on:keydown={onKeydown} />

{#if show}
  <button type="button" class="ob-backdrop" aria-label="Dismiss" on:click={dismiss}></button>
  <div class="ob-card" role="dialog" aria-modal="true" aria-label="Tell us your experience level" use:focusTrap>
    <p class="ob-eyebrow">Quick question</p>
    <h2>New to this, or already comfortable with the basics?</h2>
    <p class="ob-sub">We'll show beginner-level guides by default - change it anytime in Settings.</p>
    <div class="ob-choices">
      <button type="button" class="ob-choice" on:click={() => choose(true)}>I'm new to this</button>
      <button type="button" class="ob-choice" on:click={() => choose(false)}>I've got the basics down</button>
    </div>
    <button type="button" class="ob-skip" on:click={dismiss}>Skip for now</button>
  </div>
{/if}

<style>
  .ob-backdrop {
    position: fixed; inset: 0; z-index: 90; border: 0; cursor: default;
    background: color-mix(in srgb, var(--ink) 32%, transparent);
    animation: ob-fade 0.2s var(--ease);
  }
  @keyframes ob-fade { from { opacity: 0; } to { opacity: 1; } }
  .ob-card {
    position: fixed; z-index: 91; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(420px, 92vw);
    background: var(--raise); border: 1px solid var(--line); border-radius: 16px;
    box-shadow: var(--shadow-pop);
    padding: 1.5rem 1.5rem 1.2rem;
    text-align: center;
    animation: ob-pop 0.22s var(--ease-out);
  }
  @keyframes ob-pop {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .ob-eyebrow {
    font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--accent); margin: 0 0 0.5rem;
  }
  .ob-card h2 { margin: 0 0 0.5rem; font-family: var(--font-display); font-size: 1.2rem; line-height: 1.35; }
  .ob-sub { color: var(--muted); font-size: 0.86rem; line-height: 1.4; margin: 0 0 1.2rem; }
  .ob-choices { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.9rem; }
  .ob-choice {
    font: inherit; font-size: 0.95rem; font-weight: 500; color: var(--ink);
    background: var(--bg); border: 1px solid var(--line); border-radius: 10px;
    padding: 0.7rem 1rem; cursor: pointer;
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .ob-choice:hover { border-color: var(--accent); background: var(--accent-tint); }
  .ob-skip {
    font: inherit; font-size: 0.8rem; color: var(--faint);
    background: none; border: 0; cursor: pointer; padding: 0.3rem;
  }
  .ob-skip:hover { color: var(--ink); }
</style>
