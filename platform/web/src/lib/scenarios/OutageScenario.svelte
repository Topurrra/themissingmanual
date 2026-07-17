<script>
  // A decision scenario: you get a symptom, not a diagnosis, and a clock that runs
  // while you decide. Every action costs minutes; users are down for every one of
  // them. One action resolves the outage - the point of the exercise is that you can
  // reach it WITHOUT understanding root cause, which is the thing the guide teaches
  // and the thing engineers' instincts fight.
  //
  // Deliberately not a quiz: nothing is scored right/wrong. The debrief reflects your
  // actual path back at you - what you looked at, what it cost, and what an
  // experienced responder would have done - and explains wrong-but-sensible moves
  // instead of buzzing at them.
  export let data;

  let taken = [];      // action ids, in the order chosen
  let clock = 0;       // minutes elapsed since the alert
  let resolved = false;

  $: byId = Object.fromEntries(data.actions.map((a) => [a.id, a]));
  $: remaining = data.actions.filter((a) => !taken.includes(a.id));
  $: ideal = data.debrief?.idealMinutes ?? null;

  function take(action) {
    if (resolved) return;
    taken = [...taken, action.id];
    clock += action.minutes ?? 1;
    if (action.resolves) resolved = true;
  }

  function reset() {
    taken = [];
    clock = 0;
    resolved = false;
  }
</script>

<figure class="sc" role="group" aria-label={data.title}>
  <header class="sc-head">
    <div>
      <span class="sc-tag">Decision scenario</span>
      <h4 class="sc-title">{data.title}</h4>
    </div>
    <div class="sc-clock" class:sc-green={resolved} aria-live="polite">
      <span class="sc-clock-n">{clock}</span>
      <span class="sc-clock-u">min</span>
      <span class="sc-clock-l">{resolved ? 'to green' : 'users down'}</span>
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
            <span class="sc-cost">+{a.minutes ?? 1} min</span>
          </div>
          {#if a.reveals}<pre class="sc-out">{a.reveals}</pre>{/if}
          {#if a.note}<p class="sc-note">{a.note}</p>{/if}
        </li>
      {/each}
    </ol>
  {/if}

  {#if !resolved}
    <p class="sc-prompt">{taken.length ? 'What now?' : 'What do you do first?'}</p>
    <div class="sc-actions">
      {#each remaining as a}
        <button type="button" class="sc-btn" on:click={() => take(a)}>
          <span class="sc-btn-label">{a.label}</span>
          <span class="sc-btn-cost">{a.minutes ?? 1} min</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="sc-debrief">
      <h5>Service is back. Here's how it went.</h5>
      <p class="sc-verdict">
        You restored service in <strong>{clock} minutes</strong>, after {taken.length}
        {taken.length === 1 ? 'move' : 'moves'}.
        {#if ideal !== null}
          A calm responder gets there in about <strong>{ideal}</strong>.
        {/if}
      </p>
      {#each data.debrief?.notes ?? [] as n}
        {#if !n.when || (n.when === 'if-taken' ? taken.includes(n.action) : !taken.includes(n.action))}
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
