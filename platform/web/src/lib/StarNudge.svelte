<script>
  // A one-time, low-pressure "star us on GitHub" nudge. Deliberately NOT periodic:
  // it appears a single time, and only after the reader has clearly gotten value
  // (three distinct guide phases in a session), then never again once dismissed or
  // clicked. Asking at the moment goodwill exists converts better and respects the
  // reader far more than a recurring popup, which is the pattern this site avoids.
  //
  // Bottom-LEFT on purpose: the bottom-right corner is the tutor + feedback FAB
  // stack (--tutor-shift / --fab-lift), so a right-side card would collide.
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let githubUrl = '';

  const DONE_KEY = 'tmm-star-done'; // clicked or dismissed -> never show again
  const READS_KEY = 'tmm-star-reads'; // per-session set of guide phases read
  const THRESHOLD = 3; // distinct phases in a session before we ask

  let done = false;
  let visible = false;
  let mounted = false;

  const isGuidePhase = (p) => /^\/guides\/[^/]+\/\d+\/?$/.test(p || '');

  function readsThisSession() {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(READS_KEY) || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  // Count distinct guide phases read this session; reveal once past the threshold.
  function consider(path) {
    if (!mounted || done || !githubUrl || visible) return;
    if (!isGuidePhase(path)) return;
    const set = readsThisSession();
    if (!set.has(path)) {
      set.add(path);
      try {
        sessionStorage.setItem(READS_KEY, JSON.stringify([...set]));
      } catch (e) {}
    }
    if (set.size >= THRESHOLD) visible = true;
  }

  function finish() {
    done = true;
    visible = false;
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch (e) {}
  }

  onMount(() => {
    try {
      done = localStorage.getItem(DONE_KEY) === '1';
    } catch (e) {}
    mounted = true;
    consider($page.url.pathname);
  });

  $: if (mounted && githubUrl) consider($page?.url?.pathname);
</script>

{#if visible && githubUrl}
  <div class="star-nudge" role="dialog" aria-label="Star The Missing Manual on GitHub">
    <button class="sn-close" type="button" on:click={finish} aria-label="Dismiss">
      <i class="ti ti-x" aria-hidden="true"></i>
    </button>
    <div class="sn-head">
      <i class="ti ti-star-filled sn-star" aria-hidden="true"></i>
      <p class="sn-msg">Finding this useful? A quick GitHub star helps more developers find it.</p>
    </div>
    <a
      class="sn-btn"
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      on:click={finish}
    >
      <i class="ti ti-brand-github" aria-hidden="true"></i>
      Star on GitHub
    </a>
  </div>
{/if}

<style>
  .star-nudge {
    position: fixed;
    left: 20px;
    bottom: 20px;
    z-index: 60;
    width: 300px;
    max-width: calc(100vw - 40px);
    padding: 0.95rem 1rem 1rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--raise);
    box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.35);
    animation: sn-in 0.35s var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
  }
  @keyframes sn-in {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .star-nudge {
      animation: none;
    }
  }
  .sn-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--faint);
    cursor: pointer;
    border-radius: 7px;
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .sn-close:hover {
    color: var(--ink);
    background: var(--surface);
  }
  .sn-head {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    margin: 0 1.2rem 0.85rem 0;
  }
  .sn-star {
    color: #f5b301;
    font-size: 20px;
    flex: none;
    margin-top: 1px;
  }
  .sn-msg {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--body);
  }
  .sn-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
    justify-content: center;
    padding: 0.5rem 0.9rem;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .sn-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
