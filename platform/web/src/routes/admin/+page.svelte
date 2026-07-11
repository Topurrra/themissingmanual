<script>
  export let data;
  $: ({ published, drafts, categoryCount, recent } = data);

  // Tagged-link builder. Builds a utm-tagged URL; clicks land under "Traffic
  // by source" below (the beacon reads utm_source). Pure client-side.
  let lbPath = "/";
  let lbSource = "";
  let lbMedium = "";
  let lbCampaign = "";
  let copied = false;
  $: lbUrl = (() => {
    const origin =
      typeof location !== "undefined"
        ? location.origin
        : "https://themissingmanual.dev";
    let p = (lbPath || "/").trim();
    if (!p.startsWith("/")) p = "/" + p;
    let u;
    try {
      u = new URL(origin + p);
    } catch (e) {
      return origin + "/";
    }
    if (lbSource.trim()) u.searchParams.set("utm_source", lbSource.trim());
    if (lbMedium.trim()) u.searchParams.set("utm_medium", lbMedium.trim());
    if (lbCampaign.trim())
      u.searchParams.set("utm_campaign", lbCampaign.trim());
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

<svelte:head><title>Admin · Dashboard</title></svelte:head>

<h1 class="admin-h1">Dashboard</h1>
<p class="admin-sub">
  Your library at a glance — what's live, what's in progress, and what changed
  recently.
</p>
<div class="metrics">
  <div class="metric">
    <span class="metric-k">Live</span><span class="metric-n">{published}</span
    ><span class="metric-l">Published</span>
  </div>
  <div class="metric">
    <span class="metric-k">In progress</span><span class="metric-n"
      >{drafts}</span
    ><span class="metric-l">Drafts</span>
  </div>
  <div class="metric">
    <span class="metric-k">Topics</span><span class="metric-n"
      >{categoryCount}</span
    ><span class="metric-l">Categories</span>
  </div>
</div>

<div class="panel">
  <div class="panel-head">
    <span class="panel-label">Build a tagged link</span>
  </div>
  <p class="admin-note" style="margin:0 0 0.7rem;">
    Tag a link with its source, then post it. Clicks show up under "Traffic by
    source" below so you can see which platform sends traffic.
  </p>
  <div class="lb-fields">
    <label class="admin-field lb-grow"
      ><span>Destination</span>
      <input list="lb-dests" bind:value={lbPath} placeholder="/" />
    </label>
    <label class="admin-field"
      ><span>Source *</span>
      <input bind:value={lbSource} placeholder="reddit" />
    </label>
    <label class="admin-field"
      ><span>Medium</span>
      <input bind:value={lbMedium} placeholder="social" />
    </label>
    <label class="admin-field"
      ><span>Campaign</span>
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
    <button
      type="button"
      class="admin-btn primary"
      on:click={copyLink}
      disabled={!lbSource.trim()}
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  </div>
  {#if !lbSource.trim()}<p class="admin-empty" style="margin:0.45rem 0 0;">
      Enter a source (e.g. reddit, twitter, newsletter) to enable copy.
    </p>{/if}
</div>

<div class="admin-head">
  <h2 class="admin-h2">Recently edited</h2>
  <a class="admin-btn" href="/admin/content"
    ><i class="ti ti-files" aria-hidden="true"></i> Manage content</a
  >
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

<style>
  .lb-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
  }
  .lb-fields .admin-field {
    flex: 1 1 130px;
  }
  .lb-fields .lb-grow {
    flex: 2 1 200px;
  }
  .lb-out {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .lb-url {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }
  .lb-out .admin-btn {
    flex: none;
    white-space: nowrap;
  }
</style>
