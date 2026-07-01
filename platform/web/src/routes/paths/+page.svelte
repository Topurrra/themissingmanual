<script>
  import { onMount } from 'svelte';
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
</script>

<Seo
  title="Learn - build your path - The Missing Manual"
  description="Build a personalized learning path through the guides, tuned to your level and interests." />

{#if !ready}
  <div class="path-loading" aria-hidden="true"></div>
{:else if mode === 'wizard'}
  <header class="path-intro">
    <span class="eyebrow">Learn</span>
    <h1>Build your learning path</h1>
    <p class="tagline">Tell us where you're starting and what you care about. We'll put the guides in a sensible order so you always know what to read next - and we'll keep track of how far you've come.</p>
  </header>

  <section class="wiz-block">
    <h2 class="wiz-q">Where are you starting?</h2>
    <div class="level-cards">
      {#each LEVELS as l}
        <button type="button" class="level-card" class:on={level === l.id} on:click={() => (level = l.id)} aria-pressed={level === l.id}>
          <span class="level-name">{l.label}</span>
          <span class="level-blurb">{l.blurb}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="wiz-block">
    <h2 class="wiz-q">What do you want to focus on? <span class="wiz-opt">optional</span></h2>
    <p class="wiz-hint">Pick a few areas, or leave it empty to cover everything from the ground up.</p>
    <div class="chips">
      {#each categories as c}
        <button type="button" class="chip" class:on={interests.includes(c.slug)} on:click={() => toggleInterest(c.slug)} aria-pressed={interests.includes(c.slug)}>
          <i class={`ti ${c.icon}`} aria-hidden="true"></i> {c.name}
        </button>
      {/each}
    </div>
  </section>

  <div class="wiz-actions">
    <button type="button" class="build-btn" on:click={build}>Build my path →</button>
    {#if interests.length}<button type="button" class="link-btn" on:click={() => (interests = [])}>Clear focus</button>{/if}
  </div>
{:else}
  <header class="path-intro">
    <span class="eyebrow">Your path</span>
    <h1>Your learning path</h1>
    <p class="tagline">
      {LEVELS.find((l) => l.id === level)?.label}{#if interests.length} · focused on {interests.length} area{interests.length === 1 ? '' : 's'}{/if}
    </p>
  </header>

  {#if total}
    <div class="progress-card">
      <div class="progress-top">
        <span class="progress-pct">{pct}% complete</span>
        <span class="progress-frac">{doneCount} of {total} guides</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style={`width:${pct}%`}></div></div>
      <div class="progress-actions">
        <button type="button" class="link-btn" on:click={edit}>Edit choices</button>
        {#if doneCount}<button type="button" class="link-btn" on:click={resetProgress}>Reset progress</button>{/if}
      </div>
    </div>

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
    <div class="progress-card">
      <p>No guides matched those choices yet. Try a higher level or fewer focus areas.</p>
      <button type="button" class="link-btn" on:click={edit}>Edit choices</button>
    </div>
  {/if}
{/if}

<style>
  .path-loading { min-height: 40vh; }
  .path-intro { margin-bottom: 2rem; }
  .path-intro h1 { margin: 0.5rem 0 0.6rem; }

  .wiz-block { margin: 2rem 0; }
  .wiz-q { font-size: 1.15rem; margin: 0 0 0.9rem; }
  .wiz-opt {
    font-family: var(--font-mono); font-size: 0.6rem; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint);
    border: 1px solid var(--line); border-radius: 5px; padding: 2px 5px; vertical-align: middle;
  }
  .wiz-hint { color: var(--muted); margin: -0.4rem 0 1rem; font-size: 0.95rem; }

  .level-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.8rem; }
  .level-card {
    text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 0.35rem;
    padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 14px;
    background: var(--raise); color: var(--body);
    transition: border-color 0.15s var(--ease), background 0.15s var(--ease), box-shadow 0.15s var(--ease);
  }
  .level-card:hover { border-color: var(--accent); }
  .level-card.on { border-color: var(--accent); background: var(--accent-tint); box-shadow: var(--shadow-sm); }
  .level-name { font-family: var(--font-display); font-weight: 600; font-size: 1.02rem; color: var(--ink); }
  .level-blurb { font-size: 0.9rem; color: var(--muted); line-height: 1.5; }

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

  .wiz-actions { display: flex; align-items: center; gap: 1rem; margin-top: 2.2rem; }
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

  .progress-card { border: 1px solid var(--line); border-radius: 14px; padding: 1.1rem 1.2rem; background: var(--raise); margin-bottom: 2rem; }
  .progress-top { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
  .progress-pct { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--ink); }
  .progress-frac { font-size: 0.9rem; color: var(--muted); }
  .progress-track { height: 8px; border-radius: 999px; background: var(--surface); overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s var(--ease); }
  .progress-actions { display: flex; gap: 1.2rem; margin-top: 0.8rem; }

  .roadmap { list-style: none; padding: 0; margin: 0; }
  .road-group { margin: 0 0 1.8rem; }
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
  .road-step { display: flex; align-items: flex-start; gap: 0.8rem; padding: 0.2rem 0; }
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
    color: var(--accent); border: 1px solid currentColor; border-radius: 4px; padding: 2px 4px; opacity: 0.8;
  }
  .lvl.mid { color: #c79a2a; }
  .lvl.adv { color: #b4533a; }
</style>
