<script>
  // Reader feedback: a persistent floating FAB → popover with two thumbs + an
  // optional note. Pick a thumb, optionally add a note, then POST
  // {guide_slug, phase_no, vote, note?} to /feedback; success flips to "rated".
  // Mount inside the phase reader's {#key} block so each phase re-mounts state.
  export let guideSlug;
  export let phaseNo;

  // FAB / popover state
  let open = false;        // popover visible
  let sending = false;     // POST in flight
  let rated = false;       // a vote succeeded - both surfaces show the "Thanks" state
  let failed = false;      // last POST failed - keep the form, show a hint

  // Shared select-then-send state (drives both surfaces).
  let selected = null;     // 'up' | 'down' once a thumb is chosen, else null
  let note = '';           // optional free-text note

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
        <p class="fb-err" role="alert">Couldn't send - try again.</p>
      {/if}
    {/if}
  </div>
{/if}

<style>
  /* A) FAB - the floating "Rate this page" pill, stacked above the bookmark FAB. */
  .fb-fab {
    position: fixed; right: calc(54px + var(--tutor-shift, 0px)); bottom: calc(78px + var(--fab-lift, 0px)); z-index: 35;
    display: inline-flex; align-items: center;
    height: 46px; padding: 0 13px;
    border: 1px solid var(--line); border-radius: 999px;
    background: var(--raise); color: var(--muted);
    box-shadow: var(--shadow-md); cursor: pointer; white-space: nowrap;
    transition: color 0.18s var(--ease), background 0.18s var(--ease), border-color 0.18s var(--ease), right 0.3s var(--ease);
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

  /* Click-away - mirrors .pop-backdrop (below the popover, above the FAB stack). */
  .fb-backdrop {
    position: fixed; inset: 0; z-index: 56;
    background: transparent; border: 0; cursor: default;
  }

  /* Popover anchored above the FAB - styled like .settings-pop / .resume-pill. */
  .fb-pop {
    position: fixed; right: calc(22px + var(--tutor-shift, 0px)); bottom: calc(132px + var(--fab-lift, 0px)); z-index: 57;
    width: 264px;
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow-pop);
    padding: 0.9rem 1rem;
    transform-origin: bottom right;
    animation: fb-pop 0.16s var(--ease-out);
    transition: right 0.3s var(--ease);
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

  /* Optional note inside the popover. */
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

  /* The tutor becomes a full overlay at this width (see TutorChat.svelte) -
     no room being made for it, so this shouldn't dodge it either. */
  @media (max-width: 920px) {
    .fb-fab { right: 54px; }
    .fb-pop { right: 22px; }
  }
</style>
