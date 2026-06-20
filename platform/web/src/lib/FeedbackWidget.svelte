<script>
  // Reader feedback. Two surfaces, one shared vote flow:
  //   A) a persistent floating FAB → popover with two thumbs + an optional note.
  //   B) an in-flow end-of-content card (rendered right after </article>, so it
  //      naturally lands at the very bottom of the reading column). It stays in
  //      the page flow — it does NOT follow the viewport — and only gets a gentle
  //      one-shot CSS entrance animation on first paint.
  // A shared select-then-send flow lets the reader pick a thumb, optionally add a
  // note, then POST {guide_slug, phase_no, vote, note?} to /feedback. A success
  // flips BOTH surfaces to the "rated" state (shared state below). Mount inside
  // the phase reader's {#key} block so each phase re-mounts and resets all state.
  export let guideSlug;
  export let phaseNo;

  // FAB / popover state
  let open = false;        // popover visible
  let sending = false;     // POST in flight
  let rated = false;       // a vote succeeded — both surfaces show the "Thanks" state
  let failed = false;      // last POST failed — keep the form, show a hint

  // Shared select-then-send state (drives both surfaces).
  let selected = null;     // 'up' | 'down' once a thumb is chosen, else null
  let note = '';           // optional free-text note

  // Surface B (inline end card) dismissal.
  let nudgeDismissed = false;

  let fabEl;

  function pick(v) {
    if (sending || rated) return;
    selected = v;
    failed = false;
  }

  async function send() {
    if (sending || rated || !selected) return;
    sending = true;
    failed = false;
    const trimmed = note.trim();
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          guide_slug: guideSlug,
          phase_no: phaseNo,
          vote: selected,
          ...(trimmed ? { note: trimmed } : {})
        })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      rated = true;
      // Briefly show "Thanks!" inside the popover, then collapse it.
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
          class:selected={selected === 'up'}
          aria-label="Yes, this was helpful"
          aria-pressed={selected === 'up'}
          on:click={() => pick('up')}
          disabled={sending}
        >
          <i class="ti ti-thumb-up" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="fb-thumb"
          class:selected={selected === 'down'}
          aria-label="No, this was not helpful"
          aria-pressed={selected === 'down'}
          on:click={() => pick('down')}
          disabled={sending}
        >
          <i class="ti ti-thumb-down" aria-hidden="true"></i>
        </button>
      </div>

      {#if selected}
        <div class="fb-note">
          <label class="fb-note-label" for="fb-pop-note">Anything to add? (optional)</label>
          <textarea
            id="fb-pop-note"
            class="fb-note-input"
            rows="2"
            bind:value={note}
            disabled={sending}
          ></textarea>
          <button type="button" class="fb-send" on:click={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      {/if}

      {#if failed}
        <p class="fb-err" role="alert">Couldn't send — try again.</p>
      {/if}
    {/if}
  </div>
{/if}

<!-- B) In-flow end-of-content card. Rendered in normal page flow at the very
     bottom of the content (this component sits right after </article>), so it
     stays put and the reader only meets it on reaching the end. -->
{#if !nudgeDismissed}
  <section class="fb-end" class:rated aria-label="Page feedback">
    {#if rated}
      <p class="fb-end-thanks" role="status">
        <i class="ti ti-circle-check" aria-hidden="true"></i> Thanks for the feedback.
      </p>
    {:else}
      <button
        type="button"
        class="fb-end-x"
        aria-label="Dismiss feedback"
        on:click={() => (nudgeDismissed = true)}
      >&times;</button>

      <p class="fb-end-q">Was this page helpful?</p>

      <div class="fb-end-thumbs" role="group" aria-label="Rate this page">
        <button
          type="button"
          class="fb-thumb"
          class:selected={selected === 'up'}
          aria-label="Yes, this was helpful"
          aria-pressed={selected === 'up'}
          on:click={() => pick('up')}
          disabled={sending}
        >
          <i class="ti ti-thumb-up" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="fb-thumb"
          class:selected={selected === 'down'}
          aria-label="No, this was not helpful"
          aria-pressed={selected === 'down'}
          on:click={() => pick('down')}
          disabled={sending}
        >
          <i class="ti ti-thumb-down" aria-hidden="true"></i>
        </button>
      </div>

      {#if selected}
        <div class="fb-note">
          <label class="fb-note-label" for="fb-end-note">Anything to add? (optional)</label>
          <textarea
            id="fb-end-note"
            class="fb-note-input"
            rows="2"
            bind:value={note}
            disabled={sending}
          ></textarea>
          <button type="button" class="fb-send" on:click={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      {/if}

      {#if failed}
        <p class="fb-err" role="alert">Couldn't send — try again.</p>
      {/if}
    {/if}
  </section>
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
    width: 264px;
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
  .fb-thumb.selected {
    color: var(--accent); border-color: var(--accent); background: var(--accent-tint);
  }
  .fb-thumb:disabled { cursor: default; }
  .fb-thumb:disabled:not(.selected) { opacity: 0.55; }

  /* Optional note (shared by both surfaces). */
  .fb-note { margin-top: 0.7rem; }
  .fb-note-label {
    display: block; margin-bottom: 0.35rem;
    color: var(--muted); font-size: 0.82rem;
  }
  .fb-note-input {
    display: block; width: 100%; box-sizing: border-box;
    padding: 0.5rem 0.6rem; resize: vertical; min-height: 2.5rem;
    border: 1px solid var(--line); border-radius: 9px;
    background: var(--bg); color: var(--ink);
    font: inherit; font-size: 0.9rem; line-height: 1.5;
    transition: border-color 0.15s var(--ease);
  }
  .fb-note-input:focus { outline: none; border-color: var(--accent); }
  .fb-note-input:disabled { opacity: 0.6; }

  .fb-send {
    margin-top: 0.6rem;
    display: inline-flex; align-items: center; justify-content: center;
    height: 38px; padding: 0 1.1rem;
    border: 1px solid var(--accent); border-radius: 9px;
    background: var(--accent); color: #fff;
    font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer;
    transition: background 0.15s var(--ease), border-color 0.15s var(--ease);
  }
  .fb-send:hover:not(:disabled) { background: var(--accent-strong); border-color: var(--accent-strong); }
  .fb-send:disabled { cursor: default; opacity: 0.6; }

  .fb-err { margin: 0.6rem 0 0; color: var(--danger); font-size: 0.82rem; }

  .fb-thanks {
    display: flex; align-items: center; gap: 0.45rem; margin: 0;
    color: var(--accent-strong); font-weight: 600; font-size: 0.95rem;
  }
  .fb-thanks > i { font-size: 1.05rem; }

  /* B) In-flow end-of-content feedback card. NOT fixed — it sits in normal flow
     at the foot of the content and stays put. Constrained to the reader measure
     and centred so it reads as the article's footer. One-shot entrance only. */
  .fb-end {
    position: relative;
    box-sizing: border-box;
    max-width: 720px;
    margin: 2.5rem auto 0;
    padding: 1.4rem 1.5rem;
    border: 1px solid var(--line); border-radius: 14px;
    background: var(--raise); box-shadow: var(--shadow-sm);
    text-align: center;
    animation: fb-end-in 0.4s var(--ease-out) both;
  }
  @keyframes fb-end-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fb-end { animation: none; }
  }

  .fb-end-q {
    margin: 0 0 0.9rem;
    color: var(--ink); font-weight: 600; font-size: 1.05rem;
  }

  .fb-end-thumbs {
    display: flex; justify-content: center; gap: 0.7rem;
    max-width: 240px; margin: 0 auto;
  }
  .fb-end .fb-thumb { flex: 1; max-width: 110px; }

  /* Note inside the end card — constrained and centred to match the card. */
  .fb-end .fb-note { max-width: 360px; margin-left: auto; margin-right: auto; text-align: left; }
  .fb-end .fb-err { text-align: center; }

  .fb-end-x {
    position: absolute; top: 0.6rem; right: 0.7rem;
    border: 0; background: none; color: var(--faint);
    font-size: 20px; line-height: 1; cursor: pointer; padding: 0.2rem 0.35rem;
    transition: color 0.15s var(--ease);
  }
  .fb-end-x:hover { color: var(--ink); }

  .fb-end-thanks {
    display: flex; align-items: center; justify-content: center; gap: 0.45rem;
    margin: 0; color: var(--accent-strong); font-weight: 600; font-size: 1rem;
  }
  .fb-end-thanks > i { font-size: 1.1rem; }
</style>
