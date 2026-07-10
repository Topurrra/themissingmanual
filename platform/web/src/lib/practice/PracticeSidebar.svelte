<script>
  import { onMount } from 'svelte';
  import { progressBump } from './progress.js';
  import { practiceRailCollapsed, syncPracticeRail } from './sidebar-store.js';

  // modules: [{ slug, module, title, summary, difficulty, lessons: [{phase_no, title}] }]
  // activeModule: short module slug ("sql") or null. activePhase: lesson number or null.
  export let modules = [];
  export let activeModule = null;
  export let activePhase = null;

  // Per-module accordion. The active module starts expanded; others open/close on
  // click. Both host pages wrap their content in a per-module/lesson {#key}, so this
  // component remounts (and re-picks its default) on every navigation - no need to
  // react to activeModule changing under an existing instance.
  let openModules = new Set(activeModule ? [activeModule] : []);
  function toggleModule(mod) {
    if (openModules.has(mod)) openModules.delete(mod);
    else openModules.add(mod);
    openModules = openModules; // reassign so Svelte re-renders
  }

  // done-state, keyed "<module>/<phase_no>" -> true. Empty during SSR (no
  // localStorage there); filled in onMount and refreshed whenever progressBump
  // fires (a lesson was just completed elsewhere on the same mounted page, e.g.
  // inside the IDE this rail is docked in).
  let doneMap = {};
  function readDone() {
    const out = {};
    for (const m of modules) {
      for (const l of m.lessons) {
        try {
          const saved = JSON.parse(localStorage.getItem(`tmm-practice:${m.slug}/${l.phase_no}`) || 'null');
          if (saved?.done) out[`${m.module}/${l.phase_no}`] = true;
        } catch (e) {}
      }
    }
    doneMap = out;
  }
  // doneMap is passed as an argument (not closed over) so the template call sites
  // visibly depend on it - Svelte only re-renders an expression when a variable
  // NAMED IN IT changes, and a closure-captured doneMap is invisible to that.
  const doneCount = (m, dm) => m.lessons.filter((l) => dm[`${m.module}/${l.phase_no}`]).length;

  // Whole-rail collapse now lives in sidebar-store.js so the header toggle button
  // (+layout.svelte) can drive the same flag - this component just renders it.
  onMount(() => {
    syncPracticeRail();
    readDone();
    const unsub = progressBump.subscribe(readDone);
    return unsub;
  });
</script>

<aside class="pr-sidebar" class:pr-collapsed={$practiceRailCollapsed}>
  <nav class="pr-sidebar-nav" aria-label="Practice modules">
    {#each modules as m (m.slug)}
      {@const open = openModules.has(m.module)}
      <div class="pr-module" class:pr-module-active={m.module === activeModule}>
        <button type="button" class="pr-module-head" on:click={() => toggleModule(m.module)} aria-expanded={open}>
          <i class="ti ti-chevron-right pr-module-chev" class:pr-chev-open={open} aria-hidden="true"></i>
          <span class="pr-module-title">{m.title}</span>
          <span class="pr-module-count">{doneCount(m, doneMap)}/{m.lessons.length}</span>
        </button>
        {#if open}
          <ul class="pr-lesson-list">
            {#each m.lessons as l (l.phase_no)}
              {@const current = m.module === activeModule && l.phase_no === activePhase}
              <li>
                <a
                  class="pr-lesson-row"
                  class:pr-lesson-current={current}
                  href={`/practice/${m.module}/${l.phase_no}`}
                  aria-current={current ? 'page' : undefined}
                >
                  <span class="pr-lesson-num">
                    {#if doneMap[`${m.module}/${l.phase_no}`]}<i class="ti ti-check" aria-hidden="true"></i>{:else}{l.phase_no}{/if}
                  </span>
                  <span class="pr-lesson-title">{l.title}</span>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </nav>
</aside>

<style>
  /* Same background/border/width/collapse treatment as the reader sidebar
     (app.css .sidebar + .shell.collapsed .sidebar, ~line 835-855) - minus the
     sticky/height rules, which are reader-only (that shell scrolls the page;
     the practice shell is already position:fixed and flex-stretches its
     children to full height). Collapsed = fully hidden (width 0), not a strip. */
  .pr-sidebar {
    flex: none;
    width: var(--rail);
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid var(--line);
    background: var(--bg);
    padding: 1.2rem 0.9rem 2rem;
    transition:
      width 0.3s var(--ease),
      opacity 0.24s var(--ease),
      padding 0.3s var(--ease),
      border-color 0.2s var(--ease);
  }
  .pr-sidebar.pr-collapsed {
    width: 0;
    opacity: 0;
    padding-left: 0;
    padding-right: 0;
    border-color: transparent;
    pointer-events: none;
  }

  /* app.css .sidebar-nav, line ~886-888 */
  .pr-sidebar-nav {
    font-size: 0.95rem;
  }

  .pr-module + .pr-module {
    margin-top: 2px;
  }

  /* Module header = the reader's collapsible sub-group row (app.css .nav-group
     family, line ~1076-1122: languages nested under a category like Frameworks) -
     same chevron + name + count shape, so it gets the exact same treatment. */
  .pr-module-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.7rem;
    margin-top: 2px;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    border-radius: 9px;
  }
  .pr-module-head:hover {
    background: var(--surface);
  }
  .pr-module-active > .pr-module-head {
    font-weight: 600;
  }
  .pr-module-chev {
    font-size: 16px;
    flex: none;
    color: var(--faint);
    transition: transform 0.15s var(--ease);
  }
  .pr-module-chev.pr-chev-open {
    transform: rotate(90deg);
  }
  .pr-module-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pr-module-count {
    flex: none;
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    color: var(--faint);
  }

  /* Lesson list = the reader's nested sub-group indent (app.css .nav-sub, line
     ~1124-1128). */
  .pr-lesson-list {
    list-style: none;
    margin: 2px 0 6px 0.7rem;
    padding: 0 0 0 0.55rem;
    border-left: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  /* Lesson row = the reader's core link-row pattern (app.css .nav-items a /
     a:hover / a.on, line ~923-957) - same padding, radius, hover and active
     colors as every other row in the app. */
  .pr-lesson-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 0.7rem;
    border-radius: 9px;
    color: var(--muted);
    line-height: 1.4;
    transition:
      color 0.15s var(--ease),
      background 0.15s var(--ease);
  }
  .pr-lesson-row:hover {
    color: var(--ink);
    background: var(--surface);
    text-decoration: none;
  }
  .pr-lesson-current {
    color: var(--accent);
    background: var(--accent-tint);
    font-weight: 500;
  }
  .pr-lesson-current:hover {
    color: var(--accent);
  }
  .pr-lesson-num {
    flex: none;
    width: 16px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--faint);
    text-align: center;
  }
  .pr-lesson-current .pr-lesson-num {
    color: var(--accent);
  }
  .pr-lesson-num .ti {
    font-size: 13px;
    color: #2e9e6b;
  }
  .pr-lesson-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* <=900px: stacked disclosure above the content instead of a side rail - full
     width, no vertical border. Collapsed by default (syncPracticeRail); the
     shared header button is the only expand/collapse affordance (no more
     internal chevron), so collapse here shrinks height, not width. */
  @media (max-width: 900px) {
    .pr-sidebar {
      width: 100%;
      max-height: 60vh;
      border-right: none;
      border-bottom: 1px solid var(--line);
      transition:
        max-height 0.3s var(--ease),
        opacity 0.24s var(--ease),
        padding 0.3s var(--ease),
        border-color 0.2s var(--ease);
    }
    .pr-sidebar.pr-collapsed {
      width: 100%;
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      border-color: transparent;
    }
  }
</style>
