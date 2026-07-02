<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas, ctx;
  let step = 0;
  let playing = false;
  let raf;

  const CAPTIONS = [
    "Main has A, B, C. Feature branched off B and added D and E.",
    "Run: git rebase main (from the feature branch).",
    "Git replays D and E on top of C, one at a time, as D' and E'.",
    "Feature is now a straight line: A, B, C, D', E'."
  ];

  const MAIN_Y = 140, BRANCH_Y = 62;
  // Node layout per step: id, label, and target x/y. A/B/C never move; D/E move
  // from the branch position (steps 0-1) down onto the main line (steps 2-3).
  function layout(s) {
    const onBranch = s < 2;
    return [
      { id: 'A', x: 30, y: MAIN_Y },
      { id: 'B', x: 90, y: MAIN_Y },
      { id: 'C', x: 150, y: MAIN_Y },
      { id: 'D', x: onBranch ? 150 : 270, y: onBranch ? BRANCH_Y : MAIN_Y, prime: !onBranch },
      { id: 'E', x: onBranch ? 210 : 330, y: onBranch ? BRANCH_Y : MAIN_Y, prime: !onBranch }
    ];
  }
  // Smoothly-interpolated current positions, eased toward the target layout every
  // frame - this is what makes step changes glide instead of instantly snapping.
  let current = layout(0).map((n) => ({ ...n }));

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600;
    canvas.width = w * dpr;
    canvas.height = 200 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    const w = canvas.clientWidth || 600, h = 200;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f0f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#22282a'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

    const targets = layout(step);
    for (let i = 0; i < current.length; i++) {
      current[i].x += (targets[i].x - current[i].x) * 0.12;
      current[i].y += (targets[i].y - current[i].y) * 0.12;
      current[i].prime = targets[i].prime;
    }

    // Connect A-B-C always; connect the feature pair to whatever it's currently near.
    ctx.strokeStyle = '#4dffcf'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(current[0].x, current[0].y); ctx.lineTo(current[1].x, current[1].y); ctx.lineTo(current[2].x, current[2].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(current[3].x, current[3].y); ctx.lineTo(current[4].x, current[4].y);
    ctx.stroke();
    if (step < 2) {
      ctx.setLineDash([3, 4]); ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(current[1].x, current[1].y); ctx.lineTo(current[3].x, current[3].y); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(current[2].x, current[2].y); ctx.lineTo(current[3].x, current[3].y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Idle breathing glow on the step's focus node - keeps the screen alive even
    // when nothing is mid-transition.
    const focusId = step === 1 ? 'B' : step === 2 ? 'D' : null;
    const breathe = 10 + Math.sin(now / 400) * 3;
    for (const n of current) {
      const isFocus = n.id === focusId;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isFocus ? breathe : 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0f0f';
      ctx.strokeStyle = n.prime ? '#4dffcf' : '#5b6266';
      ctx.lineWidth = 2;
      if (isFocus) { ctx.shadowColor = '#4dffcf'; ctx.shadowBlur = 14; }
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = n.prime ? '#c9fff0' : '#9aa0a3';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.prime ? n.id + "'" : n.id, n.x, n.y + 1);
    }

    raf = requestAnimationFrame(frame);
  }

  function go(n) { step = Math.max(0, Math.min(3, n)); }
  let playTimer;
  function togglePlay() {
    playing = !playing;
    if (playing) {
      playTimer = setInterval(() => {
        if (step >= 3) { playing = false; clearInterval(playTimer); return; }
        go(step + 1);
      }, 1500);
    } else clearInterval(playTimer);
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
  });
  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    if (playTimer) clearInterval(playTimer);
    if (typeof window !== 'undefined') window.removeEventListener('resize', resize);
  });
</script>

<div class="ins-bezel">
  <div class="ins-screen">
    <canvas bind:this={canvas} style="display:block;width:100%;height:200px"></canvas>
    <span class="ins-live" class:paused={!playing} aria-hidden="true"></span>
    <span class="ins-label">git rebase</span>
  </div>
  <div class="ins-row" style="color:var(--body);font-size:0.88rem;line-height:1.5">{CAPTIONS[step]}</div>
  <div class="ins-row">
    <button type="button" class="ins-btn" on:click={() => go(step - 1)} disabled={step === 0}><i class="ti ti-chevron-left" aria-hidden="true"></i>Prev</button>
    <button type="button" class="ins-btn" on:click={togglePlay}><i class="ti {playing ? 'ti-player-pause' : 'ti-player-play'}" aria-hidden="true"></i>{playing ? 'Pause' : 'Play'}</button>
    <button type="button" class="ins-btn" on:click={() => go(step + 1)} disabled={step === 3}>Next<i class="ti ti-chevron-right" aria-hidden="true"></i></button>
    <span class="ins-chip">step {step + 1} / 4</span>
  </div>
</div>
