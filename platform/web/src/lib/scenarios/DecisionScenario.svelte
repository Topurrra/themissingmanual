<script>
  // A decision scenario: you get a situation, not a question, and a meter that runs
  // while you decide. Every move costs something real (minutes of downtime, days of
  // review round-trips, hours you don't have). One move resolves it.
  //
  // Deliberately NOT a quiz: nothing is scored right or wrong. The debrief reflects
  // your actual path back at you - what you looked at, what it cost, and what an
  // experienced person would have done - and explains wrong-but-sensible moves rather
  // than buzzing at them. If a scenario can be beaten by recall, it is a quiz wearing
  // a costume and it does not belong here.
  //
  // The wording is data-driven (`clock`, `resolvedHeading`) so this carries any
  // situation with a real cost and a resolution, not just outages. Schema:
  // WRITERMANUAL.md "Scenarios".
  export let data;

  const DEFAULTS = { unit: 'min', running: 'users down', resolved: 'to green' };

  $: clockCfg = { ...DEFAULTS, ...(data.clock || {}) };
  $: byId = Object.fromEntries(data.actions.map((a) => [a.id, a]));
  $: remaining = data.actions.filter((a) => !taken.includes(a.id));
  $: ideal = data.debrief?.ideal ?? data.debrief?.idealMinutes ?? null;

  let taken = [];   // action ids, in the order chosen
  let cost = 0;     // accumulated cost in `clockCfg.unit`
  let resolved = false;

  function take(action) {
    if (resolved) return;
    taken = [...taken, action.id];
    cost += action.cost ?? action.minutes ?? 1;
    if (action.resolves) resolved = true;
  }

  function reset() {
    taken = [];
    cost = 0;
    resolved = false;
  }

  // Both `when` values are matched explicitly. A loose `when === 'if-taken' ? … : …`
  // would treat ANY typo ("if-takenn") as if-not-taken and silently invert the note -
  // telling a reader "you never declared the incident" right after they did. An
  // unrecognised `when` shows the note instead, so a typo is visible, not inverted.
  function showNote(n, done) {
    if (!n.when) return true;
    if (n.when === 'if-taken') return done.includes(n.action);
    if (n.when === 'if-not-taken') return !done.includes(n.action);
    return true;
  }
</script>

<figure class="sc" role="group" aria-label={data.title}>
  <header class="sc-head">
    <div>
      <span class="sc-tag">Decision scenario</span>
      <h4 class="sc-title">{data.title}</h4>
    </div>
    <div class="sc-clock" class:sc-green={resolved} aria-live="polite">
      <span class="sc-clock-n">{cost}</span>
      <span class="sc-clock-u">{clockCfg.unit}</span>
      <span class="sc-clock-l">{resolved ? clockCfg.resolved : clockCfg.running}</span>
    </div>
  </header>

  <p class="sc-brief">{data.brief}</p>

  {#if taken.length}
    <ol class="sc-log">
      {#each taken as id, i}
        {@const a = byId[id]}
        <li class="sc-entry">
          <div class="sc-entry-head">
            <span class="sc-step">{i + 1}</span>
            <span class="sc-entry-label">{a.label}</span>
            <span class="sc-cost">+{a.cost ?? a.minutes ?? 1} {clockCfg.unit}</span>
          </div>
          {#if a.reveals}<pre class="sc-out">{a.reveals}</pre>{/if}
          {#if a.note}<p class="sc-note">{a.note}</p>{/if}
        </li>
      {/each}
    </ol>
  {/if}

  {#if !resolved}
    <p class="sc-prompt">{taken.length ? 'What now?' : (data.prompt ?? 'What do you do first?')}</p>
    <div class="sc-actions">
      {#each remaining as a}
        <button type="button" class="sc-btn" on:click={() => take(a)}>
          <span class="sc-btn-label">{a.label}</span>
          <span class="sc-btn-cost">{a.cost ?? a.minutes ?? 1} {clockCfg.unit}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="sc-debrief">
      <h5>{data.resolvedHeading ?? "Service is back. Here's how it went."}</h5>
      <p class="sc-verdict">
        That took <strong>{cost} {clockCfg.unit}</strong>, over {taken.length}
        {taken.length === 1 ? 'move' : 'moves'}.
        {#if ideal !== null}
          Someone who has done this before gets there in about <strong>{ideal}</strong>.
        {/if}
      </p>
      {#each data.debrief?.notes ?? [] as n}
        {#if showNote(n, taken)}
          <p class="sc-debrief-note">{n.text}</p>
        {/if}
      {/each}
      {#if data.debrief?.text}<p class="sc-debrief-main">{data.debrief.text}</p>{/if}
      <button type="button" class="sc-again" on:click={reset}>Run it again</button>
    </div>
  {/if}
</figure>

<style>
  .sc {
    margin: 1.8rem 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--raise);
    padding: 1.1rem 1.2rem 1.2rem;
  }
  .sc-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.8rem;
  }
  .sc-tag {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .sc-title {
    margin: 0.25rem 0 0;
    font-size: 1.05rem;
    color: var(--ink);
  }
  .sc-clock {
    flex: none;
    text-align: right;
    font-family: var(--font-mono);
    line-height: 1.1;
  }
  .sc-clock-n { font-size: 1.5rem; font-weight: 600; color: #b4533a; }
  .sc-clock-u { font-size: 0.7rem; color: var(--muted); }
  .sc-clock-l { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--faint); }
  .sc-green .sc-clock-n { color: var(--accent); }

  .sc-brief { margin: 0.9rem 0 0; color: var(--body); line-height: 1.6; }

  .sc-log { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }
  .sc-entry { border-left: 2px solid var(--line); padding: 0 0 0 0.8rem; }
  .sc-entry-head { display: flex; align-items: baseline; gap: 0.5rem; }
  .sc-step {
    font-family: var(--font-mono); font-size: 0.65rem; color: var(--faint);
    border: 1px solid var(--line); border-radius: 4px; padding: 0 4px;
  }
  .sc-entry-label { font-weight: 600; color: var(--ink); font-size: 0.95rem; }
  .sc-cost { font-family: var(--font-mono); font-size: 0.68rem; color: var(--muted); margin-left: auto; }
  .sc-out {
    margin: 0.45rem 0 0; padding: 0.6rem 0.7rem; border-radius: 8px;
    background: var(--surface); border: 1px solid var(--line);
    font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.5;
    color: var(--body); white-space: pre-wrap; overflow-x: auto;
  }
  .sc-note { margin: 0.45rem 0 0; font-size: 0.9rem; color: var(--muted); line-height: 1.55; }

  .sc-prompt { margin: 1.1rem 0 0.6rem; font-weight: 600; color: var(--ink); }
  .sc-actions { display: flex; flex-direction: column; gap: 0.45rem; }
  .sc-btn {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    width: 100%; text-align: left; cursor: pointer; font: inherit;
    padding: 0.6rem 0.8rem; border: 1px solid var(--line); border-radius: 10px;
    background: var(--surface); color: var(--body);
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .sc-btn:hover { border-color: var(--accent); color: var(--ink); }
  .sc-btn-label { font-size: 0.95rem; }
  .sc-btn-cost { flex: none; font-family: var(--font-mono); font-size: 0.68rem; color: var(--faint); }

  .sc-debrief { margin-top: 1.1rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
  .sc-debrief h5 { margin: 0 0 0.5rem; font-size: 0.98rem; color: var(--ink); }
  .sc-verdict { margin: 0 0 0.6rem; color: var(--body); line-height: 1.6; }
  .sc-debrief-note,
  .sc-debrief-main { margin: 0 0 0.6rem; color: var(--muted); line-height: 1.6; font-size: 0.93rem; }
  .sc-debrief-main { color: var(--body); }
  .sc-again {
    cursor: pointer; font: inherit; font-size: 0.85rem;
    background: none; border: 1px solid var(--line); border-radius: 8px;
    padding: 0.35rem 0.7rem; color: var(--muted);
  }
  .sc-again:hover { border-color: var(--accent); color: var(--accent); }
</style>
