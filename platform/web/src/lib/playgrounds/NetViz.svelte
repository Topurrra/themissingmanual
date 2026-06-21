<script>
  // Steps a "packet" through the journey of one web request: device → router →
  // ISP → internet → server and back, with a DNS lookup first. Play / step / reset.
  import { onDestroy } from 'svelte';

  const NODES = [
    { id: 'device', label: 'Your device', icon: 'ti-device-laptop' },
    { id: 'router', label: 'Router', icon: 'ti-router' },
    { id: 'isp', label: 'ISP', icon: 'ti-building-broadcast-tower' },
    { id: 'net', label: 'Internet', icon: 'ti-world' },
    { id: 'server', label: 'Server', icon: 'ti-server' }
  ];
  const STEPS = [
    { i: 0, t: 'Type & Enter', d: 'You type example.com and press Enter.' },
    { i: 0, t: 'DNS lookup', d: 'First your device asks DNS: which IP is example.com?', kind: 'dns' },
    { i: 0, t: 'DNS answer', d: 'DNS replies 93.184.216.34 — now your device can send packets.', kind: 'dns' },
    { i: 1, t: 'To the router', d: 'The request goes to your home router over Wi-Fi.', kind: 'req' },
    { i: 2, t: 'To your ISP', d: 'The router forwards it up to your ISP.', kind: 'req' },
    { i: 3, t: 'Across the internet', d: 'Hop by hop, router to router, across the world.', kind: 'req' },
    { i: 4, t: 'Reaches the server', d: 'The server holding the page receives the request.', kind: 'req' },
    { i: 3, t: 'Response returns', d: 'The server sends the page back — same path, reversed.', kind: 'res' },
    { i: 2, t: 'Back through the ISP', d: 'The answer travels back through your ISP.', kind: 'res' },
    { i: 1, t: 'Back to the router', d: 'And to your home router.', kind: 'res' },
    { i: 0, t: 'Painted!', d: 'Your browser receives the answer and draws the page.', kind: 'res' }
  ];

  let step = 0;
  let playing = false;
  let timer = null;
  $: cur = STEPS[step];
  $: xPct = (cur.i / (NODES.length - 1)) * 100;
  $: kindClass = cur.kind || 'idle';

  function go(i) { step = Math.max(0, Math.min(STEPS.length - 1, i)); }
  function next() { if (step >= STEPS.length - 1) { stop(); return; } go(step + 1); }
  function play() {
    if (step >= STEPS.length - 1) step = 0;
    playing = true;
    timer = setInterval(() => { if (step >= STEPS.length - 1) stop(); else go(step + 1); }, 1500);
  }
  function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { playing ? stop() : play(); }
  function reset() { stop(); step = 0; }
  onDestroy(stop);
</script>

<figure class="pg pg-net">
  <figcaption class="pg-cap"><i class="ti ti-route-2" aria-hidden="true"></i> The journey of one request</figcaption>
  <div class="net-body">
    <div class="net-track">
      <div class="net-line"></div>
      <div class="net-packet {kindClass}" style={`left:${xPct}%`}></div>
      {#each NODES as nd, i}
        <div class="net-node" class:on={cur.i === i} style={`left:${(i / (NODES.length - 1)) * 100}%`}>
          <span class="net-dot"><i class={`ti ${nd.icon}`} aria-hidden="true"></i></span>
          <span class="net-label">{nd.label}</span>
        </div>
      {/each}
    </div>

    <div class="net-caption">
      <span class="net-step">{step + 1}/{STEPS.length}</span>
      <span class="net-kind {kindClass}">{cur.kind === 'dns' ? 'DNS' : cur.kind === 'res' ? 'Response' : cur.kind === 'req' ? 'Request' : 'Start'}</span>
      <strong>{cur.t}</strong>
      <span class="net-desc">{cur.d}</span>
    </div>

    <div class="net-ctrls">
      <button on:click={() => go(step - 1)} disabled={step === 0} aria-label="Previous"><i class="ti ti-chevron-left"></i></button>
      <button class="net-play" on:click={toggle}>
        <i class={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}></i> {playing ? 'Pause' : 'Play'}
      </button>
      <button on:click={next} disabled={step === STEPS.length - 1} aria-label="Next"><i class="ti ti-chevron-right"></i></button>
      <button class="net-reset" on:click={reset}>Reset</button>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .net-body { background: var(--raise); padding: 1.4rem 1.2rem 1rem; }
  .net-track { position: relative; height: 84px; margin: 0 22px 0.6rem; }
  .net-line { position: absolute; top: 19px; left: 0; right: 0; height: 2px; background: var(--line); }
  .net-node { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.3rem; width: 80px; }
  .net-dot { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--bg); border: 2px solid var(--line); color: var(--muted); transition: border-color 0.25s, color 0.25s, background 0.25s; }
  .net-dot .ti { font-size: 20px; }
  .net-node.on .net-dot { border-color: var(--accent); color: var(--accent); background: var(--accent-tint); }
  .net-label { font-size: 0.72rem; color: var(--muted); text-align: center; line-height: 1.2; }
  .net-node.on .net-label { color: var(--ink); }
  .net-packet { position: absolute; top: 12px; width: 16px; height: 16px; border-radius: 50%; transform: translateX(-50%); transition: left 0.5s var(--ease); box-shadow: 0 0 0 4px var(--accent-tint); z-index: 2; background: var(--accent); }
  .net-packet.res { background: #2e9e6b; box-shadow: 0 0 0 4px color-mix(in srgb, #2e9e6b 22%, transparent); }
  .net-packet.dns { background: #e0892a; box-shadow: 0 0 0 4px color-mix(in srgb, #e0892a 22%, transparent); }
  .net-caption { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 0.7rem; padding: 0.8rem 0; border-top: 1px solid var(--line); margin-top: 0.4rem; }
  .net-step { font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); }
  .net-kind { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 5px; padding: 2px 6px; background: var(--accent-tint); color: var(--accent); }
  .net-kind.res { background: color-mix(in srgb, #2e9e6b 16%, var(--raise)); color: #2e9e6b; }
  .net-kind.dns { background: color-mix(in srgb, #e0892a 16%, var(--raise)); color: #e0892a; }
  .net-caption strong { color: var(--ink); }
  .net-desc { flex-basis: 100%; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
  .net-ctrls { display: flex; align-items: center; gap: 0.5rem; }
  .net-ctrls button { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 9px; padding: 0.4rem 0.7rem; }
  .net-ctrls button:hover:not(:disabled) { border-color: var(--accent); color: var(--ink); }
  .net-ctrls button:disabled { opacity: 0.45; cursor: not-allowed; }
  .net-play { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .net-reset { margin-left: auto; }
</style>
