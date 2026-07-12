<script>
  export let data;
  $: ({ analytics, days } = data);
  $: ai = data.ai;
  $: prev = analytics.prev || { views: 0, uniqueVisitors: 0, searches: 0 };
  $: hasData = analytics.views > 0 || analytics.searches > 0;

  const peak = (rows) => Math.max(1, ...rows.map((r) => r.count));
  const pretty = (p) => {
    if (p === "/") return "Home";
    let m;
    if ((m = p.match(/^\/guides\/([^/]+)(?:\/(\d+))?/)))
      return m[1].replace(/-/g, " ") + (m[2] ? ` · phase ${m[2]}` : "");
    if ((m = p.match(/^\/categories\/([^/]+)/))) return m[1].replace(/-/g, " ");
    return p.replace(/^\//, "").replace(/-/g, " ");
  };
  const fmtDay = (k) => {
    try {
      return new Date(k + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return k;
    }
  };
  const fmtFull = (k) => {
    try {
      return new Date(k + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return k;
    }
  };
  let hover = -1; // hovered bar index, -1 = none

  // Zero-fill the day series so the chart spans the whole window (no skipped days).
  function fillDays(n, rows) {
    const map = Object.fromEntries((rows || []).map((r) => [r.day, r.count]));
    const out = [];
    const t = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(t);
      d.setDate(t.getDate() - i);
      out.push({
        day: d.toISOString().slice(0, 10),
        count: map[d.toISOString().slice(0, 10)] || 0,
      });
    }
    return out;
  }
  $: series = fillDays(days, analytics.perDay);
  $: maxPerDay = Math.max(1, ...series.map((d) => d.count));
  $: devTotal = (analytics.devices || []).reduce((a, d) => a + d.count, 0);
  $: viewsPerVisitor = analytics.uniqueVisitors
    ? (analytics.views / analytics.uniqueVisitors).toFixed(1)
    : "0";
  // Engaged reading time (dwell): active time only, tab-hidden time excluded.
  const fmtDur = (ms) => {
    const s = Math.round((ms || 0) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  };
  $: avgDwell = analytics.avgDwellMs || 0;
  const trend = (cur, prv) =>
    prv > 0 ? Math.round(((cur - prv) / prv) * 100) : cur > 0 ? null : 0;
  $: tViews = trend(analytics.views, prev.views);
  $: tVisitors = trend(analytics.uniqueVisitors, prev.uniqueVisitors);
  $: tSearches = trend(analytics.searches, prev.searches);

  // New sections: zero-result searches, read-completion funnel, Core Web
  // Vitals, JS errors, AI-crawler traffic. All keyed off analytics fields
  // that may be absent on older data, hence the `|| []` / `|| {}` fallbacks.
  $: zeroSearches = analytics.zeroResultSearches || [];
  $: funnel = analytics.readFunnel || { p25: 0, p50: 0, p75: 0, p100: 0 };
  $: finishRate = funnel.p25 ? Math.round((funnel.p100 / funnel.p25) * 100) : 0;
  $: vitals = analytics.vitals || {};
  $: topErrors = analytics.topErrors || [];
  $: botHits = analytics.botHits || [];
  $: hvb = analytics.humanVsBot || { human: 0, bot: 0 };
  $: botPct = hvb.human + hvb.bot ? Math.round((hvb.bot / (hvb.human + hvb.bot)) * 100) : 0;

  const fmtVital = (metric, v) => {
    if (v == null) return "—";
    if (metric === "CLS") return (v / 1000).toFixed(2);
    return v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`;
  };
  const vitalThresholds = { LCP: [2500, 4000], INP: [200, 500], CLS: [100, 250] };
  const vitalStatus = (metric, v) => {
    if (v == null) return "flat";
    const [good, poor] = vitalThresholds[metric];
    return v <= good ? "up" : v > poor ? "down" : "flat";
  };
  const vitalWord = { up: "good", down: "poor", flat: "needs improvement" };
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
{#if !hasData}
  <p class="admin-empty">
    No traffic recorded yet. Visit a few public pages, then check back.
  </p>
{:else}
  <p class="admin-note" style="margin: 0 0 0.6rem;">
    Trends compare the last {days} days with the {days} before that.
  </p>
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
    <div class="metric">
      <span class="metric-n">{avgDwell ? fmtDur(avgDwell) : "—"}</span>
      <span class="metric-l">Avg engaged time / view</span>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <span class="panel-label">Views over time</span>
      {#if hover >= 0}
        <span class="panel-readout"
          >{fmtFull(series[hover].day)} ·
          <b>{series[hover].count.toLocaleString()}</b>
          view{series[hover].count === 1 ? "" : "s"}</span
        >
      {/if}
    </div>
    <div class="bars" role="presentation" on:mouseleave={() => (hover = -1)}>
      {#each series as d, i}
        <div
          class="bar"
          class:active={i === hover}
          style={`height:${Math.round((d.count / maxPerDay) * 100)}%`}
          on:mouseenter={() => (hover = i)}
          title={`${fmtDay(d.day)}: ${d.count}`}
        ></div>
      {/each}
    </div>
    {#if series.length}
      <div class="bar-axis">
        <span>{fmtDay(series[0].day)}</span>
        {#if series.length > 2}<span
            >{fmtDay(series[Math.floor(series.length / 2)].day)}</span
          >{/if}
        <span>{fmtDay(series[series.length - 1].day)}</span>
      </div>
    {/if}
  </div>

  {#if analytics.devices && analytics.devices.length}
    <h2 class="admin-h2">Devices</h2>
    <div class="ranks">
      {#each analytics.devices as r}
        <div class="rank-row">
          <span class="rank-label" style="text-transform:capitalize;"
            >{r.device}</span
          >
          <span
            class="rank-fill"
            style={`width:${devTotal ? (r.count / devTotal) * 100 : 0}%`}
          ></span>
          <b class="rank-count"
            >{devTotal ? Math.round((r.count / devTotal) * 100) : 0}%</b
          >
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
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
            ></span>
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
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
            ></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </a>
        {:else}<p class="admin-empty">-</p>{/each}
      </div>
      <h2 class="admin-h2">Guides that hold attention</h2>
      <div class="ranks">
        {#each analytics.topDwell || [] as r}
          {@const mx = Math.max(1, ...(analytics.topDwell || []).map((d) => d.ms))}
          <a class="rank-row" href={r.path} title={`${r.views} views`}>
            <span class="rank-label">{pretty(r.path)}</span>
            <span class="rank-fill" style={`width:${(r.ms / mx) * 100}%`}></span>
            <b class="rank-count">{fmtDur(r.ms)}</b>
          </a>
        {:else}<p class="admin-empty">
            Not enough engaged-time data yet (needs ≥3 views per guide).
          </p>{/each}
      </div>
      <p class="admin-note" style="margin-top:0.4rem;">
        Avg active reading time per view — background-tab time excluded. High views +
        low time here = a guide people open but don't read.
      </p>
    </div>
    <div>
      <h2 class="admin-h2">Traffic by source</h2>
      <div class="ranks">
        {#each analytics.topSources || [] as r, i}
          {@const mx = peak(analytics.topSources || [])}
          <div class="rank-row">
            <span class="rank-label">{r.source}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
            ></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </div>
        {:else}<p class="admin-empty">
            No tagged-link clicks yet. Build one above.
          </p>{/each}
      </div>
      <h2 class="admin-h2">Top referrers</h2>
      <div class="ranks">
        {#each analytics.topReferrers as r, i}
          {@const mx = peak(analytics.topReferrers)}
          <div class="rank-row">
            <span class="rank-label">{r.referrer}</span>
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
            ></span>
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
            <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
            ></span>
            <b class="rank-count">{r.count.toLocaleString()}</b>
          </div>
        {:else}<p class="admin-empty">No searches yet</p>{/each}
      </div>
      <p class="admin-note" style="margin-top:0.8rem;">
        Frequent searches are your content backlog.
      </p>

      <h2 class="admin-h2">AI Search · Ask the guides</h2>
      {#if ai.status.configured}
        <p class="admin-note" style="margin:0 0 0.6rem;">
          {ai.status.used.toLocaleString()} of {ai.status.cap.toLocaleString()} AI
          queries used this month -
          <b>{ai.status.remaining.toLocaleString()} left</b
          >{#if !ai.status.enabled}
            · feature is OFF{/if}. <a href="/admin/ai-search">Manage →</a>
        </p>
        <div class="ranks">
          {#each ai.top as r, i}
            {@const mx = peak(ai.top)}
            <div class="rank-row">
              <span class="rank-label">{r.query}</span>
              <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
              ></span>
              <b class="rank-count">{r.count.toLocaleString()}</b>
            </div>
          {:else}<p class="admin-empty">No AI questions yet</p>{/each}
        </div>
      {:else}
        <p class="admin-note">
          Not configured. <a href="/admin/ai-search">Set up AI Search →</a>
        </p>
      {/if}
    </div>
  </div>

  <h2 class="admin-h2">Zero-result searches</h2>
  <p class="admin-note" style="margin:0 0 0.4rem;">
    These are the content backlog — what people search for and don't find.
  </p>
  <div class="ranks">
    {#each zeroSearches as r}
      {@const mx = peak(zeroSearches)}
      <div class="rank-row">
        <span class="rank-label">{r.query}</span>
        <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
        ></span>
        <b class="rank-count">{r.count.toLocaleString()}</b>
      </div>
    {:else}<p class="admin-empty">No zero-result searches recorded</p>{/each}
  </div>

  <h2 class="admin-h2">Read completion</h2>
  <div class="metrics">
    <div class="metric">
      <span class="metric-n">{finishRate}%</span>
      <span class="metric-l">Finished the page (of readers who reached 25%)</span>
    </div>
  </div>
  <div class="ranks">
    {#each [["25% scrolled", funnel.p25], ["50% scrolled", funnel.p50], ["75% scrolled", funnel.p75], ["100% scrolled", funnel.p100]] as [label, n]}
      {@const mx = Math.max(1, funnel.p25)}
      <div class="rank-row">
        <span class="rank-label">{label}</span>
        <span class="rank-fill" style={`width:${(n / mx) * 100}%`}></span>
        <b class="rank-count">{n.toLocaleString()}</b>
      </div>
    {/each}
  </div>

  <h2 class="admin-h2">Core Web Vitals</h2>
  <div class="metrics">
    {#each ["LCP", "INP", "CLS"] as m}
      {@const v = vitals[m]}
      <div class="metric">
        <span class="metric-n">{v ? fmtVital(m, v.med) : "—"}</span>
        <span class="metric-l">{m} (median)</span>
        {#if v}<span class={`metric-trend ${vitalStatus(m, v.med)}`}
            >{vitalWord[vitalStatus(m, v.med)]}</span
          >{/if}
      </div>
    {/each}
  </div>
  <div class="ranks">
    {#each ["LCP", "INP", "CLS"] as m}
      {@const v = vitals[m]}
      {@const total = v ? v.good + v.ni + v.poor : 0}
      {#if total > 0}
        <div class="rank-row">
          <span class="rank-label">{m} · good split</span>
          <span class="rank-fill" style={`width:${(v.good / total) * 100}%`}
          ></span>
          <b class="rank-count">{Math.round((v.good / total) * 100)}%</b>
        </div>
      {/if}
    {/each}
    {#if !["LCP", "INP", "CLS"].some((m) => vitals[m] && vitals[m].good + vitals[m].ni + vitals[m].poor > 0)}
      <p class="admin-empty">No Core Web Vitals samples yet</p>
    {/if}
  </div>

  <h2 class="admin-h2">JS errors</h2>
  <div class="ranks">
    {#each topErrors as r}
      {@const mx = peak(topErrors)}
      <div class="rank-row">
        <span class="rank-label">{r.sig}</span>
        <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
        ></span>
        <b class="rank-count">{r.count.toLocaleString()}</b>
      </div>
    {:else}<p class="admin-empty">No client errors — nice.</p>{/each}
  </div>

  <h2 class="admin-h2">AI crawlers vs humans</h2>
  <p class="admin-note" style="margin:0 0 0.4rem;">
    Is our GEO work being read by AI engines? Bot hits are known AI/search
    crawler user agents requesting a page.
  </p>
  <div class="metrics">
    <div class="metric">
      <span class="metric-n">{hvb.human.toLocaleString()}</span>
      <span class="metric-l">Human pageviews</span>
    </div>
    <div class="metric">
      <span class="metric-n">{hvb.bot.toLocaleString()}</span>
      <span class="metric-l">Bot hits ({botPct}% of total)</span>
    </div>
  </div>
  <div class="ranks">
    {#each botHits as r}
      {@const mx = peak(botHits)}
      <div class="rank-row">
        <span class="rank-label">{r.bot}</span>
        <span class="rank-fill" style={`width:${(r.count / mx) * 100}%`}
        ></span>
        <b class="rank-count">{r.count.toLocaleString()}</b>
      </div>
    {:else}<p class="admin-empty">No crawler hits recorded yet</p>{/each}
  </div>
{/if}
