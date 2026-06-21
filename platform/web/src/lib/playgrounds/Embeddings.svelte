<script>
  const PTS = [
    { w: 'cat', x: 16, y: 24, c: 0 }, { w: 'dog', x: 22, y: 30, c: 0 }, { w: 'lion', x: 27, y: 18, c: 0 }, { w: 'kitten', x: 13, y: 31, c: 0 },
    { w: 'king', x: 80, y: 78, c: 1 }, { w: 'queen', x: 86, y: 73, c: 1 }, { w: 'prince', x: 77, y: 70, c: 1 },
    { w: 'server', x: 80, y: 22, c: 2 }, { w: 'laptop', x: 86, y: 28, c: 2 }, { w: 'CPU', x: 75, y: 16, c: 2 },
    { w: 'pizza', x: 20, y: 78, c: 3 }, { w: 'sushi', x: 26, y: 85, c: 3 }, { w: 'bread', x: 15, y: 74, c: 3 }
  ];
  const COLORS = ['#0e7c86', '#9a5bb8', '#c47a1a', '#2e9e6b'];
  let sel = null;
  $: near = sel == null ? [] : PTS.map((p, i) => ({ i, d: Math.hypot(p.x - PTS[sel].x, p.y - PTS[sel].y) }))
    .filter((o) => o.i !== sel).sort((a, b) => a.d - b.d).slice(0, 3);
  $: nearSet = new Set(near.map((o) => o.i));
  const sx = (x) => 8 + (x / 100) * 84;
  const sy = (y) => 92 - (y / 100) * 84;
</script>

<figure class="pg pg-emb">
  <figcaption class="pg-cap"><i class="ti ti-vector-triangle" aria-hidden="true"></i> Embeddings — meaning as coordinates</figcaption>
  <div class="em-body">
    <svg viewBox="0 0 100 100" class="em-svg" role="img" aria-label="Word embedding scatter plot">
      {#if sel != null}
        {#each near as o}
          <line x1={sx(PTS[sel].x)} y1={sy(PTS[sel].y)} x2={sx(PTS[o.i].x)} y2={sy(PTS[o.i].y)} class="em-link" />
        {/each}
      {/if}
      {#each PTS as p, i}
        <g class="em-pt" class:dim={sel != null && i !== sel && !nearSet.has(i)} on:click={() => sel = (sel === i ? null : i)} role="button" tabindex="0">
          <circle cx={sx(p.x)} cy={sy(p.y)} r={sel === i ? 3 : 2.1} fill={COLORS[p.c]} />
          <text x={sx(p.x)} y={sy(p.y) - 3.4} class="em-lbl" class:bold={sel === i || nearSet.has(i)}>{p.w}</text>
        </g>
      {/each}
    </svg>
    <p class="em-note">
      {#if sel != null}Closest in meaning to <b>{PTS[sel].w}</b>: {near.map((o) => PTS[o.i].w).join(', ')}. Words about the same thing land near each other — that's what an embedding captures.
      {:else}Each word is a point. Click one to see its nearest neighbours. Notice the clusters — animals, royalty, tech, food — form on their own from meaning, not spelling.{/if}
    </p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .em-body { background: var(--raise); padding: 0.9rem; }
  .em-svg { width: 100%; max-width: 460px; margin: 0 auto; display: block; aspect-ratio: 1; background: var(--bg); border: 1px solid var(--line); border-radius: 10px; }
  .em-pt { cursor: pointer; transition: opacity 0.2s; }
  .em-pt.dim { opacity: 0.25; }
  .em-lbl { font-family: var(--font-mono); font-size: 3px; fill: var(--muted); text-anchor: middle; }
  .em-lbl.bold { fill: var(--ink); font-weight: 600; }
  .em-link { stroke: var(--accent); stroke-width: 0.5; stroke-dasharray: 1.5 1; }
  .em-note { font-size: 0.84rem; color: var(--muted); line-height: 1.5; margin: 0.8rem 0 0; }
</style>
