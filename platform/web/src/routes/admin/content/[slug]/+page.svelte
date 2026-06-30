<script>
  import { adminGet, adminPatch, adminPost, adminDelete, adminUpload, adminPreview } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';
  import { diffLines } from '$lib/diff.js';

  export let data;
  $: ({ guide, phases, categories } = data);

  // ---- metadata ----
  let meta = { ...data.guide };
  let lastSlug = data.guide.slug;
  $: if (data.guide.slug !== lastSlug) {
    meta = { ...data.guide };
    lastSlug = data.guide.slug;
    current = null;
    previewHtml = '';
    resetHistory();
  }
  let metaMsg = '';
  async function saveMeta() {
    metaMsg = 'Saving…';
    try {
      await adminPatch(`/guides/${guide.slug}`, {
        title: meta.title,
        summary: meta.summary,
        category: meta.category,
        difficulty: meta.difficulty,
        status: meta.status
      });
      metaMsg = 'Saved';
      await invalidateAll();
    } catch (e) {
      metaMsg = e.message;
    }
  }
  async function togglePublish() {
    meta.status = meta.status === 'published' ? 'draft' : 'published';
    await saveMeta();
  }

  // ---- phases ----
  let current = null; // { phase_no, title, summary, markdown }
  let previewHtml = '';
  let phaseMsg = '';
  let ta;
  let previewTimer;

  async function openPhase(no) {
    resetHistory();
    const p = await adminGet(`/guides/${guide.slug}/phases/${no}`);
    current = { phase_no: p.phase_no, title: p.title, summary: p.summary, markdown: p.markdown };
    phaseMsg = '';
    schedulePreview();
  }
  async function addPhase() {
    const r = await adminPost(`/guides/${guide.slug}/phases`, {
      title: 'New phase',
      summary: '',
      markdown: '## New phase\n\nWrite here.'
    });
    await invalidateAll();
    await openPhase(r.phase_no);
  }
  async function savePhase() {
    if (!current) return;
    phaseMsg = 'Saving…';
    try {
      await adminPatch(`/guides/${guide.slug}/phases/${current.phase_no}`, {
        title: current.title,
        summary: current.summary,
        markdown: current.markdown
      });
      phaseMsg = 'Saved';
      await invalidateAll();
    } catch (e) {
      phaseMsg = e.message;
    }
  }
  let confirmDelPhase = null; // phase_no awaiting inline delete confirmation
  async function removePhase(no) {
    await adminDelete(`/guides/${guide.slug}/phases/${no}`);
    confirmDelPhase = null;
    if (current && current.phase_no === no) current = null;
    await invalidateAll();
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      if (!current) {
        previewHtml = '';
        return;
      }
      try {
        const r = await adminPreview(current.markdown);
        previewHtml = r.html;
      } catch {
        previewHtml = '';
      }
    }, 250);
  }

  function setMarkdown(next) {
    current = { ...current, markdown: next };
    schedulePreview();
  }
  function surround(before, after = before) {
    if (!current) return;
    const el = ta;
    const v = current.markdown;
    if (!el) return setMarkdown(v + before + after);
    const s = el.selectionStart;
    const e = el.selectionEnd;
    setMarkdown(v.slice(0, s) + before + v.slice(s, e) + after + v.slice(e));
  }
  function insert(text) {
    if (!current) return;
    const el = ta;
    const v = current.markdown;
    const s = el ? el.selectionStart : v.length;
    setMarkdown(v.slice(0, s) + text + v.slice(s));
  }
  async function uploadAndInsert(file) {
    if (!file) return;
    try {
      const { url } = await adminUpload(file);
      insert(`\n![](${url})\n`);
    } catch (e) {
      phaseMsg = e.message;
    }
  }
  async function onDrop(e) {
    e.preventDefault();
    await uploadAndInsert(e.dataTransfer?.files?.[0]);
  }
  async function onPaste(e) {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    await uploadAndInsert(item.getAsFile());
  }

  // ---- edit history (revisions) ----
  let historyOpen = false;
  let historyList = [];       // [{ id, created_at, title }] newest first
  let historyMsg = '';        // small status / error line for the list
  let selected = null;        // the fetched revision { id, created_at, title, markdown, ... }
  let selectedMsg = '';       // status / error for the detail pane
  let reverting = false;

  function resetHistory() {
    historyOpen = false;
    historyList = [];
    historyMsg = '';
    selected = null;
    selectedMsg = '';
    reverting = false;
  }

  async function loadHistory() {
    if (!current) return;
    historyMsg = 'Loading…';
    selected = null;
    selectedMsg = '';
    try {
      historyList = await adminGet(`/guides/${guide.slug}/phases/${current.phase_no}/revisions`);
      historyMsg = '';
    } catch (e) {
      historyList = [];
      historyMsg = e.message || 'Could not load history.';
    }
  }

  async function openHistory() {
    if (!current) return;
    historyOpen = true;
    await loadHistory();
  }
  function closeHistory() {
    historyOpen = false;
    selected = null;
    selectedMsg = '';
  }

  async function selectRevision(id) {
    selectedMsg = 'Loading…';
    selected = null;
    try {
      selected = await adminGet(`/revisions/${id}`);
      selectedMsg = '';
    } catch (e) {
      selected = null;
      selectedMsg = e.message || 'Could not load this revision.';
    }
  }

  // Diff: from the selected revision's markdown (old) to the working copy (new).
  $: revDiff = selected ? diffLines(selected.markdown, current ? current.markdown : '') : [];

  function fmtDate(s) {
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString();
  }

  let confirmRevert = false; // inline "confirm revert" armed state
  async function revertTo(id) {
    if (reverting) return;
    confirmRevert = false;
    reverting = true;
    selectedMsg = 'Reverting…';
    try {
      await adminPost(`/revisions/${id}/revert`, {});
      const no = current.phase_no;
      await openPhase(no);          // reloads the phase (also resets history state)
      await invalidateAll();
      historyOpen = true;           // re-open and refresh after openPhase cleared it
      await loadHistory();
    } catch (e) {
      selectedMsg = e.message || 'Revert failed.';
      reverting = false;
    }
  }
</script>

<svelte:head><title>Admin · {guide.title}</title></svelte:head>

<div class="ed-top">
  <a href="/admin/content" class="ed-back"><i class="ti ti-arrow-left" aria-hidden="true"></i> Content</a>
  <span class="ed-title">{guide.title}</span>
  <span class={`badge ${meta.status}`}>{meta.status}</span>
  <span class="ed-actions">
    <span class="ed-msg">{metaMsg}</span>
    <button class="admin-btn sm" on:click={saveMeta}>Save</button>
    <button class="admin-btn sm primary" on:click={togglePublish}>
      {meta.status === 'published' ? 'Unpublish' : 'Publish'}
    </button>
  </span>
</div>

<div class="ed-meta">
  <input class="ed-titlefield" bind:value={meta.title} placeholder="Title" />
  <input bind:value={meta.summary} placeholder="One-line summary" />
  <div class="ed-meta-row">
    <label>Category
      <select bind:value={meta.category}>
        {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
      </select>
    </label>
    <label>Difficulty
      <select bind:value={meta.difficulty}>
        <option value="beginner">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </label>
    <label>Status
      <select bind:value={meta.status}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </label>
  </div>
</div>

<div class="ed-body">
  <aside class="ed-phases">
    <div class="ed-phases-head">Phases <button class="admin-btn sm" on:click={addPhase}><i class="ti ti-plus" aria-hidden="true"></i></button></div>
    <ul>
      {#each phases as p}
        <li>
          <button class="ed-phase" class:on={current && current.phase_no === p.phase_no} on:click={() => openPhase(p.phase_no)}>
            {p.phase_no === 0 ? 'Overview' : `${p.phase_no} · ${p.title}`}
          </button>
          {#if confirmDelPhase === p.phase_no}
            <button class="ed-del ed-del-confirm" on:click={() => removePhase(p.phase_no)} aria-label="Confirm delete phase">Delete?</button>
            <button class="ed-del" on:click={() => (confirmDelPhase = null)} aria-label="Cancel"><i class="ti ti-x" aria-hidden="true"></i></button>
          {:else}
            <button class="ed-del" on:click={() => (confirmDelPhase = p.phase_no)} aria-label="Delete phase"><i class="ti ti-trash" aria-hidden="true"></i></button>
          {/if}
        </li>
      {:else}
        <li class="admin-empty">No phases yet.</li>
      {/each}
    </ul>
  </aside>

  <section class="ed-editor">
    {#if current}
      <div class="ed-phase-meta">
        <input bind:value={current.title} placeholder="Phase title" />
        <input bind:value={current.summary} placeholder="Phase summary" />
      </div>
      <div class="ed-toolbar">
        <button on:click={() => surround('**')} title="Bold" aria-label="Bold"><i class="ti ti-bold" aria-hidden="true"></i></button>
        <button on:click={() => surround('*')} title="Italic" aria-label="Italic"><i class="ti ti-italic" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n## ')} title="Heading" aria-label="Heading"><i class="ti ti-heading" aria-hidden="true"></i></button>
        <button on:click={() => surround('`')} title="Inline code" aria-label="Inline code"><i class="ti ti-code" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n```\n\n```\n')} title="Code block" aria-label="Code block"><i class="ti ti-code-dots" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n- ')} title="List" aria-label="List"><i class="ti ti-list" aria-hidden="true"></i></button>
        <button on:click={() => surround('[', '](url)')} title="Link" aria-label="Link"><i class="ti ti-link" aria-hidden="true"></i></button>
        <span class="ed-tool-hint">drop or paste an image to upload</span>
        <span class="ed-msg">{phaseMsg}</span>
        <button class="admin-btn sm" on:click={openHistory}><i class="ti ti-history" aria-hidden="true"></i> History</button>
        <button class="admin-btn sm primary" on:click={savePhase}>Save phase</button>
      </div>
      <div class="ed-split">
        <textarea
          bind:this={ta}
          value={current.markdown}
          on:input={(e) => setMarkdown(e.currentTarget.value)}
          on:drop={onDrop}
          on:paste={onPaste}
          spellcheck="false"
          placeholder="Write Markdown…"
        ></textarea>
        <div class="ed-preview reader">{@html previewHtml}</div>
      </div>

      {#if historyOpen}
        <button class="ed-hist-backdrop" on:click={closeHistory} aria-label="Close history"></button>
        <aside class="ed-hist" aria-label="Edit history">
          <header class="ed-hist-top">
            <span class="ed-hist-title"><i class="ti ti-history" aria-hidden="true"></i> Edit history</span>
            <button class="ed-hist-close" on:click={closeHistory} aria-label="Close history"><i class="ti ti-x" aria-hidden="true"></i></button>
          </header>

          <div class="ed-hist-body">
            <div class="ed-hist-list">
              {#if historyMsg}
                <p class="ed-hist-msg">{historyMsg}</p>
              {:else if historyList.length === 0}
                <p class="ed-hist-msg">No earlier versions yet.</p>
              {:else}
                <ul>
                  {#each historyList as r}
                    <li>
                      <button
                        class="ed-rev"
                        class:on={selected && selected.id === r.id}
                        on:click={() => selectRevision(r.id)}
                      >
                        <span class="ed-rev-title">{r.title || 'Untitled'}</span>
                        <span class="ed-rev-date">{fmtDate(r.created_at)}</span>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>

            <div class="ed-hist-detail">
              {#if selectedMsg && !selected}
                <p class="ed-hist-msg">{selectedMsg}</p>
              {:else if selected}
                <header class="ed-hist-detail-head">
                  <div>
                    <div class="ed-rev-title">{selected.title || 'Untitled'}</div>
                    <div class="ed-rev-date">{fmtDate(selected.created_at)}</div>
                  </div>
                  {#if confirmRevert}
                    <span class="ed-rev-confirm">
                      <button class="admin-btn sm danger" on:click={() => revertTo(selected.id)} disabled={reverting}>Confirm revert</button>
                      <button class="admin-btn sm" on:click={() => (confirmRevert = false)} disabled={reverting}>Cancel</button>
                    </span>
                  {:else}
                    <button class="admin-btn sm danger" on:click={() => (confirmRevert = true)} disabled={reverting}>
                      Revert to this revision
                    </button>
                  {/if}
                </header>
                {#if selectedMsg}<p class="ed-hist-msg">{selectedMsg}</p>{/if}
                <p class="ed-diff-hint">Changes from this revision to the current working copy:</p>
                <div class="ed-diff">
                  {#each revDiff as ln}
                    <div class="ed-diff-line {ln.type}"><span class="ed-diff-sign" aria-hidden="true">{ln.type === 'add' ? '+' : ln.type === 'del' ? '−' : ' '}</span><span class="ed-diff-text">{ln.text || ' '}</span></div>
                  {/each}
                </div>
              {:else}
                <p class="ed-hist-msg">Select a revision to see what changed.</p>
              {/if}
            </div>
          </div>
        </aside>
      {/if}
    {:else}
      <p class="admin-empty ed-pick">Pick a phase on the left, or add one.</p>
    {/if}
  </section>
</div>

<style>
  /* Edit-history drawer. Scoped to this component - all tokens come from app.css.
     NOTE: app.css has no --ok token, so additions fall back to a sensible green
     via the var() fallback; removals use the global --danger. */
  .ed-hist-backdrop {
    position: fixed;
    inset: 0;
    border: 0;
    padding: 0;
    background: rgba(19, 19, 22, 0.32);
    cursor: default;
    z-index: 40;
  }
  .ed-hist {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(720px, 92vw);
    display: flex;
    flex-direction: column;
    background: var(--raise);
    border-left: 1px solid var(--line);
    box-shadow: var(--shadow-pop);
    z-index: 41;
  }
  .ed-hist-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--line);
  }
  .ed-hist-title {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--ink);
  }
  .ed-hist-title .ti { color: var(--accent); }
  .ed-hist-close {
    background: none;
    border: 0;
    color: var(--faint);
    cursor: pointer;
    padding: 4px;
    font-size: 18px;
    line-height: 1;
  }
  .ed-hist-close:hover { color: var(--ink); }
  .ed-hist-body {
    flex: 1;
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }
  .ed-hist-list {
    border-right: 1px solid var(--line);
    overflow-y: auto;
    padding: 0.5rem;
  }
  .ed-hist-list ul { list-style: none; margin: 0; padding: 0; }
  .ed-rev {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    border-left: 2px solid transparent;
    padding: 0.45rem 0.5rem;
    cursor: pointer;
    font: inherit;
    border-radius: 6px;
  }
  .ed-rev:hover { background: var(--surface); }
  .ed-rev.on {
    background: var(--accent-tint);
    border-left-color: var(--accent);
  }
  .ed-rev-title {
    font-size: 0.9rem;
    color: var(--ink);
    font-weight: 500;
  }
  .ed-rev-date {
    font-size: 0.74rem;
    color: var(--faint);
    font-family: var(--font-mono);
  }
  .ed-hist-detail {
    overflow-y: auto;
    padding: 0.9rem 1rem;
    min-width: 0;
  }
  .ed-hist-detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.6rem;
  }
  .ed-hist-detail-head .ed-rev-title { font-size: 1rem; }
  .ed-diff-hint {
    color: var(--muted);
    font-size: 0.82rem;
    margin: 0 0 0.5rem;
  }
  .ed-hist-msg {
    color: var(--muted);
    font-size: 0.88rem;
    padding: 0.5rem;
  }
  .ed-diff {
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.55;
    background: var(--bg);
  }
  .ed-diff-line {
    display: flex;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 0 0.5rem;
  }
  .ed-diff-sign {
    flex: none;
    width: 1.1em;
    color: var(--faint);
    user-select: none;
  }
  .ed-diff-text { flex: 1; min-width: 0; }
  /* additions: faint green. --ok is not defined in app.css, so fall back. */
  .ed-diff-line.add {
    background: color-mix(in srgb, var(--ok, #2e9e5b) 12%, transparent);
  }
  .ed-diff-line.add .ed-diff-sign { color: var(--ok, #2e9e5b); }
  /* removals: faint red via the global --danger token. */
  .ed-diff-line.del {
    background: color-mix(in srgb, var(--danger) 12%, transparent);
  }
  .ed-diff-line.del .ed-diff-sign { color: var(--danger); }
  .ed-diff-line.same { color: var(--muted); }

  @media (max-width: 640px) {
    .ed-hist-body { grid-template-columns: 1fr; }
    .ed-hist-list {
      border-right: 0;
      border-bottom: 1px solid var(--line);
      max-height: 180px;
    }
  }
</style>
