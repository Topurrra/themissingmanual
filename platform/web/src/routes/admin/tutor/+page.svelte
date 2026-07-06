<script>
  import { onMount } from 'svelte';
  import { renderMarkdown } from '$lib/markdown.js';
  export let data;
  export let form;
  $: c = data.config;
  $: s = data.status;
  $: pct = s.cap ? Math.min(100, Math.round((s.used / s.cap) * 100)) : 0;
  const providerIds = ['groq', 'cerebras', 'mistral', 'openrouter', 'uncloseai', 'ollamacloud'];

  // Model values are local + reactive so the picker modal can set them.
  let modelValues = Object.fromEntries(providerIds.map((id) => [id, data.config.providers[id].model]));
  let systemPromptValue = data.config.systemPrompt || data.config.defaultSystemPrompt;

  // ── model picker: "Fetch free models" opens a real modal listing what came
  // back; clicking one fills the field (still needs the main Save after).
  let modelDialogEl;
  let modelDialogProvider = '';
  let modelDialogModels = [];
  let modelFetching = {};
  let modelErrors = {};
  async function fetchModels(id) {
    modelFetching = { ...modelFetching, [id]: true };
    modelErrors = { ...modelErrors, [id]: '' };
    try {
      const res = await fetch(`/admin/tutor/models.json?provider=${id}`);
      const j = await res.json();
      if (j.error === 'no_key') { modelErrors = { ...modelErrors, [id]: 'Save an API key first.' }; return; }
      if (!j.models?.length) { modelErrors = { ...modelErrors, [id]: 'No models returned - check the key.' }; return; }
      modelDialogProvider = id;
      modelDialogModels = j.models;
      modelDialogEl.showModal();
    } catch {
      modelErrors = { ...modelErrors, [id]: 'Fetch failed.' };
    } finally {
      modelFetching = { ...modelFetching, [id]: false };
    }
  }
  function pickModel(modelId) {
    modelValues = { ...modelValues, [modelDialogProvider]: modelId };
    modelDialogEl.close();
  }

  // ── chat test: talks to the real /tutor.json endpoint, multi-turn, so this
  // exercises the exact path a reader will get before any reader UI exists.
  let chatSlug = 'git-from-zero';
  let chatPhase = 1;
  let chatLog = [];
  let chatDraft = '';
  let chatBusy = false;
  let chatError = '';

  function resetChat() { chatLog = []; chatError = ''; }

  async function sendChat() {
    const q = chatDraft.trim();
    if (!q || chatBusy) return;
    chatDraft = '';
    chatError = '';
    const history = chatLog.map((m) => ({ role: m.role, content: m.content }));
    chatLog = [...chatLog, { role: 'user', content: q }];
    chatBusy = true;
    try {
      const res = await fetch('/tutor.json', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guideSlug: chatSlug, phaseNo: Number(chatPhase), question: q, history })
      });
      const j = await res.json();
      if (!j.enabled) chatError = 'Tutor is disabled - enable it above first.';
      else if (j.capReached) chatError = 'Monthly cap reached.';
      else if (j.error) chatError = j.error + (j.attempted ? ': ' + j.attempted.map((a) => `${a.id} ${a.error || a.skipped}`).join(', ') : '');
      else chatLog = [...chatLog, { role: 'assistant', content: j.answer, provider: j.providerUsed }];
    } catch {
      chatError = 'Request failed.';
    } finally {
      chatBusy = false;
    }
  }

  function fmtTime(ts) { return new Date(ts).toLocaleString(); }

  async function copyCode(e) {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const code = btn.closest('.code-wrap')?.querySelector('code')?.textContent || '';
    try {
      await navigator.clipboard.writeText(code);
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = prev; btn.classList.remove('done'); }, 1400);
    } catch {}
  }

  // ── Compare: two independent provider+model slots, run in parallel, each
  // stoppable and timed - mirrors LocalAIs's real Compare feature (which is
  // exactly-two-picks-side-by-side, not "every enabled provider").
  const compareIds = providerIds.filter((id) => data.config.providers[id].hasKey || data.config.providers[id].noKeyRequired);
  let cmpProvider = { A: compareIds[0] || '', B: compareIds[1] || compareIds[0] || '' };
  let cmpModel = { A: compareIds[0] ? data.config.providers[compareIds[0]].model : '', B: (compareIds[1] || compareIds[0]) ? data.config.providers[compareIds[1] || compareIds[0]].model : '' };
  let cmpModelLists = { A: [], B: [] };
  let cmpPrompt = '';
  let cmpRunning = false;
  let cmpResult = { A: null, B: null };
  let cmpControllers = { A: null, B: null };

  async function cmpLoadModels(slot) {
    const id = cmpProvider[slot];
    if (!id) { cmpModelLists = { ...cmpModelLists, [slot]: [] }; return; }
    try {
      const res = await fetch(`/admin/tutor/models.json?provider=${id}`);
      const j = await res.json();
      cmpModelLists = { ...cmpModelLists, [slot]: j.models || [] };
      if (j.models?.length && !j.models.some((m) => m.id === cmpModel[slot])) {
        cmpModel = { ...cmpModel, [slot]: c.providers[id].model };
      }
    } catch {
      cmpModelLists = { ...cmpModelLists, [slot]: [] };
    }
  }
  onMount(() => { cmpLoadModels('A'); cmpLoadModels('B'); });

  async function cmpRunOne(slot) {
    const provider = cmpProvider[slot];
    if (!provider) return;
    const ctrl = new AbortController();
    cmpControllers[slot] = ctrl;
    const t0 = Date.now();
    try {
      const res = await fetch('/admin/tutor/compare.json', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({ provider, model: cmpModel[slot], prompt: cmpPrompt })
      });
      const j = await res.json();
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      cmpResult = { ...cmpResult, [slot]: j.ok ? { content: j.content, secs } : { error: j.error, secs } };
    } catch (e) {
      cmpResult = { ...cmpResult, [slot]: { error: e.name === 'AbortError' ? 'Stopped.' : 'Request failed.' } };
    }
  }
  async function cmpRun() {
    if (cmpRunning) { cmpStop(); return; }
    const prompt = cmpPrompt.trim();
    if (!prompt) return;
    cmpResult = { A: null, B: null };
    cmpRunning = true;
    await Promise.all(['A', 'B'].map(cmpRunOne));
    cmpRunning = false;
  }
  function cmpStop() {
    Object.values(cmpControllers).forEach((ctrl) => { try { ctrl?.abort(); } catch {} });
    cmpRunning = false;
  }
  function cmpDownload(slot) {
    const r = cmpResult[slot];
    if (!r?.content) return;
    const provider = cmpProvider[slot];
    const model = cmpModel[slot];
    const md = `# ${model}\n\n- **Provider:** ${c.providers[provider]?.name || provider}\n- **Response time:** ${r.secs}s\n\n## Prompt\n\n${cmpPrompt}\n\n## Answer\n\n${r.content}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(model || 'model').replace(/[^\w.-]+/g, '_').slice(0, 50)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<h1 class="admin-h1">AI Tutor</h1>
<p class="admin-sub">Answers reader questions about the guide phase they're on, using whichever free-tier provider is enabled and not on cooldown, tried in the order below. Keys are stored server-side, never sent to the browser.</p>

<section class="cards">
  <div class="card">
    <span class="card-l">Status</span>
    <span class="card-n" class:on={s.enabled}>{s.enabled ? 'Enabled' : 'Off'}</span>
  </div>
  <div class="card">
    <span class="card-l">Answers this month</span>
    <span class="card-n">{s.used.toLocaleString()} / {s.cap.toLocaleString()}</span>
    <div class="bar"><div class="fill" style={`width:${pct}%`}></div></div>
  </div>
  <div class="card">
    <span class="card-l">Answers left ({s.month})</span>
    <span class="card-n big">{s.remaining.toLocaleString()}</span>
  </div>
</section>

{#if form?.saved}<p class="ok">Saved.</p>{/if}
{#if form?.error}<p class="err">{form.error}</p>{/if}

<form method="POST" action="?/save" class="cfg">
  <label class="row toggle">
    <input type="checkbox" name="enabled" checked={c.enabled} />
    <span>Enable the AI tutor</span>
  </label>
  <label class="row">
    <span class="lbl">Try order <em class="hint">comma-separated provider ids - the order routing mode below uses as its base sequence</em></span>
    <input name="providerOrder" value={c.providerOrder.join(',')} autocomplete="off" spellcheck="false" />
  </label>
  <label class="row">
    <span class="lbl">Routing mode <em class="hint">priority = always try order top to bottom; round robin = rotate the starting point each question, then still fail over through the rest in order - spreads load across rate limits instead of exhausting one provider first</em></span>
    <select name="routingMode" value={c.routingMode}>
      <option value="priority">Priority order</option>
      <option value="roundrobin">Round robin</option>
    </select>
  </label>
  <label class="row">
    <span class="lbl">Monthly answer cap <em class="hint">shared across all providers - a sanity governor, not a cost cap (they're free tiers)</em></span>
    <input name="monthlyCap" type="number" min="0" value={c.monthlyCap} />
  </label>
  <label class="row">
    <span class="lbl">Cooldown after a failure (seconds) <em class="hint">how long a provider sits out after erroring or rate-limiting before being retried</em></span>
    <input name="cooldownSec" type="number" min="5" value={c.cooldownSec} />
  </label>
  <label class="row">
    <span class="lbl">System prompt <em class="hint">what the tutor is told before every question - clear this box and save to fall back to the built-in default</em></span>
    <textarea name="systemPrompt" rows="7" bind:value={systemPromptValue}></textarea>
    <button type="button" class="fetch-btn reset-prompt" on:click={() => (systemPromptValue = '')}>Reset to default</button>
  </label>

  {#each providerIds as id}
    {@const p = c.providers[id]}
    <div class="provider">
      <label class="row toggle">
        <input type="checkbox" name={`${id}Enabled`} checked={p.enabled} />
        <span>{p.name} <em class="hint">{p.note}</em></span>
      </label>
      {#if !p.noKeyRequired}
        <label class="row">
          <span class="lbl">API key {#if p.hasKey}<em class="hint">stored: {p.keyHint} - leave blank to keep</em>{/if} &middot; <a class="link" href={p.keysUrl} target="_blank" rel="noopener">get a free key</a></span>
          <input name={`${id}Key`} type="password" placeholder={p.hasKey ? '•••••••• (unchanged)' : 'paste key'} autocomplete="off" />
        </label>
      {:else}
        <p class="hint no-key-note">No API key needed for this one - it's open access.</p>
      {/if}
      <label class="row">
        <span class="lbl">Model</span>
        <div class="model-row">
          <input name={`${id}Model`} bind:value={modelValues[id]} autocomplete="off" spellcheck="false" />
          <button type="button" class="fetch-btn" on:click={() => fetchModels(id)} disabled={modelFetching[id]}>
            {modelFetching[id] ? 'Fetching…' : 'Fetch free models'}
          </button>
        </div>
        {#if modelErrors[id]}<em class="hint err-hint">{modelErrors[id]}</em>{/if}
      </label>
    </div>
  {/each}

  <button class="save" type="submit">Save</button>
</form>

<dialog class="model-dialog" bind:this={modelDialogEl}>
  <h3>Pick a model{modelDialogProvider ? ` - ${c.providers[modelDialogProvider]?.name}` : ''}</h3>
  <div class="model-dialog-list">
    {#each modelDialogModels as m}
      <button type="button" class="model-option" on:click={() => pickModel(m.id)}>
        <span class="model-id">{m.id}</span>
        {#if m.free === true}<span class="tag free">free</span>{:else if m.free === false}<span class="tag paid">paid</span>{/if}
      </button>
    {:else}
      <p class="admin-empty">No models.</p>
    {/each}
  </div>
  <button type="button" class="fetch-btn" on:click={() => modelDialogEl.close()}>Cancel</button>
</dialog>

<section class="compare">
  <h2 class="admin-h2">Compare</h2>
  <p class="admin-sub">Run one prompt on two exact provider + model picks, side by side, timed - for tuning the system prompt or picking defaults before going live. Not shown to readers.</p>
  <div class="cmp-slots">
    {#each ['A', 'B'] as slot}
      <div class="cmp-slot">
        <div class="cmp-slot-pickers">
          <select bind:value={cmpProvider[slot]} on:change={() => cmpLoadModels(slot)}>
            {#each compareIds as id}<option value={id}>{c.providers[id].name}</option>{/each}
          </select>
          <select bind:value={cmpModel[slot]}>
            {#each cmpModelLists[slot] as m}<option value={m.id}>{m.id.length > 40 ? m.id.slice(0, 40) + '…' : m.id}</option>{/each}
            {#if !cmpModelLists[slot].some((m) => m.id === cmpModel[slot])}<option value={cmpModel[slot]}>{cmpModel[slot]}</option>{/if}
          </select>
        </div>
        <div class="cmp-result" on:click={copyCode}>
          {#if cmpRunning && !cmpResult[slot]}
            <div class="typing"><span></span><span></span><span></span></div>
          {:else if cmpResult[slot]?.error}
            <p class="err">{cmpResult[slot].error}</p>
          {:else if cmpResult[slot]}
            <div class="md-content">{@html renderMarkdown(cmpResult[slot].content)}</div>
            <div class="cmp-meta">
              <span>{cmpResult[slot].secs}s</span>
              <button type="button" class="fetch-btn" on:click={() => cmpDownload(slot)}>Download .md</button>
            </div>
          {:else}
            <p class="admin-empty">No result yet.</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  <form class="cmp-form" on:submit|preventDefault={cmpRun}>
    <textarea rows="3" bind:value={cmpPrompt} placeholder="e.g. Explain what a race condition is, with a real-world example."></textarea>
    <button class="save" type="submit">{cmpRunning ? 'Stop' : 'Run comparison'}</button>
  </form>
</section>

<section class="chat-test">
  <h2 class="admin-h2">Test chat</h2>
  <p class="admin-sub">Talks to the real <code>/tutor.json</code> endpoint - same routing, failover, phase context, and search tool a reader would get - multi-turn, so you can try it before the reader UI exists. Priority order, not random: it always tries providers in the "Try order" above, top to bottom, and only moves to the next one when the current one fails or is on cooldown - so if only one provider has a working key, that's the one you'll always see answer.</p>
  <div class="chat-setup">
    <label><span class="lbl">Guide slug</span><input bind:value={chatSlug} autocomplete="off" spellcheck="false" /></label>
    <label><span class="lbl">Phase</span><input type="number" min="1" bind:value={chatPhase} /></label>
    <button type="button" class="fetch-btn" on:click={resetChat}>Reset conversation</button>
  </div>
  <div class="chat-log" on:click={copyCode}>
    {#each chatLog as m}
      <div class="chat-msg {m.role}">
        <span class="who">{m.role === 'user' ? 'You' : 'Tutor'}{m.provider ? ` · ${m.provider}` : ''}</span>
        {#if m.role === 'assistant'}
          <div class="bubble md-content">{@html renderMarkdown(m.content)}</div>
        {:else}
          <p class="bubble">{m.content}</p>
        {/if}
      </div>
    {:else}
      <p class="admin-empty">No messages yet - ask something about the phase above.</p>
    {/each}
    {#if chatBusy}<div class="chat-msg assistant"><span class="who">Tutor</span><p class="thinking">Thinking…</p></div>{/if}
  </div>
  {#if chatError}<p class="err">{chatError}</p>{/if}
  <form class="chat-input" on:submit|preventDefault={sendChat}>
    <input bind:value={chatDraft} placeholder="Ask a question about this phase…" disabled={chatBusy} />
    <button class="save" type="submit" disabled={chatBusy || !chatDraft.trim()}>Send</button>
  </form>
</section>

<section class="activity">
  <h2 class="admin-h2">Recent activity</h2>
  <p class="admin-sub">Last {data.logs.length} tutor requests, newest first - question, which provider answered (or the failure), and the full response.</p>
  {#each data.logs as l}
    <details class="log-row">
      <summary>
        <span class="log-time">{fmtTime(l.ts)}</span>
        <span class="log-page">{l.guideSlug}/{l.phaseNo}</span>
        <span class="log-q">{l.question}</span>
        <span class="log-provider" class:ok={l.ok} class:bad={!l.ok}>{l.ok ? l.provider : 'failed: ' + l.provider}</span>
        <span class="log-rating">
          {#if l.rating === 'up'}
            <i class="ti ti-thumb-up rate-up" aria-label="Reader marked helpful" title="Reader marked helpful"></i>
          {:else if l.rating === 'down'}
            <i class="ti ti-thumb-down rate-down" aria-label="Reader marked not helpful" title="Reader marked not helpful"></i>
          {/if}
        </span>
      </summary>
      <p class="log-answer">{l.answer || '(no answer)'}</p>
    </details>
  {:else}
    <p class="admin-empty">No tutor activity yet.</p>
  {/each}
</section>

<style>
  .admin-h1 { margin: 0 0 0.2rem; }
  .admin-h2 { font-size: 1.15rem; margin: 0 0 0.3rem; }
  .admin-sub { color: var(--muted); margin: 0 0 1.2rem; max-width: 64ch; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1.4rem; }
  .card { border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem 1rem; background: var(--raise); display: flex; flex-direction: column; gap: 0.3rem; }
  .card-l { font-size: 0.75rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .card-n { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; color: var(--ink); }
  .card-n.on { color: #2e9e6b; }
  .card-n.big { font-size: 1.6rem; }
  .bar { height: 6px; background: var(--surface); border-radius: 999px; overflow: hidden; margin-top: 0.2rem; }
  .fill { height: 100%; background: var(--accent); border-radius: 999px; }
  .cfg { display: flex; flex-direction: column; gap: 0.9rem; max-width: 560px; border: 1px solid var(--line); border-radius: 12px; padding: 1.1rem; background: var(--raise); }
  .row { display: flex; flex-direction: column; gap: 0.3rem; }
  .row.toggle { flex-direction: row; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--ink); }
  .row.toggle input { accent-color: var(--accent); width: 16px; height: 16px; }
  .lbl { font-size: 0.85rem; color: var(--muted); }
  .hint { font-style: normal; color: var(--faint); font-size: 0.78rem; }
  .link { color: var(--accent); }
  .cfg input:not([type='checkbox']) { font: inherit; padding: 0.45rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .cfg input:focus { outline: none; border-color: var(--accent); }
  .cfg textarea { font: inherit; padding: 0.5rem 0.65rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; }
  .cfg textarea:focus { outline: none; border-color: var(--accent); }
  .reset-prompt { align-self: flex-start; margin-top: 0.2rem; }
  .no-key-note { margin: 0; }
  .provider { display: flex; flex-direction: column; gap: 0.7rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
  .save { align-self: flex-start; cursor: pointer; font: inherit; font-weight: 600; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 9px; padding: 0.5rem 1.1rem; }
  .save:disabled { opacity: 0.6; cursor: default; }
  .ok { color: #2e9e6b; } .err { color: #c0563c; }
  .compare { margin-top: 1.8rem; max-width: 780px; }
  .cmp-slots { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.9rem; }
  .cmp-slot { border: 1px solid var(--line); border-radius: 10px; background: var(--raise); overflow: hidden; }
  .cmp-slot-pickers { display: flex; gap: 0.4rem; padding: 0.6rem; border-bottom: 1px solid var(--line); }
  .cmp-slot-pickers select { flex: 1; min-width: 0; font: inherit; font-size: 0.78rem; padding: 0.35rem 0.4rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--ink); }
  .cmp-result { padding: 0.8rem 0.9rem; min-height: 90px; }
  .cmp-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 0.6rem; font-size: 0.75rem; color: var(--faint); font-family: var(--font-mono); }
  .admin-empty { color: var(--faint); }
  .typing { display: flex; gap: 4px; padding: 0.4rem 0; }
  .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); animation: typing-bounce 1.1s infinite ease-in-out; }
  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
  .cmp-form { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
  .cmp-form textarea { font: inherit; padding: 0.6rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--raise); color: var(--ink); resize: vertical; }
  .cmp-form textarea:focus { outline: none; border-color: var(--accent); }

  .model-row { display: flex; gap: 0.5rem; }
  .model-row input { flex: 1; }
  .fetch-btn { flex: none; cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 600; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 0.45rem 0.7rem; white-space: nowrap; }
  .fetch-btn:hover { border-color: var(--accent); }
  .fetch-btn:disabled { opacity: 0.6; cursor: default; }
  .err-hint { color: #c0563c; }

  .model-dialog { border: 1px solid var(--line); border-radius: 14px; padding: 1.1rem; background: var(--raise); color: var(--ink); max-width: 480px; width: 90vw; }
  .model-dialog::backdrop { background: rgba(10, 10, 12, 0.5); }
  .model-dialog h3 { margin: 0 0 0.8rem; font-size: 1.05rem; }
  .model-dialog-list { display: flex; flex-direction: column; gap: 0.35rem; max-height: 340px; overflow-y: auto; margin-bottom: 0.9rem; }
  .model-option { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; text-align: left; font: inherit; font-size: 0.85rem; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.7rem; cursor: pointer; }
  .model-option:hover { border-color: var(--accent); }
  .model-id { font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tag { font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.45rem; border-radius: 999px; flex: none; }
  .tag.free { background: rgba(46, 158, 107, 0.15); color: #2e9e6b; }
  .tag.paid { background: rgba(192, 86, 60, 0.12); color: #c0563c; }

  .chat-test { margin-top: 1.8rem; max-width: 640px; }
  .chat-setup { display: flex; align-items: flex-end; gap: 0.8rem; margin-bottom: 0.9rem; flex-wrap: wrap; }
  .chat-setup label { display: flex; flex-direction: column; gap: 0.3rem; }
  .chat-setup input { font: inherit; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--raise); color: var(--ink); width: 9rem; }
  .chat-setup input[type='number'] { width: 5rem; }
  .chat-log { display: flex; flex-direction: column; gap: 0.6rem; border: 1px solid var(--line); border-radius: 12px; padding: 0.9rem; min-height: 100px; max-height: 360px; overflow-y: auto; overflow-x: hidden; background: var(--raise); margin-bottom: 0.8rem; }
  .chat-msg { max-width: 85%; min-width: 0; }
  .chat-msg.user { align-self: flex-end; text-align: right; }
  .chat-msg .who { display: block; font-size: 0.72rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
  .chat-msg .bubble { margin: 0; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; display: inline-block; max-width: 100%; overflow-wrap: break-word; box-sizing: border-box; padding: 0.5rem 0.7rem; border-radius: 10px; background: var(--surface); text-align: left; }
  .chat-msg.user .bubble { background: var(--accent-tint); }
  .chat-msg .bubble.md-content { white-space: normal; }
  .chat-msg p.thinking { margin: 0; font-size: 0.9rem; display: inline-block; padding: 0.5rem 0.7rem; border-radius: 10px; background: var(--surface); color: var(--muted); font-style: italic; }
  .chat-input { display: flex; gap: 0.6rem; }
  .chat-input input { flex: 1; font: inherit; padding: 0.55rem 0.7rem; border: 1px solid var(--line); border-radius: 8px; background: var(--raise); color: var(--ink); }
  .chat-input input:focus { outline: none; border-color: var(--accent); }
  .chat-input button:disabled { opacity: 0.6; cursor: default; }

  .activity { margin-top: 1.8rem; max-width: 780px; }
  .log-row { border: 1px solid var(--line); border-radius: 10px; padding: 0.55rem 0.8rem; margin-bottom: 0.4rem; background: var(--raise); }
  .log-row summary { display: grid; grid-template-columns: 11rem 8rem 1fr auto auto; gap: 0.7rem; align-items: center; cursor: pointer; font-size: 0.82rem; }
  .log-time, .log-page { color: var(--faint); font-family: var(--font-mono); font-size: 0.74rem; white-space: nowrap; }
  .log-q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log-provider { font-family: var(--font-mono); font-size: 0.74rem; white-space: nowrap; }
  .log-provider.ok { color: #2e9e6b; }
  .log-provider.bad { color: #c0563c; }
  .log-rating { width: 1rem; text-align: center; }
  .log-rating .rate-up { color: #2e9e6b; }
  .log-rating .rate-down { color: #c0563c; }
  .log-answer { margin: 0.6rem 0 0; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; }

  @media (max-width: 640px) {
    .cards { grid-template-columns: 1fr; }
    .log-row summary { grid-template-columns: 1fr; }
    .cmp-slots { grid-template-columns: 1fr; }
  }
</style>
