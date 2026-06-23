<script>
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  let deleting = false;

  $: brokenLinks = data.broken_links ?? [];
  $: missingAssets = data.missing_assets ?? [];
  $: orphanedAssets = data.orphaned_assets ?? [];

  $: allHealthy =
    brokenLinks.length === 0 && missingAssets.length === 0 && orphanedAssets.length === 0;

  // `from` is "<guide-slug>/<phase_no>" — link the whole thing to the phase
  // editor at /admin/content/<guide-slug> (split on the first slash only).
  function editorHref(from) {
    const slug = String(from ?? '').split('/')[0];
    return `/admin/content/${slug}`;
  }
</script>

<svelte:head><title>Admin · Health</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Content Health</h1>
</div>

{#if allHealthy}
  <p class="admin-note hc-ok">Everything looks healthy ✓</p>
{/if}

<h2 class="admin-h2">Broken links <span class="hc-count">{brokenLinks.length}</span></h2>
<table class="admin-table">
  <thead>
    <tr><th>From</th><th>Href</th></tr>
  </thead>
  <tbody>
    {#each brokenLinks as l (`${l.from}-${l.href}`)}
      <tr>
        <td><a href={editorHref(l.from)}>{l.from}</a></td>
        <td class="hc-href">{l.href}</td>
      </tr>
    {:else}
      <tr><td colspan="2" class="admin-empty">No broken links.</td></tr>
    {/each}
  </tbody>
</table>

<h2 class="admin-h2">Missing assets <span class="hc-count">{missingAssets.length}</span></h2>
<table class="admin-table">
  <thead>
    <tr><th>From</th><th>Href</th></tr>
  </thead>
  <tbody>
    {#each missingAssets as a (`${a.from}-${a.href}`)}
      <tr>
        <td><a href={editorHref(a.from)}>{a.from}</a></td>
        <td class="hc-href">{a.href}</td>
      </tr>
    {:else}
      <tr><td colspan="2" class="admin-empty">No missing assets.</td></tr>
    {/each}
  </tbody>
</table>

<h2 class="admin-h2">Orphaned assets <span class="hc-count">{orphanedAssets.length}</span></h2>
<table class="admin-table">
  <thead>
    <tr><th>Asset</th></tr>
  </thead>
  <tbody>
    {#each orphanedAssets as id (id)}
      <tr><td class="hc-href">{id}</td></tr>
    {:else}
      <tr><td class="admin-empty">No orphaned assets.</td></tr>
    {/each}
  </tbody>
</table>
{#if orphanedAssets.length}
  <form
    method="POST"
    action="?/deleteOrphans"
    use:enhance={() => {
      deleting = true;
      return async ({ update }) => {
        await update();
        deleting = false;
      };
    }}
  >
    <button type="submit" class="hc-delete" disabled={deleting}>
      {deleting ? 'Deleting…' : `Delete ${orphanedAssets.length} orphaned asset${orphanedAssets.length === 1 ? '' : 's'}`}
    </button>
    <span class="hc-hint">Removes assets no phase references. Cannot remove anything still in use.</span>
  </form>
{/if}

{#if form?.deleted != null}
  <p class="admin-note hc-ok">Deleted {form.deleted} orphaned asset{form.deleted === 1 ? '' : 's'} ✓</p>
{:else if form?.error}
  <p class="admin-note hc-err">{form.error}</p>
{/if}

<style>
  .hc-ok {
    margin: 0 0 0.5rem;
  }
  .hc-count {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--muted);
    margin-left: 0.35rem;
  }
  .hc-href {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--body);
    word-break: break-all;
  }
  .hc-hint {
    color: var(--faint);
    font-size: 0.85rem;
    margin-left: 0.7rem;
  }
  .hc-delete {
    margin-top: 0.6rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    background: var(--danger, #b3261e);
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  .hc-delete:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .hc-err {
    color: var(--danger, #b3261e);
  }
</style>
