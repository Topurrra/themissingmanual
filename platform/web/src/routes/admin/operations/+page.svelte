<script>
  import { adminPost } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';
  export let data;

  $: ({ version, dbSizeBytes, guides, categories } = data);

  // Human-readable byte size (B / KB / MB / GB). Binary units (1024).
  function fmtBytes(bytes) {
    if (bytes == null || isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let n = bytes / 1024;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
  }

  // Categories may be a count (number) or an array of {name}/strings. Render sensibly.
  $: catCount = Array.isArray(categories)
    ? categories.length
    : typeof categories === 'number'
      ? categories
      : null;
  $: catNames = Array.isArray(categories)
    ? categories.map((c) => (typeof c === 'string' ? c : (c?.name ?? c?.slug ?? ''))).filter(Boolean)
    : [];

  // ---- Re-ingest content ----
  let busy = false;
  let note = '';
  let err = '';

  async function reingest() {
    note = '';
    err = '';
    busy = true;
    try {
      const res = (await adminPost('/sync', {})) ?? {};
      const parts = [`${res.changed ?? 0} changed`];
      if (res.guides != null) parts.push(`${res.guides} guides`);
      if (res.phases != null) parts.push(`${res.phases} phases`);
      note = `Re-ingested · ${parts.join(' · ')}`;
      await invalidateAll(); // re-run loader → fresh status numbers
    } catch (e) {
      err = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Admin · Operations</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Operations</h1>
  <button class="admin-btn" on:click={reingest} disabled={busy}>
    <i class="ti ti-refresh" aria-hidden="true"></i>
    {busy ? 'Re-ingesting…' : 'Re-ingest content'}
  </button>
</div>

{#if note}<p class="admin-note" aria-live="polite">{note}</p>{/if}
{#if err}<p class="admin-err" aria-live="assertive">{err}</p>{/if}

<div class="ops-grid">
  <div class="ops-card">
    <span class="ops-label">Version</span>
    <span class="ops-value">{version ?? '-'}</span>
  </div>

  <div class="ops-card">
    <span class="ops-label">Database size</span>
    <span class="ops-value">{fmtBytes(dbSizeBytes)}</span>
  </div>

  <div class="ops-card">
    <span class="ops-label">Guides</span>
    <span class="ops-value">{guides.total}</span>
    <span class="ops-sub">{guides.published} published · {guides.draft} draft</span>
  </div>

  <div class="ops-card">
    <span class="ops-label">Categories</span>
    <span class="ops-value">{catCount ?? '-'}</span>
    {#if catNames.length}
      <span class="ops-sub">{catNames.join(' · ')}</span>
    {/if}
  </div>
</div>

<style>
  .ops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.9rem;
    margin-top: 1.4rem;
  }
  .ops-card {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--raise);
  }
  .ops-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .ops-value {
    font-size: 1.7rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--ink);
    line-height: 1.1;
  }
  .ops-sub {
    font-size: 0.85rem;
    color: var(--faint);
  }
</style>
