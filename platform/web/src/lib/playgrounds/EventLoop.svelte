<script>
  import { onDestroy } from 'svelte';
  const CODE = [
    "console.log('A');",
    "setTimeout(() => console.log('B'), 0);",
    "Promise.resolve().then(() => console.log('C'));",
    "console.log('D');"
  ];
  // Each step is a full snapshot of the machine.
  const S = [
    { stack: [], micro: [], macro: [], out: [], line: -1, cap: 'The script runs top to bottom on the one call stack.' },
    { stack: ["console.log('A')"], micro: [], macro: [], out: [], line: 0, cap: "console.log('A') is pushed onto the call stack." },
    { stack: [], micro: [], macro: [], out: ['A'], line: 0, cap: "It runs - 'A' prints - then pops off." },
    { stack: ['setTimeout(…)'], micro: [], macro: [], out: ['A'], line: 1, cap: 'setTimeout hands its callback to the timer, not the stack.' },
    { stack: [], micro: [], macro: ["() => log('B')"], out: ['A'], line: 1, cap: 'After 0 ms the callback waits in the task (macrotask) queue.' },
    { stack: ['Promise.then(…)'], micro: [], macro: ["() => log('B')"], out: ['A'], line: 2, cap: 'Promise.resolve().then(…) registers its callback.' },
    { stack: [], micro: ["() => log('C')"], macro: ["() => log('B')"], out: ['A'], line: 2, cap: 'That callback goes to the microtask queue.' },
    { stack: ["console.log('D')"], micro: ["() => log('C')"], macro: ["() => log('B')"], out: ['A'], line: 3, cap: "console.log('D') runs next." },
    { stack: [], micro: ["() => log('C')"], macro: ["() => log('B')"], out: ['A', 'D'], line: 3, cap: "'D' prints. Script done - the stack is now empty." },
    { stack: [], micro: [], macro: ["() => log('B')"], out: ['A', 'D', 'C'], line: -1, cap: 'Stack empty → drain ALL microtasks first. C runs.' },
    { stack: [], micro: [], macro: [], out: ['A', 'D', 'C', 'B'], line: -1, cap: 'Only then the next macrotask: B runs. Final order: A · D · C · B.' }
  ];
  let i = 0, playing = false, timer = null;
  $: s = S[i];
  function go(n) { i = Math.max(0, Math.min(S.length - 1, n)); }
  function play() { if (i >= S.length - 1) i = 0; playing = true; timer = setInterval(() => { if (i >= S.length - 1) stop(); else go(i + 1); }, 1600); }
  function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { playing ? stop() : play(); }
  function reset() { stop(); i = 0; }
  onDestroy(stop);
</script>

<figure class="pg pg-el">
  <figcaption class="pg-cap"><i class="ti ti-arrows-exchange" aria-hidden="true"></i> The event loop</figcaption>
  <div class="el-body">
    <pre class="el-code">{#each CODE as c, n}<span class="el-line" class:on={s.line === n}>{c}</span>
{/each}</pre>
    <div class="el-cols">
      <div class="el-col"><span class="el-h">Call stack</span>{#each [...s.stack].reverse() as f}<div class="el-frame">{f}</div>{:else}<div class="el-empty">empty</div>{/each}</div>
      <div class="el-col"><span class="el-h">Microtasks</span>{#each s.micro as f}<div class="el-frame micro">{f}</div>{:else}<div class="el-empty">-</div>{/each}</div>
      <div class="el-col"><span class="el-h">Macrotasks</span>{#each s.macro as f}<div class="el-frame macro">{f}</div>{:else}<div class="el-empty">-</div>{/each}</div>
    </div>
    <div class="el-console"><span class="el-h">Console</span> <span class="el-out">{s.out.join('  ')}</span></div>
    <p class="el-cap">{s.cap}</p>
    <div class="el-ctrls">
      <button on:click={() => go(i - 1)} disabled={i === 0} aria-label="Back"><i class="ti ti-chevron-left"></i></button>
      <button class="el-play" on:click={toggle}><i class={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}></i> {playing ? 'Pause' : 'Play'}</button>
      <button on:click={() => go(i + 1)} disabled={i === S.length - 1} aria-label="Next"><i class="ti ti-chevron-right"></i></button>
      <button class="el-reset" on:click={reset}>Reset</button>
      <span class="el-step">{i + 1}/{S.length}</span>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .el-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .el-code { margin: 0; font-family: var(--font-mono); font-size: 0.82rem; background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem 0.8rem; white-space: pre; overflow-x: auto; }
  .el-line { display: block; padding: 0 0.3rem; border-radius: 4px; color: var(--body); }
  .el-line.on { background: var(--accent-tint); color: var(--ink); }
  .el-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
  .el-col { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem; background: var(--bg); min-height: 90px; }
  .el-h { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .el-frame { font-family: var(--font-mono); font-size: 0.76rem; margin-top: 0.35rem; padding: 0.3rem 0.45rem; border-radius: 6px; background: var(--accent-tint); color: var(--ink); }
  .el-frame.micro { background: color-mix(in srgb, #e0892a 18%, var(--raise)); }
  .el-frame.macro { background: color-mix(in srgb, #6f5cc4 18%, var(--raise)); }
  .el-empty { color: var(--faint); font-size: 0.78rem; margin-top: 0.35rem; }
  .el-console { font-family: var(--font-mono); font-size: 0.85rem; }
  .el-out { color: #2e9e6b; font-weight: 600; }
  .el-cap { margin: 0; font-size: 0.9rem; color: var(--muted); line-height: 1.5; min-height: 2.6em; }
  .el-ctrls { display: flex; align-items: center; gap: 0.5rem; }
  .el-ctrls button { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 9px; padding: 0.4rem 0.7rem; }
  .el-ctrls button:hover:not(:disabled) { border-color: var(--accent); color: var(--ink); }
  .el-ctrls button:disabled { opacity: 0.45; cursor: not-allowed; }
  .el-play { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .el-reset { margin-left: auto; }
  .el-step { font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); }
  @media (max-width: 560px) { .el-cols { grid-template-columns: 1fr; } }
</style>
