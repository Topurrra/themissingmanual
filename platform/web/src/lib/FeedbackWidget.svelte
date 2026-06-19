<script>
  import { onMount, tick } from 'svelte';

  // Reader feedback, redesigned to match the "save my place" bookmark tools
  // (ReaderTools.svelte) rather than sit inline at the foot of the phase. Two
  // surfaces, one component:
  //   A) a persistent floating FAB → popover with two thumbs (just 👍/👎, no note)
  //   B) a scroll-to-end nudge that appears once when the reader reaches the
  //      bottom of the content, with the same thumb actions.
  // A shared vote(v) POSTs same-origin to /feedback and flips both surfaces to
  // the "rated" state. Mount inside the phase reader's {#key} block so each
  // phase re-mounts this component and resets all state (the IntersectionObserver
  // + timeouts are torn down by the onMount cleanup on the {#key} swap).
  export let guideSlug;
  export let phaseNo;

  // FAB / popover state
  let open = false;        // popover visible
  let sending = false;     // POST in flight
  let rated = false;       // a vote succeeded — FAB shows the "Thanks" state
  let failed = false;      // last POST failed — keep the thumbs, show a hint

  // Nudge state
  let nudge = false;       // scroll-end nudge visible
  let nudgeDone = false;   // nudge already shown/dismissed this phase (don't re-show)

  let fabEl;

  async function vote(v) {
    if (sending || rated) return;
    sending = true;
    failed = false;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guide_slug: guideSlug, phase_no: phaseNo, vote: v })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      rated = true;
      // Briefly show "Thanks!" inside the popover, then collapse it.
      hideNudge();
      setTimeout(() => { open = false; }, 1100);
    } catch (e) {
      failed = true;
    } finally {
      sending = false;
    }
  }

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      open = false;
      fabEl?.focus();
    }
  }

  function hideNudge() {
    nudge = false;
    nudgeDone = true;
  }

  // Detect end-of-content: observe a 1px sentinel appended after the last child
  // of .reader. tick() first so {@html phase.html} is in the DOM. Fire once.
  onMount(() => {
    let destroyed = false;
    let sentinel = null;
    let observer = null;
    let autoHideT = null;

    const init = async () => {
      await tick();
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader || !('IntersectionObserver' in window)) return;

      sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'height:1px;width:100%;pointer-events:none;';
      reader.appendChild(sentinel);

      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Only once per phase, and not if already rated or dismissed.
          if (nudgeDone || rated) { observer.disconnect(); return; }
          nudge = true;
          observer.disconnect();
          autoHideT = setTimeout(() => { if (nudge) hideNudge(); }, 8000);
        }
      });
      observer.observe(sentinel);
    };

    init();

    return () => {
      destroyed = true;
      clearTimeout(autoHideT);
      observer?.disconnect();
      sentinel?.remove();
    };
  });
</script>

<svelte:window on:keydown={onKeydown} />

<!-- A) Floating feedback FAB, stacked above the bookmark FAB -->
<button
  bind:this={fabEl}
  type="button"
  class="fb-fab"
  class:rated
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-label={rated ? 'Thanks for rating this page' : 'Rate this page'}
  on:click={toggle}
>
  <i class="ti {rated ? 'ti-mood-smile' : 'ti-thumb-up'}" aria-hidden="true"></i>
  <span class="fb-label">{rated ? 'Thanks for rating' : 'Rate this page'}</span>
</button>

{#if open}
  <!-- Click-away + Esc closes (mirrors .pop-backdrop) -->
  <button type="button" class="fb-backdrop" aria-label="Close rating" on:click={close}></button>

  <div class="fb-pop" role="dialog" aria-label="Rate this page">
    {#if rated}
      <p class="fb-thanks" role="status">
        <i class="ti ti-circle-check" aria-hidden="true"></i> Thanks!
      </p>
    {:else}
      <p class="fb-q">How was this page?</p>
      <div class="fb-thumbs" role="group" aria-label="Rate this page">
        <button
          type="button"
          class="fb-thumb"
          aria-label="Yes, this was helpful"
          on:click={() => vote('up')}
          disabled={sending}
        >
          <i class="ti ti-thumb-up" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="fb-thumb"
          aria-label="No, this was not helpful"
          on:click={() => vote('down')}
          disabled={sending}
        >
          <i class="ti ti-thumb-down" aria-hidden="true"></i>
        </button>
      </div>
      {#if failed}
        <p class="fb-err" role="alert">Couldn't send — try again.</p>
      {/if}
    {/if}
  </div>
{/if}

<!-- B) Scroll-to-end nudge (bottom-centre, clear of the bookmark pieces) -->
{#if nudge}
  <div class="fb-nudge show" role="status">
    <span class="fb-nudge-text">Enjoyed this page? A quick rating helps</span>
    <div class="fb-nudge-thumbs" role="group" aria-label="Rate this page">
      <button
        type="button"
        class="fb-thumb"
        aria-label="Yes, this was helpful"
        on:click={() => vote('up')}
        disabled={sending}
      >
        <i class="ti ti-thumb-up" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="fb-thumb"
        aria-label="No, this was not helpful"
        on:click={() => vote('down')}
        disabled={sending}
      >
        <i class="ti ti-thumb-down" aria-hidden="true"></i>
      </button>
    </div>
    <button type="button" class="fb-nudge-x" aria-label="Dismiss" on:click={hideNudge}>&times;</button>
  </div>
{/if}

<style>
  /* A) FAB — matches .read-fab, stacked above the bookmark FAB (bottom:22px). */
  .fb-fab {
    position: fixed; right: 22px; bottom: 78px; z-index: 55;
    display: inline-flex; align-items: center;
    height: 46px; padding: 0 13px;
    border: 1px solid var(--line); border-radius: 999px;
    background: var(--raise); color: var(--muted);
    box-shadow: var(--shadow-md); cursor: pointer; white-space: nowrap;
    transition: color 0.18s var(--ease), background 0.18s var(--ease), border-color 0.18s var(--ease);
  }
  .fb-fab > i { font-size: 20px; flex: none; }
  .fb-label {
    max-width: 0; opacity: 0; margin-left: 0; overflow: hidden;
    transition: max-width 0.26s var(--ease), opacity 0.2s var(--ease), margin 0.26s var(--ease);
    font-size: 0.9rem;
  }
  .fb-fab:hover { color: var(--ink); border-color: var(--faint); }
  .fb-fab:hover .fb-label { max-width: 170px; opacity: 1; margin-left: 8px; }
  .fb-fab.rated { background: var(--accent); color: #fff; border-color: var(--accent); }
  .fb-fab.rated:hover { background: var(--accent-strong); border-color: var(--accent-strong); }

  /* Click-away — mirrors .pop-backdrop (below the popover, above the FAB stack). */
  .fb-backdrop {
    position: fixed; inset: 0; z-index: 56;
    background: transparent; border: 0; cursor: default;
  }

  /* Popover anchored above the FAB — styled like .settings-pop / .resume-pill. */
  .fb-pop {
    position: fixed; right: 22px; bottom: 132px; z-index: 57;
    width: 232px;
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow-pop);
    padding: 0.9rem 1rem;
    transform-origin: bottom right;
    animation: fb-pop 0.16s var(--ease-out);
  }
  @keyframes fb-pop {
    from { opacity: 0; transform: scale(0.96) translateY(4px); }
    to { opacity: 1; transform: none; }
  }

  .fb-q {
    margin: 0 0 0.7rem;
    font-weight: 600; color: var(--ink); font-size: 0.95rem;
  }

  .fb-thumbs { display: flex; gap: 0.55rem; }

  .fb-thumb {
    display: inline-flex; align-items: center; justify-content: center;
    flex: 1; height: 46px;
    border: 1px solid var(--line); border-radius: 10px;
    background: var(--bg); color: var(--muted);
    cursor: pointer; font-size: 1.25rem;
    transition: color 0.15s var(--ease), border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .fb-thumb:hover:not(:disabled) {
    color: var(--accent); border-color: var(--accent); background: var(--accent-tint);
  }
  .fb-thumb:disabled { cursor: default; opacity: 0.55; }

  .fb-err { margin: 0.6rem 0 0; color: var(--danger); font-size: 0.82rem; }

  .fb-thanks {
    display: flex; align-items: center; gap: 0.45rem; margin: 0;
    color: var(--accent-strong); font-weight: 600; font-size: 0.95rem;
  }
  .fb-thanks > i { font-size: 1.05rem; }

  /* B) Scroll-end nudge — bottom-centre, raised clear of every bookmark piece.
     Animates in/out like .resume-pill / .read-toast. */
  .fb-nudge {
    position: fixed; left: 50%; bottom: 92px; z-index: 56;
    transform: translate(-50%, 18px); opacity: 0;
    display: inline-flex; align-items: center; gap: 0.7rem;
    max-width: 92vw;
    background: var(--raise); border: 1px solid var(--line); border-radius: 14px;
    box-shadow: var(--shadow-pop); padding: 0.5rem 0.55rem 0.5rem 0.9rem;
    transition: opacity 0.26s var(--ease), transform 0.26s var(--ease);
  }
  .fb-nudge.show { opacity: 1; transform: translate(-50%, 0); }

  .fb-nudge-text { color: var(--ink); font-size: 0.9rem; white-space: nowrap; }
  .fb-nudge-thumbs { display: flex; gap: 0.4rem; flex: none; }
  .fb-nudge .fb-thumb { flex: none; width: 40px; height: 36px; font-size: 1.05rem; border-radius: 9px; }

  .fb-nudge-x {
    border: 0; background: none; color: var(--faint);
    font-size: 19px; line-height: 1; cursor: pointer; padding: 0 0.3rem; flex: none;
  }
  .fb-nudge-x:hover { color: var(--ink); }

  @media (max-width: 560px) {
    .fb-nudge-text { white-space: normal; }
  }
</style>
