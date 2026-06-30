<script>
  export let config = '';
  const KEYS = (config.trim() ? config.trim().split(/\s+/) : ['A', 'B', 'C', 'D', 'E']).slice(0, 8);
  let cap = 3;
  let cache = []; // most-recent first: [{k}]
  let hits = 0, misses = 0;
  let last = null; // { k, hit, evicted }
  $: ratio = hits + misses ? Math.round((hits / (hits + misses)) * 100) : 0;

  function access(k) {
    const idx = cache.findIndex((c) => c.k === k);
    let evicted = null;
    if (idx >= 0) { cache.splice(idx, 1); cache.unshift({ k }); hits++; last = { k, hit: true, evicted: null }; }
    else {
      cache.unshift({ k });
      if (cache.length > cap) evicted = cache.pop().k;
      misses++; last = { k, hit: false, evicted };
    }
    cache = cache;
  }
  function setCap(n) { cap = n; while (cache.length > cap) cache.pop(); cache = cache; }
  function reset() { cache = []; hits = 0; misses = 0; last = null; }
</script>

<figure class="pg pg-lru">
  <figcaption class="pg-cap"><i class="ti ti-stack-2" aria-hidden="true"></i> LRU cache</figcaption>
  <div class="lr-body">
    <div class="lr-top">
      <span class="lr-lbl">Capacity</span>
      <div class="lr-seg">{#each [2, 3, 4] as n}<button class:on={cap === n} on:click={() => setCap(n)}>{n}</button>{/each}</div>
      <span class="lr-lbl lr-acc">Access a key:</span>
      <div class="lr-keys">{#each KEYS as k}<button class="lr-key" on:click={() => access(k)}>{k}</button>{/each}</div>
    </div>
    <div class="lr-slots">
      <span class="lr-end">MRU</span>
      {#each Array(cap) as _, i}
        {@const c = cache[i]}
        <div class="lr-slot" class:filled={!!c} class:flash={c && last && last.k === c.k} class:hit={c && last && last.k === c.k && last.hit}>
          {c ? c.k : ''}
        </div>
      {/each}
      <span class="lr-end">LRU</span>
    </div>
    {#if last}
      <p class="lr-msg" class:hit={last.hit}>
        <i class={`ti ${last.hit ? 'ti-circle-check' : 'ti-circle-x'}`}></i>
        <b>{last.k}</b> - {last.hit ? 'HIT (already cached, moved to front)' : last.evicted ? `MISS (cached; evicted ${last.evicted} - the least-recently used)` : 'MISS (added to cache)'}
      </p>
    {:else}
      <p class="lr-msg lr-hint">Click keys above. A repeat within the last {cap} unique keys is a hit; otherwise the oldest is evicted.</p>
    {/if}
    <div class="lr-stats">
      <span class="lr-stat hit">Hits <b>{hits}</b></span>
      <span class="lr-stat miss">Misses <b>{misses}</b></span>
      <span class="lr-stat">Hit ratio <b>{ratio}%</b></span>
      <button class="lr-reset" on:click={reset}>Reset</button>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .lr-body { background: var(--raise); padding: 0.9rem; }
  .lr-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
  .lr-lbl { font-size: 0.78rem; color: var(--muted); }
  .lr-acc { margin-left: 0.5rem; }
  .lr-seg { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 8px; }
  .lr-seg button { cursor: pointer; font: inherit; font-size: 0.8rem; border: 0; background: none; color: var(--muted); padding: 0.2rem 0.55rem; border-radius: 6px; }
  .lr-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 600; }
  .lr-keys { display: inline-flex; gap: 4px; }
  .lr-key { cursor: pointer; font: inherit; font-family: var(--font-mono); font-size: 0.85rem; width: 32px; height: 32px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); border-radius: 8px; }
  .lr-key:hover { border-color: var(--accent); color: var(--accent); }
  .lr-slots { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; }
  .lr-end { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.06em; color: var(--faint); }
  .lr-slot { flex: 1; max-width: 70px; height: 56px; display: grid; place-items: center; border: 2px dashed var(--line); border-radius: 10px; font-family: var(--font-mono); font-size: 1.2rem; font-weight: 600; color: var(--faint); background: var(--bg); transition: all 0.2s var(--ease); }
  .lr-slot.filled { border-style: solid; border-color: var(--accent); color: var(--ink); background: var(--accent-tint); }
  .lr-slot.flash { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .lr-slot.hit { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); }
  .lr-msg { display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: #c0563c; margin: 0.7rem 0; }
  .lr-msg.hit { color: #2e9e6b; }
  .lr-msg.lr-hint { color: var(--muted); }
  .lr-msg .ti { font-size: 16px; }
  .lr-stats { display: flex; align-items: center; gap: 0.8rem; border-top: 1px solid var(--line); padding-top: 0.7rem; font-size: 0.8rem; color: var(--muted); }
  .lr-stat b { color: var(--ink); margin-left: 0.2rem; font-family: var(--font-mono); }
  .lr-stat.hit b { color: #2e9e6b; }
  .lr-stat.miss b { color: #c0563c; }
  .lr-reset { margin-left: auto; cursor: pointer; font: inherit; font-size: 0.8rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 8px; padding: 0.35rem 0.7rem; }
  .lr-reset:hover { border-color: var(--accent); color: var(--ink); }
</style>
