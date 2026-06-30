<script>
  let type = 'INNER';
  const TYPES = ['INNER', 'LEFT', 'RIGHT', 'FULL'];
  const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Lin' }, { id: 3, name: 'Sam' }];
  const orders = [
    { id: 101, user_id: 1, item: 'Book' },
    { id: 102, user_id: 1, item: 'Pen' },
    { id: 103, user_id: 2, item: 'Lamp' },
    { id: 104, user_id: 9, item: 'Mug' }
  ];
  $: result = (() => {
    const rows = [];
    if (type === 'INNER' || type === 'LEFT' || type === 'FULL') {
      for (const u of users) {
        const ms = orders.filter((o) => o.user_id === u.id);
        if (ms.length) ms.forEach((o) => rows.push({ u, o }));
        else if (type !== 'INNER') rows.push({ u, o: null });
      }
    }
    if (type === 'RIGHT' || type === 'FULL') {
      for (const o of orders) {
        const u = users.find((x) => x.id === o.user_id);
        if (!u) rows.push({ u: null, o });
      }
    }
    if (type === 'INNER') {
      rows.length = 0;
      for (const o of orders) { const u = users.find((x) => x.id === o.user_id); if (u) rows.push({ u, o }); }
    }
    return rows;
  })();
  $: usedUserIds = new Set(result.filter((r) => r.u).map((r) => r.u.id));
  $: usedOrderIds = new Set(result.filter((r) => r.o).map((r) => r.o.id));
</script>

<figure class="pg pg-join">
  <figcaption class="pg-cap"><i class="ti ti-table" aria-hidden="true"></i> SQL JOIN</figcaption>
  <div class="jn-body">
    <div class="jn-seg">{#each TYPES as t}<button class:on={type === t} on:click={() => type = t}>{t} JOIN</button>{/each}</div>
    <code class="jn-sql">SELECT u.name, o.item FROM users u <b>{type}{type === 'INNER' || type === 'FULL' ? '' : ' OUTER'} JOIN</b> orders o ON u.id = o.user_id;</code>
    <div class="jn-tables">
      <div class="jn-tbl">
        <span class="jn-th">users</span>
        <table><thead><tr><th>id</th><th>name</th></tr></thead><tbody>
          {#each users as u}<tr class:dim={!usedUserIds.has(u.id)}><td>{u.id}</td><td>{u.name}</td></tr>{/each}
        </tbody></table>
      </div>
      <div class="jn-tbl">
        <span class="jn-th">orders</span>
        <table><thead><tr><th>id</th><th>user_id</th><th>item</th></tr></thead><tbody>
          {#each orders as o}<tr class:dim={!usedOrderIds.has(o.id)}><td>{o.id}</td><td>{o.user_id}</td><td>{o.item}</td></tr>{/each}
        </tbody></table>
      </div>
    </div>
    <div class="jn-tbl jn-res">
      <span class="jn-th">result · {result.length} row{result.length === 1 ? '' : 's'}</span>
      <table><thead><tr><th>name</th><th>item</th></tr></thead><tbody>
        {#each result as r}
          <tr>
            <td class:null={!r.u}>{r.u ? r.u.name : 'NULL'}</td>
            <td class:null={!r.o}>{r.o ? r.o.item : 'NULL'}</td>
          </tr>
        {/each}
      </tbody></table>
    </div>
    <p class="jn-note">Dimmed rows are dropped by this join. <b>NULL</b> appears where one side has no match - that's what makes outer joins different from inner.</p>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .jn-body { background: var(--raise); padding: 0.9rem; }
  .jn-seg { display: inline-flex; gap: 3px; background: var(--surface); padding: 3px; border-radius: 8px; margin-bottom: 0.7rem; flex-wrap: wrap; }
  .jn-seg button { cursor: pointer; font: inherit; font-size: 0.76rem; border: 0; background: none; color: var(--muted); padding: 0.3rem 0.6rem; border-radius: 6px; }
  .jn-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 600; }
  .jn-sql { display: block; font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 0.5rem 0.7rem; color: var(--body); margin-bottom: 0.9rem; }
  .jn-sql b { color: var(--accent); }
  .jn-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 0.7rem; }
  .jn-tbl { border: 1px solid var(--line); border-radius: 9px; overflow: hidden; }
  .jn-th { display: block; font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.35rem 0.6rem; border-bottom: 1px solid var(--line); }
  .jn-tbl table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.8rem; }
  .jn-tbl th { text-align: left; color: var(--faint); font-weight: 500; padding: 0.3rem 0.6rem; border-bottom: 1px solid var(--line); }
  .jn-tbl td { padding: 0.3rem 0.6rem; color: var(--ink); border-bottom: 1px solid var(--line); }
  .jn-tbl tr:last-child td { border-bottom: 0; }
  .jn-tbl tr.dim { opacity: 0.32; }
  .jn-res { margin-bottom: 0.7rem; }
  .jn-res td.null { color: #c0563c; font-style: italic; }
  .jn-note { font-size: 0.84rem; color: var(--muted); line-height: 1.5; margin: 0; }
  @media (max-width: 520px) { .jn-tables { grid-template-columns: 1fr; } }
</style>
