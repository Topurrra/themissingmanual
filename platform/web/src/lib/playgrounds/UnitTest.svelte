<script>
  let code = `function add(a, b) {\n  return a + b;\n}`;
  const TESTS = [
    { desc: 'adds two positives', expr: 'add(2, 3) === 5' },
    { desc: 'handles a negative', expr: 'add(-1, 1) === 0' },
    { desc: 'adds to zero', expr: 'add(10, -4) === 6' },
    { desc: 'is commutative', expr: 'add(7, 2) === add(2, 7)' }
  ];
  let results = null;
  let buildErr = '';
  function run() {
    buildErr = '';
    let fn;
    try { fn = new Function(code + '\nreturn add;')(); }
    catch (e) { buildErr = 'Your code did not compile: ' + e.message; results = null; return; }
    if (typeof fn !== 'function') { buildErr = 'No function named `add` was found.'; results = null; return; }
    results = TESTS.map((t) => {
      try { return { ...t, pass: !!new Function('add', 'return (' + t.expr + ');')(fn) }; }
      catch (e) { return { ...t, pass: false, err: e.message }; }
    });
  }
  run();
  $: passed = results ? results.filter((r) => r.pass).length : 0;
</script>

<figure class="pg pg-ut">
  <figcaption class="pg-cap"><i class="ti ti-flask" aria-hidden="true"></i> Unit test runner</figcaption>
  <div class="ut-body">
    <span class="ut-h">Code under test - try breaking it (change <code>+</code> to <code>-</code>)</span>
    <textarea bind:value={code} rows="3" spellcheck="false" aria-label="Function under test"></textarea>
    <div class="ut-bar">
      <button class="ut-run" on:click={run}><i class="ti ti-player-play-filled"></i> Run tests</button>
      {#if results}<span class="ut-summary" class:ok={passed === results.length}>{passed}/{results.length} passing</span>{/if}
    </div>
    {#if buildErr}
      <p class="ut-err"><i class="ti ti-alert-triangle"></i> {buildErr}</p>
    {:else if results}
      <ul class="ut-list">
        {#each results as r}
          <li class:pass={r.pass}>
            <i class={`ti ${r.pass ? 'ti-circle-check' : 'ti-circle-x'}`}></i>
            <span class="ut-desc">{r.desc}</span>
            <code class="ut-expr">{r.expr}</code>
            {#if r.err}<span class="ut-msg">threw: {r.err}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}
    <p class="ut-note">Each test follows <b>Arrange · Act · Assert</b>: set up inputs, call the function, then assert the result. Green means the assertion held; red means the code disagreed with what the test expected.</p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .ut-body { background: var(--raise); padding: 0.9rem; }
  .ut-h { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 0.4rem; }
  .ut-h code { font-family: var(--font-mono); background: var(--bg); border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; }
  .ut-body textarea { width: 100%; box-sizing: border-box; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.5; padding: 0.6rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; margin-bottom: 0.7rem; }
  .ut-body textarea:focus { outline: none; border-color: var(--accent); }
  .ut-bar { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.7rem; }
  .ut-run { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 8px; padding: 0.4rem 0.8rem; font-weight: 600; }
  .ut-summary { font-family: var(--font-mono); font-size: 0.82rem; color: #c0563c; font-weight: 600; }
  .ut-summary.ok { color: #2e9e6b; }
  .ut-list { list-style: none; margin: 0 0 0.8rem; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .ut-list li { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; font-size: 0.85rem; padding: 0.4rem 0.55rem; border-radius: 8px; background: color-mix(in srgb, #c0563c 9%, var(--bg)); border: 1px solid color-mix(in srgb, #c0563c 25%, var(--line)); }
  .ut-list li.pass { background: color-mix(in srgb, #2e9e6b 9%, var(--bg)); border-color: color-mix(in srgb, #2e9e6b 25%, var(--line)); }
  .ut-list .ti { color: #c0563c; font-size: 16px; }
  .ut-list li.pass .ti { color: #2e9e6b; }
  .ut-desc { color: var(--ink); }
  .ut-expr { font-family: var(--font-mono); font-size: 0.76rem; color: var(--muted); margin-left: auto; }
  .ut-msg { flex-basis: 100%; font-family: var(--font-mono); font-size: 0.72rem; color: #c0563c; padding-left: 1.6rem; }
  .ut-err { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #c0563c; background: color-mix(in srgb, #c0563c 10%, var(--bg)); border: 1px solid color-mix(in srgb, #c0563c 28%, var(--line)); border-radius: 8px; padding: 0.5rem 0.7rem; margin: 0 0 0.8rem; }
  .ut-note { font-size: 0.83rem; color: var(--muted); line-height: 1.5; margin: 0; }
</style>
