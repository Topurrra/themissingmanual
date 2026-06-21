<script>
  import { onMount } from 'svelte';
  import { quizFor } from '$lib/quizzes.js';
  import { seedChapter } from '$lib/srs.js';

  export let guideSlug;
  export let phaseNo;
  export let isLast = false;

  const PATH_DONE = 'tmm-path-done';
  $: questions = quizFor(guideSlug, phaseNo);
  $: storeKey = `tmm-quiz:${guideSlug}/${phaseNo}`;

  let selected = [];
  let marked = false;
  let celebrated = false;
  let seeded = false;

  $: answered = selected.filter((s) => s != null).length;
  $: allDone = questions.length > 0 && answered === questions.length;
  $: correct = questions.reduce((n, q, i) => n + (selected[i] === q.answer ? 1 : 0), 0);

  // When the reader finishes the quiz on the guide's LAST phase, count the guide
  // as complete in the learning-path progress (same store the path + rail read).
  // A perfectly-answered quiz marks its guide complete (ticks it in the path).
  $: if (allDone && questions.length && correct === questions.length && !marked) { marked = true; markGuideDone(); }
  // Celebrate a perfect score with a confetti burst (skips reduced-motion users).
  $: if (allDone && questions.length && correct === questions.length && !celebrated) { celebrated = true; celebrate(); }
  // Finishing the quiz enrols this chapter into spaced review (resurfaces later).
  $: if (allDone && questions.length && !seeded) { seeded = true; seedChapter(guideSlug, phaseNo); }

  function markGuideDone() {
    try {
      const d = JSON.parse(localStorage.getItem(PATH_DONE) || '[]');
      const arr = Array.isArray(d) ? d : [];
      if (!arr.includes(guideSlug)) { arr.push(guideSlug); localStorage.setItem(PATH_DONE, JSON.stringify(arr)); }
      // Notify same-tab listeners (the path rail) — 'storage' only fires cross-tab.
      window.dispatchEvent(new CustomEvent('tmm-progress'));
    } catch (e) {}
  }
  function celebrate() {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ['#0e7c86', '#4d969c', '#e0b341', '#c0563c', '#2e9e6b', '#6fb6bc'];
    const parts = Array.from({ length: 150 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 140, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 9, vy: Math.random() * -9 - 4,
      r: 4 + Math.random() * 5, c: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3
    }));
    const start = performance.now();
    function frame(t) {
      const el = t - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - el / 2600); ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
      }
      if (el < 2600) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }
  function persist() {
    try { localStorage.setItem(storeKey, JSON.stringify(selected)); } catch (e) {}
  }
  function choose(qi, ci) {
    if (selected[qi] != null) return; // lock once answered
    selected[qi] = ci;
    selected = [...selected];
    persist();
  }
  function retry() {
    selected = questions.map(() => null);
    marked = false;
    celebrated = false;
    try { localStorage.removeItem(storeKey); } catch (e) {}
  }

  onMount(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (e) {}
    selected = questions.map((_, i) => (Array.isArray(saved) && saved[i] != null ? saved[i] : null));
    // Restoring a previously-finished quiz must NOT re-celebrate on every visit;
    // only a fresh completion (the user answering the last question now) should.
    if (questions.length && selected.every((x) => x != null)) { celebrated = true; marked = true; }
  });
</script>

{#if questions.length}
  <section class="quiz" aria-label="Check your understanding">
    <h2 class="quiz-head"><i class="ti ti-help-circle" aria-hidden="true"></i> Check your understanding</h2>

    {#each questions as q, qi}
      {@const ans = selected[qi]}
      {@const done = ans != null}
      <div class="quiz-q">
        <p class="quiz-prompt">{qi + 1}. {q.q}</p>
        <div class="quiz-choices">
          {#each q.choices as choice, ci}
            <button
              type="button"
              class="quiz-choice"
              class:correct={done && ci === q.answer}
              class:wrong={done && ci === ans && ci !== q.answer}
              disabled={done}
              on:click={() => choose(qi, ci)}>
              <span class="quiz-mark" aria-hidden="true">
                {#if done && ci === q.answer}<i class="ti ti-check"></i>
                {:else if done && ci === ans}<i class="ti ti-x"></i>
                {:else}{String.fromCharCode(65 + ci)}{/if}
              </span>
              <span>{choice}</span>
            </button>
          {/each}
        </div>
        {#if done && q.explain}
          <p class="quiz-explain" class:ok={ans === q.answer}>
            {ans === q.answer ? 'Correct. ' : 'Not quite. '}{q.explain}
          </p>
        {/if}
      </div>
    {/each}

    {#if allDone}
      <div class="quiz-summary">
        <span class="quiz-score">You got {correct} of {questions.length}.</span>
        {#if correct === questions.length}<span class="quiz-flag">Marked complete in your path.</span>{/if}
        <span class="quiz-flag"><i class="ti ti-cards" aria-hidden="true"></i> Saved to <a href="/review">review</a></span>
        <button type="button" class="quiz-retry" on:click={retry}>Try again</button>
      </div>
    {/if}
  </section>
{/if}

<style>
  .quiz {
    margin: 2.5rem 0 0; padding: 1.3rem 1.4rem; border: 1px solid var(--line);
    border-radius: 14px; background: var(--surface);
  }
  .quiz-head {
    display: flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem;
    font-family: var(--font-display); font-size: 1.05rem; color: var(--ink);
  }
  .quiz-head .ti { color: var(--accent); font-size: 20px; }
  .quiz-q { margin: 0 0 1.4rem; }
  .quiz-q:last-of-type { margin-bottom: 0.6rem; }
  .quiz-prompt { font-weight: 600; color: var(--ink); margin: 0 0 0.6rem; line-height: 1.5; }
  .quiz-choices { display: flex; flex-direction: column; gap: 0.45rem; }
  .quiz-choice {
    display: flex; align-items: center; gap: 0.6rem; text-align: left; width: 100%; cursor: pointer;
    border: 1px solid var(--line); background: var(--raise); color: var(--body);
    border-radius: 10px; padding: 0.55rem 0.7rem; font: inherit; font-size: 0.95rem;
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .quiz-choice:not(:disabled):hover { border-color: var(--accent); }
  .quiz-choice:disabled { cursor: default; }
  .quiz-mark {
    flex: none; width: 24px; height: 24px; border-radius: 6px; display: inline-grid; place-items: center;
    background: var(--surface); color: var(--muted); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;
  }
  .quiz-choice .ti { font-size: 15px; }
  .quiz-choice.correct { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 12%, var(--raise)); }
  .quiz-choice.correct .quiz-mark { background: #2e9e6b; color: #fff; }
  .quiz-choice.wrong { border-color: #c0563c; background: color-mix(in srgb, #c0563c 12%, var(--raise)); }
  .quiz-choice.wrong .quiz-mark { background: #c0563c; color: #fff; }
  .quiz-explain { margin: 0.6rem 0 0; font-size: 0.9rem; line-height: 1.55; color: var(--muted); }
  .quiz-explain.ok { color: var(--body); }
  .quiz-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
  .quiz-score { font-weight: 600; color: var(--ink); }
  .quiz-flag { display: inline-flex; align-items: center; gap: 0.3rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); }
  .quiz-flag a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  .quiz-retry { margin-left: auto; cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--muted); background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; }
  .quiz-retry:hover { color: var(--ink); }
</style>
