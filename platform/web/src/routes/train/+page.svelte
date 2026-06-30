<script>
  import { onMount, onDestroy } from 'svelte';
  import { confetti } from '$lib/confetti.js';
  import { QUIZZES } from '$lib/quizzes.js';
  import { beginnerMode } from '$lib/beginner-store.js';
  import { rand, shuffle, makeMath, makeSequence, makePattern, makeRotation, challengeScore } from '$lib/games.js';
  import { makeWordSearch, WS_PACKS } from '$lib/wordsearch.js';

  export let data;
  $: beginnerSlugs = data?.beginnerSlugs ?? [];

  // Every quiz question, tagged with its guide slug.
  const QUIZ_ENTRIES = Object.entries(QUIZZES).flatMap(([k, arr]) => arr.map((o) => ({ ...o, guide: k.split('/')[0] })));

  // Each game names the cognitive skill it trains (shown to the reader; honest, not a clinical claim).
  const GAMES = [
    { id: 'speed', name: 'Speed', blurb: 'Mental math against the clock', icon: 'ti-bolt', skill: 'Processing speed' },
    { id: 'sequence', name: 'Sequences', blurb: 'What comes next in the pattern?', icon: 'ti-arrow-narrow-right', skill: 'Inductive reasoning' },
    { id: 'pattern', name: 'Patterns', blurb: 'Complete the visual grid', icon: 'ti-grid-dots', skill: 'Fluid reasoning' },
    { id: 'rotation', name: 'Rotation', blurb: 'Find the same shape, rotated', icon: 'ti-rotate', skill: 'Spatial reasoning' },
    { id: 'nback', name: 'N-Back', blurb: 'The working-memory classic', icon: 'ti-stack-2', skill: 'Working memory' },
    { id: 'memory', name: 'Memory', blurb: 'Repeat the flashed sequence', icon: 'ti-brain', skill: 'Short-term memory' },
    { id: 'focus', name: 'Focus', blurb: 'Spot the one that’s different', icon: 'ti-eye', skill: 'Attention' },
    { id: 'wordsearch', name: 'Word Search', blurb: 'Find the hidden dev terms', icon: 'ti-search', skill: 'Vocabulary & scanning' },
    { id: 'knowledge', name: 'Knowledge', blurb: '', icon: 'ti-bulb', skill: 'Recall' }
  ];
  // Games whose difficulty adapts to you (no manual difficulty picker).
  const ADAPTIVE = ['sequence', 'pattern', 'rotation', 'nback'];
  // Games answered as multiple choice (share one card + keyboard shortcuts).
  const MC = ['speed', 'knowledge', 'sequence', 'pattern', 'rotation'];
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
  let level = 2; // adaptive difficulty for reasoning/working-memory games
  $: headline = game === 'memory' ? rounds : correct;

  let timer = null, timeLeft = 0, locked = false, picked = null;
  let q = null;
  let tiles = [], seq = [], inputPos = 0, activeTile = -1, goodTile = -1, showing = false, round = 0, memGen = 0;
  let cells = [];

  // N-back state
  let nbStream = [], nbStep = 0, nbN = 2, nbActive = -1, nbHits = 0, nbMiss = 0, nbFalse = 0, nbResponded = false, nbGen = 0, nbRunning = false;

  // Brain Challenge state
  let chQueue = [], chIdx = 0, chResults = [], chScore = 0, chBand = '', chDomain = '', chPerSkill = [];

  // Word Search state
  let wsPack = 'git';
  let ws = null, wsFound = new Set(), wsFoundCells = new Set(), wsSel = [], wsStart = null, wsElapsed = 0, wsBestTime = 0;
  $: wsPackName = (WS_PACKS.find((p) => p.id === wsPack) || {}).name || '';
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Knowledge pool: full set normally; in beginner mode, only beginner-level
  // guides the user has actually finished (2 checks). Drives the card + game.
  $: kpool = $beginnerMode
    ? QUIZ_ENTRIES.filter((e) => beginnerSlugs.includes(e.guide) && doneGuides.includes(e.guide))
    : QUIZ_ENTRIES;
  $: knowledgeEmpty = kpool.length === 0;
  $: startDisabled = game === 'knowledge' && knowledgeEmpty;

  const usesDiff = (g) => g === 'speed' || g === 'memory' || g === 'focus';
  const variant = () => (usesDiff(game) ? `${game === 'speed' ? '-' : theme}:${diff}` : '-:-');
  const bestKey = () => `tmm-train-best:${game}:${variant()}`;
  const getBest = () => { try { return parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0; } catch (e) { return 0; } };
  const setBestVal = (v) => { try { localStorage.setItem(bestKey(), String(v)); } catch (e) {} };

  // ---- Question generators ----
  // The reasoning generators (math/sequence/pattern/rotation) live in $lib/games.js
  // so they can be unit-checked headless; this file owns the stateful games.
  function knowledgeQ() {
    const item = kpool[rand(0, kpool.length - 1)];
    const opts = shuffle(item.choices.map((t, i) => ({ t, ok: i === item.answer })));
    q = { prompt: item.q, choices: opts.map((o) => o.t), answer: opts.findIndex((o) => o.ok) };
  }
  function genFor(g) {
    if (g === 'speed') q = makeMath(diff);
    else if (g === 'knowledge') knowledgeQ();
    else if (g === 'sequence') q = makeSequence(level);
    else if (g === 'pattern') q = makePattern(level);
    else if (g === 'rotation') q = makeRotation(level);
  }
  function nextMC() { genFor(game); }
  function answerMC(ci) {
    if (locked) return;
    locked = true; picked = ci; attempts += 1;
    const ok = ci === q.answer;
    if (ok) {
      correct += 1; streak += 1; if (streak > maxStreak) maxStreak = streak;
      if (ADAPTIVE.includes(game) && streak % 3 === 0) level = Math.min(8, level + 1);
    } else {
      streak = 0;
      if (ADAPTIVE.includes(game)) level = Math.max(1, level - 1);
    }
    const delay = game === 'knowledge' ? 600 : q.svg ? 420 : 260;
    setTimeout(() => { locked = false; picked = null; if (stage === 'play') nextMC(); }, delay);
  }

  // ---- Memory ----
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

  // ---- Focus ----
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

  // ---- N-back ----
  function startNback() {
    nbN = Math.min(4, Math.max(2, level));
    nbStream = []; nbStep = 0; nbHits = 0; nbMiss = 0; nbFalse = 0; correct = 0; attempts = 0; nbActive = -1;
    const len = 22 + nbN * 2;
    for (let i = 0; i < len; i++) {
      if (i >= nbN && Math.random() < 0.32) nbStream.push(nbStream[i - nbN]);
      else { let v = rand(0, 8); if (i >= nbN && v === nbStream[i - nbN]) v = (v + 1) % 9; nbStream.push(v); }
    }
    runNback();
  }
  async function runNback() {
    const g = ++nbGen; nbRunning = true;
    await sleep(700);
    for (nbStep = 0; nbStep < nbStream.length; nbStep++) {
      if (g !== nbGen) return;
      nbResponded = false; nbActive = nbStream[nbStep];
      const isMatch = nbStep >= nbN && nbStream[nbStep] === nbStream[nbStep - nbN];
      await sleep(700); if (g !== nbGen) return;
      nbActive = -1;
      await sleep(1500); if (g !== nbGen) return;
      if (isMatch && !nbResponded) nbMiss += 1;
    }
    nbRunning = false;
    correct = nbHits; attempts = nbHits + nbMiss + nbFalse;
    if (nbHits >= nbStream.length * 0.25 && nbFalse <= 2) { /* did well — could bump next time */ }
    end('Stream complete');
  }
  function nbMatch() {
    if (stage !== 'play' || game !== 'nback' || nbStep < 0 || nbResponded || !nbRunning) return;
    nbResponded = true;
    const isMatch = nbStep >= nbN && nbStream[nbStep] === nbStream[nbStep - nbN];
    if (isMatch) { nbHits += 1; correct = nbHits; } else { nbFalse += 1; }
  }

  // ---- Brain Challenge (honest self-benchmark, not a clinical IQ) ----
  const CH_DOMAINS = [
    { id: 'sequence', gen: () => makeSequence(level), label: 'Inductive reasoning' },
    { id: 'pattern', gen: () => makePattern(level), label: 'Fluid reasoning' },
    { id: 'rotation', gen: () => makeRotation(level), label: 'Spatial reasoning' },
    { id: 'speed', gen: () => makeMath(diff), label: 'Processing speed' }
  ];
  function startChallenge() {
    level = 3; diff = 'medium';
    chResults = []; chIdx = 0; correct = 0; attempts = 0; locked = false; picked = null;
    let queue = [];
    for (let i = 0; i < 3; i++) for (const d of CH_DOMAINS) queue.push(d);
    chQueue = shuffle(queue);
    stage = 'play'; game = 'challenge';
    chNextQ();
  }
  function chNextQ() {
    if (chIdx >= chQueue.length) { endChallenge(); return; }
    const d = chQueue[chIdx];
    q = d.gen();
    q.startedAt = Date.now();
    chDomain = d.label;
  }
  function answerChallenge(ci) {
    if (locked) return;
    locked = true; picked = ci; attempts += 1;
    const d = chQueue[chIdx];
    const ok = ci === q.answer;
    if (ok) correct += 1;
    chResults = [...chResults, { id: d.id, label: d.label, ok, ms: Date.now() - q.startedAt }];
    setTimeout(() => { locked = false; picked = null; chIdx += 1; chNextQ(); }, 480);
  }
  function endChallenge() {
    const sb = challengeScore(chResults);
    chScore = sb.score; chBand = sb.band;
    const byLabel = {};
    for (const d of CH_DOMAINS) byLabel[d.label] = { right: 0, total: 0 };
    for (const r of chResults) { byLabel[r.label].total += 1; if (r.ok) byLabel[r.label].right += 1; }
    chPerSkill = CH_DOMAINS.map((d) => ({ label: d.label, pct: byLabel[d.label].total ? Math.round((byLabel[d.label].right / byLabel[d.label].total) * 100) : 0 }));
    try {
      const k = 'tmm-train-best:challenge';
      const prev = parseInt(localStorage.getItem(k) || '0', 10) || 0;
      newBest = chScore > prev;
      if (newBest) { localStorage.setItem(k, String(chScore)); confetti(); }
      best = Math.max(prev, chScore);
    } catch (e) {}
    stage = 'challengeDone';
  }

  // ---- Word Search ----
  function startWordSearch() {
    const pack = WS_PACKS.find((p) => p.id === wsPack) || WS_PACKS[0];
    ws = makeWordSearch(pack.words, 12);
    wsFound = new Set(); wsFoundCells = new Set(); wsSel = []; wsStart = null; wsElapsed = 0; newBest = false;
    timer = setInterval(() => { wsElapsed += 1; }, 1000);
  }
  const wsRC = (k) => ({ r: Math.floor(k / ws.size), c: k % ws.size });
  function wsCellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.dataset && el.dataset.ws != null ? +el.dataset.ws : null;
  }
  function wsLine(a, b) {
    const aligned = a.r === b.r || a.c === b.c || Math.abs(b.r - a.r) === Math.abs(b.c - a.c);
    if (!aligned) return [a.r * ws.size + a.c];
    const dr = Math.sign(b.r - a.r), dc = Math.sign(b.c - a.c);
    const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c)) + 1;
    const cells = [];
    for (let i = 0; i < len; i++) cells.push((a.r + dr * i) * ws.size + (a.c + dc * i));
    return cells;
  }
  function wsDown(e) {
    if (!ws) return;
    const k = wsCellAt(e.clientX, e.clientY);
    if (k == null) return;
    e.preventDefault();
    wsStart = wsRC(k); wsSel = [k];
  }
  function wsMove(e) {
    if (!wsStart) return;
    const k = wsCellAt(e.clientX, e.clientY);
    if (k == null) return;
    wsSel = wsLine(wsStart, wsRC(k));
  }
  function wsRelease() {
    if (!wsStart) return;
    if (wsSel.length > 1) wsCheck();
    wsStart = null; wsSel = [];
  }
  function wsCheck() {
    const letters = wsSel.map((k) => ws.grid[k]).join('');
    const rev = [...letters].reverse().join('');
    const hit = ws.words.find((w) => !wsFound.has(w) && (w === letters || w === rev));
    if (!hit) return;
    wsFound = new Set([...wsFound, hit]);
    wsSel.forEach((k) => wsFoundCells.add(k));
    wsFoundCells = new Set(wsFoundCells);
    if (wsFound.size === ws.words.length) wsWin();
  }
  function wsReveal() {
    ws.placements.forEach((p) => { wsFound.add(p.word); p.cells.forEach((k) => wsFoundCells.add(k)); });
    wsFound = new Set(wsFound); wsFoundCells = new Set(wsFoundCells);
    clearInterval(timer); timer = null;
  }
  function wsWin() {
    clearInterval(timer); timer = null; confetti();
    try {
      const key = `tmm-train-best:wordsearch:${wsPack}`;
      const prev = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      newBest = prev === 0 || wsElapsed < prev;
      if (newBest) localStorage.setItem(key, String(wsElapsed));
      wsBestTime = newBest ? wsElapsed : prev;
    } catch (e) { wsBestTime = wsElapsed; }
    stage = 'wordsearchDone';
  }

  // ---- Lifecycle ----
  function start() {
    if (startDisabled) return;
    correct = 0; attempts = 0; streak = 0; maxStreak = 0; rounds = 0; newBest = false; locked = false; picked = null;
    if (ADAPTIVE.includes(game)) level = 2;
    clearInterval(timer); timer = null; memGen++; nbGen++;
    stage = 'play';
    if (MC.includes(game)) {
      timeLeft = 60; nextMC();
      timer = setInterval(() => { timeLeft -= 1; if (timeLeft <= 0) end('Time!'); }, 1000);
    } else if (game === 'focus') {
      timeLeft = 45; newBoard();
      timer = setInterval(() => { timeLeft -= 1; if (timeLeft <= 0) end('Time!'); }, 1000);
    } else if (game === 'nback') {
      startNback();
    } else if (game === 'wordsearch') {
      startWordSearch();
    } else { startMemory(); }
  }
  function end(label) {
    clearInterval(timer); timer = null; memGen++; nbGen++; showing = false; nbRunning = false; nbActive = -1;
    endLabel = label || 'Done';
    best = getBest();
    if (headline > best) { setBestVal(headline); best = headline; newBest = true; confetti(); }
    stage = 'done';
  }
  function quit() {
    clearInterval(timer); timer = null; memGen++; nbGen++; nbRunning = false;
    stage = 'menu'; game = 'speed';
  }
  function onKey(e) {
    if (stage !== 'play') return;
    if (game === 'nback') { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); nbMatch(); } return; }
    if (!q || !q.choices) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= q.choices.length) (game === 'challenge' ? answerChallenge : answerMC)(n - 1);
  }

  function knowledgeBlurb() {
    if (!knowledgeEmpty) return `Questions from the guides (${kpool.length})`;
    return $beginnerMode ? 'Finish a beginner guide’s quiz first' : 'No questions yet';
  }

  $: accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  $: gridCols = cells.length === 9 ? 3 : cells.length === 16 ? 4 : 5;
  $: activeSkill = (GAMES.find((g) => g.id === game) || {}).skill || '';
  $: if (stage === 'menu') best = getBest();

  onMount(() => {
    try { const d = JSON.parse(localStorage.getItem('tmm-path-done') || '[]'); doneGuides = Array.isArray(d) ? d : []; } catch (e) {}
    best = getBest();
  });
  onDestroy(() => { clearInterval(timer); memGen++; nbGen++; });
</script>

<svelte:head><title>Train your brain — The Missing Manual</title></svelte:head>
<svelte:window on:keydown={onKey} on:pointerup={wsRelease} />

{#if stage === 'menu'}
  <header class="tr-intro">
    <span class="eyebrow">Train</span>
    <h1>Train your brain</h1>
    <p class="tagline">Quick, adaptive workouts for the skills under clear thinking — reasoning, working memory, spatial sense, speed, and recall. Pick a game and beat your best, or take the Brain Challenge for a score.</p>
  </header>

  <button class="tr-challenge" on:click={startChallenge}>
    <span class="tr-ch-icon"><i class="ti ti-target-arrow" aria-hidden="true"></i></span>
    <span class="tr-ch-text">
      <span class="tr-ch-title">Brain Challenge</span>
      <span class="tr-ch-blurb">A 12-round mix across four reasoning skills → your Brain Score and a per-skill breakdown.</span>
    </span>
    <span class="tr-ch-go" aria-hidden="true">→</span>
  </button>

  <div class="tr-grid">
    {#each GAMES as g}
      {@const isK = g.id === 'knowledge'}
      {@const disabled = isK && knowledgeEmpty}
      <button class="tr-mode" class:on={game === g.id} disabled={disabled} on:click={() => (game = g.id)} aria-pressed={game === g.id}>
        <i class={`ti ${g.icon}`} aria-hidden="true"></i>
        <span class="tr-mode-name">{g.name}</span>
        <span class="tr-mode-blurb">{isK ? knowledgeBlurb() : g.blurb}</span>
        <span class="tr-mode-skill">{g.skill}</span>
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

  {#if game === 'wordsearch'}
    <div class="tr-opt">
      <span class="tr-opt-label">Topic</span>
      <div class="tr-seg tr-seg-wrap">
        {#each WS_PACKS as p}
          <button class:on={wsPack === p.id} on:click={() => (wsPack = p.id)}>{p.name}</button>
        {/each}
      </div>
    </div>
  {/if}

  {#if usesDiff(game)}
    <div class="tr-opt">
      <span class="tr-opt-label">Difficulty</span>
      <div class="tr-seg">
        {#each DIFFS as d}
          <button class:on={diff === d} on:click={() => (diff = d)}>{d[0].toUpperCase() + d.slice(1)}</button>
        {/each}
      </div>
    </div>
  {:else if ADAPTIVE.includes(game)}
    <div class="tr-opt">
      <span class="tr-opt-label">Difficulty</span>
      <span class="tr-adaptive"><i class="ti ti-trending-up" aria-hidden="true"></i> Adapts to you — it ramps up as you get them right.</span>
    </div>
  {/if}

  <div class="tr-start-row">
    <button class="tr-start" disabled={startDisabled} on:click={start}>Start →</button>
    {#if startDisabled}
      <span class="tr-best">Finish a guide’s quiz to unlock Knowledge.</span>
    {:else if game === 'wordsearch'}
      <span class="tr-best">Find every term — beat your best time.</span>
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
      {:else if game === 'nback'}
        <span class="tr-time">{Math.min(nbStep + 1, nbStream.length)}/{nbStream.length}</span>
        <span class="tr-status">{nbN}-back</span>
        <span class="tr-streak"><i class="ti ti-check" aria-hidden="true"></i> {nbHits}</span>
      {:else if game === 'challenge'}
        <span class="tr-time">{Math.min(chIdx + 1, chQueue.length)}/{chQueue.length}</span>
        <span class="tr-status">{chDomain}</span>
        <span class="tr-score">Score <b>{correct}</b></span>
      {:else if game === 'wordsearch'}
        <span class="tr-time"><i class="ti ti-clock" aria-hidden="true"></i> {fmtTime(wsElapsed)}</span>
        <span class="tr-status">{wsPackName}</span>
        <span class="tr-score">Found <b>{wsFound.size}/{ws ? ws.words.length : 0}</b></span>
      {:else}
        <span class="tr-time" class:low={timeLeft <= 10}><i class="ti ti-clock" aria-hidden="true"></i> {timeLeft}s</span>
        <span class="tr-score">Score <b>{correct}</b></span>
        {#if ADAPTIVE.includes(game)}
          <span class="tr-status">Lv {level}</span>
        {:else}
          <span class="tr-streak" class:hot={streak >= 3}><i class="ti ti-flame" aria-hidden="true"></i> {streak}</span>
        {/if}
      {/if}
    </div>
    <button class="tr-stop" on:click={() => (game === 'challenge' ? endChallenge() : game === 'wordsearch' ? quit() : end('Stopped'))} title="End game" aria-label="End game">
      <i class="ti ti-player-stop-filled" aria-hidden="true"></i> Stop
    </button>
  </div>

  {#if (MC.includes(game) || game === 'challenge') && q}
    <div class="tr-card">
      {#if q.promptSvg}
        <div class="tr-prompt-svg">{@html q.promptSvg}</div>
      {:else}
        <p class="tr-prompt" class:big={q.big} class:mono={q.mono}>{q.prompt}</p>
      {/if}
      <div class="tr-choices" class:cols={q.cols} class:svg={q.svg}>
        {#each q.choices as c, ci}
          <button class="tr-choice" class:svg={q.svg}
            class:right={locked && ci === q.answer}
            class:wrong={locked && ci === picked && ci !== q.answer}
            disabled={locked} on:click={() => (game === 'challenge' ? answerChallenge : answerMC)(ci)}>
            {#if q.svg}{@html c}{:else}{c}{/if}
          </button>
        {/each}
      </div>
    </div>
    <p class="tr-hint">{q.hint ? q.hint : `Tip: press 1–${q.choices.length} to answer fast.`}</p>

  {:else if game === 'nback'}
    <div class="tr-card">
      <p class="tr-sub">Press MATCH (or Space) when the square is in the same spot as {nbN} step{nbN > 1 ? 's' : ''} ago</p>
      <div class="tr-nb-grid">
        {#each Array(9) as _, i}
          <div class="tr-nb-cell" class:on={nbActive === i}></div>
        {/each}
      </div>
      <button class="tr-nb-btn" on:click={nbMatch} disabled={nbResponded}>MATCH</button>
    </div>
    <p class="tr-hint">Hits {nbHits} · misses {nbMiss} · false alarms {nbFalse}</p>

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

  {:else if game === 'wordsearch' && ws}
    <div class="tr-card">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="ws-grid" style={`grid-template-columns: repeat(${ws.size}, 1fr)`}
        on:pointerdown={wsDown} on:pointermove={wsMove}>
        {#each ws.grid as ch, k}
          <div class="ws-cell" data-ws={k} class:sel={wsSel.includes(k)} class:found={wsFoundCells.has(k)}>{ch}</div>
        {/each}
      </div>
    </div>
    <div class="ws-words">
      {#each ws.words as w}
        <span class="ws-word" class:done={wsFound.has(w)}>{w}</span>
      {/each}
    </div>
    <p class="tr-hint">Drag across letters in any direction — backwards and diagonally count. <button class="tr-link" on:click={wsReveal}>Reveal answers</button></p>
  {/if}

{:else if stage === 'wordsearchDone'}
  <header class="tr-intro">
    <span class="eyebrow">{newBest ? 'New best!' : 'Solved'}</span>
    <h1>All {ws ? ws.words.length : 0} found</h1>
    <p class="tagline">{wsPackName} · finished in {fmtTime(wsElapsed)}.</p>
  </header>

  <div class="tr-breakdown">
    <div class="tr-stat"><span class="tr-stat-n">{fmtTime(wsElapsed)}</span><span class="tr-stat-l">Your time</span></div>
    <div class="tr-stat"><span class="tr-stat-n">{fmtTime(wsBestTime)}</span><span class="tr-stat-l">Best time</span></div>
  </div>

  <div class="tr-start-row">
    <button class="tr-start" on:click={start}>Play again →</button>
    <button class="tr-link" on:click={quit}>Back to games</button>
  </div>

{:else if stage === 'challengeDone'}
  <header class="tr-intro">
    <span class="eyebrow">{newBest ? 'New best!' : 'Brain Challenge'}</span>
    <h1>Brain Score: {chScore}</h1>
    <p class="tagline">{chBand} — {correct} of {chResults.length} correct.</p>
  </header>

  <div class="tr-skills">
    {#each chPerSkill as s}
      <div class="tr-skill">
        <div class="tr-skill-top"><span>{s.label}</span><b>{s.pct}%</b></div>
        <div class="tr-bar"><span class="tr-bar-fill" style={`width:${s.pct}%`}></span></div>
      </div>
    {/each}
  </div>

  <p class="tr-disclaimer">
    <i class="ti ti-info-circle" aria-hidden="true"></i>
    This is a self-benchmark for fun and practice — <b>not a clinical IQ test</b>. A real IQ score needs a
    professionally administered, age-normed assessment. And brain-training mostly sharpens the trained skill;
    transfer to general intelligence is debated. Train because it’s fun and useful, not to chase a number.
  </p>

  <div class="tr-start-row">
    <button class="tr-start" on:click={startChallenge}>Try again →</button>
    <button class="tr-link" on:click={quit}>Back to games</button>
  </div>

{:else}
  <header class="tr-intro">
    <span class="eyebrow">{newBest ? 'New best!' : endLabel}</span>
    <h1>{game === 'memory' ? `${rounds} rounds` : game === 'nback' ? `${nbHits} hits` : `You scored ${correct}`}</h1>
    {#if activeSkill}<p class="tagline">Trained: {activeSkill}.</p>{/if}
  </header>

  <div class="tr-breakdown">
    {#if game === 'memory'}
      <div class="tr-stat"><span class="tr-stat-n">{rounds}</span><span class="tr-stat-l">Rounds cleared</span></div>
    {:else if game === 'nback'}
      <div class="tr-stat"><span class="tr-stat-n">{nbHits}</span><span class="tr-stat-l">Hits</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{nbMiss}</span><span class="tr-stat-l">Misses</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{nbFalse}</span><span class="tr-stat-l">False alarms</span></div>
    {:else}
      <div class="tr-stat"><span class="tr-stat-n">{accuracy}%</span><span class="tr-stat-l">Accuracy</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{maxStreak}</span><span class="tr-stat-l">Best streak</span></div>
      <div class="tr-stat"><span class="tr-stat-n">{attempts}</span><span class="tr-stat-l">Answered</span></div>
    {/if}
    <div class="tr-stat"><span class="tr-stat-n">{best}</span><span class="tr-stat-l">Personal best</span></div>
  </div>

  <div class="tr-start-row">
    <button class="tr-start" on:click={start}>Play again →</button>
    <button class="tr-link" on:click={quit}>Back to games</button>
  </div>
{/if}

<style>
  .tr-intro { margin-bottom: 1.8rem; }
  .tr-intro h1 { margin: 0.5rem 0 0.6rem; }

  .tr-challenge {
    display: flex; align-items: center; gap: 1rem; width: 100%; text-align: left; cursor: pointer;
    padding: 1.1rem 1.3rem; margin-bottom: 1.4rem; border: 1px solid var(--accent); border-radius: 16px;
    background: var(--accent-tint); color: var(--body);
    transition: box-shadow 0.15s var(--ease), transform 0.15s var(--ease);
  }
  .tr-challenge:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .tr-ch-icon { flex: none; display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; background: var(--accent); }
  .tr-ch-icon .ti { font-size: 26px; color: #fff; }
  .tr-ch-text { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .tr-ch-title { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; color: var(--ink); }
  .tr-ch-blurb { font-size: 0.88rem; color: var(--muted); }
  .tr-ch-go { margin-left: auto; flex: none; color: var(--accent); font-size: 1.3rem; }

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
  .tr-mode-skill { font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--faint); margin-top: 0.2rem; }

  .tr-opt { display: flex; align-items: center; gap: 0.9rem; margin: 0 0 1rem; }
  .tr-opt-label { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--faint); width: 80px; }
  .tr-seg { display: inline-flex; gap: 4px; background: var(--surface); padding: 4px; border-radius: 10px; }
  .tr-seg button { cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--muted); border: 0; background: none; padding: 0.35rem 0.7rem; border-radius: 8px; }
  .tr-seg button:hover { color: var(--ink); }
  .tr-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 500; }
  .tr-adaptive { font-size: 0.85rem; color: var(--muted); display: inline-flex; align-items: center; gap: 0.4rem; }
  .tr-adaptive .ti { color: var(--accent); font-size: 16px; }

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
  .tr-prompt.big { font-family: var(--font-mono); font-size: clamp(2rem, 7vw, 3rem); font-weight: 600; text-align: center; }
  .tr-prompt.mono { font-family: var(--font-mono); font-size: clamp(1.1rem, 4vw, 1.6rem); font-weight: 600; text-align: center; letter-spacing: 0.02em; }
  .tr-choices { display: flex; flex-direction: column; gap: 0.6rem; }
  .tr-choices.cols { display: grid; grid-template-columns: 1fr 1fr; }
  .tr-choices.svg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.7rem; max-width: 360px; margin: 0 auto; }
  .tr-choice { cursor: pointer; font: inherit; font-size: 1.02rem; color: var(--ink); border: 1px solid var(--line); background: var(--bg); border-radius: 11px; padding: 0.8rem 1rem; text-align: left; transition: border-color 0.12s var(--ease), background 0.12s var(--ease); }
  .tr-choice:not(:disabled):hover { border-color: var(--accent); }
  .tr-choice.svg { display: grid; place-items: center; padding: 0.6rem; aspect-ratio: 1.4; color: var(--ink); }
  .tr-choice.right { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); }
  .tr-choice.wrong { border-color: #c0563c; background: color-mix(in srgb, #c0563c 16%, var(--raise)); }

  .tr-prompt-svg { display: flex; justify-content: center; margin: 0 0 1.4rem; color: var(--ink); }
  /* These elements are injected via {@html}, so Svelte's scoping never tags
     them — the selectors must be :global() or the styles silently don't apply. */
  :global(.tr-svg) { width: 100%; height: 100%; display: block; }
  .tr-choice.svg :global(.tr-svg) { width: 60px; height: 60px; }
  :global(.tr-mx) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: min(300px, 88%); margin: 0 auto; padding: 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); }
  :global(.tr-mx-cell) { aspect-ratio: 1; display: grid; place-items: center; border-radius: 8px; background: var(--surface); }
  :global(.tr-mx-cell .tr-svg) { width: 74%; height: 74%; }
  :global(.tr-mx-q) { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--accent); }
  :global(.tr-rot-target) { display: grid; place-items: center; width: 104px; height: 104px; border: 1px solid var(--accent); border-radius: 14px; background: var(--accent-tint); }
  :global(.tr-rot-target .tr-svg) { width: 76px; height: 76px; }

  .tr-nb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; max-width: 280px; margin: 0 auto 1.2rem; }
  .tr-nb-cell { aspect-ratio: 1; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); transition: background 0.08s var(--ease), transform 0.08s var(--ease); }
  .tr-nb-cell.on { background: var(--accent); border-color: var(--accent); transform: scale(1.04); }
  .tr-nb-btn { display: block; width: min(280px, 100%); margin: 0 auto; cursor: pointer; font: inherit; font-weight: 700; letter-spacing: 0.06em; font-size: 1rem; color: #fff; background: var(--accent); border: 1px solid var(--accent); border-radius: 12px; padding: 0.9rem; transition: background 0.12s var(--ease); }
  .tr-nb-btn:hover:not(:disabled) { background: var(--accent-strong); }
  .tr-nb-btn:disabled { opacity: 0.45; cursor: default; }

  .tr-seg-wrap { flex-wrap: wrap; }
  .ws-grid { display: grid; gap: 3px; width: min(460px, 100%); margin: 0 auto; touch-action: none; user-select: none; }
  .ws-cell { aspect-ratio: 1; display: grid; place-items: center; font-family: var(--font-mono); font-size: clamp(0.65rem, 2.3vw, 0.95rem); font-weight: 600; color: var(--body); background: var(--bg); border: 1px solid var(--line); border-radius: 5px; cursor: pointer; }
  .ws-cell.found { background: color-mix(in srgb, #2e9e6b 22%, var(--raise)); border-color: #2e9e6b; color: var(--ink); }
  .ws-cell.sel { background: var(--accent); border-color: var(--accent); color: #fff; }
  .ws-words { display: flex; flex-wrap: wrap; gap: 0.45rem; justify-content: center; margin: 1.2rem auto 0; max-width: 560px; }
  .ws-word { font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.03em; color: var(--body); background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 0.25rem 0.7rem; }
  .ws-word.done { color: var(--faint); text-decoration: line-through; opacity: 0.6; border-color: transparent; background: transparent; }

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

  .tr-skills { display: flex; flex-direction: column; gap: 0.8rem; margin: 0 0 1.4rem; }
  .tr-skill-top { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--body); margin-bottom: 0.3rem; }
  .tr-skill-top b { color: var(--ink); font-family: var(--font-mono); }
  .tr-bar { height: 8px; border-radius: 999px; background: var(--surface); overflow: hidden; }
  .tr-bar-fill { display: block; height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.4s var(--ease); }
  .tr-disclaimer { font-size: 0.85rem; line-height: 1.6; color: var(--muted); border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1.1rem; background: var(--surface); margin: 0 0 1.4rem; }
  .tr-disclaimer .ti { color: var(--accent); vertical-align: -2px; margin-right: 0.3rem; }

  .tr-hint { margin: 1rem 0 0; font-size: 0.82rem; color: var(--faint); text-align: center; }
</style>
