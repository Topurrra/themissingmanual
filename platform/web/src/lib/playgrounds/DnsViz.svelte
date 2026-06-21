<script>
  import { onDestroy } from 'svelte';
  const NODES = [
    { label: 'You', icon: 'ti-device-laptop' },
    { label: 'Resolver', icon: 'ti-server-cog' },
    { label: 'Root', icon: 'ti-world' },
    { label: '.com TLD', icon: 'ti-folders' },
    { label: 'Authoritative', icon: 'ti-server' }
  ];
  const STEPS = [
    { to: 0, d: 'You want example.com. Your computer asks its DNS resolver.' },
    { to: 1, d: 'The resolver (your ISP, or 8.8.8.8) takes the question.' },
    { to: 2, d: 'Resolver asks a root server: where do I find .com?' },
    { to: 1, d: 'Root replies: here are the .com TLD servers.', back: true },
    { to: 3, d: 'Resolver asks the .com TLD: where is example.com?' },
    { to: 1, d: 'TLD replies: ask example.com’s authoritative nameserver.', back: true },
    { to: 4, d: 'Resolver asks the authoritative server for example.com.' },
    { to: 1, d: 'Authoritative answers: 93.184.216.34 (with a TTL).', back: true },
    { to: 0, d: 'Resolver caches it and hands the IP back to you. Connect!', back: true }
  ];
  let i = 0, playing = false, timer = null;
  $: s = STEPS[i];
  $: x = (s.to / (NODES.length - 1)) * 100;
  function go(n) { i = Math.max(0, Math.min(STEPS.length - 1, n)); }
  function play() { if (i >= STEPS.length - 1) i = 0; playing = true; timer = setInterval(() => { if (i >= STEPS.length - 1) stop(); else go(i + 1); }, 1500); }
  function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { playing ? stop() : play(); }
  function reset() { stop(); i = 0; }
  onDestroy(stop);
</script>

<figure class="pg pg-dns">
  <figcaption class="pg-cap"><i class="ti ti-world-search" aria-hidden="true"></i> DNS resolution</figcaption>
  <div class="dn-body">
    <div class="dn-track">
      <div class="dn-line"></div>
      <div class="dn-packet" class:back={s.back} style={`left:${x}%`}></div>
      {#each NODES as nd, n}
        <div class="dn-node" class:on={s.to === n} style={`left:${(n / (NODES.length - 1)) * 100}%`}>
          <span class="dn-dot"><i class={`ti ${nd.icon}`}></i></span>
          <span class="dn-label">{nd.label}</span>
        </div>
      {/each}
    </div>
    <p class="dn-cap"><span class="dn-step">{i + 1}/{STEPS.length}</span> {s.d}</p>
    <div class="dn-ctrls">
      <button on:click={() => go(i - 1)} disabled={i === 0} aria-label="Back"><i class="ti ti-chevron-left"></i></button>
      <button class="dn-play" on:click={toggle}><i class={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}></i> {playing ? 'Pause' : 'Play'}</button>
      <button on:click={() => go(i + 1)} disabled={i === STEPS.length - 1} aria-label="Next"><i class="ti ti-chevron-right"></i></button>
      <button class="dn-reset" on:click={reset}>Reset</button>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .dn-body { background: var(--raise); padding: 1.4rem 1.2rem 1rem; }
  .dn-track { position: relative; height: 84px; margin: 0 26px 0.4rem; }
  .dn-line { position: absolute; top: 19px; left: 0; right: 0; height: 2px; background: var(--line); }
  .dn-node { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.3rem; width: 90px; }
  .dn-dot { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--bg); border: 2px solid var(--line); color: var(--muted); transition: all 0.25s; }
  .dn-dot .ti { font-size: 20px; }
  .dn-node.on .dn-dot { border-color: var(--accent); color: var(--accent); background: var(--accent-tint); }
  .dn-label { font-size: 0.72rem; color: var(--muted); text-align: center; }
  .dn-node.on .dn-label { color: var(--ink); }
  .dn-packet { position: absolute; top: 12px; width: 16px; height: 16px; border-radius: 50%; transform: translateX(-50%); transition: left 0.5s var(--ease); background: var(--accent); box-shadow: 0 0 0 4px var(--accent-tint); z-index: 2; }
  .dn-packet.back { background: #2e9e6b; box-shadow: 0 0 0 4px color-mix(in srgb, #2e9e6b 22%, transparent); }
  .dn-cap { display: flex; gap: 0.6rem; align-items: baseline; color: var(--muted); font-size: 0.92rem; line-height: 1.5; border-top: 1px solid var(--line); padding-top: 0.8rem; margin: 0.4rem 0 0.8rem; }
  .dn-step { font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); flex: none; }
  .dn-ctrls { display: flex; align-items: center; gap: 0.5rem; }
  .dn-ctrls button { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 9px; padding: 0.4rem 0.7rem; }
  .dn-ctrls button:hover:not(:disabled) { border-color: var(--accent); color: var(--ink); }
  .dn-ctrls button:disabled { opacity: 0.45; cursor: not-allowed; }
  .dn-play { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .dn-reset { margin-left: auto; }
</style>
