<script>
  export let config = '';
  let input = config.trim() || '{ "name": "Ada", "skills": ["math", "code"], "born": 1815, "active": true }';
  $: result = (() => { try { return { ok: true, value: JSON.parse(input) }; } catch (e) { return { ok: false, error: e.message }; } })();
  $: pretty = result.ok ? JSON.stringify(result.value, null, 2) : '';
  function format() { if (result.ok) input = JSON.stringify(result.value, null, 2); }
  function minify() { if (result.ok) input = JSON.stringify(result.value); }
</script>

<figure class="pg pg-json">
  <figcaption class="pg-cap"><i class="ti ti-braces" aria-hidden="true"></i> JSON formatter
    <span class="js-status {result.ok ? 'ok' : 'bad'}">{result.ok ? 'valid' : 'invalid'}</span>
    <button class="pg-reset" on:click={format} disabled={!result.ok}>Format</button>
    <button class="pg-reset" on:click={minify} disabled={!result.ok}>Minify</button>
  </figcaption>
  <div class="js-body">
    <textarea bind:value={input} rows="7" spellcheck="false" aria-label="JSON input"></textarea>
    {#if !result.ok}<p class="js-err">✕ {result.error}</p>{:else}<pre class="js-out">{pretty}</pre>{/if}
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .js-status { font-size: 0.62rem; border-radius: 5px; padding: 2px 6px; }
  .js-status.ok { background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); color: #2e9e6b; }
  .js-status.bad { background: color-mix(in srgb, #c0563c 16%, var(--raise)); color: #c0563c; }
  .pg-reset { cursor: pointer; font: inherit; font-size: 0.68rem; text-transform: uppercase; color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
  .pg-reset:last-child { margin-right: 0; } .pg-cap .pg-reset:nth-of-type(1) { margin-left: auto; }
  .pg-reset:hover:not(:disabled) { color: var(--ink); border-color: var(--accent); }
  .pg-reset:disabled { opacity: 0.45; cursor: not-allowed; }
  .js-body { background: var(--raise); padding: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  @media (max-width: 620px) { .js-body { grid-template-columns: 1fr; } }
  .js-body textarea { border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem; font-family: var(--font-mono); font-size: 0.82rem; background: var(--bg); color: var(--ink); resize: vertical; }
  .js-body textarea:focus { outline: none; border-color: var(--accent); }
  .js-out { margin: 0; font-family: var(--font-mono); font-size: 0.82rem; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem; overflow: auto; max-height: 260px; color: var(--ink); white-space: pre; }
  .js-err { margin: 0; align-self: start; font-family: var(--font-mono); font-size: 0.85rem; color: #c0563c; border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem; background: var(--bg); }
</style>
