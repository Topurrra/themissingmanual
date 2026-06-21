<script>
  import { onDestroy } from 'svelte';
  const S = [
    { cs: 'CLOSED', ss: 'LISTEN', pkt: null, cap: 'The server is listening. The client wants to open a connection.' },
    { cs: 'SYN-SENT', ss: 'LISTEN', pkt: { dir: 'cs', label: 'SYN  seq=100' }, cap: 'Client → SYN: "let’s talk", carrying its initial sequence number.' },
    { cs: 'SYN-SENT', ss: 'SYN-RCVD', pkt: { dir: 'sc', label: 'SYN-ACK  seq=300 ack=101' }, cap: 'Server → SYN-ACK: acknowledges the client (ack=101) and sends its own seq.' },
    { cs: 'ESTABLISHED', ss: 'ESTABLISHED', pkt: { dir: 'cs', label: 'ACK  ack=301' }, cap: 'Client → ACK: acknowledges the server. Three-way handshake complete.' },
    { cs: 'ESTABLISHED', ss: 'ESTABLISHED', pkt: null, cap: 'Connection established — data can now flow both ways.' }
  ];
  let i = 0, playing = false, timer = null;
  $: s = S[i];
  $: pktLeft = s.pkt ? (s.pkt.dir === 'cs' ? 82 : 18) : 50;
  function go(n) { i = Math.max(0, Math.min(S.length - 1, n)); }
  function play() { if (i >= S.length - 1) i = 0; playing = true; timer = setInterval(() => { if (i >= S.length - 1) stop(); else go(i + 1); }, 1700); }
  function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } }
  function toggle() { playing ? stop() : play(); }
  function reset() { stop(); i = 0; }
  onDestroy(stop);
</script>

<figure class="pg pg-tcp">
  <figcaption class="pg-cap"><i class="ti ti-arrows-left-right" aria-hidden="true"></i> TCP three-way handshake</figcaption>
  <div class="tc-body">
    <div class="tc-lanes">
      <div class="tc-end"><span class="tc-dot"><i class="ti ti-device-laptop"></i></span><span class="tc-name">Client</span><span class="tc-state">{s.cs}</span></div>
      <div class="tc-mid">
        {#if s.pkt}<div class="tc-pkt {s.pkt.dir}" style={`left:${pktLeft}%`}>{s.pkt.label}<i class={`ti ${s.pkt.dir === 'cs' ? 'ti-arrow-right' : 'ti-arrow-left'}`}></i></div>{/if}
      </div>
      <div class="tc-end"><span class="tc-dot"><i class="ti ti-server"></i></span><span class="tc-name">Server</span><span class="tc-state">{s.ss}</span></div>
    </div>
    <p class="tc-cap"><span class="tc-step">{i + 1}/{S.length}</span> {s.cap}</p>
    <div class="tc-ctrls">
      <button on:click={() => go(i - 1)} disabled={i === 0} aria-label="Back"><i class="ti ti-chevron-left"></i></button>
      <button class="tc-play" on:click={toggle}><i class={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}></i> {playing ? 'Pause' : 'Play'}</button>
      <button on:click={() => go(i + 1)} disabled={i === S.length - 1} aria-label="Next"><i class="ti ti-chevron-right"></i></button>
      <button class="tc-reset" on:click={reset}>Reset</button>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .tc-body { background: var(--raise); padding: 1.2rem 1rem 1rem; }
  .tc-lanes { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 0.5rem; }
  .tc-end { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  .tc-dot { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--accent-tint); color: var(--accent); }
  .tc-dot .ti { font-size: 22px; }
  .tc-name { font-size: 0.78rem; color: var(--ink); font-weight: 600; }
  .tc-state { font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.04em; color: var(--muted); background: var(--bg); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; }
  .tc-mid { position: relative; height: 44px; }
  .tc-pkt { position: absolute; top: 50%; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 0.3rem; white-space: nowrap; font-family: var(--font-mono); font-size: 0.72rem; background: var(--accent); color: #fff; border-radius: 999px; padding: 0.25rem 0.6rem; transition: left 0.6s var(--ease); box-shadow: var(--shadow-sm); }
  .tc-cap { display: flex; gap: 0.6rem; align-items: baseline; color: var(--muted); font-size: 0.92rem; line-height: 1.5; border-top: 1px solid var(--line); padding-top: 0.8rem; margin: 1rem 0 0.8rem; }
  .tc-step { font-family: var(--font-mono); font-size: 0.72rem; color: var(--faint); flex: none; }
  .tc-ctrls { display: flex; align-items: center; gap: 0.5rem; }
  .tc-ctrls button { cursor: pointer; font: inherit; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 9px; padding: 0.4rem 0.7rem; }
  .tc-ctrls button:hover:not(:disabled) { border-color: var(--accent); color: var(--ink); }
  .tc-ctrls button:disabled { opacity: 0.45; cursor: not-allowed; }
  .tc-play { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; font-weight: 600; }
  .tc-reset { margin-left: auto; }
</style>
