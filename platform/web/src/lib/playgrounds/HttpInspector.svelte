<script>
  let method = 'GET';
  let path = '/api/users/42';
  let host = 'api.example.com';
  let body = '';
  let sent = null;

  const STATUS = { GET: [200, 'OK'], POST: [201, 'Created'], PUT: [200, 'OK'], PATCH: [200, 'OK'], DELETE: [204, 'No Content'] };
  $: hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

  function send() {
    const [code, text] = STATUS[method] || [200, 'OK'];
    const reqLines = [`${method} ${path} HTTP/1.1`, `Host: ${host}`, 'Accept: application/json', 'User-Agent: MissingManual/1.0'];
    if (hasBody && body.trim()) { reqLines.push('Content-Type: application/json', `Content-Length: ${body.trim().length}`); }
    const req = reqLines.join('\n') + '\n' + (hasBody && body.trim() ? '\n' + body.trim() : '');
    const respBody = code === 204 ? '' : (method === 'GET'
      ? '{\n  "id": 42,\n  "name": "Ada Lovelace"\n}'
      : hasBody && body.trim() ? body.trim() : '{\n  "ok": true\n}');
    const resp = [`HTTP/1.1 ${code} ${text}`, 'Content-Type: application/json', 'Cache-Control: no-cache', `Content-Length: ${respBody.length}`].join('\n') + (respBody ? '\n\n' + respBody : '');
    sent = { req, resp, code };
  }
  send();
</script>

<figure class="pg pg-http">
  <figcaption class="pg-cap"><i class="ti ti-http-get" aria-hidden="true"></i> HTTP request inspector</figcaption>
  <div class="ht-body">
    <div class="ht-controls">
      <select bind:value={method}>{#each Object.keys(STATUS) as m}<option>{m}</option>{/each}</select>
      <input class="ht-path" bind:value={path} spellcheck="false" aria-label="Path" />
      <button class="ht-send" on:click={send}><i class="ti ti-send"></i> Send</button>
    </div>
    {#if hasBody}
      <textarea class="ht-bodyin" bind:value={body} rows="3" spellcheck="false" placeholder={'Request body (JSON), e.g. {"name": "Ada"}'}></textarea>
    {/if}
    {#if sent}
      <div class="ht-panes">
        <div class="ht-pane">
          <span class="ht-h"><i class="ti ti-arrow-up-right"></i> Request</span>
          <pre>{sent.req}</pre>
        </div>
        <div class="ht-pane">
          <span class="ht-h"><i class="ti ti-arrow-down-left"></i> Response <em class="ht-code" class:err={sent.code >= 400}>{sent.code}</em></span>
          <pre>{sent.resp}</pre>
        </div>
      </div>
    {/if}
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .ht-body { background: var(--raise); padding: 0.9rem; }
  .ht-controls { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
  .ht-controls select { font: inherit; font-family: var(--font-mono); font-size: 0.85rem; padding: 0.4rem 0.5rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); font-weight: 600; }
  .ht-path { flex: 1; font: inherit; font-family: var(--font-mono); font-size: 0.85rem; padding: 0.4rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .ht-path:focus { outline: none; border-color: var(--accent); }
  .ht-send { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 8px; padding: 0.4rem 0.8rem; font-weight: 600; }
  .ht-bodyin { width: 100%; box-sizing: border-box; font-family: var(--font-mono); font-size: 0.82rem; padding: 0.5rem 0.6rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); resize: vertical; margin-bottom: 0.6rem; }
  .ht-bodyin:focus { outline: none; border-color: var(--accent); }
  .ht-panes { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .ht-pane { border: 1px solid var(--line); border-radius: 9px; overflow: hidden; background: var(--bg); }
  .ht-h { display: flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--line); background: var(--surface); }
  .ht-h .ti { color: var(--accent); }
  .ht-code { margin-left: auto; font-style: normal; color: #2e9e6b; }
  .ht-code.err { color: #c0563c; }
  .ht-pane pre { margin: 0; padding: 0.6rem 0.7rem; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.5; color: var(--body); white-space: pre-wrap; word-break: break-word; }
  @media (max-width: 560px) { .ht-panes { grid-template-columns: 1fr; } }
</style>
