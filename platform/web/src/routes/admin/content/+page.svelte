<script>
  import { enhance } from '$app/forms';
  import { adminPost } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';
  export let data;
  export let form;
  $: ({ guides, categories } = data);
  let showNew = false;

  // ---- Filter / sort / search (client-side over the SSR-loaded list) ----
  let fStatus = 'all';      // all | published | draft
  let fCategory = 'all';    // all | <category slug>
  let fDifficulty = 'all';  // all | beginner | intermediate | advanced
  let q = '';               // title search
  let sort = 'title-asc';   // title-asc | title-desc

  const DIFF_LABEL = { beginner: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' };

  $: filtered = guides
    .filter((g) => fStatus === 'all' || g.status === fStatus)
    .filter((g) => fCategory === 'all' || g.category === fCategory)
    .filter((g) => fDifficulty === 'all' || g.difficulty === fDifficulty)
    .filter((g) => !q.trim() || g.title.toLowerCase().includes(q.trim().toLowerCase()))
    .slice() // copy before sort (don't mutate data)
    .sort((a, b) =>
      sort === 'title-desc'
        ? b.title.localeCompare(a.title)
        : a.title.localeCompare(b.title)
    );

  // ---- Pagination (over the filtered+sorted result) ----
  const PER_PAGE = 25;
  let pageNum = 1;
  $: total = filtered.length;
  $: pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  $: if (pageNum > pageCount) pageNum = pageCount;
  $: paged = filtered.slice((pageNum - 1) * PER_PAGE, pageNum * PER_PAGE);

  // Reset to page 1 whenever the filtered view changes (filter/sort/search).
  // Keyed on the inputs so changing a filter — not paging — triggers it.
  $: resetKey = `${fStatus}|${fCategory}|${fDifficulty}|${q}|${sort}`;
  let lastResetKey = resetKey;
  $: if (resetKey !== lastResetKey) {
    lastResetKey = resetKey;
    pageNum = 1;
  }

  // ---- Selection (tracked by slug, across the whole filtered set) ----
  let selected = new Set();
  $: filteredSlugs = filtered.map((g) => g.slug);
  // Drop selections that fall out of the current filtered view.
  $: if (filteredSlugs) {
    const next = new Set();
    for (const s of selected) if (filteredSlugs.includes(s)) next.add(s);
    if (next.size !== selected.size) selected = next;
  }
  $: selectedCount = selected.size;
  $: allFilteredSelected = total > 0 && selectedCount === total;

  function toggleRow(slug) {
    const next = new Set(selected);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    selected = next;
  }
  function toggleAll() {
    selected = allFilteredSelected ? new Set() : new Set(filteredSlugs);
  }

  // ---- Bulk actions ----
  let msg = '';
  let err = '';
  let busy = false;
  let bulkCategory = '';   // value for "recategorize"
  let bulkDifficulty = ''; // value for "set difficulty"

  $: if (categories.length && !bulkCategory) bulkCategory = categories[0].slug;
  $: if (!bulkDifficulty) bulkDifficulty = 'beginner';

  async function runBulk(action, value) {
    msg = '';
    err = '';
    const slugs = [...selected];
    if (!slugs.length) return;
    busy = true;
    try {
      const body = { action, slugs };
      if (value !== undefined) body.value = value;
      const res = await adminPost('/guides/bulk', body);
      await invalidateAll(); // re-run loader → fresh guide list
      selected = new Set();
      msg = `${res?.affected ?? slugs.length} updated`;
    } catch (e) {
      err = e.message;
    } finally {
      busy = false;
    }
  }

  function bulkDelete() {
    const n = selected.size;
    if (!confirm(`Delete ${n} topic${n === 1 ? '' : 's'}? This cannot be undone.`)) return;
    runBulk('delete');
  }

  // ---- Reorder mode (drag-to-reorder within a category) ----
  // A separate, grouped-by-category view. The flat filter/sort/paginate/bulk
  // table only makes sense over the whole set; manual ordering only makes sense
  // *within* one category, so we toggle to a dedicated view rather than bolting
  // dragging onto the table.
  let reorderMode = false;
  let savingCat = null;        // category slug currently persisting (disables drag)
  let dragCat = null;          // category slug of the row being dragged
  let dragIndex = null;        // index of the row being dragged within its group
  let overIndex = null;        // index currently hovered (for drop indicator)

  // Local working copy of the grouped order. Built from data.guides, which
  // already arrives in the backend's persisted per-category order.
  let groups = [];
  // Rebuild groups from the loaded guides whenever they change (e.g. after a
  // save + invalidateAll, or when first entering reorder mode).
  $: groups = buildGroups(guides, categories);

  function buildGroups(allGuides, cats) {
    const catName = new Map((cats ?? []).map((c) => [c.slug, c.name]));
    const order = []; // category slugs in first-seen order, seeded by `categories`
    const byCat = new Map();
    for (const c of cats ?? []) {
      order.push(c.slug);
      byCat.set(c.slug, []);
    }
    for (const g of allGuides) {
      const key = g.category ?? '';
      if (!byCat.has(key)) {
        order.push(key);
        byCat.set(key, []);
      }
      byCat.get(key).push(g);
    }
    return order
      .map((slug) => ({
        slug,
        name: catName.get(slug) ?? slug ?? 'Uncategorised',
        items: byCat.get(slug) ?? []
      }))
      .filter((grp) => grp.items.length > 0);
  }

  function onDragStart(catSlug, index, ev) {
    if (savingCat) return;
    dragCat = catSlug;
    dragIndex = index;
    overIndex = index;
    // Required for Firefox to initiate a drag; payload is informational only.
    try {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(index));
    } catch {}
  }

  function onDragOver(catSlug, index, ev) {
    // Only a valid drop target if it's the same category as the dragged row.
    if (dragCat !== catSlug || savingCat) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    overIndex = index;
  }

  function onDragEnd() {
    dragCat = null;
    dragIndex = null;
    overIndex = null;
  }

  async function onDrop(catSlug, index) {
    if (dragCat !== catSlug || dragIndex === null || savingCat) {
      onDragEnd();
      return;
    }
    const from = dragIndex;
    const to = index;
    if (from === to) {
      onDragEnd();
      return;
    }

    const grp = groups.find((g) => g.slug === catSlug);
    if (!grp) {
      onDragEnd();
      return;
    }

    // Reorder a copy of this category's items.
    const items = grp.items.slice();
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);

    // Optimistically reflect the new order in the UI.
    groups = groups.map((g) => (g.slug === catSlug ? { ...g, items } : g));
    onDragEnd();

    // Persist just this category's slugs in their new order.
    msg = '';
    err = '';
    savingCat = catSlug;
    try {
      await adminPost('/guides/reorder', { order: items.map((g) => g.slug) });
      await invalidateAll(); // re-run loader → groups rebuild from fresh order
      msg = `Order saved · ${grp.name}`;
    } catch (e) {
      err = e.message;
      await invalidateAll(); // resync from server on failure
    } finally {
      savingCat = null;
    }
  }
</script>

<svelte:head><title>Admin · Content</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Content</h1>
  <div class="admin-head-actions">
    <button
      class="admin-btn"
      class:primary={reorderMode}
      aria-pressed={reorderMode}
      on:click={() => (reorderMode = !reorderMode)}
    >
      <i class="ti ti-arrows-sort" aria-hidden="true"></i>
      {reorderMode ? 'Done reordering' : 'Reorder'}
    </button>
    <button class="admin-btn" on:click={() => (showNew = !showNew)}><i class="ti ti-plus" aria-hidden="true"></i> New topic</button>
  </div>
</div>

{#if showNew}
  <form method="POST" action="?/create" use:enhance class="new-topic">
    <input name="slug" placeholder="slug (e.g. docker-basics)" required />
    <input name="title" placeholder="Title" required />
    <select name="category">
      {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
    </select>
    <select name="difficulty">
      <option value="beginner">Basic</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
    </select>
    <button type="submit">Create</button>
  </form>
  {#if form?.error}<p class="admin-err">{form.error}</p>{/if}
{/if}

{#if !reorderMode}
<!-- Filter / sort / search bar -->
<div class="admin-filters" role="search">
  <label class="admin-field">
    <span>Status</span>
    <select bind:value={fStatus}>
      <option value="all">All</option>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </select>
  </label>
  <label class="admin-field">
    <span>Category</span>
    <select bind:value={fCategory}>
      <option value="all">All</option>
      {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
    </select>
  </label>
  <label class="admin-field">
    <span>Level</span>
    <select bind:value={fDifficulty}>
      <option value="all">All</option>
      <option value="beginner">Basic</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
    </select>
  </label>
  <label class="admin-field">
    <span>Sort</span>
    <select bind:value={sort}>
      <option value="title-asc">Title A–Z</option>
      <option value="title-desc">Title Z–A</option>
    </select>
  </label>
  <label class="admin-field admin-field-grow">
    <span>Search</span>
    <input type="search" bind:value={q} placeholder="Filter by title…" />
  </label>
</div>
{/if}

{#if msg}<p class="admin-note" aria-live="polite">{msg}</p>{/if}
{#if err}<p class="admin-err" aria-live="assertive">{err}</p>{/if}

{#if !reorderMode}
<!-- Bulk action bar -->
{#if selectedCount > 0}
  <div class="admin-bulk" aria-live="polite">
    <span class="admin-bulk-count">{selectedCount} selected</span>
    <button class="admin-btn sm" on:click={() => runBulk('publish')} disabled={busy}>Publish</button>
    <button class="admin-btn sm" on:click={() => runBulk('unpublish')} disabled={busy}>Unpublish</button>
    <label class="admin-bulk-pick">
      <span class="admin-bulk-lbl">Category</span>
      <select bind:value={bulkCategory} disabled={busy} aria-label="Category to apply">
        {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
      </select>
      <button class="admin-btn sm" on:click={() => runBulk('recategorize', bulkCategory)} disabled={busy || !bulkCategory}>Apply</button>
    </label>
    <label class="admin-bulk-pick">
      <span class="admin-bulk-lbl">Level</span>
      <select bind:value={bulkDifficulty} disabled={busy} aria-label="Difficulty to apply">
        <option value="beginner">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <button class="admin-btn sm" on:click={() => runBulk('difficulty', bulkDifficulty)} disabled={busy}>Set</button>
    </label>
    <button class="admin-btn sm danger" on:click={bulkDelete} disabled={busy}>Delete</button>
  </div>
{/if}

<table class="admin-table">
  <thead>
    <tr>
      <th class="admin-check-col">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          on:change={toggleAll}
          disabled={total === 0}
          aria-label={allFilteredSelected ? 'Clear selection' : `Select all ${total} filtered topics`}
        />
      </th>
      <th>Title</th><th>Category</th><th>Level</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    {#each paged as g (g.slug)}
      <tr class:admin-row-sel={selected.has(g.slug)}>
        <td class="admin-check-col">
          <input
            type="checkbox"
            checked={selected.has(g.slug)}
            on:change={() => toggleRow(g.slug)}
            aria-label={`Select ${g.title}`}
          />
        </td>
        <td><a href={`/admin/content/${g.slug}`}>{g.title}</a></td>
        <td>{g.category}</td>
        <td>{DIFF_LABEL[g.difficulty] ?? g.difficulty}</td>
        <td><span class={`badge ${g.status}`}>{g.status}</span></td>
      </tr>
    {:else}
      <tr><td colspan="5" class="admin-empty">No topics match these filters.</td></tr>
    {/each}
  </tbody>
</table>

{#if pageCount > 1}
  <nav class="admin-pager" aria-label="Content pages">
    <button type="button" class="admin-btn sm" on:click={() => (pageNum -= 1)} disabled={pageNum === 1} aria-label="Previous page">
      <i class="ti ti-chevron-left" aria-hidden="true"></i> Prev
    </button>
    <span class="admin-pager-status" aria-live="polite">Page {pageNum} of {pageCount} · {total} topics</span>
    <button type="button" class="admin-btn sm" on:click={() => (pageNum += 1)} disabled={pageNum === pageCount} aria-label="Next page">
      Next <i class="ti ti-chevron-right" aria-hidden="true"></i>
    </button>
  </nav>
{/if}
{/if}

{#if reorderMode}
<!-- Reorder mode: grouped-by-category, drag rows within a category to reorder -->
<p class="admin-reorder-hint">Drag rows by the handle to set the order within a category. Changes save automatically.</p>
{#each groups as grp (grp.slug)}
  <section class="admin-reorder-group" aria-labelledby={`reorder-cat-${grp.slug}`}>
    <h2 class="admin-h2 admin-reorder-cat" id={`reorder-cat-${grp.slug}`}>
      {grp.name}
      {#if savingCat === grp.slug}<span class="admin-reorder-saving">Saving…</span>{/if}
    </h2>
    <ul class="admin-reorder-list" class:is-saving={savingCat === grp.slug}>
      {#each grp.items as g, i (g.slug)}
        <li
          class="admin-reorder-row"
          class:is-dragging={dragCat === grp.slug && dragIndex === i}
          class:is-over={dragCat === grp.slug && overIndex === i && dragIndex !== i}
          title={g.title}
          draggable={savingCat ? 'false' : 'true'}
          on:dragstart={(e) => onDragStart(grp.slug, i, e)}
          on:dragover={(e) => onDragOver(grp.slug, i, e)}
          on:drop|preventDefault={() => onDrop(grp.slug, i)}
          on:dragend={onDragEnd}
        >
          <span class="admin-reorder-handle" aria-label={`Drag to reorder ${g.title}`}>
            <i class="ti ti-grip-vertical" aria-hidden="true"></i>
          </span>
          <span class="admin-reorder-title">{g.title}</span>
          <span class={`badge ${g.status}`}>{g.status}</span>
        </li>
      {/each}
    </ul>
  </section>
{:else}
  <p class="admin-empty">No topics to reorder yet.</p>
{/each}
{/if}

<style>
  .admin-head-actions { display: flex; align-items: center; gap: 0.5rem; }

  .admin-reorder-hint {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0.4rem 0 1.2rem;
  }
  .admin-reorder-group { margin-bottom: 1.6rem; }
  .admin-reorder-cat {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }
  .admin-reorder-saving {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .admin-reorder-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }
  .admin-reorder-list.is-saving { opacity: 0.6; pointer-events: none; }

  .admin-reorder-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0.7rem;
    border-bottom: 1px solid var(--line);
    background: var(--raise);
    transition: background 0.12s var(--ease), box-shadow 0.12s var(--ease);
  }
  .admin-reorder-row:last-child { border-bottom: 0; }
  .admin-reorder-row:hover { background: var(--surface); }
  .admin-reorder-row.is-dragging { opacity: 0.45; }
  .admin-reorder-row.is-over {
    box-shadow: inset 0 2px 0 0 var(--accent);
    background: var(--accent-tint);
  }

  .admin-reorder-handle {
    display: inline-flex;
    align-items: center;
    color: var(--faint);
    cursor: grab;
    flex: 0 0 auto;
  }
  .admin-reorder-handle:active { cursor: grabbing; }
  .admin-reorder-handle .ti { font-size: 18px; }
  .admin-reorder-row.is-dragging .admin-reorder-handle { cursor: grabbing; }

  .admin-reorder-title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.95rem;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
