<script>
  export let config = '';
  let val = (config.trim().match(/\d+/) || ['42'])[0];
  let base = 10;
  $: n = (() => { const x = parseInt(val, base); return isNaN(x) || x < 0 ? null : x; })();
  const pad8 = (s) => s.padStart(Math.ceil(s.length / 8) * 8, '0').replace(/(.{4})(?=.)/g, '$1 ');

  let a = 12, b = 10, op = '&';
  const OPS = ['&', '|', '^', '<<', '>>'];
  $: res = (() => {
    const A = a | 0, B = b | 0;
    switch (op) { case '&': return A & B; case '|': return A | B; case '^': return A ^ B; case '<<': return (A << B) >>> 0; case '>>': return A >> B; }
  })();
</script>

<figure class="pg pg-base">
  <figcaption class="pg-cap"><i class="ti ti-binary" aria-hidden="true"></i> Number bases &amp; bits</figcaption>
  <div class="bs-body">
    <div class="bs-row">
      <input class="bs-val" bind:value={val} spellcheck="false" aria-label="value" />
      <div class="bs-bases">
        {#each [['bin', 2], ['oct', 8], ['dec', 10], ['hex', 16]] as [lbl, bv]}
          <button class:on={base === bv} on:click={() => (base = bv)}>{lbl}</button>
        {/each}
      </div>
    </div>
    {#if n === null}
      <p class="bs-err">Not a valid base-{base} number.</p>
    {:else}
      <dl class="bs-grid">
        <div><dt>Decimal</dt><dd>{n.toString(10)}</dd></div>
        <div><dt>Hex</dt><dd>0x{n.toString(16).toUpperCase()}</dd></div>
        <div><dt>Octal</dt><dd>0o{n.toString(8)}</dd></div>
        <div class="bs-bin"><dt>Binary</dt><dd>{pad8(n.toString(2))}</dd></div>
      </dl>
    {/if}
    <div class="bs-bitwise">
      <span class="bs-lbl">Bitwise</span>
      <input type="number" bind:value={a} aria-label="a" />
      <select bind:value={op} aria-label="operator">{#each OPS as o}<option>{o}</option>{/each}</select>
      <input type="number" bind:value={b} aria-label="b" />
      <span class="bs-eq">= <b>{res}</b> <span class="bs-binsm">0b{(res >>> 0).toString(2)}</span></span>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .bs-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .bs-row { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
  .bs-val { flex: 1; min-width: 8rem; border: 1px solid var(--line); border-radius: 8px; padding: 0.45rem 0.6rem; background: var(--bg); color: var(--accent); font-family: var(--font-mono); font-size: 1.05rem; }
  .bs-val:focus { outline: none; border-color: var(--accent); }
  .bs-bases { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 9px; }
  .bs-bases button { cursor: pointer; font: inherit; font-family: var(--font-mono); font-size: 0.78rem; border: 0; background: none; color: var(--muted); padding: 0.3rem 0.6rem; border-radius: 7px; }
  .bs-bases button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); }
  .bs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; margin: 0; }
  .bs-grid > div { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem 0.7rem; background: var(--bg); }
  .bs-bin { grid-column: 1 / -1; }
  .bs-grid dt { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .bs-grid dd { margin: 0.15rem 0 0; font-family: var(--font-mono); color: var(--ink); word-break: break-all; }
  .bs-bitwise { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-family: var(--font-mono); border-top: 1px solid var(--line); padding-top: 0.7rem; }
  .bs-lbl { font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .bs-bitwise input { width: 4.5rem; border: 1px solid var(--line); border-radius: 7px; padding: 0.3rem 0.5rem; background: var(--bg); color: var(--ink); font: inherit; }
  .bs-bitwise select { border: 1px solid var(--line); border-radius: 7px; padding: 0.3rem; background: var(--bg); color: var(--ink); font: inherit; }
  .bs-eq b { color: var(--accent); }
  .bs-binsm { color: var(--faint); font-size: 0.8rem; }
</style>
