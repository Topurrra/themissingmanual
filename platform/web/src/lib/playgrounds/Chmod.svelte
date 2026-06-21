<script>
  const ROLES = [['Owner', 'u'], ['Group', 'g'], ['Other', 'o']];
  const PERMS = [['r', 4], ['w', 2], ['x', 1]];
  let b = { ur: true, uw: true, ux: true, gr: true, gw: false, gx: true, or: true, ow: false, ox: true };

  const oct = (r) => (b[r + 'r'] ? 4 : 0) + (b[r + 'w'] ? 2 : 0) + (b[r + 'x'] ? 1 : 0);
  $: octal = `${oct('u')}${oct('g')}${oct('o')}`;
  $: symbolic = ['u', 'g', 'o'].map((r) => (b[r + 'r'] ? 'r' : '-') + (b[r + 'w'] ? 'w' : '-') + (b[r + 'x'] ? 'x' : '-')).join('');

  let typed = '';
  function applyOctal() {
    const m = typed.trim().match(/^([0-7])([0-7])([0-7])$/);
    if (!m) return;
    ['u', 'g', 'o'].forEach((r, i) => {
      const d = +m[i + 1];
      b[r + 'r'] = !!(d & 4); b[r + 'w'] = !!(d & 2); b[r + 'x'] = !!(d & 1);
    });
    b = b;
  }
</script>

<figure class="pg pg-chmod">
  <figcaption class="pg-cap"><i class="ti ti-file-settings" aria-hidden="true"></i> chmod calculator</figcaption>
  <div class="cm-body">
    <table class="cm-table">
      <thead><tr><th></th>{#each PERMS as [p]}<th>{p === 'r' ? 'read' : p === 'w' ? 'write' : 'execute'}</th>{/each}</tr></thead>
      <tbody>
        {#each ROLES as [label, r]}
          <tr>
            <th>{label}</th>
            {#each PERMS as [p]}
              <td><input type="checkbox" bind:checked={b[r + p]} aria-label={`${label} ${p}`} /></td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="cm-out">
      <span class="cm-octal">{octal}</span>
      <code class="cm-sym">-{symbolic}</code>
      <code class="cm-cmd">chmod {octal} file</code>
    </div>
    <div class="cm-set">
      <input bind:value={typed} placeholder="type an octal, e.g. 644" maxlength="3" aria-label="octal input" />
      <button on:click={applyOctal}>Apply</button>
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .cm-body { background: var(--raise); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .cm-table { border-collapse: collapse; font-size: 0.88rem; }
  .cm-table th { font-weight: 600; color: var(--muted); text-align: center; padding: 0.3rem 0.7rem; font-size: 0.78rem; }
  .cm-table tbody th { text-align: left; color: var(--ink); }
  .cm-table td { text-align: center; padding: 0.3rem 0.7rem; }
  .cm-table input { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
  .cm-out { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
  .cm-octal { font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--accent); }
  .cm-sym { font-family: var(--font-mono); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 7px; padding: 0.25rem 0.5rem; }
  .cm-cmd { font-family: var(--font-mono); font-size: 0.85rem; color: var(--muted); }
  .cm-set { display: flex; gap: 0.5rem; }
  .cm-set input { width: 9rem; border: 1px solid var(--line); border-radius: 8px; padding: 0.4rem 0.6rem; background: var(--bg); color: var(--ink); font: inherit; font-family: var(--font-mono); }
  .cm-set input:focus { outline: none; border-color: var(--accent); }
  .cm-set button { cursor: pointer; font: inherit; border: 1px solid var(--line); background: var(--bg); color: var(--body); border-radius: 8px; padding: 0.4rem 0.9rem; }
  .cm-set button:hover { border-color: var(--accent); color: var(--ink); }
</style>
