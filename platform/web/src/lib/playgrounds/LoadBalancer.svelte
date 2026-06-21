<script>
  import { onDestroy } from 'svelte';
  let algo = 'round-robin';
  const N = 3;
  let backends = Array.from({ length: N }, (_, i) => ({ id: i + 1, active: 0, total: 0 }));
  let rr = 0;
  let lastTo = null;
  let timers = [];
  $: maxTotal = Math.max(1, ...backends.map((b) => b.total));

  function pick() {
    if (algo === 'round-robin') { const i = rr % N; rr++; return i; }
    if (algo === 'random') return Math.floor(Math.random() * N);
    // least-connections: fewest active, tie -> lowest total
    let best = 0;
    for (let i = 1; i < N; i++) {
      if (backends[i].active < backends[best].active ||
        (backends[i].active === backends[best].active && backends[i].total < backends[best].total)) best = i;
    }
    return best;
  }
  function send() {
    const i = pick();
    backends[i].active++; backends[i].total++; backends = backends; lastTo = i;
    const dur = 1200 + Math.random() * 2200;
    const t = setTimeout(() => { backends[i].active = Math.max(0, backends[i].active - 1); backends = backends; }, dur);
    timers.push(t);
  }
  function burst() { for (let n = 0; n < 6; n++) setTimeout(send, n * 130); }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    backends = Array.from({ length: N }, (_, i) => ({ id: i + 1, active: 0, total: 0 }));
    rr = 0; lastTo = null;
  }
  onDestroy(() => timers.forEach(clearTimeout));
</script>

<figure class="pg pg-lb">
  <figcaption class="pg-cap"><i class="ti ti-arrows-split-2" aria-hidden="true"></i> Load balancer</figcaption>
  <div class="lb-body">
    <div class="lb-top">
      <div class="lb-seg">
        {#each [['round-robin', 'Round-robin'], ['least-connections', 'Least-conn'], ['random', 'Random']] as [v, lbl]}
          <button class:on={algo === v} on:click={() => algo = v}>{lbl}</button>
        {/each}
      </div>
      <button class="lb-send" on:click={send}><i class="ti ti-send"></i> Send request</button>
      <button class="lb-burst" on:click={burst}>Send 6</button>
      <button class="lb-reset" on:click={reset}>Reset</button>
    </div>
    <div class="lb-back">
      {#each backends as b, i}
        <div class="lb-node" class:lit={lastTo === i}>
          <div class="lb-head"><i class="ti ti-server"></i> Backend {b.id}</div>
          <div class="lb-bar"><div class="lb-fill" style={`height:${(b.total / maxTotal) * 100}%`}></div></div>
          <div class="lb-nums"><span class="lb-active">{b.active} active</span><span class="lb-total">{b.total} total</span></div>
        </div>
      {/each}
    </div>
    <p class="lb-note">
      {#if algo === 'round-robin'}Each request goes to the next backend in turn — simple and even, but ignores how busy each one is.
      {:else if algo === 'least-connections'}Each request goes to the backend with the fewest in-flight requests — adapts when some requests run long.
      {:else}Each request picks a backend at random — even over time, lumpy in the short run.{/if}
      Requests finish on their own after a random delay (watch “active” drop).
    </p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .lb-body { background: var(--raise); padding: 0.9rem; }
  .lb-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .lb-seg { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 8px; }
  .lb-seg button { cursor: pointer; font: inherit; font-size: 0.78rem; border: 0; background: none; color: var(--muted); padding: 0.25rem 0.55rem; border-radius: 6px; }
  .lb-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 600; }
  .lb-top button:not(.lb-seg button) { cursor: pointer; font: inherit; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 8px; padding: 0.35rem 0.7rem; }
  .lb-send { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .lb-reset { margin-left: auto; }
  .lb-back { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; }
  .lb-node { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem; background: var(--bg); transition: border-color 0.2s, box-shadow 0.2s; }
  .lb-node.lit { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .lb-head { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--ink); font-weight: 600; margin-bottom: 0.5rem; }
  .lb-head .ti { color: var(--accent); }
  .lb-bar { height: 90px; background: var(--surface); border-radius: 7px; display: flex; align-items: flex-end; overflow: hidden; }
  .lb-fill { width: 100%; background: var(--accent); border-radius: 0 0 7px 7px; transition: height 0.3s var(--ease); }
  .lb-nums { display: flex; justify-content: space-between; margin-top: 0.4rem; font-family: var(--font-mono); font-size: 0.7rem; }
  .lb-active { color: var(--accent); }
  .lb-total { color: var(--muted); }
  .lb-note { font-size: 0.85rem; color: var(--muted); line-height: 1.5; border-top: 1px solid var(--line); padding-top: 0.8rem; margin: 1rem 0 0; }
  @media (max-width: 520px) { .lb-back { grid-template-columns: 1fr; } }
</style>
