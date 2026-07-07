<script>
  import { onMount, onDestroy } from 'svelte';
  import { HL_COLORS, loadAnnotations, addAnnotation, updateAnnotation, removeAnnotation } from '$lib/annotations.js';

  export let guideSlug;
  export let phaseNo;

  // Floating toolbar shown on a fresh text selection - lets the reader pick a
  // highlight color or add a note. Positioned BELOW the selection (TutorChat's
  // "ask about this" pill already owns the space above it, so the two never overlap).
  let selPopup = null; // { x, y, range }
  // The little card shown when tapping an existing highlight - view/edit its
  // note, change color, or remove it.
  let editPopup = null; // { x, y, id, note, color, draft }

  function readerEl() {
    return document.querySelector('.reader');
  }

  function clearSelPopup() {
    selPopup = null;
  }

  function onMouseup(e) {
    if (e.target.closest('.ann-popup, .ann-edit')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) { clearSelPopup(); return; }
    const reader = readerEl();
    const range = sel.getRangeAt(0);
    if (!reader || !reader.contains(range.commonAncestorContainer)) { clearSelPopup(); return; }
    const text = sel.toString();
    if (!text.trim() || text.length > 300) { clearSelPopup(); return; }
    const rect = range.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90);
    selPopup = { x, y: rect.bottom + window.scrollY + 8, range: range.cloneRange() };
  }

  function makeMark(color, id) {
    const mark = document.createElement('mark');
    mark.className = `tmm-hl tmm-hl-${color}`;
    mark.dataset.annId = id;
    return mark;
  }

  // range.surroundContents() throws the moment a range only partially contains
  // an element (e.g. a selection that starts mid-sentence and ends inside a
  // <strong>/<code>/<a>) - which is the common case for a "long text" selection,
  // not the exception. Instead, wrap each text node the range touches in its
  // own <mark> (splitting the boundary nodes so only the selected slice is
  // wrapped) - every fragment shares one data-ann-id, so it still acts, edits,
  // and deletes as a single highlight even though it's several DOM nodes.
  function wrapTextNodesInRange(range, makeMarkFn) {
    const root = range.commonAncestorContainer;
    const container = root.nodeType === Node.TEXT_NODE ? root.parentNode : root;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (range.intersectsNode(n)) nodes.push(n);
    }
    const marks = [];
    for (let node of nodes) {
      if (node === range.endContainer && range.endOffset < node.length) {
        node.splitText(range.endOffset);
      }
      if (node === range.startContainer && range.startOffset > 0) {
        node = node.splitText(range.startOffset);
      }
      if (!node.nodeValue) continue;
      const mark = makeMarkFn();
      node.parentNode.insertBefore(mark, node);
      mark.appendChild(node);
      marks.push(mark);
    }
    return marks;
  }

  function createHighlight(color, openNote) {
    if (!selPopup) return;
    const { range } = selPopup;
    const text = range.toString();
    const entry = addAnnotation(guideSlug, phaseNo, { text, color, note: '' });
    wrapTextNodesInRange(range, () => makeMark(color, entry.id));
    window.getSelection()?.removeAllRanges();
    selPopup = null;
    if (openNote) openEdit(entry.id, entry.note, entry.color);
  }

  function markRect(mark) {
    const r = mark.getBoundingClientRect();
    return { x: Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130), y: r.bottom + window.scrollY + 8 };
  }

  // A highlight can be several <mark> fragments sharing one id (see
  // wrapTextNodesInRange) - lookups return all of them; position/edit uses
  // the first, actions like recolor/delete apply to every fragment.
  function marksFor(id) {
    return Array.from(readerEl()?.querySelectorAll(`mark[data-ann-id="${id}"]`) || []);
  }

  function openEdit(id, note, color) {
    const marks = marksFor(id);
    const pos = marks[0] ? markRect(marks[0]) : { x: window.innerWidth / 2, y: window.scrollY + 120 };
    editPopup = { ...pos, id, note, color, draft: note };
  }

  function onReaderClick(e) {
    const mark = e.target.closest('mark.tmm-hl');
    if (!mark) return;
    const id = mark.dataset.annId;
    const all = loadAnnotations(guideSlug, phaseNo);
    const entry = all.find((a) => a.id === id);
    if (!entry) return;
    openEdit(id, entry.note, entry.color);
  }

  function setColor(color) {
    if (!editPopup) return;
    updateAnnotation(guideSlug, phaseNo, editPopup.id, { color });
    for (const mark of marksFor(editPopup.id)) mark.className = `tmm-hl tmm-hl-${color}`;
    editPopup = { ...editPopup, color };
  }

  function saveNote() {
    if (!editPopup) return;
    updateAnnotation(guideSlug, phaseNo, editPopup.id, { note: editPopup.draft.trim() });
    const hasNote = editPopup.draft.trim() ? '1' : '';
    for (const mark of marksFor(editPopup.id)) mark.dataset.hasNote = hasNote;
    editPopup = null;
  }

  function deleteHighlight() {
    if (!editPopup) return;
    removeAnnotation(guideSlug, phaseNo, editPopup.id);
    for (const mark of marksFor(editPopup.id)) {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
    editPopup = null;
  }

  // Re-apply saved highlights on mount by finding their text and wrapping it -
  // localStorage is the source of truth, the DOM is rebuilt from it every load.
  // A highlight's saved text may originally have spanned several text nodes
  // (crossing a <strong>/<code>/<a>), so search across all of them concatenated,
  // then map the match back to a (node, offset) range and wrap it the same way
  // a fresh selection would be.
  function applyStored() {
    const reader = readerEl();
    if (!reader) return;
    const entries = loadAnnotations(guideSlug, phaseNo);
    for (const entry of entries) {
      if (!entry.text) continue;
      const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          return n.parentElement?.closest('mark.tmm-hl') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);
      const full = nodes.map((n) => n.nodeValue).join('');
      const idx = full.indexOf(entry.text);
      if (idx === -1) continue;
      const range = document.createRange();
      let pos = 0, started = false, ended = false;
      for (const n of nodes) {
        const len = n.nodeValue.length;
        if (!started && idx < pos + len) { range.setStart(n, idx - pos); started = true; }
        if (started && !ended && idx + entry.text.length <= pos + len) {
          range.setEnd(n, idx + entry.text.length - pos);
          ended = true;
          break;
        }
        pos += len;
      }
      if (!started || !ended) continue;
      const marks = wrapTextNodesInRange(range, () => makeMark(entry.color, entry.id));
      if (entry.note) marks.forEach((m) => (m.dataset.hasNote = '1'));
    }
  }

  onMount(() => {
    applyStored();
    window.addEventListener('mouseup', onMouseup);
    document.querySelector('.reader')?.addEventListener('click', onReaderClick);
  });
  onDestroy(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('mouseup', onMouseup);
    document.querySelector('.reader')?.removeEventListener('click', onReaderClick);
  });
  function onKeydown(e) {
    if (e.key !== 'Escape') return;
    if (selPopup) selPopup = null;
    else if (editPopup) editPopup = null;
  }
</script>

<svelte:window on:keydown={onKeydown} on:scroll={clearSelPopup} />

{#if selPopup}
  <div class="ann-popup" style="left:{selPopup.x}px; top:{selPopup.y}px;">
    {#each HL_COLORS as c}
      <button class="ann-swatch" style="background:{c.hex}" on:mousedown|preventDefault={() => createHighlight(c.id)} aria-label="Highlight in {c.id}"></button>
    {/each}
    <span class="ann-sep" aria-hidden="true"></span>
    <button class="ann-note-btn" on:mousedown|preventDefault={() => createHighlight(HL_COLORS[0].id, true)} aria-label="Highlight and add a note" title="Highlight and add a note">
      <i class="ti ti-note" aria-hidden="true"></i>
    </button>
  </div>
{/if}

{#if editPopup}
  <div class="ann-edit" style="left:{editPopup.x}px; top:{editPopup.y}px;">
    <div class="ann-edit-swatches">
      {#each HL_COLORS as c}
        <button class="ann-swatch" class:on={editPopup.color === c.id} style="background:{c.hex}" on:click={() => setColor(c.id)} aria-label="Change to {c.id}"></button>
      {/each}
      <button class="ann-edit-del" on:click={deleteHighlight} aria-label="Remove highlight" title="Remove highlight">
        <i class="ti ti-trash" aria-hidden="true"></i>
      </button>
    </div>
    <textarea
      class="ann-edit-note"
      placeholder="Add a private note (only you can see this)…"
      bind:value={editPopup.draft}
      rows="2"
    ></textarea>
    <div class="ann-edit-actions">
      <button class="ann-edit-save" on:click={saveNote}>Save</button>
    </div>
  </div>
{/if}

<style>
  .ann-popup, .ann-edit {
    position: absolute; z-index: 45; transform: translateX(-50%);
    display: flex; align-items: center; gap: 0.35rem;
    background: var(--raise); border: 1px solid var(--line); border-radius: 12px;
    box-shadow: var(--shadow-pop); padding: 0.4rem 0.5rem;
    animation: ann-in 0.12s var(--ease-out);
  }
  @keyframes ann-in { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%); } }
  .ann-swatch {
    width: 22px; height: 22px; border-radius: 999px; border: 2px solid transparent; cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  }
  .ann-swatch:hover { transform: scale(1.12); }
  .ann-swatch.on { border-color: var(--ink); }
  .ann-sep { width: 1px; height: 20px; background: var(--line); }
  .ann-note-btn, .ann-edit-del {
    background: none; border: 0; color: var(--muted); cursor: pointer;
    width: 26px; height: 26px; border-radius: 8px; display: inline-grid; place-items: center;
  }
  .ann-note-btn:hover, .ann-edit-del:hover { background: var(--surface); color: var(--ink); }
  .ann-note-btn .ti, .ann-edit-del .ti { font-size: 16px; }

  .ann-edit { flex-direction: column; align-items: stretch; width: 240px; gap: 0.5rem; }
  .ann-edit-swatches { display: flex; align-items: center; gap: 0.4rem; }
  .ann-edit-del { margin-left: auto; }
  .ann-edit-note {
    font: inherit; font-size: 0.82rem; color: var(--body); background: var(--bg);
    border: 1px solid var(--line); border-radius: 8px; padding: 0.45rem 0.55rem; resize: vertical;
  }
  .ann-edit-note:focus { outline: none; border-color: var(--accent); }
  .ann-edit-actions { display: flex; justify-content: flex-end; }
  .ann-edit-save {
    font: inherit; font-size: 0.8rem; font-weight: 500; cursor: pointer;
    background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 0.35rem 0.8rem;
  }
  .ann-edit-save:hover { background: var(--accent-strong); }

  /* The highlight marks themselves - rendered inline in .reader prose, so these
     rules live here (scoped) rather than app.css since only this component
     creates .tmm-hl elements. */
  :global(mark.tmm-hl) { border-radius: 3px; padding: 0.05em 0.1em; cursor: pointer; }
  :global(mark.tmm-hl[data-has-note='1']) { box-shadow: inset 0 -2px 0 0 currentColor; }
  :global(mark.tmm-hl-amber) { background: color-mix(in srgb, #f5c451 45%, transparent); color: inherit; }
  :global(mark.tmm-hl-mint) { background: color-mix(in srgb, #7cd9b0 45%, transparent); color: inherit; }
  :global(mark.tmm-hl-rose) { background: color-mix(in srgb, #f2a3b3 45%, transparent); color: inherit; }
  :global(mark.tmm-hl-teal) { background: color-mix(in srgb, #5fb8c2 45%, transparent); color: inherit; }
</style>
