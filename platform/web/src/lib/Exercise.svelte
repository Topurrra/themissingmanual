<script>
  import { onMount } from 'svelte';
  import { checkAnswer, checkRegex, checkJson } from '$lib/exercises.js';

  export let guideSlug;
  export let phaseNo;
  export let items = [];

  $: storeKey = `tmm-exercise:${guideSlug}/${phaseNo}`;

  // One state slot per item: predict/regex/json -> {value, correct, error}; task -> {revealed, checks}.
  let state = [];

  function blankState(item) {
    return item.type === 'task'
      ? { revealed: false, checks: (item.checklist || []).map(() => false) }
      : { value: '', correct: false, error: null };
  }

  function persist() {
    try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (e) {}
  }

  function check(i) {
    const item = items[i];
    let result;
    if (item.type === 'regex') result = checkRegex(state[i].value, item.mustMatch, item.mustNotMatch);
    else if (item.type === 'json') result = checkJson(state[i].value, item.expected);
    else result = { correct: checkAnswer(state[i].value, item.accept), error: null };
    state[i] = { ...state[i], correct: result.correct, error: result.error };
    state = [...state];
    persist();
  }
  function setValue(i, v) {
    state[i] = { ...state[i], value: v, correct: false, error: null };
    state = [...state];
  }
  function reveal(i) {
    state[i] = { ...state[i], revealed: true };
    state = [...state];
    persist();
  }
  function toggleCheck(i, ci) {
    const checks = [...state[i].checks];
    checks[ci] = !checks[ci];
    state[i] = { ...state[i], checks };
    state = [...state];
    persist();
  }
  function reset(i) {
    state[i] = blankState(items[i]);
    state = [...state];
    persist();
  }

  onMount(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (e) {}
    state = items.map((item, i) => (Array.isArray(saved) && saved[i] ? saved[i] : blankState(item)));
  });
</script>

{#if items.length}
  <details class="exercise">
    <summary class="exercise-head">
      <i class="ti ti-clipboard-check" aria-hidden="true"></i>
      <span class="exercise-head-text">Practice this</span>
      <span class="exercise-count">{items.length} {items.length === 1 ? 'exercise' : 'exercises'}</span>
      <i class="ti ti-chevron-down exercise-chevron" aria-hidden="true"></i>
    </summary>
    <div class="exercise-body">
      {#each items as item, i}
        {@const s = state[i]}
        <div class="exercise-item">
          <p class="exercise-task">{i + 1}. {item.task}</p>

          {#if item.type === 'task'}
            <ul class="exercise-checklist">
              {#each item.checklist || [] as c, ci}
                <li>
                  <label>
                    <input type="checkbox" checked={s?.checks?.[ci] || false} on:change={() => toggleCheck(i, ci)} />
                    <span>{c}</span>
                  </label>
                </li>
              {/each}
            </ul>
            {#if item.reveal}
              {#if s?.revealed}
                <div class="exercise-reveal">
                  <p class="exercise-reveal-label"><i class="ti ti-bulb" aria-hidden="true"></i> Reference approach</p>
                  <p class="exercise-reveal-text">{item.reveal}</p>
                </div>
              {:else}
                <button type="button" class="exercise-btn ghost" on:click={() => reveal(i)}>Reveal reference solution</button>
              {/if}
            {/if}
          {:else}
            <div class="exercise-predict">
              <input
                type="text"
                class="exercise-input"
                class:correct={s?.correct}
                placeholder="Type your answer"
                value={s?.value || ''}
                disabled={s?.correct}
                on:input={(e) => setValue(i, e.target.value)}
                on:keydown={(e) => { if (e.key === 'Enter') check(i); }}
              />
              {#if s?.correct}
                <span class="exercise-result ok"><i class="ti ti-check" aria-hidden="true"></i> Correct</span>
              {:else}
                <button type="button" class="exercise-btn" on:click={() => check(i)} disabled={!s?.value}>Check</button>
              {/if}
            </div>
            {#if s?.value && !s?.correct && s?.error}
              <p class="exercise-hint">{s.error}</p>
            {:else if s?.value && !s?.correct && item.hint}
              <p class="exercise-hint">Hint: {item.hint}</p>
            {/if}
          {/if}

          {#if (item.type === 'task' && s?.revealed) || (item.type !== 'task' && s?.correct)}
            <button type="button" class="exercise-retry" on:click={() => reset(i)}>Start over</button>
          {/if}
        </div>
      {/each}
    </div>
  </details>
{/if}

<style>
  .exercise {
    margin: 2.5rem 0 0; padding: 1.3rem 1.4rem; border: 1px solid var(--line);
    border-radius: 14px; background: var(--surface);
  }
  .exercise-head {
    display: flex; align-items: center; gap: 0.5rem; margin: 0; cursor: pointer;
    list-style: none; user-select: none;
    font-family: var(--font-display); font-size: 1.05rem; color: var(--ink);
  }
  .exercise-head::-webkit-details-marker { display: none; }
  .exercise-head .ti { color: var(--accent); font-size: 20px; }
  .exercise-count { font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted); font-weight: 500; }
  .exercise-chevron { margin-left: auto; color: var(--muted) !important; font-size: 18px !important; transition: transform 0.18s var(--ease); }
  details.exercise[open] .exercise-chevron { transform: rotate(180deg); }
  details.exercise[open] .exercise-head { margin-bottom: 1rem; }
  .exercise-body { animation: exercise-reveal 0.18s var(--ease); }
  @keyframes exercise-reveal { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
  .exercise-item { margin: 0 0 1.4rem; }
  .exercise-item:last-of-type { margin-bottom: 0.2rem; }
  .exercise-task { font-weight: 600; color: var(--ink); margin: 0 0 0.7rem; line-height: 1.5; }

  .exercise-predict { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .exercise-input {
    flex: 1 1 220px; min-width: 0; padding: 0.5rem 0.7rem; border: 1px solid var(--line);
    border-radius: 9px; background: var(--raise); color: var(--ink); font: inherit; font-size: 0.95rem;
  }
  .exercise-input:focus { outline: none; border-color: var(--accent); }
  .exercise-input.correct { border-color: #2e9e6b; background: color-mix(in srgb, #2e9e6b 10%, var(--raise)); }
  .exercise-btn {
    flex: none; cursor: pointer; font: inherit; font-size: 0.88rem; font-weight: 500;
    padding: 0.5rem 0.9rem; border-radius: 9px; border: 1px solid var(--accent);
    background: var(--accent); color: #fff;
  }
  .exercise-btn:disabled { opacity: 0.45; cursor: default; }
  .exercise-btn.ghost { background: none; color: var(--accent); }
  .exercise-result.ok { display: inline-flex; align-items: center; gap: 0.3rem; color: #2e9e6b; font-weight: 600; font-size: 0.9rem; }
  .exercise-hint { margin: 0.5rem 0 0; font-size: 0.87rem; color: var(--muted); }

  .exercise-checklist { list-style: none; margin: 0 0 0.7rem; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .exercise-checklist label { display: flex; align-items: flex-start; gap: 0.55rem; cursor: pointer; font-size: 0.92rem; color: var(--body); }
  .exercise-checklist input { margin-top: 0.2rem; accent-color: var(--accent); }
  .exercise-reveal { margin-top: 0.6rem; padding: 0.8rem 0.9rem; border-radius: 10px; background: var(--raise); border: 1px solid var(--line); }
  .exercise-reveal-label { display: flex; align-items: center; gap: 0.35rem; margin: 0 0 0.4rem; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; }
  .exercise-reveal-text { margin: 0; color: var(--body); line-height: 1.6; white-space: pre-wrap; }

  .exercise-retry { margin-top: 0.6rem; cursor: pointer; font: inherit; font-size: 0.82rem; color: var(--muted); background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; }
  .exercise-retry:hover { color: var(--ink); }
</style>
