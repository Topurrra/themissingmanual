<script>
  export let data;
  $: ({ published, drafts, categoryCount, recent } = data);
</script>

<svelte:head><title>Admin · Dashboard</title></svelte:head>

<h1 class="admin-h1">Dashboard</h1>
<p class="admin-sub">Your library at a glance — what's live, what's in progress, and what changed recently.</p>
<div class="metrics">
  <div class="metric"><span class="metric-k">Live</span><span class="metric-n">{published}</span><span class="metric-l">Published</span></div>
  <div class="metric"><span class="metric-k">In progress</span><span class="metric-n">{drafts}</span><span class="metric-l">Drafts</span></div>
  <div class="metric"><span class="metric-k">Topics</span><span class="metric-n">{categoryCount}</span><span class="metric-l">Categories</span></div>
</div>

<div class="admin-head">
  <h2 class="admin-h2">Recently edited</h2>
  <a class="admin-btn" href="/admin/content"><i class="ti ti-files" aria-hidden="true"></i> Manage content</a>
</div>
<ul class="admin-list">
  {#each recent as g}
    <li>
      <a href={`/admin/content/${g.slug}`}>{g.title}</a>
      <span class={`badge ${g.status}`}>{g.status}</span>
    </li>
  {:else}
    <li class="admin-empty">No topics yet. Create one from Content.</li>
  {/each}
</ul>
