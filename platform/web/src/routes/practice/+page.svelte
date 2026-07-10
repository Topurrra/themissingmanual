<script>
  import { onMount } from "svelte";
  import Seo from "$lib/Seo.svelte";
  import { levelLabel } from "$lib/difficulty.js";
  import { getStreak } from "$lib/streaks.js";

  export let data;
  $: modules = data?.modules ?? [];

  // Per-module icon in the same vein as cheatsheets.js (ti-database for SQL,
  // ti-brand-python for Python); falls back to the category's own ti-keyboard.
  const LANG_ICON = {
    sql: "ti-database",
    javascript: "ti-brand-javascript",
    python: "ti-brand-python",
    typescript: "ti-brand-typescript",
    regex: "ti-regex",
    git: "ti-brand-git",
    math: "ti-math-function",
    physics: "ti-atom-2",
    postgres: "ti-database",
  };

  let progress = {}; // guideSlug -> count of lessons marked done, from localStorage
  let streak = { current: 0, longest: 0 };
  let continueInfo = null; // first undone lesson of the first module with any progress

  onMount(() => {
    streak = getStreak();
    const out = {};
    for (const m of modules) {
      const prefix = `tmm-practice:${m.slug}/`;
      let done = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        try {
          if (JSON.parse(localStorage.getItem(k))?.done) done++;
        } catch (e) {}
      }
      out[m.slug] = done;
    }
    progress = out;

    // Continuity, not a "featured lesson": walk modules in course order, find the
    // first one that's been started but isn't finished, and point at its next
    // undone lesson. No progress anywhere -> render nothing.
    for (const m of modules) {
      const doneSet = new Set();
      for (const l of m.lessons) {
        try {
          if (
            JSON.parse(
              localStorage.getItem(`tmm-practice:${m.slug}/${l.phase_no}`) ||
                "null",
            )?.done
          ) {
            doneSet.add(l.phase_no);
          }
        } catch (e) {}
      }
      if (doneSet.size === 0) continue;
      const next = m.lessons.find((l) => !doneSet.has(l.phase_no));
      if (next) {
        continueInfo = {
          module: m.module,
          title: m.title,
          phaseNo: next.phase_no,
          lessonTitle: next.title,
        };
        break;
      }
    }
  });
</script>

<Seo
  title="Practice - The Missing Manual"
  description="Hands-on coding lessons in a three-panel playground - write real SQL, JavaScript, or Python and get checked instantly, right in your browser."
/>

<header class="pr-intro">
  <span class="eyebrow">Practice</span>
  <h1 class="page-title">Learn by doing</h1>
  <p class="tagline">
    Short, hands-on lessons - read the task, write real code, run it in your
    browser, and get checked instantly. No setup, no account.
  </p>
  {#if streak.current > 1}<p class="pr-streak">
      🔥 {streak.current}-day streak
    </p>{/if}
</header>

{#if continueInfo}
  <a
    class="pr-continue"
    href={`/practice/${continueInfo.module}/${continueInfo.phaseNo}`}
  >
    Continue: {continueInfo.lessonTitle} in {continueInfo.title}
    <i class="ti ti-arrow-right" aria-hidden="true"></i>
  </a>
{/if}

{#if modules.length === 0}
  <p class="pr-empty">Practice modules are on the way.</p>
{:else}
  <div class="pr-grid">
    {#each modules as m (m.slug)}
      {@const lvl = levelLabel(m.difficulty)}
      <a class="pr-card" href={`/practice/${m.module}`}>
        <div class="pr-card-top">
          <i
            class={`ti ${LANG_ICON[m.module] || "ti-keyboard"}`}
            aria-hidden="true"
          ></i>
          <span class="pr-title">{m.title}</span>
          <span
            class="lvl"
            class:mid={lvl === "Intermediate"}
            class:adv={lvl === "Advanced"}
            title={lvl}>{lvl[0]}</span
          >
        </div>
        <p class="pr-summary">{m.summary}</p>
        <div class="pr-meta">
          <span
            >{m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}</span
          >
          <span class="pr-progress"
            >{progress[m.slug] || 0}/{m.lessons.length} done</span
          >
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .pr-intro {
    margin-bottom: 1.8rem;
  }
  .pr-intro h1 {
    margin: 0.5rem 0 0.6rem;
  }
  .pr-streak {
    font-weight: 600;
    color: var(--ink);
    margin: 0.4rem 0 0;
  }

  .pr-continue {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 1.2rem;
    font-weight: 600;
    color: var(--accent);
  }
  .pr-continue:hover {
    color: var(--accent-strong);
    text-decoration: none;
  }

  .pr-empty {
    color: var(--muted);
  }

  .pr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.9rem;
  }
  .pr-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1.2rem 1.25rem;
    background: var(--raise);
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.2s var(--ease),
      transform 0.2s var(--ease),
      box-shadow 0.2s var(--ease);
  }
  .pr-card:hover {
    border-color: var(--accent);
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .pr-card-top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .pr-card-top .ti {
    font-size: 22px;
    color: var(--accent);
    flex: none;
  }
  .pr-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.06rem;
    letter-spacing: -0.015em;
    color: var(--ink);
  }
  .pr-summary {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.55;
    margin: 0;
  }
  .pr-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: var(--faint);
    font-family: var(--font-mono);
    margin-top: auto;
    padding-top: 0.2rem;
  }
  .pr-progress {
    color: var(--accent);
  }
</style>
