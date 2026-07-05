<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas, ctx;
  let freq = 2.4; // GHz, illustrative - not a literal render of gigahertz-speed edges
  let jitterOn = false;
  let playing = true;
  let scrollX = 0;
  let lastT = null;
  let raf;
  let dpr = 1;

  $: period = (1 / freq).toFixed(2);
  $: cycles = Math.round(freq * 1e9).toLocaleString();

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600;
    canvas.width = w * dpr;
    canvas.height = 200 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = '#22282a';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#3a4144';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  function frame(now) {
    if (lastT === null) lastT = now;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const w = canvas.clientWidth || 600, h = 200;
    if (playing) scrollX += dt * 70;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f0f';
    ctx.fillRect(0, 0, w, h);
    drawGrid(w, h);

    const pxPerCycle = 300 / freq;
    const top = h * 0.28, bot = h * 0.72;
    ctx.beginPath();
    let first = true;
    for (let x = 0; x <= w; x += 2) {
      const worldX = x + scrollX;
      const wob = jitterOn ? Math.sin(worldX * 0.02 + now * 0.002) * 7 + Math.sin(worldX * 0.075) * 3 : 0;
      const pos = ((worldX + wob) % pxPerCycle + pxPerCycle) % pxPerCycle;
      const y = pos < pxPerCycle * 0.5 ? top : bot;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4dffcf'; ctx.lineWidth = 5; ctx.globalAlpha = 0.35;
    ctx.shadowColor = '#4dffcf'; ctx.shadowBlur = 14; ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.lineWidth = 1.6; ctx.strokeStyle = '#c9fff0'; ctx.stroke();

    raf = requestAnimationFrame(frame);
  }

  function toggle() { playing = !playing; }

  onMount(() => {
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
  });
  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    if (typeof window !== 'undefined') window.removeEventListener('resize', resize);
  });
</script>

<div class="ins-bezel">
  <div class="ins-screen">
    <canvas bind:this={canvas} style="display:block;width:100%;height:200px" role="img" aria-label={`Animated square clock signal wave scrolling left to right at ${freq} GHz (period ${period} ns), ${playing ? 'currently playing' : 'paused'}${jitterOn ? ' with jitter enabled' : ''}.`}></canvas>
    <span class="ins-live" class:paused={!playing} aria-hidden="true"></span>
    <span class="ins-label">Clock signal</span>
  </div>
  <div class="ins-row">
    <button type="button" class="ins-btn" on:click={toggle} aria-label={playing ? 'Pause' : 'Play'}>
      <i class="ti {playing ? 'ti-player-pause' : 'ti-player-play'}" aria-hidden="true"></i>{playing ? 'Pause' : 'Play'}
    </button>
    <span class="ins-chip">{freq.toFixed(1)} GHz</span>
    <span class="ins-chip">period {period} ns</span>
    <span class="ins-chip">{cycles} cycles / sec</span>
  </div>
  <div class="ins-row">
    <span class="ins-lbl">Clock speed</span>
    <input type="range" class="ins-range" min="0.5" max="5" step="0.1" bind:value={freq} />
  </div>
  <div class="ins-row">
    <span class="ins-lbl">Add jitter</span>
    <label class="ins-switch">
      <input type="checkbox" bind:checked={jitterOn} />
      <span class="ins-switch-track"></span>
    </label>
    <span style="font-size:12px;color:var(--muted)">an unstable clock: edges wobble instead of landing cleanly</span>
  </div>
</div>
