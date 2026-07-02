<script>
  import { page } from '$app/stores';
  import { tick, onDestroy } from 'svelte';
  import { renderMarkdown } from '$lib/markdown.js';
  import { tutorOpen } from '$lib/tutor-store.js';

  const STARTER_CHIPS = ['Why does this matter?', 'Show a real example', 'Explain it more simply'];
  const TYPE_MS = 22; // ms per word-ish chunk revealed while "typing" an answer

  let history = [];
  let draft = '';
  let busy = false;
  let error = '';
  let logEl;
  let inputEl;
  let mascotEl;
  let loadedKey = null;
  let selPopup = null; // { x, y, text } - floating "ask about this" pill for a text selection
  let look = { x: 0, y: 0 }; // mascot pupil offset, in the eye's own SVG units
  let typingTimer = null;

  onDestroy(() => { if (typingTimer) clearInterval(typingTimer); });

  $: m = $page.url.pathname.match(/^\/guides\/([^/]+)\/(\d+)/);
  $: guideSlug = m ? m[1] : null;
  $: phaseNo = m ? m[2] : null;
  $: storageKey = guideSlug && phaseNo ? `tmm-tutor:${guideSlug}/${phaseNo}` : null;
  $: tutorEnabled = !!$page.data?.tutorEnabled;
  $: show = tutorEnabled && !!storageKey;

  // Reload history whenever the phase changes (navigating between phases) -
  // each phase's conversation is its own, matching how quiz/exercise state
  // is already scoped per phase.
  $: if (storageKey && storageKey !== loadedKey) {
    loadedKey = storageKey;
    try { history = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { history = []; }
    error = '';
  }

  function saveHistory() {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(history)); } catch {}
  }

  async function scrollToBottom() {
    await tick();
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }

  $: if ($tutorOpen) scrollToBottom();

  // Lets floating page furniture (bookmark/feedback FABs) dodge the open
  // drawer instead of sitting underneath it - consumed via var(--tutor-shift)
  // the same way --fab-lift already lets those FABs react to the footer.
  $: if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--tutor-shift', $tutorOpen ? '330px' : '0px');
  }

  // "Thinking…" only covers the network wait - once the answer starts
  // typing out, the growing text itself is the activity indicator.
  $: waitingForFetch = busy && !(history.length && history[history.length - 1].typing);

  function clearHistory() {
    history = [];
    saveHistory();
  }

  async function send() {
    const q = draft.trim();
    if (!q || busy || !storageKey) return;
    draft = '';
    error = '';
    const priorTurns = history.map((h) => ({ role: h.role, content: h.content }));
    history = [...history, { role: 'user', content: q }];
    saveHistory();
    busy = true;
    scrollToBottom();
    try {
      const res = await fetch('/tutor.json', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guideSlug, phaseNo: Number(phaseNo), question: q, history: priorTurns })
      });
      const j = await res.json();
      if (j.enabled && !j.error && !j.capReached) {
        await typeOutAnswer(j.answer, j.logId);
      } else if (j.capReached) {
        error = "This has hit its limit for now - try again later.";
      } else {
        error = "Couldn't get an answer just now - try again in a moment.";
      }
    } catch {
      error = "Couldn't reach the tutor - check your connection.";
    } finally {
      busy = false;
      scrollToBottom();
    }
  }

  // Reveals an already-fully-received answer in chunks, like it's being typed
  // live - the backend call itself isn't streamed, this is a client-side
  // effect. Chunking on whitespace (not single characters) is both fast
  // enough to read and keeps short markdown tokens like **bold** or `code`
  // intact within one chunk instead of flickering half-open mid-reveal.
  function typeOutAnswer(fullText, logId) {
    return new Promise((resolve) => {
      const msg = { role: 'assistant', content: '', logId, typing: true };
      history = [...history, msg];
      scrollToBottom();
      const tokens = fullText.split(/(\s+)/);
      let i = 0;
      if (typingTimer) clearInterval(typingTimer);
      typingTimer = setInterval(() => {
        i++;
        msg.content = tokens.slice(0, i).join('');
        if (i >= tokens.length) {
          msg.typing = false;
          clearInterval(typingTimer);
          typingTimer = null;
          saveHistory();
          resolve();
        }
        history = history; // re-render + persist once done - msg is mutated in place
        scrollToBottom();
      }, TYPE_MS);
    });
  }

  // Starter chips on an empty chat send immediately - the point is skipping
  // the blank textbox, not filling it in and making the reader hit send too.
  function sendChip(text) {
    if (busy) return;
    draft = text;
    send();
  }

  // Optimistic thumbs up/down, feeding admin's existing Recent activity log.
  // Toggles off on a second click of the same thumb. Best-effort: a failed
  // POST just leaves the vote unsynced, not worth surfacing an error for.
  async function rate(h, value) {
    if (!h.logId) return;
    const next = h.rating === value ? null : value;
    history = history.map((m) => (m === h ? { ...m, rating: next } : m));
    saveHistory();
    try {
      await fetch('/tutor.rate.json', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: h.logId, rating: next })
      });
    } catch {}
  }

  // Text selected inside the guide's own reading column gets a floating
  // "ask about this" pill. Scoped to .reader so selecting inside the tutor's
  // own chat log (e.g. to copy an answer) never triggers it.
  function onSelMouseup(e) {
    if (!show || e.target.closest('.tutor-drawer, .sel-ask')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) { selPopup = null; return; }
    const reader = document.querySelector('.reader');
    if (!reader || !reader.contains(sel.getRangeAt(0).commonAncestorContainer)) { selPopup = null; return; }
    const text = sel.toString().trim().replace(/\s+/g, ' ').slice(0, 300);
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90);
    selPopup = { x, y: rect.top, text };
  }

  function askAboutSelection() {
    if (!selPopup) return;
    const text = selPopup.text;
    selPopup = null;
    window.getSelection()?.removeAllRanges();
    tutorOpen.set(true);
    draft = `Can you explain this: "${text}"`;
    tick().then(() => inputEl?.focus());
  }

  function onKeydown(e) {
    if (e.key !== 'Escape') return;
    if (selPopup) { selPopup = null; return; }
    if ($tutorOpen) tutorOpen.set(false);
  }

  // The empty-chat mascot's eyes track the cursor direction (unit vector,
  // scaled to a small fixed offset - it's a "which way" glance, not a
  // distance-accurate gaze). Once the reader starts typing, it looks down at
  // the input instead of wherever the mouse happens to be.
  $: watching = draft.length > 0;
  $: if (watching) look = { x: 0, y: 0.55 };

  function onMascotLook(e) {
    if (watching || !mascotEl) return;
    const rect = mascotEl.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    look = { x: (dx / dist) * 0.55, y: (dy / dist) * 0.55 };
  }

  async function copyCode(e) {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const code = btn.closest('.code-wrap')?.querySelector('code')?.textContent || '';
    try {
      await navigator.clipboard.writeText(code);
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = prev; btn.classList.remove('done'); }, 1400);
    } catch {}
  }
</script>

<svelte:window on:keydown={onKeydown} on:mouseup={onSelMouseup} on:scroll={() => (selPopup = null)} on:mousemove={onMascotLook} />

{#if show}
  <aside class="tutor-rail" class:open={$tutorOpen} inert={!$tutorOpen}>
    <div class="tutor-drawer" role="dialog" aria-label="AI tutor">
      <div class="settings-drawer-head">
        <h2>Ask the tutor</h2>
        <button class="settings-x" on:click={() => tutorOpen.set(false)} aria-label="Close"><i class="ti ti-x" aria-hidden="true"></i></button>
      </div>

      <div class="tutor-log" bind:this={logEl} on:click={copyCode}>
        {#each history as h}
          <div class="tutor-msg {h.role}">
            <span class="who">{h.role === 'user' ? 'You' : 'Tutor'}</span>
            {#if h.role === 'assistant'}
              <div class="bubble md-content">{@html renderMarkdown(h.content)}{#if h.typing}<span class="caret"></span>{/if}</div>
              {#if h.logId && !h.typing}
                <div class="tutor-rate" role="group" aria-label="Rate this answer">
                  <button type="button" class="rate-btn" class:selected={h.rating === 'up'}
                    aria-label="Helpful" aria-pressed={h.rating === 'up'} on:click={() => rate(h, 'up')}>
                    <i class="ti ti-thumb-up" aria-hidden="true"></i>
                  </button>
                  <button type="button" class="rate-btn" class:selected={h.rating === 'down'}
                    aria-label="Not helpful" aria-pressed={h.rating === 'down'} on:click={() => rate(h, 'down')}>
                    <i class="ti ti-thumb-down" aria-hidden="true"></i>
                  </button>
                </div>
              {/if}
            {:else}
              <p class="bubble">{h.content}</p>
            {/if}
          </div>
        {:else}
          <div class="tutor-empty">
            <svg bind:this={mascotEl} class="mascot" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 4L21 7.5L12 9L3 7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              <path d="M21 7.5C21.8 8.5 21.8 10 21 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="21" cy="11.4" r="0.9" fill="currentColor" />
              <rect x="6" y="9" width="12" height="9" rx="3" stroke="currentColor" stroke-width="1.6" />
              <rect x="4" y="11.5" width="2" height="3" rx="0.6" stroke="currentColor" stroke-width="1.4" />
              <rect x="18" y="11.5" width="2" height="3" rx="0.6" stroke="currentColor" stroke-width="1.4" />
              <g class="mascot-eyes">
                <circle cx="9.5" cy="13.7" r="1.5" fill="var(--raise)" />
                <circle cx="14.5" cy="13.7" r="1.5" fill="var(--raise)" />
                <circle cx="9.5" cy="13.7" r="0.85" fill="currentColor" transform="translate({look.x} {look.y})" />
                <circle cx="14.5" cy="13.7" r="0.85" fill="currentColor" transform="translate({look.x} {look.y})" />
              </g>
            </svg>
            <p>Ask anything about this phase.</p>
            <div class="tutor-chips">
              {#each STARTER_CHIPS as c}
                <button type="button" class="tutor-chip" on:click={() => sendChip(c)}>{c}</button>
              {/each}
            </div>
          </div>
        {/each}
        {#if waitingForFetch}
          <div class="tutor-msg assistant"><span class="who">Tutor</span><p class="thinking">Thinking…</p></div>
        {/if}
      </div>

      {#if error}<p class="tutor-err">{error}</p>{/if}

      <form class="tutor-input" on:submit|preventDefault={send}>
        <input bind:this={inputEl} bind:value={draft} placeholder="Ask a question…" disabled={busy} />
        <button type="submit" disabled={busy || !draft.trim()} aria-label="Send"><i class="ti ti-send-2" aria-hidden="true"></i></button>
      </form>

      {#if history.length}
        <button type="button" class="tutor-clear" on:click={clearHistory}>Clear history</button>
      {/if}
    </div>
  </aside>

  {#if selPopup}
    <button type="button" class="sel-ask" style="left: {selPopup.x}px; top: {selPopup.y}px;"
      on:mousedown|preventDefault={askAboutSelection}>
      Ask the tutor about this
    </button>
  {/if}
{/if}

<style>
  /* In normal flow as a grid sibling of .page-main/PathRail (see .shell in
     app.css) - sticky below the header, like every other sidebar, so opening
     it resizes the reading column instead of covering it. Width (not
     grid-template-columns) is what's animated, same technique as .sidebar. */
  .tutor-rail {
    position: sticky; top: 57px; height: calc(100vh - 57px);
    box-sizing: border-box;
    width: 0; opacity: 0; overflow: hidden;
    border-left: 1px solid transparent;
    pointer-events: none;
    transition: width 0.3s var(--ease), opacity 0.24s var(--ease), border-color 0.2s var(--ease);
  }
  .tutor-rail.open {
    width: 370px; opacity: 1; border-left-color: var(--line); pointer-events: auto;
  }
  .tutor-drawer {
    width: 370px; height: 100%; box-sizing: border-box;
    background: var(--raise);
    padding: 1.1rem 1.2rem 1rem; overflow-y: auto; overflow-x: hidden;
    display: flex; flex-direction: column;
  }
  /* Below the sidebar's own off-canvas breakpoint there's no room to push
     content sideways - fall back to the original fixed-position overlay. */
  @media (max-width: 920px) {
    .tutor-rail {
      position: fixed; top: 0; right: 0; height: 100%; width: 370px; max-width: 88vw; z-index: 61;
      opacity: 1; border-left: 0; pointer-events: auto;
      transform: translateX(100%);
      transition: transform 0.26s var(--ease-out);
    }
    .tutor-rail.open { transform: translateX(0); }
    .tutor-drawer { border-left: 1px solid var(--line); box-shadow: -12px 0 32px -8px rgba(19, 19, 22, 0.18); }
  }
  .tutor-sub { color: var(--muted); font-size: 0.82rem; line-height: 1.4; margin: 0 0 0.9rem; }
  .tutor-log { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; overflow-x: hidden; margin-bottom: 0.7rem; min-height: 120px; min-width: 0; }
  .tutor-empty { color: var(--faint); font-size: 0.85rem; }
  .mascot { display: block; width: 56px; height: 56px; margin-bottom: 0.6rem; }
  .mascot-eyes { transform-box: fill-box; transform-origin: center; animation: mascot-blink 5s ease-in-out infinite; }
  @keyframes mascot-blink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(0.12); } }
  .tutor-empty p { margin: 0 0 0.6rem; }
  .tutor-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .tutor-chip {
    font: inherit; font-size: 0.78rem; color: var(--muted); text-align: left;
    background: var(--surface); border: 1px solid var(--line); border-radius: 999px;
    padding: 0.4rem 0.75rem; cursor: pointer;
    transition: color 0.15s var(--ease), border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .tutor-chip:hover { color: var(--ink); border-color: var(--accent); background: var(--accent-tint); }
  .tutor-msg { max-width: 92%; min-width: 0; }
  .tutor-msg.user { align-self: flex-end; text-align: right; }
  .tutor-msg .who { display: block; font-size: 0.7rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
  .tutor-msg .bubble { margin: 0; font-size: 0.88rem; line-height: 1.5; white-space: pre-wrap; display: inline-block; max-width: 100%; overflow-wrap: break-word; box-sizing: border-box; padding: 0.5rem 0.7rem; border-radius: 10px; background: var(--surface); text-align: left; }
  .tutor-msg.user .bubble { background: var(--accent-tint); }
  .tutor-msg .bubble.md-content { white-space: normal; }
  .tutor-msg p.thinking { margin: 0; font-size: 0.88rem; display: inline-block; padding: 0.5rem 0.7rem; border-radius: 10px; background: var(--surface); color: var(--muted); font-style: italic; }
  .caret { display: inline-block; width: 2px; height: 0.9em; background: currentColor; margin-left: 2px; vertical-align: text-bottom; animation: caret-blink 0.8s steps(2) infinite; }
  @keyframes caret-blink { to { opacity: 0; } }
  .tutor-rate { display: flex; gap: 0.25rem; margin-top: 0.3rem; }
  .rate-btn {
    background: none; border: 1px solid transparent; color: var(--faint);
    cursor: pointer; width: 24px; height: 24px; border-radius: 6px;
    display: inline-grid; place-items: center; transition: all 0.15s var(--ease);
  }
  .rate-btn:hover { background: var(--surface); color: var(--ink); }
  .rate-btn .ti { font-size: 13px; }
  .rate-btn.selected { color: var(--accent); border-color: var(--accent); background: var(--accent-tint); }
  .tutor-err { color: #c0563c; font-size: 0.82rem; margin: 0 0 0.6rem; }
  /* Floating pill near a text selection made inside the guide's own reading
     column (see onSelMouseup) - anchored via left/top set inline in JS. */
  .sel-ask {
    position: fixed; z-index: 62;
    transform: translate(-50%, calc(-100% - 8px));
    padding: 0.45rem 0.8rem;
    background: var(--ink); color: var(--bg);
    border: 0; border-radius: 999px;
    font: inherit; font-size: 0.8rem; font-weight: 500;
    white-space: nowrap; cursor: pointer;
    box-shadow: var(--shadow-pop);
    animation: sel-ask-in 0.12s var(--ease-out);
  }
  .sel-ask:hover { background: var(--accent); color: #fff; }
  @keyframes sel-ask-in { from { opacity: 0; } to { opacity: 1; } }
  .tutor-input { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
  .tutor-input input { flex: 1; font: inherit; padding: 0.55rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .tutor-input input:focus { outline: none; border-color: var(--accent); }
  .tutor-input button { flex: none; width: 38px; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: #fff; display: inline-grid; place-items: center; cursor: pointer; }
  .tutor-input button:disabled { opacity: 0.6; cursor: default; }
  .tutor-clear { align-self: flex-start; font: inherit; font-size: 0.78rem; color: var(--faint); background: none; border: 1px solid var(--line); border-radius: 7px; padding: 0.35rem 0.7rem; cursor: pointer; }
  .tutor-clear:hover { color: var(--ink); border-color: var(--ink); }
</style>
