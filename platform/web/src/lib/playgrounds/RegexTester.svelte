<script>
  // Live regex tester. Highlights matches in sample text and lists capture groups.
  // config (from the fence): first line = pattern, remaining lines = sample text.
  export let config = '';

  const lines = config.split('\n');
  let pattern = (lines[0] || '\\b\\w+@\\w+\\.\\w+\\b').trim();
  let sample = lines.slice(1).join('\n').trim() ||
    'Contact alice@example.com or bob@test.org.\nNot an email: hello world.';
  let gi = true, gm = false; // ignore-case, multiline

  $: flags = 'g' + (gi ? 'i' : '') + (gm ? 'm' : '');
  $: result = (() => {
    if (!pattern) return { ok: true, segs: [{ text: sample }], matches: [] };
    let re;
    try { re = new RegExp(pattern, flags); } catch (e) { return { ok: false, error: e.message }; }
    const segs = [];
    const matches = [];
    let last = 0, m, guard = 0;
    re.lastIndex = 0;
    while ((m = re.exec(sample)) !== null) {
      if (guard++ > 5000) break;
      if (m.index > last) segs.push({ text: sample.slice(last, m.index) });
      segs.push({ text: m[0], hit: true });
      matches.push({ value: m[0], index: m.index, groups: m.slice(1) });
      last = m.index + m[0].length;
      if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-length loop
    }
    if (last < sample.length) segs.push({ text: sample.slice(last) });
    return { ok: true, segs, matches };
  })();
</script>

<figure class="pg pg-rx">
  <figcaption class="pg-cap"><i class="ti ti-regex" aria-hidden="true"></i> Regex tester</figcaption>
  <div class="rx-body">
    <div class="rx-pattern">
      <span class="rx-slash">/</span>
      <input class="rx-input" bind:value={pattern} spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="pattern" />
      <span class="rx-slash">/{flags}</span>
    </div>
    <div class="rx-flags">
      <label><input type="checkbox" bind:checked={gi} /> ignore case</label>
      <label><input type="checkbox" bind:checked={gm} /> multiline</label>
      <span class="rx-count">{result.ok ? `${result.matches.length} match${result.matches.length === 1 ? '' : 'es'}` : ''}</span>
    </div>
    {#if !result.ok}
      <p class="rx-err">Invalid pattern: {result.error}</p>
    {/if}
    <textarea class="rx-sample" bind:value={sample} rows="4" spellcheck="false" aria-label="sample text"></textarea>
    <div class="rx-preview" aria-hidden="true">
      {#if result.ok}{#each result.segs as s}{#if s.hit}<mark>{s.text}</mark>{:else}{s.text}{/if}{/each}{/if}
    </div>
    {#if result.ok && result.matches.length && result.matches.some((m) => m.groups.length)}
      <div class="rx-groups">
        {#each result.matches as m, i}
          {#if m.groups.length}<div><b>match {i + 1}</b>: {m.groups.map((g, j) => `$${j + 1}=${g ?? '∅'}`).join('  ')}</div>{/if}
        {/each}
      </div>
    {/if}
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .rx-body { padding: 0.9rem; background: var(--raise); display: flex; flex-direction: column; gap: 0.6rem; }
  .rx-pattern { display: flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); border-radius: 9px; padding: 0.4rem 0.6rem; background: var(--bg); font-family: var(--font-mono); }
  .rx-pattern:focus-within { border-color: var(--accent); }
  .rx-slash { color: var(--faint); }
  .rx-input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font: inherit; color: var(--accent); }
  .rx-flags { display: flex; align-items: center; gap: 1rem; font-size: 0.82rem; color: var(--muted); }
  .rx-flags label { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; }
  .rx-count { margin-left: auto; font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); }
  .rx-err { margin: 0; color: #c0563c; font-size: 0.85rem; font-family: var(--font-mono); }
  .rx-sample { border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem; font-family: var(--font-mono); font-size: 0.85rem; background: var(--bg); color: var(--ink); resize: vertical; }
  .rx-sample:focus { outline: none; border-color: var(--accent); }
  .rx-preview { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; word-break: break-word; padding: 0.6rem; border: 1px dashed var(--line); border-radius: 9px; color: var(--muted); }
  .rx-preview mark { background: var(--accent-tint); color: var(--ink); border-radius: 3px; padding: 0 1px; }
  .rx-groups { font-family: var(--font-mono); font-size: 0.78rem; color: var(--muted); display: flex; flex-direction: column; gap: 0.2rem; }
  .rx-groups b { color: var(--ink); }
</style>
