<script>
  import { goto } from '$app/navigation';
  export let data;

  $: items = data.items ?? [];
  // Active window — coerce to a string so it matches the option values below.
  $: activeDays = String(data.days ?? '30');

  const WINDOWS = ['7', '30', '90'];

  function setDays(d) {
    goto(`?days=${d}`, { keepFocus: true, noScroll: true });
  }

  // "Draft a guide" → open the existing inline new-topic flow on the Content page,
  // prefilled from the dead query. The Content page reads ?new=<title> to auto-open
  // and populate its create form (slug is derived from the title there).
  function draft(query) {
    goto(`/admin/content?new=${encodeURIComponent(query)}`);
  }
</script>

<svelte:head><title>Admin · Backlog</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Content Backlog</h1>
  <div class="bk-windows" role="group" aria-label="Time window">
    {#each WINDOWS as d}
      <button
        class="admin-btn sm"
        class:primary={activeDays === d}
        aria-pressed={activeDays === d}
        on:click={() => setDays(d)}
      >
        {d}d
      </button>
    {/each}
  </div>
</div>

<p class="bk-intro">
  Searches with the fewest hits over the last {activeDays} days — readers looking for
  guides that don't exist yet. Draft one straight from a row.
</p>

<table class="admin-table">
  <thead>
    <tr>
      <th>Query</th><th class="bk-num">Demand</th><th class="bk-num">Hits</th><th></th>
    </tr>
  </thead>
  <tbody>
    {#each items as it (it.query)}
      <tr>
        <td class="bk-query">{it.query}</td>
        <td class="bk-num">{it.demand}</td>
        <td class="bk-num">{it.hits}</td>
        <td class="bk-action">
          <button class="admin-btn sm" on:click={() => draft(it.query)}>
            <i class="ti ti-plus" aria-hidden="true"></i> Draft a guide
          </button>
        </td>
      </tr>
    {:else}
      <tr><td colspan="4" class="admin-empty">No backlog for this window.</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .bk-windows {
    display: flex;
    gap: 0.4rem;
  }
  .bk-intro {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0.4rem 0 0;
    max-width: 60ch;
  }
  .bk-query {
    font-weight: 500;
    color: var(--ink);
  }
  .bk-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .bk-action {
    text-align: right;
    white-space: nowrap;
  }
</style>
