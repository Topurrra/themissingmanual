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
</script>

<svelte:head><title>Admin · Content</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Content</h1>
  <button class="admin-btn" on:click={() => (showNew = !showNew)}><i class="ti ti-plus" aria-hidden="true"></i> New topic</button>
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

{#if msg}<p class="admin-note" aria-live="polite">{msg}</p>{/if}
{#if err}<p class="admin-err" aria-live="assertive">{err}</p>{/if}

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
