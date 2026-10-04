<script>
  import { onMount } from 'svelte';
  import Seo from '$lib/Seo.svelte';
  import { levelLabel } from '$lib/difficulty.js';
  import PracticeSidebar from '$lib/practice/PracticeSidebar.svelte';
  import { practiceViewport } from '$lib/practice/viewport.js';

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
  <div class="pr-mod-shell" use:practiceViewport>
    <PracticeSidebar modules={data.modules} activeModule={module.module} activePhase={null} />

    <div class="pr-mod-content">
      <div class="pr-mod-inner">
        <a class="pr-back" href="/practice"><i class="ti ti-chevron-left" aria-hidden="true"></i> All practice</a>

        <header class="pr-mod-head">
          <div>
            <h1 class="pr-mod-title">{module.title}</h1>
            <p class="pr-mod-summary">{module.summary}</p>
          </div>
          <div class="pr-mod-meta">
            <span class="lvl" class:mid={lvl === 'Intermediate'} class:adv={lvl === 'Advanced'}>{lvl}</span>
            <span>{doneSet.size}/{module.lessons.length} complete</span>
          </div>
        </header>

        {#if primaryHref}
          <div class="pr-mod-next">
            <div>
              <strong>{allDone ? 'Ready for a review?' : doneSet.size ? 'Pick up where you left off.' : 'Start with the first lesson.'}</strong>
              <span>{module.lessons.length} hands-on lesson{module.lessons.length === 1 ? '' : 's'}</span>
            </div>
            <a class="pr-btn pr-btn-primary" href={primaryHref}>
              {primaryLabel} <i class="ti ti-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        {/if}

        {#if data.overviewHtml}
          <div class="pr-mod-prose">{@html data.overviewHtml}</div>
        {/if}

        {#if module.lessons.length}
          <section class="pr-mod-lessons-section" aria-labelledby="lessons-title">
            <div class="pr-mod-section-head">
              <h2 id="lessons-title">Lessons</h2>
              <span>{module.lessons.length} total</span>
            </div>
            <ol class="pr-mod-lessons">
              {#each module.lessons as l (l.phase_no)}
                <li class:pr-mod-lesson-done={doneSet.has(l.phase_no)}>
                  <a href={`/practice/${module.module}/${l.phase_no}`}>
                    <span class="pr-mod-lesson-number">
                      {#if doneSet.has(l.phase_no)}<i class="ti ti-check" aria-label="Completed"></i>{:else}{String(l.phase_no).padStart(2, '0')}{/if}
                    </span>
                    <span class="pr-mod-lesson-title">{l.title}</span>
                    <i class="ti ti-arrow-up-right pr-mod-lesson-arrow" aria-hidden="true"></i>
                  </a>
                </li>
              {/each}
            </ol>
          </section>
        {/if}

        {#if allDone}
          <p class="pr-mod-done-msg">
            <i class="ti ti-circle-check" aria-hidden="true"></i>
            You've completed all {module.lessons.length} lessons in {module.title}.
            {#if nextModule}<a href={`/practice/${nextModule.module}`}>Continue to {nextModule.title} <i class="ti ti-arrow-right" aria-hidden="true"></i></a>{/if}
          </p>
        {/if}
      </div>
    </div>
  </div>
{/key}

<style>
  .pr-mod-shell {
    position: fixed;
    top: var(--practice-header-offset, 57px);
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
    max-width: 760px;
    margin: 0 auto;
    padding: 2.4rem 1.5rem 4rem;
  }

  .pr-back {
    font-size: 0.88rem;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding: 1.4rem 0 1.7rem;
    border-bottom: 1px solid var(--line);
  }
  .pr-mod-title {
    font-family: var(--font-display);
    font-size: 2.25rem;
    line-height: 1.08;
    letter-spacing: -0.03em;
    margin: 0;
  }
  .pr-mod-summary {
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.65;
    max-width: 55ch;
    margin: 0.65rem 0 0;
  }
  .pr-mod-meta {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--faint);
    white-space: nowrap;
  }
  .pr-mod-next {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.15rem 0;
    border-bottom: 1px solid var(--line);
  }
  .pr-mod-next div {
    display: grid;
    gap: 0.2rem;
  }
  .pr-mod-next strong {
    font-size: 1rem;
    color: var(--ink);
  }
  .pr-mod-next span {
    font-size: 0.86rem;
    color: var(--muted);
  }

  .pr-mod-prose :global(p) {
    line-height: 1.72;
    color: var(--body);
  }
  .pr-mod-prose {
    max-width: 68ch;
    margin: 1.9rem 0 0;
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

  .pr-mod-lessons-section {
    margin-top: 2.5rem;
  }
  .pr-mod-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.55rem;
  }
  .pr-mod-section-head h2 {
    font-family: var(--font-display);
    font-size: 1.35rem;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .pr-mod-section-head span {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--faint);
  }
  .pr-mod-lessons {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .pr-mod-lessons li {
    border-bottom: 1px solid var(--line);
  }
  .pr-mod-lessons a {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 0.2rem;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 1rem;
    color: var(--ink);
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .pr-mod-lessons a:hover {
    color: var(--accent);
    text-decoration: none;
  }
  .pr-mod-lesson-number {
    font-family: var(--font-mono);
    font-size: 0.76rem;
    color: var(--faint);
  }
  .pr-mod-lesson-done .pr-mod-lesson-number {
    color: var(--accent);
  }
  .pr-mod-lesson-title {
    min-width: 0;
  }
  .pr-mod-lesson-arrow {
    color: var(--faint);
    font-size: 1rem;
    transition: transform 0.15s var(--ease), color 0.15s var(--ease);
  }
  .pr-mod-lessons a:hover .pr-mod-lesson-arrow {
    color: var(--accent);
    transform: translate(2px, -2px);
  }

  .pr-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-body);
    font-size: 0.9rem;
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
  :global(:root[data-mode="dark"]) .pr-btn-primary,
  :global(:root[data-mode="dark"]) .pr-btn-primary:hover {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
    color: var(--bg);
  }
  .pr-mod-done-msg {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.4rem 0.55rem;
    color: var(--body);
    font-size: 0.92rem;
    margin: 1.35rem 0 0;
    padding: 0.9rem 0;
    border-top: 1px solid var(--line);
  }
  .pr-mod-done-msg > .ti { color: var(--accent); margin-top: 0.12rem; }
  .pr-mod-done-msg a {
    color: var(--accent);
    white-space: nowrap;
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
    .pr-mod-head {
      display: block;
      padding: 1.15rem 0 1.35rem;
    }
    .pr-mod-title {
      font-size: 2rem;
    }
    .pr-mod-meta {
      margin-top: 1rem;
    }
    .pr-mod-next {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
