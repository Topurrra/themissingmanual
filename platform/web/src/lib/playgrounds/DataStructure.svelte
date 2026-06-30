<script>
  export let config = '';
  const MODES = ['array', 'stack', 'queue', 'map', 'set'];
  let mode = MODES.includes(config.trim()) ? config.trim() : 'array';

  let list = [];   // array / stack / queue: [{id, v}]
  let pairs = [];  // map: [{k, v}]
  let sset = [];   // set: [string]
  let n = 0;
  let flash = null;      // id or value just touched
  let flashAll = false;
  let note = '';

  const KEYS = ['name', 'age', 'city', 'role', 'team', 'plan'];
  const SVALS = ['red', 'green', 'blue', 'gold', 'teal'];

  function setMode(m) { mode = m; list = []; pairs = []; sset = []; n = 0; flash = null; flashAll = false; note = ''; }
  function fa(msg) { flashAll = true; note = msg; setTimeout(() => flashAll = false, 450); }
  function f1(id, msg) { flash = id; note = msg; }

  // array
  function append() { n++; list = [...list, { id: n, v: n }]; f1(n, 'Appended to the end - O(1).'); }
  function prepend() { n++; list = [{ id: n, v: n }, ...list]; fa('Inserted at the front - every element shifts right. O(n).'); }
  function popEnd() { if (!list.length) return; const last = list[list.length - 1]; f1(last.id, mode === 'stack' ? 'Popped the top - O(1).' : 'Removed the last element - O(1).'); list = list.slice(0, -1); }
  function removeFront() { if (!list.length) return; flash = list[0].id; fa('Removed from the front - everything shifts left. O(n).'); list = list.slice(1); }
  function access(it, i) { f1(it.id, `Jumped to index ${i} directly - O(1), no scanning.`); }
  // stack / queue
  function push() { n++; list = [...list, { id: n, v: n }]; f1(n, mode === 'stack' ? 'Pushed onto the top - O(1).' : 'Enqueued at the back - O(1).'); }
  function dequeue() { if (!list.length) return; flash = list[0].id; note = 'Dequeued from the front - O(1).'; list = list.slice(1); }
  // map
  function setKey() {
    const k = KEYS[pairs.length % KEYS.length];
    const ex = pairs.find((p) => p.k === k);
    n++;
    if (ex) { pairs = pairs.map((p) => p.k === k ? { k, v: n } : p); f1('k:' + k, `Key "${k}" already exists → its value is replaced. Keys are unique.`); }
    else { pairs = [...pairs, { k, v: n }]; f1('k:' + k, `Inserted "${k}" - hashed straight to a slot. O(1) average.`); }
  }
  function getKey(k) { f1('k:' + k, `Looked up "${k}" by key - O(1), no scanning the others.`); }
  function delKey() { if (pairs.length) { pairs = pairs.slice(0, -1); note = 'Removed a key - O(1) average.'; } }
  // set
  function addVal() {
    const v = SVALS[(sset.length + n) % SVALS.length];
    if (sset.includes(v)) { f1('s:' + v, `"${v}" is already in the set - duplicates are ignored.`); }
    else { sset = [...sset, v]; n++; f1('s:' + v, `Added "${v}". A set keeps only unique values.`); }
  }
  function hasVal(v) { f1('s:' + v, `"${v}" is in the set? Yes - membership is O(1).`); }
  function delVal() { if (sset.length) { sset = sset.slice(0, -1); note = 'Removed a value - O(1).'; } }
</script>

<figure class="pg pg-ds">
  <figcaption class="pg-cap"><i class="ti ti-stack" aria-hidden="true"></i> Data structures</figcaption>
  <div class="ds-body">
    <div class="ds-seg">
      {#each MODES as m}<button class:on={mode === m} on:click={() => setMode(m)}>{m}</button>{/each}
    </div>

    <div class="ds-top">
      {#if mode === 'array'}
        <button class="ds-add" on:click={append}><i class="ti ti-plus"></i> Append</button>
        <button on:click={prepend}><i class="ti ti-arrow-bar-to-left"></i> Insert front</button>
        <button on:click={popEnd} disabled={!list.length}><i class="ti ti-minus"></i> Remove last</button>
        <button on:click={removeFront} disabled={!list.length}>Remove front</button>
      {:else if mode === 'stack'}
        <button class="ds-add" on:click={push}><i class="ti ti-plus"></i> Push</button>
        <button on:click={popEnd} disabled={!list.length}><i class="ti ti-minus"></i> Pop</button>
      {:else if mode === 'queue'}
        <button class="ds-add" on:click={push}><i class="ti ti-plus"></i> Enqueue</button>
        <button on:click={dequeue} disabled={!list.length}><i class="ti ti-minus"></i> Dequeue</button>
      {:else if mode === 'map'}
        <button class="ds-add" on:click={setKey}><i class="ti ti-plus"></i> Set key</button>
        <button on:click={delKey} disabled={!pairs.length}><i class="ti ti-minus"></i> Delete</button>
        <span class="ds-hint">click a row to “get”</span>
      {:else}
        <button class="ds-add" on:click={addVal}><i class="ti ti-plus"></i> Add value</button>
        <button on:click={delVal} disabled={!sset.length}><i class="ti ti-minus"></i> Remove</button>
        <span class="ds-hint">click a chip to test membership</span>
      {/if}
    </div>

    {#if mode === 'array' || mode === 'stack' || mode === 'queue'}
      <div class="ds-track">
        <span class="ds-end">{mode === 'stack' ? 'bottom' : mode === 'queue' ? 'front (out)' : 'index 0'}</span>
        <div class="ds-row">
          {#each list as it, i (it.id)}
            <div class="ds-cell">
              <div class="ds-box" class:flash={flash === it.id || flashAll} class:click={mode === 'array'} on:click={() => mode === 'array' && access(it, i)}>{it.v}</div>
              {#if mode === 'array'}<span class="ds-ix">{i}</span>{/if}
            </div>
          {:else}
            <span class="ds-empty">empty</span>
          {/each}
        </div>
        <span class="ds-end">{mode === 'stack' ? 'top (in/out)' : mode === 'queue' ? 'back (in)' : `index ${Math.max(0, list.length - 1)}`}</span>
      </div>
    {:else if mode === 'map'}
      <div class="ds-map">
        {#each pairs as p (p.k)}
          <div class="ds-pair" class:flash={flash === 'k:' + p.k} on:click={() => getKey(p.k)}>
            <code class="ds-key">{p.k}</code><span class="ds-arrow">→</span><span class="ds-val">{p.v}</span>
          </div>
        {:else}
          <span class="ds-empty">empty map</span>
        {/each}
      </div>
    {:else}
      <div class="ds-set">
        {#each sset as v (v)}
          <span class="ds-chip" class:flash={flash === 's:' + v} on:click={() => hasVal(v)}>{v}</span>
        {:else}
          <span class="ds-empty">empty set</span>
        {/each}
      </div>
    {/if}

    <p class="ds-note">
      {#if note}{note}
      {:else if mode === 'array'}An <b>array/list</b> is indexed: reaching item <code>i</code> is instant, but inserting or removing in the middle/front shifts everything after it.
      {:else if mode === 'stack'}A <b>stack</b> is last-in, first-out - push and pop at the same end. Think undo history or the call stack.
      {:else if mode === 'queue'}A <b>queue</b> is first-in, first-out - enqueue at the back, dequeue from the front. Think a print queue.
      {:else if mode === 'map'}A <b>map/dictionary</b> jumps to a value by its key via hashing - no scanning. Each key is unique.
      {:else}A <b>set</b> stores unique values with instant membership tests - adding a duplicate does nothing.{/if}
    </p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .ds-body { background: var(--raise); padding: 0.9rem; }
  .ds-seg { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 8px; margin-bottom: 0.9rem; flex-wrap: wrap; }
  .ds-seg button { cursor: pointer; font: inherit; font-size: 0.78rem; text-transform: capitalize; border: 0; background: none; color: var(--muted); padding: 0.3rem 0.7rem; border-radius: 6px; }
  .ds-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 600; }
  .ds-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .ds-top button { cursor: pointer; font: inherit; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 8px; padding: 0.35rem 0.7rem; }
  .ds-top button:hover:not(:disabled) { border-color: var(--accent); color: var(--ink); }
  .ds-add { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .ds-top button:disabled { opacity: 0.45; cursor: not-allowed; }
  .ds-hint { font-size: 0.74rem; color: var(--faint); }
  .ds-track { display: flex; align-items: flex-start; gap: 0.6rem; }
  .ds-end { flex: none; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.03em; color: var(--faint); width: 62px; margin-top: 1.1rem; }
  .ds-end:last-child { text-align: right; }
  .ds-row { flex: 1; display: flex; gap: 6px; align-items: flex-start; min-height: 60px; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 8px; overflow-x: auto; }
  .ds-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: none; }
  .ds-box { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 8px; background: var(--accent-tint); border: 1px solid var(--accent); color: var(--ink); font-family: var(--font-mono); font-weight: 600; transition: transform 0.15s, background 0.2s; }
  .ds-box.click { cursor: pointer; }
  .ds-box.flash { background: color-mix(in srgb, #2e9e6b 28%, var(--raise)); border-color: #2e9e6b; transform: translateY(-3px); }
  .ds-ix { font-family: var(--font-mono); font-size: 0.62rem; color: var(--faint); }
  .ds-empty { color: var(--faint); font-size: 0.82rem; padding: 0.3rem; }
  .ds-map { display: flex; flex-direction: column; gap: 5px; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 8px; }
  .ds-pair { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.3rem 0.5rem; border-radius: 7px; transition: background 0.2s; }
  .ds-pair.flash { background: color-mix(in srgb, #2e9e6b 18%, var(--raise)); }
  .ds-key { font-family: var(--font-mono); background: var(--accent-tint); color: var(--accent); padding: 1px 8px; border-radius: 5px; font-weight: 600; }
  .ds-arrow { color: var(--faint); }
  .ds-val { font-family: var(--font-mono); color: var(--ink); }
  .ds-set { display: flex; flex-wrap: wrap; gap: 6px; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 8px; min-height: 44px; }
  .ds-chip { cursor: pointer; font-family: var(--font-mono); font-size: 0.85rem; padding: 0.3rem 0.7rem; border-radius: 999px; background: var(--accent-tint); border: 1px solid var(--accent); color: var(--ink); transition: transform 0.15s, background 0.2s; }
  .ds-chip.flash { background: color-mix(in srgb, #2e9e6b 26%, var(--raise)); border-color: #2e9e6b; transform: translateY(-2px); }
  .ds-note { font-size: 0.84rem; color: var(--muted); line-height: 1.5; border-top: 1px solid var(--line); padding-top: 0.8rem; margin: 1rem 0 0; }
  .ds-note code { font-family: var(--font-mono); background: var(--bg); border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; }
</style>
