<script>
  // Reader feedback widget shown at the foot of each guide phase. Posts a
  // 👍/👎 vote (+ an optional note) same-origin to /feedback, which proxies to
  // the backend. State (idle → voting → done / error) lives in this component;
  // mount it inside the phase reader's {#key} block so it resets per phase.
  export let guideSlug;
  export let phaseNo;

  // idle: nothing picked · note: vote chosen, note open · done: submitted · error: send failed
  let stage = 'idle';
  let vote = null; // 'up' | 'down'
  let note = '';
  let sending = false;

  async function send() {
    if (sending) return;
    sending = true;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          guide_slug: guideSlug,
          phase_no: phaseNo,
          vote,
          note: note.trim() || undefined
        })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      stage = 'done';
    } catch (e) {
      stage = 'error';
    } finally {
      sending = false;
    }
  }

  function pick(v) {
    vote = v;
    stage = 'note';
  }
</script>

<aside class="fbw" aria-label="Was this helpful?">
  {#if stage === 'done'}
    <p class="fbw-thanks" role="status">
      <i class="ti ti-circle-check" aria-hidden="true"></i> Thanks for the feedback.
    </p>
  {:else}
    <div class="fbw-prompt">
      <span class="fbw-q">Was this helpful?</span>
      <div class="fbw-votes" role="group" aria-label="Rate this phase">
        <button
          type="button"
          class="fbw-vote"
          class:on={vote === 'up'}
          aria-pressed={vote === 'up'}
          aria-label="Yes, this was helpful"
          on:click={() => pick('up')}
          disabled={sending}
        >
          <i class="ti ti-thumb-up" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="fbw-vote"
          class:on={vote === 'down'}
          aria-pressed={vote === 'down'}
          aria-label="No, this was not helpful"
          on:click={() => pick('down')}
          disabled={sending}
        >
          <i class="ti ti-thumb-down" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    {#if stage === 'note' || stage === 'error'}
      <div class="fbw-note">
        <label class="fbw-note-lbl" for="fbw-note-{guideSlug}-{phaseNo}">
          Anything to add? <span class="fbw-opt">(optional)</span>
        </label>
        <textarea
          id="fbw-note-{guideSlug}-{phaseNo}"
          class="fbw-textarea"
          rows="3"
          bind:value={note}
          placeholder="What worked, what didn't…"
          disabled={sending}
        ></textarea>
        <div class="fbw-actions">
          <button type="button" class="fbw-send" on:click={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
          {#if stage === 'error'}
            <span class="fbw-err" role="alert">Couldn't send — try again.</span>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</aside>

<style>
  .fbw {
    max-width: 720px;
    margin: 2.5rem auto 0;
    padding: 1.1rem 1.25rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--raise);
  }

  .fbw-prompt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .fbw-q {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.98rem;
  }

  .fbw-votes {
    display: flex;
    gap: 0.5rem;
  }

  .fbw-vote {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 36px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--bg);
    color: var(--muted);
    cursor: pointer;
    font-size: 1.05rem;
    transition: color 0.15s var(--ease), border-color 0.15s var(--ease),
      background 0.15s var(--ease);
  }
  .fbw-vote:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
  }
  .fbw-vote.on {
    color: var(--accent-strong);
    border-color: var(--accent);
    background: var(--accent-tint);
  }
  .fbw-vote:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .fbw-note {
    margin-top: 1rem;
    animation: fbw-in 0.18s var(--ease-out);
  }

  .fbw-note-lbl {
    display: block;
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 0.4rem;
  }
  .fbw-opt {
    color: var(--faint);
  }

  .fbw-textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.6rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--bg);
    color: var(--body);
    font: inherit;
    font-size: 0.95rem;
    resize: vertical;
    transition: border-color 0.15s var(--ease), box-shadow 0.15s var(--ease);
  }
  .fbw-textarea:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-tint);
  }

  .fbw-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.7rem;
  }

  .fbw-send {
    padding: 0.5rem 1.1rem;
    border: 1px solid var(--accent);
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s var(--ease), border-color 0.15s var(--ease);
  }
  .fbw-send:hover:not(:disabled) {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }
  .fbw-send:disabled {
    cursor: default;
    opacity: 0.7;
  }

  .fbw-err {
    color: var(--danger);
    font-size: 0.85rem;
  }

  .fbw-thanks {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    color: var(--accent-strong);
    font-weight: 500;
    font-size: 0.98rem;
  }

  @keyframes fbw-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
