<script>
  export let data;
  $: ({ analytics, days } = data);
  $: ai = data.ai;
  $: prev = analytics.prev || { views: 0, uniqueVisitors: 0, searches: 0 };
  $: hasData = analytics.views > 0 || analytics.searches > 0;

  const peak = (rows) => Math.max(1, ...rows.map((r) => r.count));
  const pretty = (p) => {
    if (p === '/') return 'Home';
    let m;
    if ((m = p.match(/^\/guides\/([^/]+)(?:\/(\d+))?/))) return m[1].replace(/-/g, ' ') + (m[2] ? ` · phase ${m[2]}` : '');
    if ((m = p.match(/^\/categories\/([^/]+)/))) return m[1].replace(/-/g, ' ');
    return p.replace(/^\//, '').replace(/-/g, ' ');
  };
  const fmtDay = (k) => { try { return new Date(k + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return k; } };
  const fmtFull = (k) => { try { return new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); } catch (e) { return k; } };
  let hover = -1; // hovered bar index, -1 = none

  // Zero-fill the day series so the chart spans the whole window (no skipped days).
  function fillDays(n, rows) {
    const map = Object.fromEntries((rows || []).map((r) => [r.day, r.count]));
    const out = [];
    const t = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(t);
      d.setDate(t.getDate() - i);
      out.push({ day: d.toISOString().slice(0, 10), count: map[d.toISOString().slice(0, 10)] || 0 });
    }
    return out;
  }
  $: series = fillDays(days, analytics.perDay);
  $: maxPerDay = Math.max(1, ...series.map((d) => d.count));
  $: devTotal = (analytics.devices || []).reduce((a, d) => a + d.count, 0);
  $: viewsPerVisitor = analytics.uniqueVisitors ? (analytics.views / analytics.uniqueVisitors).toFixed(1) : '0';
  const trend = (cur, prv) => (prv > 0 ? Math.round(((cur - prv) / prv) * 100) : cur > 0 ? null : 0);
  $: tViews = trend(analytics.views, prev.views);
  $: tVisitors = trend(analytics.uniqueVisitors, prev.uniqueVisitors);
  $: tSearches = trend(analytics.searches, prev.searches);

  // ── Tagged-link builder. Builds a utm-tagged URL; clicks land under "Traffic
  // by source" below (the beacon reads utm_source). Pure client-side.
  let lbPath = '/';
  let lbSource = '';
  let lbMedium = '';
  let lbCampaign = '';
  let copied = false;
  $: lbUrl = (() => {
    const origin = typeof location !== 'undefined' ? location.origin : 'https://themissingmanual.dev';
    let p = (lbPath || '/').trim();
    if (!p.startsWith('/')) p = '/' + p;
    let u;
    try { u = new URL(origin + p); } catch (e) { return origin + '/'; }
    if (lbSource.trim()) u.searchParams.set('utm_source', lbSource.trim());
    if (lbMedium.trim()) u.searchParams.set('utm_medium', lbMedium.trim());
    if (lbCampaign.trim()) u.searchParams.set('utm_campaign', lbCampaign.trim());
    return u.toString();
  })();
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(lbUrl);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (e) {}
  }
</script>

{#snippet chip(t)}
  {#if t === null}<span class="metric-trend up">new</span>
  {:else if t > 0}<span class="metric-trend up">▲ {t}%</span>
  {:else if t < 0}<span class="metric-trend down">▼ {Math.abs(t)}%</span>
  {:else}<span class="metric-trend flat">no change</span>{/if}
{/snippet}

<svelte:head><title>Admin · Analytics</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Analytics</h1>
  <div class="range-pills">
    {#each [7, 30, 90] as d}
      <a href={`?days=${d}`} class:on={days === d}>{d}d</a>
    {/each}
  </div>
</div>

<div class="panel">
  <div class="panel-head"><span class="panel-label">Build a tagged link</span></div>
  <p class="admin-note" style="margin:0 0 0.7rem;">Tag a link with its source, then post it. Clicks show up under "Traffic by source" below so you can see which platform sends traffic.</p>
  <div class="lb-fields">
    <label class="admin-field lb-grow"><span>Destination</span>
      <input list="lb-dests" bind:value={lbPath} placeholder="/" />
    </label>
    <label class="admin-field"><span>Source *</span>
      <input bind:value={lbSource} placeholder="reddit" />
    </label>
    <label class="admin-field"><span>Medium</span>
      <input bind:value={lbMedium} placeholder="social" />
    </label>
    <label class="admin-field"><span>Campaign</span>
      <input bind:value={lbCampaign} placeholder="launch" />
    </label>
  </div>
  <datalist id="lb-dests">
    <option value="/"></option>
    <option value="/cheat-sheet"></option>
    <option value="/glossary"></option>
    <option value="/train"></option>
    <option value="/paths"></option>
  </datalist>
  <div class="lb-out">
    <input class="lb-url" readonly value={lbUrl} aria-label="Generated link" />
    <button type="button" class="admin-btn primary" on:click={copyLink} disabled={!lbSource.trim()}>
      {copied ? 'Copied ✓' : 'Copy link'}
    </button>
  </div>
  {#if !lbSource.trim()}<p class="admin-empty" style="margin:0.45rem 0 0;">Enter a source (e.g. reddit, twitter, newsletter) to enable copy.</p>{/if}
</div>

{#if !hasData}
  <p class="admin-empty">No traffic recorded yet. Visit a few public pages, then check back.</p>
{:else}
  <p class="admin-note" style="margin: 0 0 0.6rem;">Trends compare the last {days} days with the {days} before that.</p>
  <div class="metrics">
    <div class="metric">
      <span class="metric-n">{analytics.views.toLocaleString()}</span>
      <span class="metric-l">Views</span>
      {@render chip(tViews)}
    </div>
    <div class="metric">
      <span class="metric-n">{analytics.uniqueVisitors.toLocaleString()}</span>
      <span class="metric-l">Unique visitors / day</span>
      {@render chip(tVisitors)}
    </div>
    <div class="metric">
      <span class="metric-n">{analytics.searches.toLocaleString()}</span>
      <span class="metric-l">Searches</span>
      {@render chip(tSearches)}
    </div>
    <div class="metric">
      <span class="metric-n">{viewsPerVisitor}</span>
      <span class="metric-l">Views / visitor</span>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <span class="panel-label">Views over time</span>
      {#if hover >= 0}
        <span class="panel-readout">{fmtFull(series[hover].day)} · <b>{series[hover].count.toLocaleString()}</b> view{series[hover].count === 1 ? '' : 's'}</span>
      {/if}
    </div>
    <div class="bars" role="presentation" on:mouseleave={() => (hover = -1)}>
      {#each series as d, i}
        <div class="bar" class:active={i === hover} style={`height:${Math.round((d.count / maxPerDay) * 100)}%`}
          on:mouseenter={() => (hover = i)} title={`${fmtDay(d.day)}: ${d.count}`}></div>
      {/each}
    </div>
    {#if series.length}
      <div class="bar-axis">
        <span>{fmtDay(series[0].day)}</span>
        {#if series.length > 2}<span>{fmtDay(series[Math.floor(series.length / 2)].day)}</span>{/if}
        <span>{fmtDay(series[series.length - 1].day)}</span>
      </div>
    {/if}
  </div>

  {#if analytics.devices && analytics.devices.length}
    <h2 class="admin-h2">Devices</h2>
    <div class="ranks">
      {#each analytics.devices as r}
        <div class="rank-row">
          <span class="rank-label" style="text-transform:capitalize;">{r.device}</span>
          <span class="rank-fill" style={`width:${devTotal ? (r.count / devTotal) * 100 : 0}%`}></span>
          <b class="rank-count">{devTotal ? Math.round((r.count / devTotal) * 100) : 0}%</b>
        </div>
      {/each}
    </div>
  {/if}

  <div class="rank-cols">
    <div>
      <h2 class="admin-h2">Top guides</h2>
      <div class="ranks">
        {#each analytics.topGuides || [] as r, i}
          {@const mx = peak(analytics.topGuides)}
          <a class="rank-row" href={r.path} title={r.path}>
            <span class="rank-label">{pretty(r.path)}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </a>
        {:else}<p class="admin-empty">-</p>{/each}
      </div>
      <h2 class="admin-h2">Top categories</h2>
      <div class="ranks">
        {#each analytics.topCategories || [] as r, i}
          {@const mx = peak(analytics.topCategories)}
          <a class="rank-row" href={r.path} title={r.path}>
            <span class="rank-label">{pretty(r.path)}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </a>
        {:else}<p class="admin-empty">-</p>{/each}
      </div>
    </div>
    <div>
      <h2 class="admin-h2">Traffic by source</h2>
      <div class="ranks">
        {#each analytics.topSources || [] as r, i}
          {@const mx = peak(analytics.topSources || [])}
          <div class="rank-row">
            <span class="rank-label">{r.source}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </div>
        {:else}<p class="admin-empty">No tagged-link clicks yet. Build one above.</p>{/each}
      </div>
      <h2 class="admin-h2">Top referrers</h2>
      <div class="ranks">
        {#each analytics.topReferrers as r, i}
          {@const mx = peak(analytics.topReferrers)}
          <div class="rank-row">
            <span class="rank-label">{r.referrer}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </div>
        {:else}<p class="admin-empty">Direct / none yet</p>{/each}
      </div>
      <h2 class="admin-h2">Top search queries</h2>
      <div class="ranks">
        {#each analytics.topSearches as r, i}
          {@const mx = peak(analytics.topSearches)}
          <div class="rank-row">
            <span class="rank-label">{r.query}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </div>
        {:else}<p class="admin-empty">No searches yet</p>{/each}
      </div>
      <p class="admin-note" style="margin-top:0.8rem;">Frequent searches are your content backlog.</p>

      <h2 class="admin-h2">AI Search · Ask the guides</h2>
      {#if ai.status.configured}
        <p class="admin-note" style="margin:0 0 0.6rem;">{ai.status.used.toLocaleString()} of {ai.status.cap.toLocaleString()} AI queries used this month - <b>{ai.status.remaining.toLocaleString()} left</b>{#if !ai.status.enabled} · feature is OFF{/if}. <a href="/admin/ai-search">Manage →</a></p>
        <div class="ranks">
          {#each ai.top as r, i}
            {@const mx = peak(ai.top)}
            <div class="rank-row">
                <span class="rank-label">{r.query}</span>
              <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}></span>
              <b class="rank-count">{r.count.toLocaleString()}</b>
            </div>
          {:else}<p class="admin-empty">No AI questions yet</p>{/each}
        </div>
      {:else}
        <p class="admin-note">Not configured. <a href="/admin/ai-search">Set up AI Search →</a></p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .lb-fields { display: flex; flex-wrap: wrap; gap: 0.7rem; }
  .lb-fields .admin-field { flex: 1 1 130px; }
  .lb-fields .lb-grow { flex: 2 1 200px; }
  .lb-out { display: flex; gap: 0.5rem; margin-top: 0.8rem; }
  .lb-url {
    flex: 1; min-width: 0; padding: 0.5rem 0.65rem;
    border: 1px solid var(--line); border-radius: 8px;
    background: var(--surface); color: var(--ink);
    font-family: var(--font-mono); font-size: 0.85rem;
  }
  .lb-out .admin-btn { flex: none; white-space: nowrap; }
</style>
