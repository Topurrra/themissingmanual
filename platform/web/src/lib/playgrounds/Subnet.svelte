<script>
  export let config = '';
  let ip = '192.168.1.10';
  let prefix = 24;
  const m = config.trim().match(/^(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d+)/);
  if (m) { ip = m[1]; prefix = Math.min(32, Math.max(0, +m[2])); }

  const toInt = (s) => {
    const p = s.trim().split('.').map(Number);
    if (p.length !== 4 || p.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
    return (((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]) >>> 0;
  };
  const toStr = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  $: ipInt = toInt(ip);
  $: valid = ipInt !== null && prefix >= 0 && prefix <= 32;
  $: mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  $: network = valid ? (ipInt & mask) >>> 0 : 0;
  $: broadcast = valid ? (network | (~mask >>> 0)) >>> 0 : 0;
  $: total = Math.pow(2, 32 - prefix);
  $: usable = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, total - 2);
  $: firstHost = prefix >= 31 ? network : network + 1;
  $: lastHost = prefix >= 31 ? broadcast : broadcast - 1;
</script>

<figure class="pg pg-net2">
  <figcaption class="pg-cap"><i class="ti ti-network" aria-hidden="true"></i> Subnet calculator</figcaption>
  <div class="sn-body">
    <div class="sn-in">
      <input class="sn-ip" bind:value={ip} spellcheck="false" aria-label="IP address" />
      <span class="sn-slash">/</span>
      <input class="sn-prefix" type="number" min="0" max="32" bind:value={prefix} aria-label="prefix length" />
    </div>
    <input class="sn-range" type="range" min="0" max="32" bind:value={prefix} aria-label="prefix slider" />
    {#if !valid}
      <p class="sn-err">Enter a valid IPv4 address and a prefix 0–32.</p>
    {:else}
      <dl class="sn-grid">
        <div><dt>Netmask</dt><dd>{toStr(mask)}</dd></div>
        <div><dt>Network</dt><dd>{toStr(network)}/{prefix}</dd></div>
        <div><dt>Broadcast</dt><dd>{toStr(broadcast)}</dd></div>
        <div><dt>First host</dt><dd>{toStr(firstHost)}</dd></div>
        <div><dt>Last host</dt><dd>{toStr(lastHost)}</dd></div>
        <div><dt>Usable hosts</dt><dd>{usable.toLocaleString()}</dd></div>
      </dl>
    {/if}
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .sn-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .sn-in { display: flex; align-items: center; gap: 0.4rem; font-family: var(--font-mono); }
  .sn-ip, .sn-prefix { border: 1px solid var(--line); border-radius: 8px; padding: 0.45rem 0.6rem; background: var(--bg); color: var(--ink); font: inherit; }
  .sn-ip { flex: 1; min-width: 0; } .sn-prefix { width: 4rem; }
  .sn-ip:focus, .sn-prefix:focus { outline: none; border-color: var(--accent); }
  .sn-slash { color: var(--faint); }
  .sn-range { width: 100%; accent-color: var(--accent); }
  .sn-err { color: #c0563c; font-size: 0.85rem; margin: 0; }
  .sn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; margin: 0; }
  .sn-grid > div { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem 0.7rem; background: var(--bg); }
  .sn-grid dt { font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .sn-grid dd { margin: 0.15rem 0 0; font-family: var(--font-mono); color: var(--ink); }
</style>
