<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas, ctx;
  let jitter = 15; // ms of variance
  let lossPct = 2; // % of packets dropped
  let playing = true;
  let scrollX = 0;
  let lastT = null;
  let raf;
  let curMs = 20, avgMs = 20, dropped = 0, sent = 0;

  const BASE_MS = 20;
  const SLOT_PX = 14; // one "packet" per slot

  // Cheap deterministic hash -> stable per slot index, so drops don't flicker frame to frame.
  function hash(n) { return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1; }
  function latencyAt(worldX) {
    const noise = Math.sin(worldX * 0.02) * 0.5 + Math.sin(worldX * 0.053 + 1.7) * 0.3 + Math.sin(worldX * 0.11 + 3.1) * 0.2;
    return BASE_MS + noise * jitter;
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
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
  }

  function frame(now) {
    if (lastT === null) lastT = now;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const w = canvas.clientWidth || 600, h = 200;
    if (playing) scrollX += dt * 90;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f0f';
    ctx.fillRect(0, 0, w, h);
    drawGrid(w, h);

    const maxMs = 150;
    const yFor = (ms) => h - 14 - (Math.min(ms, maxMs) / maxMs) * (h - 28);

    ctx.beginPath();
    let penDown = false;
    let sumMs = 0, n = 0, drops = 0, total = 0;
    for (let x = 0; x <= w; x += 2) {
      const worldX = x + scrollX;
      const slot = Math.floor(worldX / SLOT_PX);
      const isDrop = hash(slot) < lossPct / 100;
      if (Math.floor((worldX - dt * 90) / SLOT_PX) !== slot) total++;
      if (isDrop) {
        penDown = false;
        if (Math.abs((worldX % SLOT_PX) - SLOT_PX / 2) < 1) drops++;
        continue;
      }
      const ms = latencyAt(worldX);
      sumMs += ms; n++;
      const y = yFor(ms);
      if (!penDown) { ctx.moveTo(x, y); penDown = true; } else ctx.lineTo(x, y);
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4dffcf'; ctx.lineWidth = 5; ctx.globalAlpha = 0.35;
    ctx.shadowColor = '#4dffcf'; ctx.shadowBlur = 12; ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.lineWidth = 1.6; ctx.strokeStyle = '#c9fff0'; ctx.stroke();

    // Readouts, sampled at the rightmost (newest) point.
    curMs = Math.round(latencyAt(scrollX + w));
    avgMs = n ? Math.round(sumMs / n) : avgMs;
    sent = Math.max(sent, Math.floor(scrollX / SLOT_PX));
    dropped = Math.round(lossPct);

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
    <canvas bind:this={canvas} style="display:block;width:100%;height:200px"></canvas>
    <span class="ins-live" class:paused={!playing} aria-hidden="true"></span>
    <span class="ins-label">Round-trip latency</span>
  </div>
  <div class="ins-row">
    <button type="button" class="ins-btn" on:click={toggle} aria-label={playing ? 'Pause' : 'Play'}>
      <i class="ti {playing ? 'ti-player-pause' : 'ti-player-play'}" aria-hidden="true"></i>{playing ? 'Pause' : 'Play'}
    </button>
    <span class="ins-chip">{curMs} ms now</span>
    <span class="ins-chip">{avgMs} ms average</span>
    <span class="ins-chip">{dropped}% dropped</span>
  </div>
  <div class="ins-row">
    <span class="ins-lbl">Jitter</span>
    <input type="range" class="ins-range" min="0" max="40" step="1" bind:value={jitter} />
    <span class="ins-chip">{jitter} ms</span>
  </div>
  <div class="ins-row">
    <span class="ins-lbl">Packet loss</span>
    <input type="range" class="ins-range" min="0" max="10" step="0.5" bind:value={lossPct} />
    <span class="ins-chip">{lossPct}%</span>
  </div>
</div>
