<script>
  const PAGE = 'https://app.example.com';
  let allow = PAGE;          // server's Access-Control-Allow-Origin
  let method = 'GET';
  let customHeader = false;   // adds X-Auth-Token -> forces preflight
  let withCreds = false;

  const ALLOW_OPTS = [
    [PAGE, 'app.example.com (exact)'],
    ['*', '* (any origin)'],
    ['https://other.com', 'other.com (different)'],
    ['', '(none - header absent)']
  ];

  // A request is "simple" only for GET/HEAD/POST with no custom headers.
  $: simple = ['GET', 'HEAD', 'POST'].includes(method) && !customHeader;
  $: originOk = allow === '*' || allow === PAGE;
  $: credClash = withCreds && allow === '*'; // wildcard not allowed with credentials
  $: allowed = originOk && !credClash;
  $: reason = (() => {
    if (!allow) return 'The server sent no Access-Control-Allow-Origin header, so the browser blocks the page from reading the response.';
    if (allow === 'https://other.com') return `The server only allows other.com, but the page is ${PAGE}. The origin doesn't match, so the browser blocks it.`;
    if (credClash) return 'With credentials (cookies) the server may NOT use "*" - it must echo the exact origin. The browser blocks it.';
    if (allow === '*') return 'The server allows any origin ("*"), so the browser lets the page read the response.';
    return 'The server explicitly allows this exact origin, so the browser lets the page read the response.';
  })();
</script>

<figure class="pg pg-cors">
  <figcaption class="pg-cap"><i class="ti ti-shield-lock" aria-hidden="true"></i> CORS simulator</figcaption>
  <div class="co-body">
    <div class="co-scenario">Page at <code>{PAGE}</code> calls <code>https://api.other.com/data</code></div>
    <div class="co-controls">
      <label>Method
        <select bind:value={method}>{#each ['GET', 'POST', 'PUT', 'DELETE'] as m}<option>{m}</option>{/each}</select>
      </label>
      <label>Server's <code>Allow-Origin</code>
        <select bind:value={allow}>{#each ALLOW_OPTS as [v, lbl]}<option value={v}>{lbl}</option>{/each}</select>
      </label>
      <label class="co-chk"><input type="checkbox" bind:checked={customHeader} /> Custom header (X-Auth-Token)</label>
      <label class="co-chk"><input type="checkbox" bind:checked={withCreds} /> Send credentials (cookies)</label>
    </div>
    <div class="co-flow">
      <div class="co-step" class:show={!simple}>
        <span class="co-tag pre">PREFLIGHT</span>
        <code>OPTIONS /data</code> - non-simple request ({method}{customHeader ? ' + custom header' : ''}), so the browser asks permission first.
      </div>
      <div class="co-step" class:show={simple}>
        <span class="co-tag">SIMPLE</span>
        No preflight: a {method} with standard headers goes straight to the server.
      </div>
    </div>
    <div class="co-verdict" class:ok={allowed}>
      <i class={`ti ${allowed ? 'ti-circle-check' : 'ti-ban'}`}></i>
      <div>
        <b>{allowed ? 'Allowed' : 'Blocked by CORS'}</b>
        <span>{reason}</span>
      </div>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .co-body { background: var(--raise); padding: 0.9rem; }
  .co-scenario { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.8rem; }
  .co-scenario code, .co-step code { font-family: var(--font-mono); font-size: 0.82em; background: var(--bg); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; color: var(--ink); }
  .co-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 0.9rem; margin-bottom: 0.9rem; }
  .co-controls label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.78rem; color: var(--muted); }
  .co-controls select { font: inherit; font-size: 0.85rem; padding: 0.35rem 0.45rem; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); }
  .co-chk { flex-direction: row !important; align-items: center; gap: 0.4rem !important; cursor: pointer; }
  .co-chk input { accent-color: var(--accent); }
  .co-flow { margin-bottom: 0.8rem; }
  .co-step { display: none; align-items: baseline; gap: 0.5rem; font-size: 0.85rem; color: var(--muted); line-height: 1.5; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 0.55rem 0.7rem; }
  .co-step.show { display: flex; }
  .co-tag { flex: none; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 5px; background: var(--surface); color: var(--muted); }
  .co-tag.pre { background: color-mix(in srgb, #e0892a 20%, var(--raise)); color: #b9701f; }
  .co-verdict { display: flex; align-items: flex-start; gap: 0.6rem; border-radius: 10px; padding: 0.7rem 0.8rem; background: color-mix(in srgb, #c0563c 12%, var(--raise)); border: 1px solid color-mix(in srgb, #c0563c 35%, var(--line)); }
  .co-verdict.ok { background: color-mix(in srgb, #2e9e6b 12%, var(--raise)); border-color: color-mix(in srgb, #2e9e6b 35%, var(--line)); }
  .co-verdict .ti { font-size: 22px; color: #c0563c; flex: none; }
  .co-verdict.ok .ti { color: #2e9e6b; }
  .co-verdict div { display: flex; flex-direction: column; gap: 0.15rem; }
  .co-verdict b { color: var(--ink); }
  .co-verdict span { font-size: 0.86rem; color: var(--muted); line-height: 1.5; }
</style>
