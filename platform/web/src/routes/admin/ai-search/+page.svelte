<script>
  export let data;
  export let form;
  $: c = data.config;
  $: s = data.status;
  $: pct = s.cap ? Math.min(100, Math.round((s.used / s.cap) * 100)) : 0;
  $: peak = Math.max(1, ...data.topAsks.map((r) => r.count));
</script>

<h1 class="admin-h1">AI Search</h1>
<p class="admin-sub">Optional Cloudflare AI Search powers the “Ask the guides” box on search. When off, the site uses Tantivy keyword search only.</p>

<section class="cards">
  <div class="card">
    <span class="card-l">Status</span>
    <span class="card-n" class:on={s.enabled}>{s.enabled ? 'Enabled' : s.configured ? 'Configured · off' : 'Not configured'}</span>
  </div>
  <div class="card">
    <span class="card-l">Queries this month</span>
    <span class="card-n">{s.used.toLocaleString()} / {s.cap.toLocaleString()}</span>
    <div class="bar"><div class="fill" style={`width:${pct}%`}></div></div>
  </div>
  <div class="card">
    <span class="card-l">Searches left ({s.month})</span>
    <span class="card-n big">{s.remaining.toLocaleString()}</span>
  </div>
</section>

{#if form?.saved}<p class="ok">Saved.</p>{/if}
{#if form?.error}<p class="err">{form.error}</p>{/if}

<form method="POST" action="?/save" class="cfg">
  <label class="row toggle">
    <input type="checkbox" name="enabled" checked={c.enabled} />
    <span>Enable “Ask the guides” (AI Search)</span>
  </label>
  <label class="row toggle">
    <input type="checkbox" name="generate" checked={c.generate} />
    <span>Generate written answers <em class="hint">uses Workers AI — billed separately, may cost beyond the free tier. Off = semantic search only (free).</em></span>
  </label>
  <label class="row">
    <span class="lbl">Cloudflare Account ID</span>
    <input name="accountId" value={c.accountId} autocomplete="off" spellcheck="false" />
  </label>
  <label class="row">
    <span class="lbl">AI Search instance name</span>
    <input name="name" value={c.name} autocomplete="off" spellcheck="false" />
  </label>
  <label class="row">
    <span class="lbl">API token {#if c.hasToken}<em class="hint">stored: {c.tokenHint} — leave blank to keep</em>{/if}</span>
    <input name="token" type="password" placeholder={c.hasToken ? '•••••••• (unchanged)' : 'paste token'} autocomplete="off" />
  </label>
  <label class="row">
    <span class="lbl">Monthly query cap <em class="hint">stays under the Free 20,000/mo limit</em></span>
    <input name="monthlyCap" type="number" min="0" value={c.monthlyCap} />
  </label>
  <button class="save" type="submit">Save</button>
</form>

<section class="asks">
  <h2 class="admin-h2">Top AI questions</h2>
  {#each data.topAsks as r}
    <div class="rank"><span class="q">{r.query}</span><span class="bars"><span class="b" style={`width:${(r.count / peak) * 100}%`}></span></span><span class="n">{r.count}</span></div>
  {:else}
    <p class="admin-empty">No AI questions yet.</p>
  {/each}
</section>

<style>
  .admin-h1 { margin: 0 0 0.2rem; }
  .admin-sub { color: var(--muted); margin: 0 0 1.2rem; max-width: 60ch; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1.4rem; }
  .card { border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1rem; background: var(--raise); display: flex; flex-direction: column; gap: 0.3rem; }
  .card-l { font-size: 0.75rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .card-n { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; color: var(--ink); }
  .card-n.on { color: #2e9e6b; }
  .card-n.big { font-size: 1.6rem; }
  .bar { height: 6px; background: var(--surface); border-radius: 999px; overflow: hidden; margin-top: 0.2rem; }
  .fill { height: 100%; background: var(--accent); border-radius: 999px; }
  .cfg { display: flex; flex-direction: column; gap: 0.9rem; max-width: 520px; border: 1px solid var(--line); border-radius: 12px; padding: 1.1rem; background: var(--raise); }
  .row { display: flex; flex-direction: column; gap: 0.3rem; }
  .row.toggle { flex-direction: row; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--ink); }
  .row.toggle input { accent-color: var(--accent); width: 16px; height: 16px; }
  .lbl { font-size: 0.85rem; color: var(--muted); }
  .hint { font-style: normal; color: var(--faint); font-size: 0.78rem; }
  .cfg input:not([type='checkbox']) { font: inherit; padding: 0.45rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .cfg input:focus { outline: none; border-color: var(--accent); }
  .save { align-self: flex-start; cursor: pointer; font: inherit; font-weight: 600; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 9px; padding: 0.5rem 1.1rem; }
  .ok { color: #2e9e6b; } .err { color: #c0563c; }
  .asks { margin-top: 1.6rem; }
  .rank { display: grid; grid-template-columns: 1fr 120px 44px; align-items: center; gap: 0.6rem; padding: 0.25rem 0; }
  .rank .q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem; }
  .rank .bars { background: var(--surface); border-radius: 999px; height: 8px; overflow: hidden; }
  .rank .b { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
  .rank .n { text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--muted); }
  .admin-empty { color: var(--faint); }
  @media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }
</style>
