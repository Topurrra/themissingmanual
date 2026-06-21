<script>
  import { onDestroy } from 'svelte';
  let algo = 'bubble';
  const SIZE = 16, MAXV = 100;
  let arr = [];
  let steps = [];
  let i = 0, playing = false, timer = null;
  $: step = steps[i] || { arr, hi: [], kind: '' };

  function gen(name, input) {
    const a = [...input], out = [];
    const snap = (hi, kind) => out.push({ arr: [...a], hi: hi || [], kind: kind || '' });
    snap([], '');
    if (name === 'bubble') { for (let p = 0; p < a.length; p++) { for (let j = 0; j < a.length - 1 - p; j++) { snap([j, j + 1], 'cmp'); if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; snap([j, j + 1], 'swap'); } } } }
    else if (name === 'insertion') { for (let p = 1; p < a.length; p++) { let j = p; while (j > 0) { snap([j - 1, j], 'cmp'); if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; snap([j - 1, j], 'swap'); j--; } else break; } } }
    else if (name === 'selection') { for (let p = 0; p < a.length; p++) { let m = p; for (let j = p + 1; j < a.length; j++) { snap([m, j], 'cmp'); if (a[j] < a[m]) m = j; } if (m !== p) { [a[p], a[m]] = [a[m], a[p]]; snap([p, m], 'swap'); } } }
    snap([], 'sorted');
    return out;
  }
  function build() { steps = gen(algo, arr); i = 0; }
  function shuffle() { stop(); arr = Array.from({ length: SIZE }, () => 6 + Math.floor(Math.random() * (MAXV - 6))); build(); }
  function go(n) { i = Math.max(0, Math.min(steps.length - 1, n)); }
  function play() { if (i >= steps.length - 1) i = 0; playing = true; timer = setInterval(() => { if (i >= steps.length - 1) stop(); else go(i + 1); }, 120); }
  function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { playing ? stop() : play(); }
  function pick(a) { algo = a; build(); }
  shuffle();
  onDestroy(stop);
</script>

<figure class="pg pg-sort">
  <figcaption class="pg-cap"><i class="ti ti-arrows-sort" aria-hidden="true"></i> Sorting visualizer</figcaption>
  <div class="so-body">
    <div class="so-bars">
      {#each step.arr as v, idx}
        <div class="so-bar" class:cmp={step.kind !== 'sorted' && step.hi.includes(idx) && step.kind === 'cmp'}
          class:swap={step.kind !== 'sorted' && step.hi.includes(idx) && step.kind === 'swap'}
          class:sorted={step.kind === 'sorted'} style={`height:${v}%`}></div>
      {/each}
    </div>
    <div class="so-controls">
      <div class="so-seg">
        {#each ['bubble', 'insertion', 'selection'] as a}<button class:on={algo === a} on:click={() => pick(a)}>{a}</button>{/each}
      </div>
      <button class="so-play" on:click={toggle}><i class={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}></i> {playing ? 'Pause' : 'Play'}</button>
      <button on:click={() => { stop(); go(i + 1); }} aria-label="Step"><i class="ti ti-player-track-next"></i></button>
      <button class="so-shuffle" on:click={shuffle}>Shuffle</button>
      <span class="so-step">{i}/{steps.length - 1}</span>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .so-body { background: var(--raise); padding: 0.9rem; }
  .so-bars { display: flex; align-items: flex-end; gap: 3px; height: 160px; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 6px; }
  .so-bar { flex: 1; background: var(--accent); opacity: 0.55; border-radius: 2px 2px 0 0; transition: height 0.08s linear; }
  .so-bar.cmp { opacity: 1; background: #e0892a; }
  .so-bar.swap { opacity: 1; background: #c0563c; }
  .so-bar.sorted { opacity: 1; background: #2e9e6b; }
  .so-controls { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.7rem; flex-wrap: wrap; }
  .so-seg { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 9px; }
  .so-seg button { cursor: pointer; font: inherit; font-size: 0.8rem; text-transform: capitalize; border: 0; background: none; color: var(--muted); padding: 0.3rem 0.6rem; border-radius: 7px; }
  .so-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 500; }
  .so-controls button:not(.so-seg button) { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 9px; padding: 0.4rem 0.7rem; }
  .so-play { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .so-shuffle { margin-left: auto; }
  .so-step { font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); }
</style>
