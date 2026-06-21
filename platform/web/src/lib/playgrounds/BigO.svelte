<script>
  let n = 16;
  const N = 64, W = 560, H = 220, PAD = 10;
  const CURVES = [
    { k: 'O(1)', f: () => 1, c: '#2e9e6b' },
    { k: 'O(log n)', f: (x) => Math.log2(x), c: '#4d969c' },
    { k: 'O(n)', f: (x) => x, c: '#0e7c86' },
    { k: 'O(n log n)', f: (x) => x * Math.log2(x), c: '#e0892a' },
    { k: 'O(n²)', f: (x) => x * x, c: '#c0563c' }
  ];
  const maxY = N * N;
  const px = (x) => PAD + ((x - 1) / (N - 1)) * (W - 2 * PAD);
  const py = (v) => H - PAD - (Math.min(v, maxY) / maxY) * (H - 2 * PAD);
  function path(f) { let d = ''; for (let x = 1; x <= N; x++) d += (x === 1 ? 'M' : 'L') + px(x).toFixed(1) + ' ' + py(f(x)).toFixed(1) + ' '; return d; }
  const fmt = (v) => (v >= 1000 ? Math.round(v).toLocaleString() : v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v).toString());
  $: ops = CURVES.map((c) => ({ k: c.k, c: c.c, v: c.f(n) }));
</script>

<figure class="pg pg-bigo">
  <figcaption class="pg-cap"><i class="ti ti-chart-line" aria-hidden="true"></i> Big-O grapher</figcaption>
  <div class="bo-body">
    <svg viewBox={`0 0 ${W} ${H}`} class="bo-svg" role="img" aria-label="growth curves">
      <line x1={px(n)} y1={PAD} x2={px(n)} y2={H - PAD} stroke="var(--line)" stroke-dasharray="3 3" />
      {#each CURVES as c}<path d={path(c.f)} fill="none" stroke={c.c} stroke-width="2" />{/each}
      {#each CURVES as c}<circle cx={px(n)} cy={py(c.f(n))} r="3.5" fill={c.c} />{/each}
    </svg>
    <div class="bo-slider"><label>n = <b>{n}</b></label><input type="range" min="1" max={N} bind:value={n} aria-label="input size n" /></div>
    <div class="bo-legend">
      {#each ops as o}
        <span class="bo-item"><span class="bo-dot" style={`background:${o.c}`}></span>{o.k} ≈ <b>{fmt(o.v)}</b></span>
      {/each}
    </div>
    <p class="bo-note">At n = {n}, an O(n²) algorithm does ~<b>{fmt(n * n)}</b> steps where O(log n) does just <b>{fmt(Math.log2(n))}</b>. That gap is why complexity matters as data grows.</p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .bo-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .bo-svg { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); }
  .bo-slider { display: flex; align-items: center; gap: 0.7rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); }
  .bo-slider b { color: var(--ink); }
  .bo-slider input { flex: 1; accent-color: var(--accent); }
  .bo-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--muted); }
  .bo-item { display: inline-flex; align-items: center; gap: 0.4rem; } .bo-item b { color: var(--ink); }
  .bo-dot { width: 10px; height: 10px; border-radius: 2px; }
  .bo-note { margin: 0; font-size: 0.85rem; color: var(--muted); line-height: 1.5; } .bo-note b { color: var(--ink); }
</style>
