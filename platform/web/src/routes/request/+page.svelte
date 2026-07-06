<script>
  import Seo from '$lib/Seo.svelte';

  // Guide requests ride the existing feedback pipeline (POST /feedback) with a
  // sentinel slug instead of a new backend table - the admin inbox already
  // shows every row, so requests land there tagged as "guide-request".
  let topic = '';
  let details = '';
  let sending = false;
  let sent = false;
  let failed = false;

  async function submit() {
    const t = topic.trim();
    if (!t || sending) return;
    sending = true;
    failed = false;
    const note = details.trim() ? `${t} — ${details.trim()}` : t;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guide_slug: 'guide-request', phase_no: 0, vote: 'up', note })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      sent = true;
    } catch (e) {
      failed = true;
    } finally {
      sending = false;
    }
  }
</script>

<Seo
  title="Request a guide - The Missing Manual"
  description="Tell us what you wish existed - the topic you searched for and couldn't find. Requests go straight into the writing queue." />

<div class="crumb"><a href="/">Home</a> <span>/</span> <span>Request a guide</span></div>
<h1 class="page-title">Request a guide</h1>
<p class="tagline">
  Couldn't find the topic you needed? Tell us what you wish existed. Every request lands directly
  in our writing queue - the library grows from exactly this.
</p>

{#if sent}
  <div class="req-done">
    <i class="ti ti-circle-check" aria-hidden="true"></i>
    <div>
      <strong>Got it - thank you!</strong>
      <p>Your request is in the queue. New guides ship on <a href="/changelog">What's new</a>.</p>
    </div>
  </div>
{:else}
  <form class="req-form" on:submit|preventDefault={submit}>
    <label class="req-label" for="req-topic">What should we write about?</label>
    <input
      id="req-topic" class="req-input" type="text" bind:value={topic}
      maxlength="120" required placeholder="e.g. WebSockets from zero, or how DNS caching really works"
    />

    <label class="req-label" for="req-details">Anything else? <span class="req-opt">(optional)</span></label>
    <textarea
      id="req-details" class="req-input req-area" bind:value={details}
      maxlength="600" rows="4"
      placeholder="What confused you, what you tried to find, or the terrible day this would have saved."
    ></textarea>

    <button class="req-send" type="submit" disabled={sending || !topic.trim()}>
      {sending ? 'Sending…' : 'Send request'}
    </button>
    {#if failed}<p class="req-err">Couldn't send right now - please try again in a moment.</p>{/if}
  </form>
{/if}

<style>
  .req-form { max-width: 560px; display: flex; flex-direction: column; gap: 0.4rem; margin-top: 1.5rem; }
  .req-label { font-weight: 600; font-size: 0.95rem; color: var(--ink); margin-top: 0.8rem; }
  .req-opt { font-weight: 400; color: var(--faint); font-size: 0.85rem; }
  .req-input {
    font: inherit; color: var(--ink); background: var(--raise);
    border: 1px solid var(--line); border-radius: 10px; padding: 0.65rem 0.8rem;
  }
  .req-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .req-area { resize: vertical; min-height: 90px; }
  .req-send {
    align-self: flex-start; margin-top: 1rem; cursor: pointer;
    font: inherit; font-weight: 600; color: #fff; background: var(--accent);
    border: 0; border-radius: 10px; padding: 0.65rem 1.4rem;
    transition: filter 0.15s var(--ease);
  }
  .req-send:hover:not(:disabled) { filter: brightness(1.1); }
  .req-send:disabled { opacity: 0.55; cursor: default; }
  .req-err { color: #c0563c; font-size: 0.9rem; margin: 0.5rem 0 0; }

  .req-done {
    display: flex; gap: 0.9rem; align-items: flex-start; max-width: 560px;
    margin-top: 1.5rem; padding: 1.1rem 1.3rem;
    border: 1px solid var(--accent); border-radius: 14px; background: var(--accent-tint);
  }
  .req-done .ti { color: var(--accent); font-size: 26px; flex: none; margin-top: 2px; }
  .req-done p { margin: 0.25rem 0 0; color: var(--body); }
</style>
