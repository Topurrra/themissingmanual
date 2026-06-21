<script>
  export let config = '';
  let expr = config.trim() || '*/15 9-17 * * 1-5';
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');

  function parseField(spec, min, max) {
    const set = new Set();
    for (const part of spec.split(',')) {
      let m;
      if (part === '*') { for (let v = min; v <= max; v++) set.add(v); }
      else if ((m = part.match(/^\*\/(\d+)$/))) { const s = +m[1]; if (!s) return null; for (let v = min; v <= max; v += s) set.add(v); }
      else if ((m = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/))) { const a = +m[1], b = +m[2], s = m[3] ? +m[3] : 1; for (let v = a; v <= b; v += s) if (v >= min && v <= max) set.add(v); }
      else if ((m = part.match(/^(\d+)$/))) { const v = +m[1]; if (v < min || v > max) return null; set.add(v); }
      else return null;
    }
    return set.size ? set : null;
  }

  $: parsed = (() => {
    const f = expr.trim().split(/\s+/);
    if (f.length !== 5) return { err: 'A cron expression has 5 fields: minute hour day-of-month month day-of-week.' };
    const min = parseField(f[0], 0, 59), hr = parseField(f[1], 0, 23), dom = parseField(f[2], 1, 31), mon = parseField(f[3], 1, 12);
    let dow = parseField(f[4], 0, 7);
    if (!min || !hr || !dom || !mon || !dow) return { err: 'Could not parse a field. Use *, */n, a-b, lists (a,b), or numbers.' };
    if (dow.has(7)) dow.add(0);
    return { f, min, hr, dom, mon, dow };
  })();

  function matches(d, p) {
    const domR = p.f[2] !== '*', dowR = p.f[4] !== '*';
    const dayOk = domR && dowR ? (p.dom.has(d.getDate()) || p.dow.has(d.getDay())) : (p.dom.has(d.getDate()) && p.dow.has(d.getDay()));
    return p.min.has(d.getMinutes()) && p.hr.has(d.getHours()) && p.mon.has(d.getMonth() + 1) && dayOk;
  }
  $: next = (() => {
    if (parsed.err) return [];
    const out = []; const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    for (let i = 0; i < 366 * 24 * 60 && out.length < 5; i++) { if (matches(d, parsed)) out.push(new Date(d)); d.setMinutes(d.getMinutes() + 1); }
    return out;
  })();
  $: human = (() => {
    if (parsed.err) return '';
    const f = parsed.f;
    let time;
    let mm; 
    if (f[0] === '*' && f[1] === '*') time = 'every minute';
    else if ((mm = f[0].match(/^\*\/(\d+)$/)) && f[1] === '*') time = `every ${mm[1]} minutes`;
    else if (f[1] === '*') time = `every hour at minute ${f[0]}`;
    else if (/^\d+$/.test(f[0]) && /^\d+$/.test(f[1])) time = `at ${pad(f[1])}:${pad(f[0])}`;
    else time = `at minute ${f[0]} past hour ${f[1]}`;
    let day = '';
    if (f[4] !== '*') day += ` on ${[...parsed.dow].filter((x) => x <= 6).sort((a, b) => a - b).map((x) => DOW[x]).join(', ')}`;
    if (f[2] !== '*') day += `${day ? ' and' : ''} on day ${f[2]} of the month`;
    const month = f[3] !== '*' ? ` in ${[...parsed.mon].sort((a, b) => a - b).map((x) => MON[x - 1]).join(', ')}` : '';
    return `Runs ${time}${day}${month}.`;
  })();
</script>

<figure class="pg pg-cron">
  <figcaption class="pg-cap"><i class="ti ti-clock-hour-4" aria-hidden="true"></i> Cron expression explainer</figcaption>
  <div class="cr-body">
    <input class="cr-expr" bind:value={expr} spellcheck="false" aria-label="cron expression" />
    <div class="cr-legend">minute · hour · day-of-month · month · day-of-week</div>
    {#if parsed.err}
      <p class="cr-err">{parsed.err}</p>
    {:else}
      <p class="cr-human">{human}</p>
      <div class="cr-next">
        <span class="cr-lbl">Next runs</span>
        {#each next as d}<div class="cr-run">{d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>{:else}<div class="cr-run">none in the next year</div>{/each}
      </div>
    {/if}
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .cr-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .cr-expr { border: 1px solid var(--line); border-radius: 9px; padding: 0.55rem 0.7rem; background: var(--bg); color: var(--accent); font-family: var(--font-mono); font-size: 1.1rem; letter-spacing: 0.05em; }
  .cr-expr:focus { outline: none; border-color: var(--accent); }
  .cr-legend { font-family: var(--font-mono); font-size: 0.66rem; color: var(--faint); letter-spacing: 0.02em; }
  .cr-err { margin: 0.3rem 0 0; color: #c0563c; font-size: 0.88rem; }
  .cr-human { margin: 0.3rem 0; font-size: 1.02rem; color: var(--ink); font-weight: 600; }
  .cr-next { border-top: 1px solid var(--line); padding-top: 0.6rem; }
  .cr-lbl { font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .cr-run { font-family: var(--font-mono); font-size: 0.85rem; color: var(--body); margin-top: 0.2rem; }
</style>
