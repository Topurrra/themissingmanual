<script>
  // Two roots (stack/global references) into a heap of objects. Each object may
  // reference one other object (a chain). GC marks everything reachable from a
  // root, then sweeps the rest.
  let roots = { a: null, b: null };
  let objs = [];
  let next = 0;
  let phase = 'idle'; // idle | swept
  let marked = new Set();

  function reachable() {
    const seen = new Set();
    for (const r of ['a', 'b']) {
      let id = roots[r];
      while (id != null && !seen.has(id)) { seen.add(id); const o = objs.find((x) => x.id === id); id = o ? o.ref : null; }
    }
    return seen;
  }
  $: live = reachable();

  function alloc(root) { next++; const id = next; objs = [...objs, { id, ref: roots[root] }]; roots[root] = id; phase = 'idle'; }
  function drop(root) { roots[root] = null; phase = 'idle'; }
  function gc() {
    marked = reachable();
    phase = 'mark';
    setTimeout(() => { objs = objs.filter((o) => marked.has(o.id)); phase = 'swept'; }, 900);
  }
  function reset() { roots = { a: null, b: null }; objs = []; next = 0; phase = 'idle'; marked = new Set(); }
  $: garbage = objs.filter((o) => !live.has(o.id)).length;
</script>

<figure class="pg pg-gc">
  <figcaption class="pg-cap"><i class="ti ti-trash" aria-hidden="true"></i> Garbage collection (mark &amp; sweep)</figcaption>
  <div class="gc-body">
    <div class="gc-roots">
      <span class="gc-lbl">Roots</span>
      {#each ['a', 'b'] as r}
        <div class="gc-root">
          <code>{r}</code> → {roots[r] != null ? `#${roots[r]}` : '∅'}
          <button class="gc-mini" on:click={() => alloc(r)} title="Allocate object held by this root">+ new</button>
          <button class="gc-mini" on:click={() => drop(r)} disabled={roots[r] == null} title="Drop this reference">drop</button>
        </div>
      {/each}
    </div>
    <div class="gc-heap">
      <span class="gc-lbl">Heap</span>
      <div class="gc-objs">
        {#each objs as o (o.id)}
          <div class="gc-obj" class:live={live.has(o.id)} class:garbage={!live.has(o.id)}
            class:marked={phase === 'mark' && marked.has(o.id)}>
            <b>#{o.id}</b><span class="gc-ref">→ {o.ref != null ? `#${o.ref}` : '∅'}</span>
          </div>
        {:else}
          <span class="gc-empty">Heap is empty — allocate an object from a root.</span>
        {/each}
      </div>
    </div>
    <div class="gc-foot">
      <span class="gc-stat">{objs.length} object{objs.length === 1 ? '' : 's'} · <b class="gc-g">{garbage} unreachable</b></span>
      <button class="gc-run" on:click={gc} disabled={!objs.length}><i class="ti ti-recycle"></i> Run GC</button>
      <button class="gc-reset" on:click={reset}>Reset</button>
    </div>
    <p class="gc-note">
      {#if phase === 'swept'}Swept! Everything not reachable from a root was freed. The rest survives.
      {:else}Allocate objects, then <b>drop</b> a root to orphan its chain. Unreachable objects (red) are exactly what GC collects — even if they still point at each other.{/if}
    </p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .gc-body { background: var(--raise); padding: 0.9rem; }
  .gc-lbl { display: block; font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); margin-bottom: 0.4rem; }
  .gc-roots { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.9rem; }
  .gc-root { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.84rem; color: var(--ink); }
  .gc-root code { background: var(--accent-tint); color: var(--accent); padding: 1px 7px; border-radius: 5px; font-weight: 600; }
  .gc-mini { cursor: pointer; font: inherit; font-size: 0.72rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 6px; padding: 0.2rem 0.5rem; }
  .gc-mini:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .gc-mini:disabled { opacity: 0.4; cursor: not-allowed; }
  .gc-heap { background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 0.7rem; margin-bottom: 0.8rem; }
  .gc-objs { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .gc-obj { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; min-width: 56px; padding: 0.45rem 0.6rem; border-radius: 9px; border: 2px solid; font-family: var(--font-mono); transition: all 0.3s var(--ease); }
  .gc-obj.live { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 13%, var(--raise)); color: var(--ink); }
  .gc-obj.garbage { border-style: dashed; border-color: #c0563c; background: color-mix(in srgb, #c0563c 10%, var(--raise)); color: var(--muted); }
  .gc-obj.marked { box-shadow: 0 0 0 3px color-mix(in srgb, #2e9e6b 35%, transparent); transform: translateY(-2px); }
  .gc-obj b { font-size: 0.9rem; }
  .gc-ref { font-size: 0.68rem; color: var(--faint); }
  .gc-empty { font-size: 0.84rem; color: var(--faint); }
  .gc-foot { display: flex; align-items: center; gap: 0.7rem; border-top: 1px solid var(--line); padding-top: 0.7rem; }
  .gc-stat { font-size: 0.82rem; color: var(--muted); }
  .gc-g { color: #c0563c; }
  .gc-run { cursor: pointer; font: inherit; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 8px; padding: 0.4rem 0.8rem; font-weight: 600; margin-left: auto; }
  .gc-run:disabled { opacity: 0.45; cursor: not-allowed; }
  .gc-reset { cursor: pointer; font: inherit; font-size: 0.82rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 8px; padding: 0.4rem 0.7rem; }
  .gc-reset:hover { border-color: var(--accent); color: var(--ink); }
  .gc-note { font-size: 0.84rem; color: var(--muted); line-height: 1.5; margin: 0.8rem 0 0; }
</style>
