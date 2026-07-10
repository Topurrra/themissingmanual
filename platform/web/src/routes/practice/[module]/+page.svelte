<script>
  import { onMount } from 'svelte';
  import Seo from '$lib/Seo.svelte';
  import { levelLabel } from '$lib/difficulty.js';
  import PracticeSidebar from '$lib/practice/PracticeSidebar.svelte';

  export let data;
  $: module = data.module;
  $: lvl = levelLabel(module.difficulty);

  // Client-side only (needs localStorage): which lesson the primary button should
  // point at, and which lessons already show a checkmark in the list below.
  let doneSet = new Set();
  let primaryHref = null;
  let primaryLabel = 'Start lesson 1';
  let allDone = false;
  let nextModule = null;

  onMount(() => {
    const done = new Set();
    for (const l of module.lessons) {
      try {
        if (JSON.parse(localStorage.getItem(`tmm-practice:${module.slug}/${l.phase_no}`) || 'null')?.done) {
          done.add(l.phase_no);
        }
      } catch (e) {}
    }
    doneSet = done;

    const next = module.lessons.find((l) => !done.has(l.phase_no));
    if (next) {
      primaryHref = `/practice/${module.module}/${next.phase_no}`;
      primaryLabel = done.size === 0 ? 'Start lesson 1' : 'Continue';
    } else if (module.lessons.length) {
      primaryHref = `/practice/${module.module}/${module.lessons[0].phase_no}`;
      primaryLabel = 'Review lesson 1';
    }

    if (module.lessons.length && done.size === module.lessons.length) {
      allDone = true;
      // data.modules is already in course order (getCategory sorts by the `order`
      // frontmatter) - the next entry after this one is simply the next course
      // module, if any exist yet (regex may not, and that's fine, no link then).
      const idx = data.modules.findIndex((m) => m.module === module.module);
      nextModule = idx >= 0 && idx < data.modules.length - 1 ? data.modules[idx + 1] : null;
    }
  });
</script>

<Seo title={`${module.title} - Practice - The Missing Manual`} description={module.summary} />

{#key module.module}
  <div class="pr-mod-shell">
    <PracticeSidebar modules={data.modules} activeModule={module.module} activePhase={null} />

    <div class="pr-mod-content">
      <div class="pr-mod-inner">
        <a class="pr-back" href="/practice"><i class="ti ti-chevron-left" aria-hidden="true"></i> Practice</a>

        <div class="pr-mod-head">
          <h1 class="pr-mod-title">{module.title}</h1>
          <span class="lvl" class:mid={lvl === 'Intermediate'} class:adv={lvl === 'Advanced'} title={lvl}>{lvl}</span>
        </div>
        <p class="pr-mod-summary">{module.summary}</p>

        <!-- <div class="pr-mod-prose">{@html data.overviewHtml}</div> -->

        {#if module.lessons.length}
          <h2 class="pr-mod-sub">Lessons</h2>
          <ol class="pr-mod-lessons">
            {#each module.lessons as l (l.phase_no)}
              <li>
                <a href={`/practice/${module.module}/${l.phase_no}`}>
                  {#if doneSet.has(l.phase_no)}<i class="ti ti-circle-check pr-mod-done" aria-hidden="true"></i>{/if}
                  {l.title}
                </a>
              </li>
            {/each}
          </ol>
        {/if}

        {#if allDone}
          <p class="pr-mod-done-msg">
            You've completed all {module.lessons.length} lessons in {module.title}.
            {#if nextModule}<a href={`/practice/${nextModule.module}`}>Continue to {nextModule.title} →</a>{/if}
          </p>
        {/if}

        {#if primaryHref}
          <a class="pr-btn pr-btn-primary pr-mod-cta" href={primaryHref}>
            {primaryLabel} <i class="ti ti-arrow-right" aria-hidden="true"></i>
          </a>
        {/if}
      </div>
    </div>
  </div>
{/key}

<style>
  .pr-mod-shell {
    position: fixed;
    top: 57px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    display: flex;
    background: var(--bg);
    overflow: hidden;
  }
  .pr-mod-content {
    flex: 1 1 auto;
    min-width: 0;
    overflow-y: auto;
  }
  .pr-mod-inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 2.4rem 1.5rem 4rem;
  }

  .pr-back {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .pr-back:hover {
    color: var(--accent);
    text-decoration: none;
  }

  .pr-mod-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0.9rem 0 0.4rem;
  }
  .pr-mod-title {
    font-size: clamp(1.7rem, 3.6vw, 2.2rem);
    letter-spacing: -0.03em;
    margin: 0;
  }
  .pr-mod-summary {
    color: var(--muted);
    font-size: 1.02rem;
    line-height: 1.6;
    margin: 0 0 1.6rem;
  }

  .pr-mod-prose :global(p) {
    line-height: 1.75;
    color: var(--body);
  }
  .pr-mod-prose :global(pre) {
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 10px;
    padding: 0.8rem 0.9rem;
    overflow-x: auto;
    font-size: 0.86rem;
  }
  .pr-mod-prose :global(:not(pre) > code) {
    background: var(--surface);
    color: var(--accent-strong);
    border-radius: 5px;
    padding: 0.1em 0.35em;
    font-family: var(--font-mono);
    font-size: 0.86em;
  }

  .pr-mod-sub {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 400;
    margin: 2.2rem 0 0.6rem;
  }
  .pr-mod-lessons {
    counter-reset: lesson;
    list-style: none;
    margin: 0 0 2rem;
    padding: 0;
  }
  .pr-mod-lessons li {
    padding: 0.85rem 0 0.85rem 2.6rem;
    border-bottom: 1px solid var(--line);
    position: relative;
  }
  .pr-mod-lessons li:first-child {
    border-top: 1px solid var(--line);
  }
  .pr-mod-lessons li::before {
    counter-increment: lesson;
    content: counter(lesson, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 0.9rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--accent);
  }
  .pr-mod-lessons a {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.05rem;
    letter-spacing: -0.015em;
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .pr-mod-lessons a:hover {
    color: var(--accent);
    text-decoration: none;
  }
  .pr-mod-done {
    color: #2e9e6b;
    font-size: 0.95em;
  }

  .pr-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-body);
    font-size: 0.92rem;
    font-weight: 500;
    border-radius: 9px;
    padding: 0.6rem 1.1rem;
    cursor: pointer;
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .pr-btn-primary {
    color: #fff;
    background: var(--accent);
    border: 1px solid var(--accent);
  }
  .pr-btn-primary:hover {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
    color: #fff;
    text-decoration: none;
  }
  .pr-mod-cta {
    margin-top: 0.4rem;
  }
  .pr-mod-done-msg {
    color: var(--muted);
    font-size: 0.92rem;
    margin: 0 0 0.7rem;
  }
  .pr-mod-done-msg a {
    color: var(--accent);
  }

  /* ≤900px: same treatment as the IDE shell - stack children, the shell itself
     scrolls as one unit instead of each pane scrolling independently. */
  @media (max-width: 900px) {
    .pr-mod-shell {
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .pr-mod-content {
      flex: none;
      overflow-y: visible;
    }
    .pr-mod-inner {
      padding: 1.4rem 1.1rem 3rem;
    }
  }
</style>
