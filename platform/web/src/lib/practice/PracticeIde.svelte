<script>
  import { onMount } from 'svelte';
  import PracticeSidebar from './PracticeSidebar.svelte';
  import { bumpProgress } from './progress.js';
  import { recordActivity } from '$lib/streaks.js';

  // One instance per lesson - the parent route wraps us in {#key `${guide_slug}/${phase_no}`}
  // so navigating between lessons destroys and recreates this component, which is what
  // gives every piece of state below (editor contents, hints, run/grade results, ...) a
  // clean reset for free instead of a hand-rolled "reset all state" function.
  export let lesson;
  export let lessonHtml;
  export let phase;
  export let guide;
  export let phases;
  export let moduleParam;
  export let modules = [];
  export let related = null;

  const LANG_LABEL = { sql: 'SQL', js: 'JavaScript', python: 'Python', typescript: 'TypeScript', git: 'Git', postgres: 'PostgreSQL', wat: 'WAT', math: 'Math' };
  $: langLabel = LANG_LABEL[lesson.language] || lesson.language;

  $: storageKey = `tmm-practice:${phase.guide_slug}/${phase.phase_no}`;
  $: idx = phases.findIndex((p) => p.phase_no === phase.phase_no);
  $: total = phases.length;
  $: prevPhase = idx > 0 ? phases[idx - 1] : null;
  $: nextPhase = idx >= 0 && idx < total - 1 ? phases[idx + 1] : null;

  // SSR always renders starterCode (localStorage isn't available server-side) - the
  // editor host below also renders a matching <pre> fallback so the starter code is
  // present in the raw SSR HTML, not just after hydration.
  let code = lesson.starterCode;
  let done = false;
  let hintsShown = 0;
  let solutionRevealed = false;
  let lessonOpen = true;

  let running = false;
  let loadingStatus = '';
  let runResult = null;
  let gradeResult = null;

  let editorHost;
  let editor = null;
  let runLessonFn;
  let gradeLessonFn;
  let adapter;

  // Panel widths as % of the ide container; center (editor) column takes the
  // remainder. Defaults ~32/40/28 lesson/editor/output - see the min-width
  // constants below (and the report) for the 901px/1100px arithmetic behind
  // both these defaults and the floors.
  let leftPct = 32;
  let rightPct = 28;
  let containerEl;

  // Panel floors in px - single source of truth for the CSS min-widths
  // (below, in <style>), the drag handler, keyboard nudging, and the on-load
  // clamp of a stale localStorage save.
  const LESSON_MIN = 190;
  const EDITOR_MIN = 250;
  const OUTPUT_MIN = 190;

  // Current min-widths as % of the ide container (not the viewport - the
  // container is already "viewport minus the practice rail", which is what
  // the drag math needs). All-zero if the container isn't measurable yet.
  function panelBounds() {
    const width = containerEl ? containerEl.getBoundingClientRect().width : 0;
    if (!width) return { minLeft: 0, minCenter: 0, minRight: 0 };
    return {
      minLeft: (LESSON_MIN / width) * 100,
      minCenter: (EDITOR_MIN / width) * 100,
      minRight: (OUTPUT_MIN / width) * 100
    };
  }

  // Clamps leftPct/rightPct (just loaded from defaults or a stale
  // tmm-practice-panels save) to the current mins - same bounds math as
  // beginDrag below. A save from before this change, or from a much
  // wider/narrower window, can no longer force a panel under its floor.
  function clampPanels() {
    const { minLeft, minCenter, minRight } = panelBounds();
    if (!minLeft && !minCenter && !minRight) return; // container not measurable
    const maxLeft = Math.max(minLeft, 100 - rightPct - minCenter);
    leftPct = Math.min(Math.max(leftPct, minLeft), maxLeft);
    const maxRight = Math.max(minRight, 100 - leftPct - minCenter);
    rightPct = Math.min(Math.max(rightPct, minRight), maxRight);
  }

  function persist(patch) {
    let cur = {};
    try {
      cur = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch (e) {}
    const next = { done: cur.done || false, code: cur.code ?? null, ts: Date.now(), ...patch };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {}
    if (Object.prototype.hasOwnProperty.call(patch, 'done')) {
      done = !!patch.done;
    }
  }

  function savePanels() {
    try {
      localStorage.setItem('tmm-practice-panels', JSON.stringify({ left: leftPct, right: rightPct }));
    } catch (e) {}
  }

  async function handleRun() {
    if (running || !editor) return;
    running = true;
    loadingStatus = '';
    runResult = null;
    gradeResult = null;
    const currentCode = editor.getValue();
    persist({ code: currentCode });
    try {
      runResult = await runLessonFn(lesson, currentCode, {
        onStatus: (s) => (loadingStatus = s || '')
      });
      loadingStatus = '';
      gradeResult = await gradeLessonFn(lesson, currentCode);
      if (gradeResult.passed) {
        persist({ done: true });
        bumpProgress();
        recordActivity();
      }
    } catch (e) {
      runResult = { ok: false, error: String((e && e.message) || e) };
    } finally {
      running = false;
      loadingStatus = '';
    }
  }

  function handleReset() {
    if (!editor) return;
    editor.setValue(lesson.starterCode);
    persist({ code: null });
    runResult = null;
    gradeResult = null;
  }

  function revealSolution() {
    solutionRevealed = true;
  }
  function loadSolution() {
    if (!editor) return;
    editor.setValue(lesson.solution);
    persist({ code: lesson.solution });
  }
  function showHint() {
    hintsShown = Math.min(hintsShown + 1, lesson.hints.length);
  }

  function beginDrag(which, e) {
    e.preventDefault();
    const rect = containerEl.getBoundingClientRect();
    const startX = e.clientX;
    const startLeft = leftPct;
    const startRight = rightPct;
    const { minLeft, minCenter, minRight } = panelBounds();

    function onMove(ev) {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      if (which === 'left') {
        const maxLeft = Math.max(minLeft, 100 - startRight - minCenter);
        leftPct = Math.min(Math.max(startLeft + dxPct, minLeft), maxLeft);
      } else {
        const maxRight = Math.max(minRight, 100 - startLeft - minCenter);
        rightPct = Math.min(Math.max(startRight - dxPct, minRight), maxRight);
      }
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      savePanels();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function nudgeDivider(which, e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 2 : -2;
    const { minLeft, minCenter, minRight } = panelBounds();
    if (which === 'left') {
      const maxLeft = Math.max(minLeft, 100 - rightPct - minCenter);
      leftPct = Math.min(Math.max(leftPct + delta, minLeft), maxLeft);
    } else {
      const maxRight = Math.max(minRight, 100 - leftPct - minCenter);
      rightPct = Math.min(Math.max(rightPct - delta, minRight), maxRight);
    }
    savePanels();
  }

  onMount(() => {
    let destroyed = false;
    let saveTimer = null;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.code === 'string') code = saved.code;
      done = !!(saved && saved.done);
    } catch (e) {}

    try {
      const panels = JSON.parse(localStorage.getItem('tmm-practice-panels') || 'null');
      if (panels && Number.isFinite(panels.left) && Number.isFinite(panels.right)) {
        leftPct = panels.left;
        rightPct = panels.right;
      }
    } catch (e) {}
    // containerEl is already bound (refs are set before onMount runs) - clamp
    // whatever we just loaded (defaults or a stale pre-v1.2 save) to the
    // current mins so an old percentage can't force a panel under its floor.
    clampPanels();

    (async () => {
      const [editorMod, runnerMod, adaptersMod] = await Promise.all([
        import('$lib/runnable/editor.js'),
        import('$lib/practice/runners.js'),
        import('$lib/runnable/adapters.js')
      ]);
      if (destroyed) return;
      runLessonFn = runnerMod.runLesson;
      gradeLessonFn = runnerMod.gradeLesson;
      adapter = adaptersMod.getAdapter(lesson.language);

      editor = editorMod.createEditor({ parent: editorHost, doc: code, langExtension: null });
      adapter
        .cmLang()
        .then((ext) => {
          if (!destroyed && editor) editor.setLanguage(ext);
        })
        .catch(() => {});

      let lastSaved = code;
      saveTimer = setInterval(() => {
        if (!editor) return;
        const v = editor.getValue();
        if (v !== lastSaved) {
          lastSaved = v;
          persist({ code: v });
        }
      }, 1500);
    })();

    const themeObserver = new MutationObserver((muts) => {
      if (muts.some((m) => m.attributeName === 'data-theme') && editor) editor.refreshTheme();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function onKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener('keydown', onKeydown);

    // Synchronous cleanup (mirrors RunnableCode.svelte): runs on every lesson nav,
    // since this component lives inside the parent's {#key} block. The language
    // runtime adapter itself is NOT disposed here - it's memoised per-page in
    // adapters.js so the next lesson (same language) reuses it instead of reloading
    // Pyodide/sql.js from scratch.
    return () => {
      destroyed = true;
      window.removeEventListener('keydown', onKeydown);
      themeObserver.disconnect();
      if (saveTimer) clearInterval(saveTimer);
      if (editor) editor.destroy();
    };
  });
</script>

<div class="pr-ide-shell">
  <PracticeSidebar {modules} activeModule={moduleParam} activePhase={phase.phase_no} />

  <div class="pr-ide" bind:this={containerEl}>
  <aside class="pr-lesson" style={`width:${leftPct}%`}>
    <div class="pr-lesson-sticky">
      <div class="pr-lesson-head">
        <a class="pr-back" href="/practice"><i class="ti ti-chevron-left" aria-hidden="true"></i> {guide.title}</a>
        <span class="pr-progress-tag">{idx + 1}/{total}</span>
        <h1 class="pr-lesson-title">{phase.title}</h1>
        <button
          type="button"
          class="pr-lesson-toggle icon-btn"
          on:click={() => (lessonOpen = !lessonOpen)}
          aria-expanded={lessonOpen}
          aria-controls="pr-lesson-body"
          aria-label={lessonOpen ? 'Collapse lesson' : 'Expand lesson'}
        >
          <i class="ti {lessonOpen ? 'ti-chevron-up' : 'ti-chevron-down'}" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div id="pr-lesson-body" class="pr-lesson-body" class:pr-collapsed={!lessonOpen}>
      <div class="pr-prose">{@html lessonHtml}</div>

      {#if lesson.hints && lesson.hints.length}
        <div class="pr-hints">
          {#each lesson.hints.slice(0, hintsShown) as hint, i}
            <p class="pr-hint"><strong>Hint {i + 1}.</strong> {hint}</p>
          {/each}
          {#if hintsShown < lesson.hints.length}
            <button type="button" class="pr-btn pr-btn-ghost" on:click={showHint}>
              <i class="ti ti-bulb" aria-hidden="true"></i>
              {hintsShown === 0 ? 'Show a hint' : 'Show another hint'}
            </button>
          {/if}
        </div>
      {/if}

      <div class="pr-solution">
        {#if !solutionRevealed}
          <button type="button" class="pr-btn pr-btn-ghost" on:click={revealSolution}>
            <i class="ti ti-eye" aria-hidden="true"></i> Show solution
          </button>
        {:else}
          <p class="pr-solution-label">Solution</p>
          <pre class="pr-solution-code">{lesson.solution}</pre>
          <button type="button" class="pr-btn" on:click={loadSolution}>Load into editor</button>
        {/if}
      </div>

      {#if related}
        <p class="pr-related">
          <a href={`/guides/${related.slug}/${related.phaseNo}`}>Related reading: {related.title} →</a>
        </p>
      {/if}

      <nav class="pr-lesson-nav" aria-label="Lesson navigation">
        {#if prevPhase}
          <a href={`/practice/${moduleParam}/${prevPhase.phase_no}`}><i class="ti ti-arrow-left" aria-hidden="true"></i> Previous</a>
        {:else}
          <span></span>
        {/if}
        {#if nextPhase}
          <a href={`/practice/${moduleParam}/${nextPhase.phase_no}`}>Next <i class="ti ti-arrow-right" aria-hidden="true"></i></a>
        {/if}
      </nav>
    </div>
  </aside>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="pr-divider"
    role="separator"
    aria-orientation="vertical"
    aria-label="Resize lesson panel"
    tabindex="0"
    on:pointerdown={(e) => beginDrag('left', e)}
    on:keydown={(e) => nudgeDivider('left', e)}
  ></div>

  <section class="pr-editor-col">
    <div class="pr-toolbar">
      <span class="pr-lang-tag">{langLabel}</span>
      <div class="pr-toolbar-actions">
        <button type="button" class="pr-btn" on:click={handleReset}>
          <i class="ti ti-rotate" aria-hidden="true"></i> Reset
        </button>
        <button type="button" class="pr-btn pr-btn-primary" on:click={handleRun} disabled={running} title="Ctrl/Cmd+Enter">
          <i class="ti ti-player-play" aria-hidden="true"></i> {running ? 'Running…' : 'Run'}
        </button>
      </div>
    </div>
    <div class="pr-editor-wrap">
      {#if !editor}
        <pre class="pr-editor-fallback">{code}</pre>
      {/if}
      <div class="pr-editor-host" class:pr-hidden={!editor} bind:this={editorHost}></div>
    </div>
  </section>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="pr-divider"
    role="separator"
    aria-orientation="vertical"
    aria-label="Resize output panel"
    tabindex="0"
    on:pointerdown={(e) => beginDrag('right', e)}
    on:keydown={(e) => nudgeDivider('right', e)}
  ></div>

  <aside class="pr-output" style={`width:${rightPct}%`}>
    <div class="pr-panel-head">Output</div>
    <div class="pr-output-body" aria-live="polite">
      {#if running}
        <div class="pr-loading"><span class="pr-spinner"></span><span>{loadingStatus || 'Running…'}</span></div>
      {:else if runResult}
        {#if runResult.preview != null}
          <!-- Sandboxed with no allow-scripts, so nothing in the page runs; it is
               only ever rendered, never executed. srcdoc loads no URL, so the
               site's frame-src (translate.google.com only) doesn't gate it. -->
          <iframe
            class="pr-preview"
            title="Preview of your page"
            sandbox=""
            srcdoc={runResult.preview}
          ></iframe>
        {/if}
        {#if runResult.table}
          <div class="pr-table-wrap">
            <table class="pr-table">
              <thead>
                <tr>
                  {#each runResult.table.columns as c}<th>{c}</th>{/each}
                </tr>
              </thead>
              <tbody>
                {#each runResult.table.rows as row}
                  <tr>
                    {#each row as cell}
                      <td class:pr-null={cell === null}>{cell === null ? 'NULL' : cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
        {#if runResult.logs}
          <pre class="pr-out pr-stdout">{runResult.logs}</pre>
        {/if}
        {#if runResult.result != null && runResult.result !== ''}
          <pre class="pr-out pr-result">⇒ {runResult.result}</pre>
        {/if}
        {#if runResult.error}
          <pre class="pr-out pr-stderr">{runResult.errorLine ? `Line ${runResult.errorLine}: ` : ''}{runResult.error}</pre>
        {/if}
        {#if runResult.timeMs != null}
          <p class="pr-time">Ran in {runResult.timeMs}ms</p>
        {/if}

        {#if gradeResult?.mode === 'tests' && gradeResult.tests?.length}
          <ul class="pr-checklist">
            {#each gradeResult.tests as t}
              <li class:pr-pass={t.passed} class:pr-fail={!t.passed}>
                <i class="ti {t.passed ? 'ti-check' : 'ti-x'}" aria-hidden="true"></i>
                <span>{t.name}</span>
                {#if !t.passed && t.message}<span class="pr-test-msg">{t.message}</span>{/if}
              </li>
            {/each}
          </ul>
        {/if}

        {#if gradeResult?.passed}
          <div class="pr-success">
            <p><i class="ti ti-circle-check" aria-hidden="true"></i> Completed</p>
            {#if nextPhase}
              <a class="pr-btn pr-btn-primary" href={`/practice/${moduleParam}/${nextPhase.phase_no}`}>
                Next lesson <i class="ti ti-arrow-right" aria-hidden="true"></i>
              </a>
            {:else}
              <a class="pr-btn pr-btn-primary" href="/practice">
                Back to Practice <i class="ti ti-arrow-right" aria-hidden="true"></i>
              </a>
            {/if}
          </div>
        {:else if gradeResult && !gradeResult.passed && gradeResult.mode !== 'tests' && gradeResult.detail && !runResult.error}
          <p class="pr-grade-note">{gradeResult.detail}</p>
        {/if}
      {:else if done}
        <p class="pr-placeholder"><i class="ti ti-circle-check" aria-hidden="true"></i> Already completed - run again anytime, or move on.</p>
      {:else}
        <p class="pr-placeholder">Run your code to see the output here.</p>
      {/if}
    </div>
  </aside>
  </div>
</div>

<style>
  .pr-ide-shell {
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

  /* The 3 original panels live in their own flex row, sized to whatever width is
     left after PracticeSidebar's fixed rail - so their existing width:NN% (set via
     leftPct/rightPct below) keeps resolving against "space left for the IDE", not
     the full shell width, and none of that percentage/drag math has to change. */
  .pr-ide {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    overflow: hidden;
  }

  /* -- lesson panel ------------------------------------------------------- */
  .pr-lesson {
    min-width: 190px; /* LESSON_MIN above */
    overflow-y: auto;
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
  }
  .pr-lesson-sticky {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
    padding: 1rem 1.1rem;
  }
  .pr-lesson-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .pr-back {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .pr-back:hover {
    color: var(--accent);
  }
  .pr-progress-tag {
    flex: none;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--faint);
  }
  .pr-lesson-toggle {
    display: none;
    flex: none;
    width: 28px;
    height: 28px;
  }
  /* Consolidated onto the same row as the back-link/progress tag (used to be
     its own row below, at 1.25rem) - grows to fill the remainder, with its
     own ellipsis as a safety net for a long title on a narrow panel. */
  .pr-lesson-title {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding-left: 0.65rem;
    border-left: 1px solid var(--line);
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pr-lesson-body {
    padding: 1.1rem;
  }
  /* Compact scale for lesson prose - reader-like but tighter, since this panel
     is much narrower than the reader's 720px column: body ~0.92rem vs the
     reader's 17px base, headings scaled/tightened to match (app.css
     `.reader h1/h2/h3`, line ~1585-1600, is the full-size reference these are
     a compact take on). 62ch caps the line length so a wide lesson panel (or
     a >=1600px monitor) doesn't turn into a huge sparse column of text; left-
     aligned rather than centered so it reads consistently with the full-width
     hint/solution/nav blocks that follow it. */
  .pr-prose {
    font-size: 0.92rem;
    max-width: 62ch;
  }
  .pr-prose :global(h1) {
    font-size: 1.2rem;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin: 0 0 0.5rem;
  }
  .pr-prose :global(h2) {
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    line-height: 1.3;
    margin: 1.3rem 0 0.4rem;
  }
  .pr-prose :global(h3) {
    font-size: 0.96rem;
    line-height: 1.3;
    margin: 1.1rem 0 0.35rem;
  }
  .pr-prose :global(p) {
    line-height: 1.65;
    color: var(--body);
  }
  .pr-prose :global(pre) {
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 10px;
    padding: 0.7rem 0.8rem;
    overflow-x: auto;
    font-size: 0.8rem;
  }
  .pr-prose :global(code) {
    font-family: var(--font-mono);
    font-size: 0.86em;
  }
  .pr-prose :global(:not(pre) > code) {
    background: var(--surface);
    color: var(--accent-strong);
    border-radius: 5px;
    padding: 0.1em 0.35em;
  }

  .pr-hints {
    margin-top: 1rem;
  }
  /* The preview is the lesson for HTML/CSS, so it gets the room. White background
     always: the learner is styling a page, and it should look like the page they
     are building, not inherit whatever theme they happen to be reading in. */
  .pr-preview {
    width: 100%;
    height: 320px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: #fff;
    display: block;
    margin: 0 0 0.6rem;
  }

  .pr-hint {
    font-size: 0.9rem;
    color: var(--body);
    background: var(--surface);
    border-radius: 9px;
    padding: 0.6rem 0.8rem;
    margin: 0 0 0.5rem;
    line-height: 1.55;
  }
  .pr-solution {
    margin-top: 1rem;
  }
  .pr-solution-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 0.4rem;
  }
  .pr-solution-code {
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
    border-radius: 10px;
    padding: 0.8rem 0.9rem;
    overflow-x: auto;
    white-space: pre;
    margin: 0 0 0.6rem;
  }

  .pr-related {
    margin: 1rem 0 0;
    font-size: 0.82rem;
  }
  .pr-related a {
    color: var(--muted);
  }
  .pr-related a:hover {
    color: var(--accent);
  }

  .pr-lesson-nav {
    display: flex;
    justify-content: space-between;
    margin-top: 1.3rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--line);
    font-size: 0.86rem;
  }
  .pr-lesson-nav a {
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .pr-lesson-nav a:hover {
    color: var(--accent);
  }

  /* -- divider -------------------------------------------------------- */
  .pr-divider {
    flex: none;
    width: 6px;
    cursor: col-resize;
    position: relative;
    touch-action: none;
  }
  .pr-divider::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 2px;
    width: 2px;
    background: var(--line);
    transition: background 0.15s var(--ease);
  }
  .pr-divider:hover::after,
  .pr-divider:focus-visible::after {
    background: var(--accent);
  }
  .pr-divider:focus-visible {
    outline: none;
  }

  /* -- editor column ---------------------------------------------------- */
  .pr-editor-col {
    flex: 1 1 auto;
    min-width: 250px; /* EDITOR_MIN above */
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .pr-toolbar {
    position: sticky;
    top: 0;
    z-index: 2;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 0.65rem 0.5rem 0.9rem;
    border-bottom: 1px solid var(--line);
    /* background: color-mix(in srgb, var(--code-bg) 70%, var(--surface)); */
  }
  .pr-lang-tag {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .pr-toolbar-actions {
    display: flex;
    gap: 0.45rem;
  }
  .pr-editor-wrap {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
    background: var(--code-bg);
  }
  .pr-editor-host {
    height: 100%;
    overflow: auto;
  }
  .pr-editor-host.pr-hidden {
    display: none;
  }
  .pr-editor-fallback {
    margin: 0;
    padding: 0.9rem 1rem;
    color: var(--code-fg);
    font-family: var(--font-mono);
    font-size: 0.86rem;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* -- output panel ------------------------------------------------------- */
  .pr-output {
    min-width: 190px; /* OUTPUT_MIN above */
    overflow-y: auto;
    border-left: 1px solid var(--line);
    display: flex;
    flex-direction: column;
  }
  .pr-panel-head {
    position: sticky;
    top: 0;
    z-index: 2;
    flex: none;
    padding: 1rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }
  .pr-output-body {
    padding: 0.6rem 0.9rem;
    flex: 1 1 auto;
  }
  .pr-placeholder {
    color: var(--faint);
    font-size: 0.88rem;
  }
  .pr-loading {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.82rem;
    color: var(--muted);
  }
  .pr-spinner {
    width: 13px;
    height: 13px;
    border: 2px solid var(--line);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: pr-spin 0.7s linear infinite;
    flex: none;
  }
  @keyframes pr-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pr-spinner {
      animation-duration: 1.6s;
    }
  }

  .pr-out {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
    margin: 0 0 0.6rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .pr-stdout {
    color: var(--body);
  }
  .pr-result {
    color: var(--accent-strong);
  }
  .pr-stderr {
    color: var(--danger-strong);
  }
  .pr-time {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--faint);
    margin: 0 0 0.8rem;
  }

  .pr-table-wrap {
    overflow-x: auto;
    margin: 0 0 0.6rem;
  }
  .pr-table {
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    width: auto;
  }
  .pr-table th,
  .pr-table td {
    border: 1px solid var(--line);
    padding: 0.3rem 0.6rem;
    text-align: left;
    color: var(--body);
  }
  .pr-table th {
    background: var(--surface);
    color: var(--ink);
    font-weight: 600;
  }
  .pr-table .pr-null {
    color: var(--faint);
    font-style: italic;
  }

  .pr-checklist {
    list-style: none;
    margin: 0 0 0.8rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .pr-checklist li {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    font-size: 0.86rem;
    color: var(--body);
  }
  .pr-checklist .ti {
    flex: none;
  }
  .pr-checklist li.pr-pass .ti {
    color: #2e9e6b;
  }
  .pr-checklist li.pr-fail .ti {
    color: var(--danger-strong);
  }
  .pr-test-msg {
    color: var(--faint);
    font-size: 0.78rem;
  }
  .pr-grade-note {
    font-size: 0.86rem;
    color: var(--muted);
    background: var(--surface);
    border-radius: 9px;
    padding: 0.6rem 0.8rem;
  }

  .pr-success {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.7rem;
    background: color-mix(in srgb, #2e9e6b 12%, var(--surface));
    border: 1px solid color-mix(in srgb, #2e9e6b 35%, var(--line));
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    margin-top: 0.4rem;
  }
  .pr-success p {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #1f7a52;
    font-weight: 600;
  }

  /* -- shared buttons ---------------------------------------------------- */
  .pr-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--body);
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 0.32rem 0.55rem;
    cursor: pointer;
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease), background 0.15s var(--ease);
  }
  .pr-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .pr-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .pr-btn-primary {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
    padding: 0.32rem 0.8rem;
  }
  .pr-btn-primary:hover:not(:disabled) {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
    color: #fff;
  }
  .pr-btn-primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .pr-btn-ghost {
    background: none;
    color: var(--accent);
    border-color: transparent;
  }

  /* -- ≤900px: vertical stack, no drag, collapsible lesson, sticky Run ---- */
  @media (max-width: 900px) {
    .pr-ide-shell {
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .pr-ide {
      flex: none;
      flex-direction: column;
      overflow: visible;
    }
    .pr-lesson,
    .pr-editor-col,
    .pr-output {
      width: 100% !important;
      min-width: 0;
      flex: none;
      overflow: visible;
    }
    .pr-editor-col {
      min-height: 420px;
    }
    .pr-divider {
      display: none;
    }
    .pr-lesson-toggle {
      display: inline-grid;
    }
    .pr-lesson-body.pr-collapsed {
      display: none;
    }
  }
</style>
