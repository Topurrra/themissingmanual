<script>
  export let config = '';
  let text = config.trim() || 'Tokenization splits text into pieces a model can count. Unbelievable, right?';
  const CTX = 8192;
  // Rough BPE-style approximation: keep leading space with a word, split long
  // words into ~4-char subword chunks, punctuation stands alone.
  function tokenize(s) {
    const out = [];
    const parts = s.match(/\s*[A-Za-z]+|\s*\d+|\s*[^\sA-Za-z\d]+|\s+/g) || [];
    for (const p of parts) {
      const lead = p.match(/^\s*/)[0];
      const core = p.slice(lead.length);
      if (/^[A-Za-z]+$/.test(core) && core.length > 5) {
        let first = true;
        for (let i = 0; i < core.length; i += 4) { out.push((first ? lead : '') + core.slice(i, i + 4)); first = false; }
      } else out.push(p);
    }
    return out.filter((t) => t.length);
  }
  $: tokens = tokenize(text);
  $: chars = text.length;
  $: pct = Math.min(100, (tokens.length / CTX) * 100);
</script>

<figure class="pg pg-tok">
  <figcaption class="pg-cap"><i class="ti ti-square-letter-t" aria-hidden="true"></i> Tokenizer (approximate)</figcaption>
  <div class="tk-body">
    <textarea bind:value={text} rows="3" spellcheck="false" aria-label="Text to tokenize"></textarea>
    <div class="tk-chips">
      {#each tokens as t, i}<span class="tk-chip" style={`--h:${(i * 47) % 360}`}>{t.replace(/ /g, '·')}</span>{/each}
    </div>
    <div class="tk-stats">
      <span class="tk-stat"><b>{tokens.length}</b> tokens</span>
      <span class="tk-stat"><b>{chars}</b> chars</span>
      <span class="tk-stat"><b>{chars ? (chars / tokens.length).toFixed(1) : 0}</b> chars/token</span>
    </div>
    <div class="tk-ctx"><div class="tk-fill" style={`width:${pct}%`}></div></div>
    <p class="tk-note">≈ {pct.toFixed(2)}% of an 8K context window. Models bill by the token, not the word — short common words are one token, rare/long words split into several. (This is an approximation; real tokenizers use a learned vocabulary.)</p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .tk-body { background: var(--raise); padding: 0.9rem; }
  .tk-body textarea { width: 100%; box-sizing: border-box; font: inherit; font-size: 0.9rem; padding: 0.5rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; margin-bottom: 0.7rem; }
  .tk-body textarea:focus { outline: none; border-color: var(--accent); }
  .tk-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 0.8rem; min-height: 1.5rem; }
  .tk-chip { font-family: var(--font-mono); font-size: 0.8rem; padding: 0.15rem 0.4rem; border-radius: 5px; background: hsl(var(--h) 55% 90%); color: hsl(var(--h) 60% 28%); border: 1px solid hsl(var(--h) 45% 80%); }
  :global(:root[data-theme="dark"]) .tk-chip { background: hsl(var(--h) 35% 22%); color: hsl(var(--h) 55% 82%); border-color: hsl(var(--h) 35% 32%); }
  .tk-stats { display: flex; gap: 1rem; font-size: 0.82rem; color: var(--muted); margin-bottom: 0.6rem; }
  .tk-stat b { color: var(--ink); font-family: var(--font-mono); }
  .tk-ctx { height: 8px; background: var(--surface); border-radius: 999px; overflow: hidden; margin-bottom: 0.6rem; }
  .tk-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s var(--ease); }
  .tk-note { font-size: 0.83rem; color: var(--muted); line-height: 1.5; margin: 0; }
</style>
