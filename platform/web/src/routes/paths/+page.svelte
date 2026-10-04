<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { LEVELS, generatePath } from '$lib/pathgen.js';
  import { levelLabel } from '$lib/difficulty.js';
  import Seo from '$lib/Seo.svelte';

  export let data;
  $: ({ categories, guides } = data);

  const CFG_KEY = 'tmm-path-config';
  const DONE_KEY = 'tmm-path-done';

  let ready = false;        // hydrated from localStorage yet?
  let mode = 'wizard';      // 'wizard' | 'path'
  let level = 'newbie';
  let interests = [];       // category slugs (empty = everything)
  let done = [];            // completed guide slugs

  $: steps = mode === 'path' ? generatePath({ level, interests }, categories, guides) : [];
  $: total = steps.length;
  $: doneCount = steps.filter((s) => done.includes(s.slug)).length;
  $: pct = total ? Math.round((doneCount / total) * 100) : 0;
  $: nextStep = steps.find((s) => !done.includes(s.slug));
  $: focusNames = categories.filter((c) => interests.includes(c.slug)).map((c) => c.name);

  // Group consecutive steps by category for readable section headers.
  $: groups = (() => {
    const out = [];
    steps.forEach((s, i) => {
      let g = out[out.length - 1];
      if (!g || g.category !== s.category) { g = { category: s.category, name: s.categoryName, items: [] }; out.push(g); }
      g.items.push({ ...s, n: i + 1 });
    });
    return out;
  })();

  onMount(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
      if (cfg && cfg.level) {
        level = cfg.level;
        interests = Array.isArray(cfg.interests) ? cfg.interests : [];
        mode = 'path';
      }
      done = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
      if (!Array.isArray(done)) done = [];
    } catch (e) {}
    ready = true;
  });

  function toggleInterest(slug) {
    interests = interests.includes(slug) ? interests.filter((s) => s !== slug) : [...interests, slug];
  }

  function build() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify({ level, interests })); } catch (e) {}
    mode = 'path';
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function edit() {
    mode = 'wizard';
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleDone(slug) {
    done = done.includes(slug) ? done.filter((s) => s !== slug) : [...done, slug];
    try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch (e) {}
  }

  function resetProgress() {
    done = [];
    try { localStorage.setItem(DONE_KEY, '[]'); } catch (e) {}
  }

  // Destroy the saved path (config + progress) and leave for the landing page.
  function deletePath() {
    try {
      localStorage.removeItem(CFG_KEY);
      localStorage.removeItem(DONE_KEY);
    } catch (e) {}
    goto('/');
  }
</script>

<Seo
  title="Learn - build your path - The Missing Manual"
  description="Build a personalized learning path through the guides, tuned to your level and interests." />

{#if !ready}
  <div class="path-loading" aria-hidden="true"></div>
{:else if mode === 'wizard'}
  <header class="path-intro">
    <h1>Build your learning path</h1>
    <p>Choose a starting point and the subjects you want to prioritise. Your guides will stay in order, with the next one ready when you return.</p>
  </header>

  <section class="wiz-block" aria-labelledby="path-level-heading">
    <div class="wiz-heading">
      <h2 id="path-level-heading">Where are you starting?</h2>
      <p>Your level sets the order and depth of each guide.</p>
    </div>
    <div class="level-cards">
      {#each LEVELS as l}
        <button type="button" class="level-card" class:on={level === l.id} on:click={() => (level = l.id)} aria-pressed={level === l.id}>
          <span class="level-name"><i class={`ti ti-${l.id === 'newbie' ? 'seedling' : l.id === 'basics' ? 'route' : 'trophy'}`} aria-hidden="true"></i>{l.label}</span>
          <span class="level-blurb">{l.blurb}</span>
          {#if level === l.id}<span class="level-selected"><i class="ti ti-check" aria-hidden="true"></i> Selected</span>{/if}
        </button>
      {/each}
    </div>
  </section>

  <section class="wiz-block" aria-labelledby="path-focus-heading">
    <div class="wiz-heading">
      <h2 id="path-focus-heading">What do you want to focus on?</h2>
      <p>Optional. Leave this blank for a broad foundation.</p>
    </div>
    <div class="chips">
      {#each categories as c}
        <button type="button" class="chip" class:on={interests.includes(c.slug)} on:click={() => toggleInterest(c.slug)} aria-pressed={interests.includes(c.slug)}>
          <i class={`ti ${c.icon}`} aria-hidden="true"></i> {c.name}
        </button>
      {/each}
    </div>
  </section>

  <div class="wiz-actions">
    <button type="button" class="build-btn" on:click={build}>Build my path <i class="ti ti-arrow-right" aria-hidden="true"></i></button>
    {#if interests.length}<button type="button" class="link-btn" on:click={() => (interests = [])}>Clear focus</button>{/if}
  </div>
{:else}
  <header class="path-intro">
    <h1>Your learning path</h1>
    <p>{LEVELS.find((l) => l.id === level)?.label} path{#if focusNames.length} · {focusNames.join(', ')}{/if}</p>
  </header>

  {#if total}
    <section class="path-status" aria-label="Path progress">
      <div class="progress-summary">
        <div>
          <span class="path-overline">Your progress</span>
          <strong>{pct}% complete</strong>
        </div>
        <span>{doneCount} of {total} guides</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style={`width:${pct}%`}></div></div>
      <div class="path-status-actions">
        <button type="button" class="link-btn" on:click={edit}>Edit choices</button>
        {#if doneCount}<button type="button" class="link-btn" on:click={resetProgress}>Reset progress</button>{/if}
        <button type="button" class="link-btn danger" on:click={deletePath}>Delete path</button>
      </div>
    </section>

    {#if nextStep}
      <section class="next-guide" aria-labelledby="next-guide-heading">
        <div class="next-guide-copy">
          <span class="path-overline">Up next · guide {steps.indexOf(nextStep) + 1}</span>
          <h2 id="next-guide-heading">{nextStep.title}</h2>
          <p>{nextStep.summary}</p>
        </div>
        <a class="next-guide-action" href={`/guides/${nextStep.slug}`}>Open guide <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
      </section>
    {:else}
      <section class="next-guide path-complete" aria-labelledby="path-complete-heading">
        <div class="next-guide-copy">
          <span class="path-overline">Path complete</span>
          <h2 id="path-complete-heading">You finished every guide on this path.</h2>
          <p>Revisit a topic below, reset your progress, or edit your choices to create a new direction.</p>
        </div>
      </section>
    {/if}

    <ol class="roadmap">
      {#each groups as g}
        <li class="road-group">
          <h2 class="road-cat">{g.name}</h2>
          <ul class="road-items">
            {#each g.items as s}
              {@const isDone = done.includes(s.slug)}
              <li class="road-step" class:done={isDone}>
                <button type="button" class="step-check" class:on={isDone} on:click={() => toggleDone(s.slug)}
                  aria-pressed={isDone} aria-label={isDone ? 'Mark as not done' : 'Mark as done'} title={isDone ? 'Done' : 'Mark as done'}>
                  <i class="ti ti-check" aria-hidden="true"></i>
                </button>
                <div class="step-body">
                  <a class="step-title" href={`/guides/${s.slug}`}>{s.n}. {s.title}</a>
                  <span class="step-summary">{s.summary}</span>
                </div>
                <span class="lvl" class:mid={levelLabel(s.difficulty) === 'Intermediate'} class:adv={levelLabel(s.difficulty) === 'Advanced'} title={levelLabel(s.difficulty)}>{levelLabel(s.difficulty)[0]}</span>
              </li>
            {/each}
          </ul>
          <a class="road-review" href={`/review?guides=${g.items.map((s) => s.slug).join(',')}`}>
            <i class="ti ti-cards" aria-hidden="true"></i> Review {g.name}
          </a>
        </li>
      {/each}
    </ol>
  {:else}
    <div class="path-empty">
      <i class="ti ti-map-off" aria-hidden="true"></i>
      <p>No guides matched those choices yet. Try a higher level or fewer focus areas.</p>
      <div class="path-empty-actions">
        <button type="button" class="link-btn" on:click={edit}>Edit choices</button>
        <button type="button" class="link-btn danger" on:click={deletePath}>Delete path</button>
      </div>
    </div>
  {/if}
{/if}

<style>
  .path-loading { min-height: 40vh; }
  .path-intro { max-width: 44rem; margin-bottom: 2.8rem; }
  .path-intro h1 { margin: 0; font-family: var(--font-display); font-size: 2rem; line-height: 1.12; letter-spacing: -0.025em; }
  .path-intro p { margin: 0.75rem 0 0; color: var(--muted); font-size: 1rem; line-height: 1.6; }

  .wiz-block { margin: 0; padding: 1.4rem 0 2.2rem; border-top: 1px solid var(--line); }
  .wiz-heading { margin-bottom: 1rem; }
  .wiz-heading h2 { margin: 0; font-family: var(--font-display); font-size: 1.2rem; line-height: 1.25; color: var(--ink); }
  .wiz-heading p { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }

  .level-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.8rem; }
  .level-card {
    text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 0.35rem;
    min-height: 9.25rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 12px;
    background: var(--raise); color: var(--body);
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease), box-shadow 0.15s var(--ease);
  }
  .level-card:hover { border-color: var(--accent); }
  .level-card.on { border-color: var(--accent); background: var(--accent-tint); }
  .level-name { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-display); font-weight: 600; font-size: 1rem; color: var(--ink); }
  .level-name .ti { color: var(--accent); font-size: 1.1rem; }
  .level-blurb { font-size: 0.9rem; color: var(--muted); line-height: 1.5; }
  .level-selected { display: inline-flex; align-items: center; gap: 0.25rem; margin-top: auto; color: var(--accent); font-size: 0.8rem; font-weight: 600; }

  .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip {
    cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.45rem 0.8rem; border: 1px solid var(--line); border-radius: 999px;
    background: var(--raise); color: var(--body); font: inherit; font-size: 0.9rem;
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease), color 0.15s var(--ease);
  }
  .chip .ti { font-size: 16px; color: var(--accent); }
  .chip:hover { border-color: var(--accent); }
  .chip.on { border-color: var(--accent); background: var(--accent-tint); color: var(--ink); font-weight: 500; }

  .wiz-actions { display: flex; align-items: center; gap: 1rem; padding-top: 1.3rem; border-top: 1px solid var(--line); }
  .build-btn {
    cursor: pointer; font: inherit; font-weight: 600; font-size: 1rem;
    background: var(--accent); color: #fff; border: 1px solid var(--accent);
    padding: 0.7rem 1.3rem; border-radius: 10px;
    transition: background 0.15s var(--ease);
  }
  .build-btn:hover { background: var(--accent-strong); }
  .link-btn {
    cursor: pointer; font: inherit; font-size: 0.92rem; color: var(--muted);
    background: none; border: none; padding: 0.3rem 0; text-decoration: underline; text-underline-offset: 3px;
  }
  .link-btn:hover { color: var(--ink); }
  .link-btn.danger:hover { color: var(--accent-strong); }

  .path-status { padding: 1.15rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); margin-bottom: 1.8rem; }
  .progress-summary { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 0.7rem; color: var(--muted); font-size: 0.88rem; }
  .progress-summary > div { display: flex; flex-direction: column; gap: 0.1rem; }
  .progress-summary strong { color: var(--ink); font-family: var(--font-display); font-size: 1.25rem; line-height: 1.2; }
  .path-overline { color: var(--faint); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
  .progress-track { height: 8px; border-radius: 999px; background: var(--surface); overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s var(--ease); }
  .path-status-actions { display: flex; flex-wrap: wrap; gap: 0.9rem 1.2rem; margin-top: 0.75rem; }

  .next-guide { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.25rem 1.35rem; border: 1px solid var(--accent); border-radius: 12px; background: var(--accent-tint); margin-bottom: 2.25rem; }
  .next-guide-copy { min-width: 0; }
  .next-guide h2 { margin: 0.35rem 0 0; color: var(--ink); font-family: var(--font-display); font-size: 1.2rem; line-height: 1.25; }
  .next-guide p { max-width: 42rem; margin: 0.35rem 0 0; color: var(--body); font-size: 0.9rem; line-height: 1.5; }
  .next-guide-action { flex: none; display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 9px; padding: 0.65rem 0.85rem; background: var(--accent); color: #fff; font-size: 0.9rem; font-weight: 600; text-decoration: none; }
  .next-guide-action:hover { background: var(--accent-strong); color: #fff; }
  :global(:root[data-mode="dark"]) .build-btn,
  :global(:root[data-mode="dark"]) .build-btn:hover,
  :global(:root[data-mode="dark"]) .next-guide-action,
  :global(:root[data-mode="dark"]) .next-guide-action:hover,
  :global(:root[data-mode="dark"]) .step-check.on { background: var(--accent-strong); border-color: var(--accent-strong); color: var(--bg); }
  .path-complete { border-color: var(--line); background: var(--surface); }

  .roadmap { list-style: none; padding: 0; margin: 0; }
  .road-group { margin: 0 0 2.3rem; }
  .road-cat {
    font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--faint); margin: 0 0 0.7rem;
  }
  .road-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .road-review {
    display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.7rem; margin-left: 1.5rem;
    font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.02em; color: var(--muted);
  }
  .road-review .ti { font-size: 15px; color: var(--accent); }
  .road-review:hover { color: var(--accent); }
  .road-step { display: flex; align-items: flex-start; gap: 0.8rem; padding: 0.65rem 0; border-bottom: 1px solid var(--line); }
  .step-check {
    flex: none; margin-top: 0.15rem; cursor: pointer;
    width: 26px; height: 26px; border-radius: 8px;
    border: 1.5px solid var(--line); background: var(--raise); color: transparent;
    display: inline-grid; place-items: center;
    transition: all 0.15s var(--ease);
  }
  .step-check .ti { font-size: 16px; }
  .step-check:hover { border-color: var(--accent); }
  .step-check.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .step-body { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .step-title { font-family: var(--font-display); font-weight: 600; color: var(--ink); }
  .step-summary { font-size: 0.9rem; color: var(--muted); line-height: 1.5; }
  .road-step.done .step-title { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--faint); }
  .road-step.done .step-summary { opacity: 0.7; }
  .lvl {
    flex: none; margin-top: 0.2rem;
    font-family: var(--font-mono); font-size: 0.62rem; font-weight: 500; line-height: 1;
    color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 2px 4px;
  }
  .lvl.mid, .lvl.adv { color: var(--muted); }
  .path-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 0.8rem; max-width: 40rem; padding: 1.4rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); color: var(--muted); }
  .path-empty > .ti { color: var(--accent); font-size: 1.5rem; }
  .path-empty p { margin: 0; }
  .path-empty-actions { display: flex; gap: 1rem; }

  @media (max-width: 640px) {
    .path-intro { margin-bottom: 2rem; }
    .level-cards { grid-template-columns: 1fr; }
    .next-guide { align-items: flex-start; flex-direction: column; }
    .progress-summary { align-items: flex-start; flex-direction: column; }
  }
</style>
