<script>
  import { onMount } from 'svelte';
  import { allCards, loadState, saveState, dueQueue, schedule } from '$lib/srs.js';
  import { confetti } from '$lib/confetti.js';
  import { recordActivity, getStreak } from '$lib/streaks.js';
  import ComebackOptIn from '$lib/ComebackOptIn.svelte';
  import Seo from '$lib/Seo.svelte';

  let streak = { current: 0, longest: 0 };

  let stage = 'loading'; // loading | empty | review | done
  let cards = [], state = {}, queue = [], idx = 0, initialLen = 0, reviewed = 0;
  let card = null;
  let revealed = false;
  let qChoices = [];
  let qPicked = null;

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  $: qCorrect = qPicked != null && qChoices[qPicked] && qChoices[qPicked].correct;

  function setCard(i) {
    idx = i;
    card = queue[i];
    revealed = false;
    qPicked = null;
    qChoices = card && card.type === 'quiz'
      ? shuffle(card.q.choices.map((t, j) => ({ text: t, correct: j === card.q.answer })))
      : [];
  }
  function grade(g) {
    state[card.id] = schedule(state[card.id], g);
    saveState(state);
    reviewed += 1;
    streak = recordActivity();
    if (g === 'again') queue.push(card);
    advance();
  }
  function advance() {
    const ni = idx + 1;
    if (ni >= queue.length) finish();
    else setCard(ni);
  }
  function finish() {
    stage = 'done';
    if (reviewed > 0) confetti({ count: 90 });
  }

  onMount(() => {
    streak = getStreak();
    cards = allCards();
    // Optional ?guides=a,b,c scopes the session to one topic's chapters.
    try {
      const g = new URLSearchParams(location.search).get('guides');
      if (g) {
        const set = new Set(g.split(',').filter(Boolean));
        cards = cards.filter((c) => set.has(c.guide));
      }
    } catch (e) {}
    state = loadState();
    queue = dueQueue(cards, state);
    initialLen = queue.length;
    if (!queue.length) { stage = 'empty'; return; }
    stage = 'review';
    setCard(0);
  });
</script>

<Seo
  title="Review - The Missing Manual"
  description="Spaced-repetition review: quick self-check questions to lock in what you've learned." />

{#if stage === 'loading'}
  <div style="min-height:40vh"></div>
{:else if stage === 'empty'}
  <header class="rv-intro">
    <span class="eyebrow">Review</span>
    <h1>You're all caught up</h1>
    <p class="tagline">Nothing is due right now. As you read guides and take quizzes, cards appear here for spaced review - the proven way to make what you learn actually stick. Check back tomorrow.</p>
    {#if streak.current > 1}<p class="rv-streak">🔥 {streak.current}-day streak</p>{/if}
  </header>
  <div class="rv-actions"><a class="rv-btn" href="/train">Train your brain →</a><a class="rv-link" href="/paths">Your learning path</a></div>
  <ComebackOptIn />
{:else if stage === 'done'}
  <header class="rv-intro">
    <span class="eyebrow">Review</span>
    <h1>Done - {reviewed} card{reviewed === 1 ? '' : 's'} reviewed</h1>
    <p class="tagline">Nice. Spacing your reviews out over days is what moves this into long-term memory. Come back tomorrow for the next batch.</p>
    {#if streak.current > 1}<p class="rv-streak">🔥 {streak.current}-day streak</p>{/if}
  </header>
  <div class="rv-actions"><a class="rv-btn" href="/">Back home →</a><a class="rv-link" href="/train">Train</a></div>
  <ComebackOptIn />
{:else}
  <header class="rv-head">
    <span class="rv-eyebrow">Review</span>
    <div class="rv-progress"><div class="rv-fill" style={`width:${initialLen ? Math.min(100, (reviewed / initialLen) * 100) : 0}%`}></div></div>
    <span class="rv-count">{reviewed}/{initialLen}</span>
  </header>

  {#if card.type === 'term'}
    <div class="rv-card">
      <span class="rv-kind">Term</span>
      <p class="rv-term">{card.term}</p>
      {#if !revealed}
        <button class="rv-reveal" on:click={() => (revealed = true)}>Show definition</button>
      {:else}
        <p class="rv-def">{card.def}</p>
        <div class="rv-grades">
          <button class="rv-g again" on:click={() => grade('again')}>Again</button>
          <button class="rv-g good" on:click={() => grade('good')}>Good</button>
          <button class="rv-g easy" on:click={() => grade('easy')}>Easy</button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="rv-card">
      <span class="rv-kind">Question</span>
      <p class="rv-q">{card.q.q}</p>
      <div class="rv-choices">
        {#each qChoices as c, j}
          <button class="rv-choice"
            class:right={qPicked != null && c.correct}
            class:wrong={qPicked === j && !c.correct}
            disabled={qPicked != null}
            on:click={() => (qPicked = j)}>{c.text}</button>
        {/each}
      </div>
      {#if qPicked != null}
        {#if card.q.explain}<p class="rv-explain">{qCorrect ? 'Correct. ' : 'Not quite. '}{card.q.explain}</p>{/if}
        <div class="rv-grades">
          {#if qCorrect}
            <button class="rv-g good" on:click={() => grade('good')}>Good</button>
            <button class="rv-g easy" on:click={() => grade('easy')}>Easy</button>
          {:else}
            <button class="rv-g again" on:click={() => grade('again')}>Got it - show again</button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .rv-intro { margin-bottom: 1.6rem; }
  .rv-intro h1 { margin: 0.5rem 0 0.6rem; }
  .rv-streak { font-weight: 600; color: var(--ink); margin: 0.4rem 0 0; }
  .rv-actions { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.6rem; }
  .rv-btn { display: inline-flex; font-weight: 600; background: var(--accent); color: #fff; border-radius: 10px; padding: 0.7rem 1.3rem; }
  .rv-btn:hover { background: var(--accent-strong); color: #fff; text-decoration: none; }
  .rv-link { color: var(--muted); }

  .rv-head { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.6rem; }
  .rv-eyebrow { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
  .rv-progress { flex: 1; height: 7px; border-radius: 999px; background: var(--surface); overflow: hidden; }
  .rv-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.3s var(--ease); }
  .rv-count { font-family: var(--font-mono); font-size: 0.78rem; color: var(--muted); }

  .rv-card { border: 1px solid var(--line); border-radius: 16px; background: var(--raise); padding: 1.8rem 1.6rem; }
  .rv-kind { font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
  .rv-term { font-family: var(--font-display); font-weight: 700; font-size: 1.8rem; color: var(--ink); margin: 0.6rem 0 1.2rem; letter-spacing: -0.02em; }
  .rv-def { font-size: 1.05rem; line-height: 1.6; color: var(--body); margin: 0 0 1.4rem; }
  .rv-q { font-weight: 600; font-size: 1.15rem; line-height: 1.5; color: var(--ink); margin: 0.6rem 0 1.2rem; }
  .rv-choices { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.4rem; }
  .rv-choice { cursor: pointer; text-align: left; font: inherit; font-size: 1rem; color: var(--ink); border: 1px solid var(--line); background: var(--bg); border-radius: 11px; padding: 0.8rem 1rem; transition: border-color 0.12s var(--ease), background 0.12s var(--ease); }
  .rv-choice:not(:disabled):hover { border-color: var(--accent); }
  .rv-choice.right { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); }
  .rv-choice.wrong { border-color: #c0563c; background: color-mix(in srgb, #c0563c 16%, var(--raise)); }
  .rv-explain { font-size: 0.92rem; line-height: 1.55; color: var(--muted); margin: 0.9rem 0 0; }
  .rv-reveal { cursor: pointer; font: inherit; font-weight: 600; color: #fff; background: var(--accent); border: 0; border-radius: 10px; padding: 0.7rem 1.3rem; }
  .rv-reveal:hover { background: var(--accent-strong); }
  .rv-grades { display: flex; gap: 0.6rem; margin-top: 1.3rem; flex-wrap: wrap; }
  .rv-g { cursor: pointer; font: inherit; font-weight: 600; font-size: 0.95rem; border-radius: 10px; padding: 0.6rem 1.2rem; border: 1px solid var(--line); background: var(--raise); color: var(--body); }
  .rv-g.again:hover { border-color: #c0563c; color: #c0563c; }
  .rv-g.good { background: var(--accent); border-color: var(--accent); color: #fff; }
  .rv-g.good:hover { background: var(--accent-strong); }
  .rv-g.easy:hover { border-color: #2e9e6b; color: #2e9e6b; }
</style>
