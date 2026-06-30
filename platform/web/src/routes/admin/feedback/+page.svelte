<script>
  export let data;
  $: items = data.items ?? [];

  $: upCount = items.filter((f) => f.vote === 'up').length;
  $: downCount = items.filter((f) => f.vote === 'down').length;

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

<table class="admin-table">
  <thead>
    <tr>
      <th>When</th><th>Guide / phase</th><th>Vote</th><th>Note</th>
    </tr>
  </thead>
  <tbody>
    {#each items as f (`${f.ts}-${f.guide_slug}-${f.phase_no}`)}
      <tr>
        <td class="fb-ts">{fmtTs(f.ts)}</td>
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
        <td class="fb-note">{f.note || '-'}</td>
      </tr>
    {:else}
      <tr><td colspan="4" class="admin-empty">No feedback yet.</td></tr>
    {/each}
  </tbody>
</table>

<style>
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

  .fb-note {
    color: var(--body);
    max-width: 32ch;
  }
</style>
