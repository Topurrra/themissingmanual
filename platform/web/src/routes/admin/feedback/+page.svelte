<script>
  import { adminPatch } from '$lib/admin.js';

  export let data;
  $: items = data.items ?? [];

  // Guide requests ride the same pipeline under a sentinel slug (see /request);
  // split them out so vote totals stay honest and requests get their own tab.
  const isRequest = (f) => f.guide_slug === 'guide-request';
  $: requests = items.filter(isRequest);
  $: votes = items.filter((f) => !isRequest(f));
  $: upCount = votes.filter((f) => f.vote === 'up').length;
  $: downCount = votes.filter((f) => f.vote === 'down').length;

  let voteFilter = 'all'; // 'all' | 'up' | 'down' | 'req'
  $: shown =
    voteFilter === 'all' ? items
    : voteFilter === 'req' ? requests
    : votes.filter((f) => f.vote === voteFilter);

  // Compact relative time ("2h ago"); the absolute time rides in the cell title.
  function relTime(ts) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const dd = Math.floor(h / 24); if (dd < 30) return `${dd}d ago`;
    const mo = Math.floor(dd / 30); if (mo < 12) return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  }

  async function toggleDone(f) {
    const done = !f.done;
    f.done = done; // optimistic
    items = items;
    try {
      await adminPatch(`/feedback/${f.id}/done`, { done });
    } catch (e) {
      f.done = !done; // revert on failure
      items = items;
    }
  }

  // Format the API timestamp into a readable local date-time. Falls back to the
  // raw value if it isn't a parseable date.
  function fmtTs(ts) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head><title>Admin · Feedback</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Feedback</h1>
  {#if items.length}
    <div class="fb-totals" aria-label="Vote totals">
      <span class="fb-total up"><i class="ti ti-thumb-up" aria-hidden="true"></i> {upCount}</span>
      <span class="fb-total down"><i class="ti ti-thumb-down" aria-hidden="true"></i> {downCount}</span>
    </div>
  {/if}
</div>
<p class="admin-sub">Reader thumbs-up and thumbs-down on each phase, newest first.</p>

{#if items.length}
  <div class="range-pills fb-filter">
    <button class:on={voteFilter === 'all'} on:click={() => (voteFilter = 'all')}>All {items.length}</button>
    <button class:on={voteFilter === 'up'} on:click={() => (voteFilter = 'up')}>Up {upCount}</button>
    <button class:on={voteFilter === 'down'} on:click={() => (voteFilter = 'down')}>Down {downCount}</button>
    <button class:on={voteFilter === 'req'} on:click={() => (voteFilter = 'req')}>Requests {requests.length}</button>
  </div>
{/if}

<table class="admin-table">
  <thead>
    <tr>
      <th>When</th><th>Guide / phase</th><th>Vote</th><th>Note</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    {#each shown as f (f.id)}
      <tr class:fb-done={isRequest(f) && f.done}>
        <td class="fb-ts" title={fmtTs(f.ts)}>{relTime(f.ts)}</td>
        {#if isRequest(f)}
          <td><span class="fb-req-src">from /request</span></td>
          <td><span class="fb-vote req"><i class="ti ti-bulb" aria-hidden="true"></i> Request</span></td>
        {:else}
          <td>
            <a href={`/guides/${f.guide_slug}/${f.phase_no}`}>{f.guide_slug}</a>
            <span class="fb-phase">· phase {f.phase_no}</span>
          </td>
          <td>
            {#if f.vote === 'up'}
              <span class="fb-vote up"><i class="ti ti-thumb-up" aria-hidden="true"></i> Up</span>
            {:else}
              <span class="fb-vote down"><i class="ti ti-thumb-down" aria-hidden="true"></i> Down</span>
            {/if}
          </td>
        {/if}
        <td class="fb-note">{f.note || '-'}</td>
        <td>
          {#if isRequest(f)}
            <button type="button" class="fb-done-btn" class:on={f.done} on:click={() => toggleDone(f)}>
              <i class={`ti ${f.done ? 'ti-check' : 'ti-circle'}`} aria-hidden="true"></i>
              {f.done ? 'Done' : 'Mark done'}
            </button>
          {/if}
        </td>
      </tr>
    {:else}
      <tr><td colspan="5" class="admin-empty">{items.length ? `No ${voteFilter} votes.` : 'No feedback yet.'}</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .fb-filter { margin: 0 0 1rem; }
  .fb-totals {
    display: flex;
    gap: 0.6rem;
  }
  .fb-total {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid var(--line);
  }
  .fb-total.up {
    color: var(--accent-strong);
    background: var(--accent-tint);
  }
  .fb-total.down {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 12%, transparent);
  }

  .fb-ts {
    color: var(--muted);
    white-space: nowrap;
  }
  .fb-phase {
    color: var(--faint);
    font-size: 0.85rem;
  }

  .fb-vote {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
  }
  .fb-vote.up {
    color: var(--accent-strong);
    background: var(--accent-tint);
  }
  .fb-vote.down {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 12%, transparent);
  }
  .fb-vote.req {
    color: var(--accent-strong);
    background: var(--accent-tint);
  }
  .fb-req-src {
    color: var(--faint);
    font-size: 0.85rem;
  }

  .fb-note {
    color: var(--body);
    max-width: 32ch;
  }

  .fb-done-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0.3rem 0.6rem;
    white-space: nowrap;
  }
  .fb-done-btn:hover { border-color: var(--accent); color: var(--ink); }
  .fb-done-btn.on { color: var(--accent-strong); background: var(--accent-tint); border-color: var(--accent); }
  tr.fb-done { opacity: 0.55; }
</style>
