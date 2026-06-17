<script>
  export let data;
  $: ({ analytics, days } = data);
  $: maxPerDay = Math.max(1, ...analytics.perDay.map((d) => d.count));
  $: hasData = analytics.views > 0 || analytics.searches > 0;
</script>

<svelte:head><title>Admin · Analytics</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Analytics</h1>
  <div class="range-pills">
    {#each [7, 30, 90] as d}
      <a href={`?days=${d}`} class:on={days === d}>{d}d</a>
    {/each}
  </div>
</div>

{#if !hasData}
  <p class="admin-empty">No traffic recorded yet. Visit a few public pages, then check back.</p>
{:else}
  <div class="metrics">
    <div class="metric"><span class="metric-n">{analytics.views.toLocaleString()}</span><span class="metric-l">Views</span></div>
    <div class="metric"><span class="metric-n">{analytics.uniqueVisitors.toLocaleString()}</span><span class="metric-l">Unique visitors</span></div>
    <div class="metric"><span class="metric-n">{analytics.searches.toLocaleString()}</span><span class="metric-l">Searches</span></div>
  </div>

  {#if analytics.perDay.length}
    <div class="panel">
      <div class="panel-label">Views over time</div>
      <div class="bars">
        {#each analytics.perDay as d}
          <div class="bar" style={`height:${Math.round((d.count / maxPerDay) * 100)}%`} title={`${d.day}: ${d.count}`}></div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="rank-cols">
    <div>
      <h2 class="admin-h2">Top topics</h2>
      <div class="ranks">
        {#each analytics.topPaths as r}
          <div class="rank-row"><span>{r.path}</span><b>{r.count.toLocaleString()}</b></div>
        {:else}<p class="admin-empty">—</p>{/each}
      </div>
      <h2 class="admin-h2">Top referrers</h2>
      <div class="ranks">
        {#each analytics.topReferrers as r}
          <div class="rank-row"><span>{r.referrer}</span><b>{r.count.toLocaleString()}</b></div>
        {:else}<p class="admin-empty">Direct / none yet</p>{/each}
      </div>
    </div>
    <div>
      <h2 class="admin-h2">Top search queries</h2>
      <div class="ranks">
        {#each analytics.topSearches as r}
          <div class="rank-row"><span>{r.query}</span><b>{r.count.toLocaleString()}</b></div>
        {:else}<p class="admin-empty">No searches yet</p>{/each}
      </div>
      <p class="admin-note" style="margin-top:0.8rem;">Frequent searches are your content backlog.</p>
    </div>
  </div>
{/if}
