<script>
  import { onMount, onDestroy } from 'svelte';
  import { confetti } from '$lib/confetti.js';
  import { QUIZZES } from '$lib/quizzes.js';
  import { beginnerMode } from '$lib/beginner-store.js';

  export let data;
  $: beginnerSlugs = data?.beginnerSlugs ?? [];

  // Every quiz question, tagged with its guide slug.
  const QUIZ_ENTRIES = Object.entries(QUIZZES).flatMap(([k, arr]) => arr.map((o) => ({ ...o, guide: k.split('/')[0] })));

  const GAMES = [
    { id: 'speed', name: 'Speed', blurb: 'Mental math against the clock', icon: 'ti-bolt' },
    { id: 'knowledge', name: 'Knowledge', blurb: '', icon: 'ti-bulb' },
    { id: 'memory', name: 'Memory', blurb: 'Repeat the flashed sequence', icon: 'ti-brain' },
    { id: 'focus', name: 'Focus', blurb: 'Spot the one that’s different', icon: 'ti-eye' }
  ];
  const DIFFS = ['easy', 'medium', 'hard'];
  const CODE_TILES = ['{ }', '( )', '[ ]', '=>', '&&', '||', '==', '!=', '++', ';'];

  let stage = 'menu';
  let game = 'speed';
  let theme = 'numbers';
  let diff = 'medium';
  let best = 0;
  let newBest = false;
  let endLabel = '';
  let doneGuides = [];

  let correct = 0, attempts = 0, streak = 0, maxStreak = 0, rounds = 0;
  $: headline = game === 'memory' ? rounds : correct;

  let timer = null, timeLeft = 0, locked = false, picked = null;
  let q = null;
  let tiles = [], seq = [], inputPos = 0, activeTile = -1, goodTile = -1, showing = false, round = 0, memGen = 0;
  let cells = [];

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Knowledge pool: full set normally; in beginner mode, only beginner-level
  // guides the user has actually finished (2 checks). Drives the card + game.
  $: kpool = $beginnerMode
    ? QUIZ_ENTRIES.filter((e) => beginnerSlugs.includes(e.guide) && doneGuides.includes(e.guide))
    : QUIZ_ENTRIES;
  $: knowledgeEmpty = kpool.length === 0;
  $: startDisabled = game === 'knowledge' && knowledgeEmpty;

  const variant = () => (game === 'speed' ? `-:${diff}` : game === 'knowledge' ? '-:-' : `${theme}:${diff}`);
  const bestKey = () => `tmm-train-best:${game}:${variant()}`;
  const getBest = () => { try { return parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0; } catch (e) { return 0; } };
  const setBestVal = (v) => { try { localStorage.setItem(bestKey(), String(v)); } catch (e) {} };

  function mathQ() {
    const cfg = { easy: { add: 20, mul: 5 }, medium: { add: 50, mul: 12 }, hard: { add: 99, mul: 20 } }[diff];
    const ops = diff === 'easy' ? ['+', '−', '×'] : ['+', '−', '×', '×'];
    const op = ops[rand(0, ops.length - 1)];
    let a, b, ans;
    if (op === '×') { a = rand(2, cfg.mul); b = rand(2, cfg.mul); ans = a * b; }
    else if (op === '+') { a = rand(2, cfg.add); b = rand(2, cfg.add); ans = a + b; }
    else { a = rand(Math.floor(cfg.add / 3), cfg.add); b = rand(2, a - 1); ans = a - b; }
    const set = new Set([ans]);
    while (set.size < 4) { const d = ans + rand(-9, 9); if (d >= 0) set.add(d); }
    const choices = shuffle([...set]).map(String);
    q = { prompt: `${a} ${op} ${b}`, choices, answer: choices.indexOf(String(ans)), math: true };
  }
  function knowledgeQ() {
    const item = kpool[rand(0, kpool.length - 1)];
    const opts = shuffle(item.choices.map((t, i) => ({ t, ok: i === item.answer })));
    q = { prompt: item.q, choices: opts.map((o) => o.t), answer: opts.findIndex((o) => o.ok), math: false };
  }
  function nextMC() { if (game === 'speed') mathQ(); else knowledgeQ(); }
  function answerMC(ci) {
    if (locked) return;
    locked = true; picked = ci; attempts += 1;
    if (ci === q.answer) { correct += 1; streak += 1; if (streak > maxStreak) maxStreak = streak; } else { streak = 0; }
    setTimeout(() => { locked = false; picked = null; if (stage === 'play') nextMC(); }, game === 'knowledge' ? 600 : 240);
  }

  function memoryTiles() {
    const n = diff === 'easy' ? 4 : diff === 'medium' ? 6 : 9;
    tiles = theme === 'code' ? shuffle(CODE_TILES).slice(0, n) : shuffle(Array.from({ length: 9 }, (_, i) => String(i + 1))).slice(0, n);
  }
  const flashMs = () => ({ easy: [620, 320], medium: [460, 230], hard: [320, 150] }[diff]);
  async function playSeq() {
    const g = ++memGen; showing = true; inputPos = 0;
    await sleep(450);
    const [on, off] = flashMs();
    for (const idx of seq) { if (g !== memGen) return; activeTile = idx; await sleep(on); activeTile = -1; await sleep(off); }
    if (g !== memGen) return;
    showing = false;
  }
  function nextRound() { round += 1; seq = [...seq, rand(0, tiles.length - 1)]; playSeq(); }
  function startMemory() { memoryTiles(); seq = []; round = 0; rounds = 0; nextRound(); }
  function tapTile(i) {
    if (showing || stage !== 'play' || game !== 'memory') return;
    if (i === seq[inputPos]) {
      goodTile = i; setTimeout(() => (goodTile = -1), 150); inputPos += 1;
      if (inputPos === seq.length) { rounds = round; setTimeout(nextRound, 520); }
    } else { end('Sequence broken'); }
  }

  function newBoard() {
    const size = diff === 'easy' ? 9 : diff === 'medium' ? 16 : 25;
    let base, odd;
    if (theme === 'code') { const p = shuffle(CODE_TILES).slice(0, 2); base = p[0]; odd = p[1]; }
    else { base = String(rand(1, 9)); do { odd = String(rand(1, 9)); } while (odd === base); }
    const oddIndex = rand(0, size - 1);
    cells = Array.from({ length: size }, (_, i) => ({ label: i === oddIndex ? odd : base, odd: i === oddIndex }));
  }
  function tapCell(c) {
    if (locked || stage !== 'play') return;
    attempts += 1;
    if (c.odd) { correct += 1; streak += 1; if (streak > maxStreak) maxStreak = streak; newBoard(); }
    else { streak = 0; locked = true; setTimeout(() => (locked = false), 250); }
  }

  function start() {
    if (startDisabled) return;
    correct = 0; attempts = 0; streak = 0; maxStreak = 0; rounds = 0; newBest = false; locked = false; picked = null;
    clearInterval(timer); timer = null;
    stage = 'play';
    if (game === 'speed' || game === 'knowledge') {
      timeLeft = 60; nextMC();
      timer = setInterval(() => { timeLeft -= 1; if (timeLeft <= 0) end('Time!'); }, 1000);
    } else if (game === 'focus') {
      timeLeft = 45; newBoard();
      timer = setInterval(() => { timeLeft -= 1; if (timeLeft <= 0) end('Time!'); }, 1000);
    } else { startMemory(); }
  }
  function end(label) {
    clearInterval(timer); timer = null; memGen++; showing = false;
    endLabel = label || 'Done';
    best = getBest();
    if (headline > best) { setBestVal(headline); best = headline; newBest = true; confetti(); }
    stage = 'done';
  }
  function onKey(e) {
    if (stage !== 'play' || !(game === 'speed' || game === 'knowledge') || !q) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= q.choices.length) answerMC(n - 1);
  }

  function knowledgeBlurb() {
    if (!knowledgeEmpty) return `Questions from the guides (${kpool.length})`;
    return $beginnerMode ? 'Finish a beginner guide’s quiz first' : 'No questions yet';
  }

  $: accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  $: gridCols = cells.length === 9 ? 3 : cells.length === 16 ? 4 : 5;
  $: if (stage === 'menu') best = getBest();

  onMount(() => {
    try { const d = JSON.parse(localStorage.getItem('tmm-path-done') || '[]'); doneGuides = Array.isArray(d) ? d : []; } catch (e) {}
    best = getBest();
  });
  onDestroy(() => { clearInterval(timer); memGen++; });
</script>

<svelte:head><title>Train your brain — The Missing Manual</title></svelte:head>
<svelte:window on:keydown={onKey} />

{#if stage === 'menu'}
  <header class="tr-intro">
    <span class="eyebrow">Train</span>
    <h1>Train your brain</h1>
    <p class="tagline">Quick workouts to sharpen speed, memory, and focus — plus a knowledge round drawn from the guides. Pick a game, set the difficulty, and beat your best.</p>
  </header>

  <div class="tr-grid">
    {#each GAMES as g}
      {@const isK = g.id === 'knowledge'}
      {@const disabled = isK && knowledgeEmpty}
      <button class="tr-mode" class:on={game === g.id} disabled={disabled} on:click={() => (game = g.id)} aria-pressed={game === g.id}>
        <i class={`ti ${g.icon}`} aria-hidden="true"></i>
        <span class="tr-mode-name">{g.name}</span>
        <span class="tr-mode-blurb">{isK ? knowledgeBlurb() : g.blurb}</span>
      </button>
    {/each}
  </div>

  {#if game === 'memory' || game === 'focus'}
    <div class="tr-opt">
      <span class="tr-opt-label">Tiles</span>
      <div class="tr-seg">
        <button class:on={theme === 'numbers'} on:click={() => (theme = 'numbers')}>Numbers</button>
        <button class:on={theme === 'code'} on:click={() => (theme = 'code')}>Code</button>
      </div>
    </div>
  {/if}

  {#if game !== 'knowledge'}
    <div class="tr-opt">
      <span class="tr-opt-label">Difficulty</span>
      <div class="tr-seg">
        {#each DIFFS as d}
          <button class:on={diff === d} on:click={() => (diff = d)}>{d[0].toUpperCase() + d.slice(1)}</button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="tr-start-row">
    <button class="tr-start" disabled={startDisabled} on:click={start}>Start →</button>
    {#if startDisabled}
      <span class="tr-best">Finish a guide’s quiz to unlock Knowledge.</span>
    {:else}
      <span class="tr-best">Best: <b>{best}</b></span>
    {/if}
  </div>

{:else if stage === 'play'}
  <div class="tr-hud">
    <div class="tr-stats">
      {#if game === 'memory'}
        <span class="tr-time">Round <b>{round}</b></span>
        <span class="tr-status">{showing ? 'Watch…' : 'Your turn'}</span>
        <span class="tr-streak"><i class="ti ti-brain" aria-hidden="true"></i> {rounds}</span>
      {:else}
        <span class="tr-time" class:low={timeLeft <= 10}><i class="ti ti-clock" aria-hidden="true"></i> {timeLeft}s</span>
        <span class="tr-score">Score <b>{correct}</b></span>
        <span class="tr-streak" class:hot={streak >= 3}><i class="ti ti-flame" aria-hidden="true"></i> {streak}</span>
      {/if}
    </div>
    <button class="tr-stop" on:click={() => end('Stopped')} title="End game" aria-label="End game">
      <i class="ti ti-player-stop-filled" aria-hidden="true"></i> Stop
    </button>
  </div>

  {#if (game === 'speed' || game === 'knowledge') && q}
    <div class="tr-card">
      <p class="tr-prompt" class:math={q.math}>{q.prompt}</p>
      <div class="tr-choices" class:cols={q.math}>
        {#each q.choices as c, ci}
          <button class="tr-choice"
            class:right={locked && ci === q.answer}
            class:wrong={locked && ci === picked && ci !== q.answer}
            disabled={locked} on:click={() => answerMC(ci)}>{c}</button>
        {/each}
      </div>
    </div>
    <p class="tr-hint">Tip: press 1–{q.choices.length} to answer fast.</p>

  {:else if game === 'memory'}
    <div class="tr-card">
      <div class="tr-tiles" style={`grid-template-columns: repeat(${Math.ceil(Math.sqrt(tiles.length))}, 1fr)`}>
        {#each tiles as t, i}
          <button class="tr-tile" class:active={activeTile === i} class:good={goodTile === i}
            disabled={showing} on:click={() => tapTile(i)}>{t}</button>
        {/each}
      </div>
    </div>
    <p class="tr-hint">{showing ? 'Memorise the order…' : 'Tap the tiles in the same order.'}</p>

  {:else if game === 'focus'}
    <div class="tr-card">
      <p class="tr-sub">Tap the one that’s different</p>
      <div class="tr-cells" style={`grid-template-columns: repeat(${gridCols}, 1fr)`} class:shake={locked}>
        {#each cells as c}
          <button class="tr-cell" on:click={() => tapCell(c)}>{c.label}</button>
        {/each}
      </div>
    </div>
  {/if}

{:else}
  <header class="tr-intro">
    <span class="eyebrow">{newBest ? 'New best!' : endLabel}</span>
    <h1>{game === 'memory' ? `${rounds} rounds` : `You scored ${correct}`}</h1>
  </header>

  <div class="tr-breakdown">
    {#if game !== 'memory'}
      <div class="tr-stat"><span class="tr-stat-n">{accuracy}%</span><span class="tr-stat-l">Accuracy</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{maxStreak}</span><span class="tr-stat-l">Best streak</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{attempts}</span><span class="tr-stat-l">Answered</span></div>
    {:else}
      <div class="tr-stat"><span class="tr-stat-n">{rounds}</span><span class="tr-stat-l">Rounds cleared</span></div>
    {/if}
    <div class="tr-stat"><span class="tr-stat-n">{best}</span><span class="tr-stat-l">Personal best</span></div>
  </div>

  <div class="tr-start-row">
    <button class="tr-start" on:click={start}>Play again →</button>
    <button class="tr-link" on:click={() => (stage = 'menu')}>Back to games</button>
  </div>
{/if}

<style>
  .tr-intro { margin-bottom: 1.8rem; }
  .tr-intro h1 { margin: 0.5rem 0 0.6rem; }

  .tr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.8rem; margin-bottom: 1.4rem; }
  .tr-mode {
    display: flex; flex-direction: column; gap: 0.3rem; text-align: left; cursor: pointer;
    padding: 1.1rem 1.2rem; border: 1px solid var(--line); border-radius: 14px; background: var(--raise); color: var(--body);
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease), box-shadow 0.15s var(--ease);
  }
  .tr-mode:hover:not(:disabled) { border-color: var(--accent); }
  .tr-mode.on { border-color: var(--accent); background: var(--accent-tint); box-shadow: var(--shadow-sm); }
  .tr-mode:disabled { opacity: 0.5; cursor: not-allowed; }
  .tr-mode .ti { font-size: 22px; color: var(--accent); }
  .tr-mode-name { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--ink); }
  .tr-mode-blurb { font-size: 0.86rem; color: var(--muted); }

  .tr-opt { display: flex; align-items: center; gap: 0.9rem; margin: 0 0 1rem; }
  .tr-opt-label { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--faint); width: 80px; }
  .tr-seg { display: inline-flex; gap: 4px; background: var(--surface); padding: 4px; border-radius: 10px; }
  .tr-seg button { cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--muted); border: 0; background: none; padding: 0.35rem 0.7rem; border-radius: 8px; }
  .tr-seg button:hover { color: var(--ink); }
  .tr-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 500; }

  .tr-start-row { display: flex; align-items: center; gap: 1.2rem; margin-top: 1.4rem; }
  .tr-start { cursor: pointer; font: inherit; font-weight: 600; font-size: 1rem; background: var(--accent); color: #fff; border: 1px solid var(--accent); padding: 0.7rem 1.4rem; border-radius: 10px; transition: background 0.15s var(--ease); }
  .tr-start:hover:not(:disabled) { background: var(--accent-strong); }
  .tr-start:disabled { opacity: 0.5; cursor: not-allowed; }
  .tr-best { font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); }
  .tr-best b, .tr-score b, .tr-time b { color: var(--ink); }
  .tr-link { cursor: pointer; font: inherit; font-size: 0.92rem; color: var(--muted); background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; }
  .tr-link:hover { color: var(--ink); }

  .tr-hud { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-family: var(--font-mono); font-size: 0.95rem; color: var(--muted); padding: 0.6rem 0.9rem; border: 1px solid var(--line); border-radius: 12px; margin-bottom: 1.4rem; }
  .tr-stats { display: flex; align-items: center; gap: 1.4rem; }
  .tr-hud .ti { font-size: 16px; vertical-align: -2px; }
  .tr-time.low { color: #c0563c; font-weight: 600; }
  .tr-streak.hot { color: #e0892a; }
  .tr-status { color: var(--accent); }
  .tr-stop { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; font: inherit; font-size: 0.82rem; color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.3rem 0.7rem; }
  .tr-stop:hover { border-color: #c0563c; color: #c0563c; }
  .tr-stop .ti { font-size: 14px; }

  .tr-card { border: 1px solid var(--line); border-radius: 16px; background: var(--raise); padding: 1.8rem 1.4rem; }
  .tr-sub { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--faint); margin: 0 0 1rem; text-align: center; }
  .tr-prompt { font-size: 1.1rem; line-height: 1.5; color: var(--ink); margin: 0 0 1.3rem; }
  .tr-prompt.math { font-family: var(--font-mono); font-size: clamp(2rem, 7vw, 3rem); font-weight: 600; text-align: center; }
  .tr-choices { display: flex; flex-direction: column; gap: 0.6rem; }
  .tr-choices.cols { display: grid; grid-template-columns: 1fr 1fr; }
  .tr-choice { cursor: pointer; font: inherit; font-size: 1.02rem; color: var(--ink); border: 1px solid var(--line); background: var(--bg); border-radius: 11px; padding: 0.8rem 1rem; text-align: left; transition: border-color 0.12s var(--ease), background 0.12s var(--ease); }
  .tr-choice:not(:disabled):hover { border-color: var(--accent); }
  .tr-choice.right { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); }
  .tr-choice.wrong { border-color: #c0563c; background: color-mix(in srgb, #c0563c 16%, var(--raise)); }

  .tr-tiles { display: grid; gap: 0.6rem; max-width: 340px; margin: 0 auto; }
  .tr-tile { aspect-ratio: 1; cursor: pointer; font: inherit; font-family: var(--font-mono); font-size: 1.1rem; font-weight: 600; color: var(--ink); border: 1px solid var(--line); background: var(--bg); border-radius: 12px; transition: background 0.1s var(--ease), border-color 0.1s var(--ease), transform 0.08s var(--ease); }
  .tr-tile:not(:disabled):hover { border-color: var(--accent); }
  .tr-tile.active { background: var(--accent); border-color: var(--accent); color: #fff; transform: scale(1.04); }
  .tr-tile.good { background: color-mix(in srgb, #2e9e6b 22%, var(--raise)); border-color: #2e9e6b; }

  .tr-cells { display: grid; gap: 0.5rem; max-width: 420px; margin: 0 auto; }
  .tr-cells.shake { animation: tr-shake 0.25s; }
  .tr-cell { aspect-ratio: 1; cursor: pointer; font: inherit; font-family: var(--font-mono); font-size: 1.05rem; font-weight: 600; color: var(--ink); border: 1px solid var(--line); background: var(--bg); border-radius: 10px; transition: border-color 0.12s var(--ease), background 0.12s var(--ease); }
  .tr-cell:hover { border-color: var(--accent); background: var(--surface); }
  @keyframes tr-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }

  .tr-breakdown { display: flex; flex-wrap: wrap; gap: 0.8rem; margin: 0 0 1.6rem; }
  .tr-stat { flex: 1; min-width: 90px; border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1rem; background: var(--raise); display: flex; flex-direction: column; gap: 0.2rem; }
  .tr-stat-n { font-family: var(--font-display); font-weight: 700; font-size: 1.4rem; color: var(--ink); }
  .tr-stat-l { font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }

  .tr-hint { margin: 1rem 0 0; font-size: 0.82rem; color: var(--faint); text-align: center; }
</style>
