<script>
  export let config = '';
  let text = config.trim() || 'hunter2';
  let salt = '';
  let hash = '';
  let supported = true;

  async function sha256(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function recompute() {
    if (typeof crypto === 'undefined' || !crypto.subtle) { supported = false; return; }
    try { hash = await sha256(salt + text); } catch (e) { supported = false; }
  }
  // Recompute whenever the inputs change.
  $: { text; salt; recompute(); }
</script>

<figure class="pg pg-hash">
  <figcaption class="pg-cap"><i class="ti ti-hash" aria-hidden="true"></i> SHA-256 hashing</figcaption>
  <div class="hs-body">
    {#if !supported}
      <p class="hs-err">Hashing needs a secure context (https or localhost).</p>
    {/if}
    <label class="hs-field"><span>Input</span><input bind:value={text} spellcheck="false" aria-label="text to hash" /></label>
    <label class="hs-field"><span>Salt <em>(optional)</em></span><input bind:value={salt} spellcheck="false" placeholder="e.g. a per-user random string" aria-label="salt" /></label>
    <div class="hs-out">
      <span class="hs-lbl">SHA-256</span>
      <code class="hs-hash">{hash}</code>
    </div>
    <p class="hs-note">Change one character and the whole hash changes - that's the avalanche effect. A unique salt per user means identical passwords hash differently.</p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .hs-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .hs-err { color: #c0563c; font-size: 0.85rem; margin: 0; }
  .hs-field { display: flex; flex-direction: column; gap: 0.25rem; }
  .hs-field span { font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .hs-field em { text-transform: none; letter-spacing: 0; }
  .hs-field input { border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.6rem; background: var(--bg); color: var(--ink); font: inherit; font-family: var(--font-mono); }
  .hs-field input:focus { outline: none; border-color: var(--accent); }
  .hs-out { display: flex; flex-direction: column; gap: 0.25rem; }
  .hs-lbl { font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .hs-hash { font-family: var(--font-mono); font-size: 0.82rem; color: var(--accent); word-break: break-all; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.6rem; }
  .hs-note { margin: 0; font-size: 0.85rem; color: var(--muted); line-height: 1.5; }
</style>
