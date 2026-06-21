<script>
  // A tiny visual Git: type git commands, watch the commit graph build. Models
  // commits (with parents), branches, and HEAD. Supports commit / branch /
  // checkout / merge / log / reset. Purely a teaching toy — no real repo.
  let commits = [];        // { id, msg, parents:[id], lane }
  let branches = {};       // name -> tip commit id
  let laneOf = {};         // branch -> lane index
  let head = 'main';
  let n = 0;
  let log = [];
  let input = '';

  function reset() {
    commits = []; branches = {}; laneOf = {}; head = 'main'; n = 0; log = [];
    laneOf.main = 0;
    branches.main = null;
    out('Initialised empty repository on branch main. Try: commit -m "first"');
  }
  function out(v, t = 'out') { log = [...log, { v, t }]; }
  const tip = () => branches[head];
  const nextLane = () => (Object.keys(laneOf).length ? Math.max(...Object.values(laneOf)) + 1 : 0);

  function doCommit(msg) {
    const id = 'c' + (++n);
    const parent = tip();
    commits = [...commits, { id, msg: msg || `commit ${n}`, parents: parent ? [parent] : [], lane: laneOf[head] ?? 0 }];
    branches[head] = id;
    branches = branches;
    out(`[${head} ${id}] ${msg || 'commit ' + n}`);
  }
  function doBranch(name) {
    if (!name) return out('usage: branch <name>', 'err');
    if (laneOf[name] != null) return out(`branch ${name} already exists`, 'err');
    branches[name] = tip();
    laneOf[name] = nextLane();
    branches = branches; laneOf = laneOf;
    out(`Created branch ${name}`);
  }
  function doCheckout(name) {
    if (laneOf[name] == null) return out(`error: branch '${name}' not found`, 'err');
    head = name;
    out(`Switched to branch ${name}`);
  }
  function doMerge(name) {
    if (laneOf[name] == null) return out(`merge: ${name} - not something we can merge`, 'err');
    if (!branches[name]) return out(`nothing to merge from ${name}`, 'err');
    const id = 'c' + (++n);
    const parents = [tip(), branches[name]].filter(Boolean);
    commits = [...commits, { id, msg: `Merge ${name} into ${head}`, parents, lane: laneOf[head] ?? 0, merge: true }];
    branches[head] = id; branches = branches;
    out(`Merge made by the 'recursive' strategy. [${head} ${id}]`);
  }
  function doLog() {
    if (!commits.length) return out('(no commits yet)');
    [...commits].reverse().forEach((c) => out(`${c.id}  ${c.msg}`));
  }

  function run() {
    const raw = input.trim();
    input = '';
    if (!raw) return;
    out('$ ' + raw, 'cmd');
    let s = raw.replace(/^git\s+/, '');
    const m = s.match(/^commit(?:\s+-m\s+["']?(.+?)["']?)?\s*$/);
    if (m) return doCommit(m[1]);
    const parts = s.split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1];
    if (cmd === 'branch') return doBranch(arg);
    if (cmd === 'checkout' || cmd === 'switch') return doCheckout(arg);
    if (cmd === 'merge') return doMerge(arg);
    if (cmd === 'log') return doLog();
    if (cmd === 'reset') return reset();
    out(`git: '${cmd}' is not supported in this sandbox`, 'err');
  }
  function onKey(e) { if (e.key === 'Enter') { e.preventDefault(); run(); } }

  reset();

  // ---- graph layout ----
  const ROW = 46, LANE = 46, PAD = 24, R = 9;
  const COLORS = ['#0e7c86', '#c0563c', '#2e9e6b', '#e0892a', '#6f5cc4', '#4d969c'];
  $: pos = Object.fromEntries(commits.map((c, i) => [c.id, { x: PAD + c.lane * LANE, y: PAD + (commits.length - 1 - i) * ROW, lane: c.lane }]));
  $: height = PAD * 2 + Math.max(0, commits.length - 1) * ROW;
  $: branchTags = (() => {
    const byTip = {};
    for (const [name, id] of Object.entries(branches)) { if (!id) continue; (byTip[id] = byTip[id] || []).push(name); }
    return byTip;
  })();
</script>

<figure class="pg pg-git">
  <figcaption class="pg-cap"><i class="ti ti-git-branch" aria-hidden="true"></i> Git sandbox · on <b>{head}</b><button class="pg-reset" on:click={reset}>Reset</button></figcaption>
  <div class="git-body">
    <div class="git-graph" style={`height:${height + 20}px`}>
      <svg width="100%" height={height + 20} role="img" aria-label="commit graph">
        {#each commits as c}
          {#each c.parents as p}
            {#if pos[p]}
              <line x1={pos[c.id].x} y1={pos[c.id].y} x2={pos[p].x} y2={pos[p].y} stroke="var(--line)" stroke-width="2" />
            {/if}
          {/each}
        {/each}
        {#each commits as c}
          <circle cx={pos[c.id].x} cy={pos[c.id].y} r={R} fill={COLORS[c.lane % COLORS.length]} stroke="var(--raise)" stroke-width="2" />
          <text x={pos[c.id].x + 18} y={pos[c.id].y + 4} font-size="13" font-family="var(--font-mono)" fill="var(--body)">{c.msg}{#if branchTags[c.id]} ({branchTags[c.id].join(', ')}){/if}</text>
        {/each}
      </svg>
    </div>
    <div class="git-log">
      {#each log as l}<div class="g-{l.t}">{l.v}</div>{/each}
    </div>
    <div class="git-row">
      <span class="git-prompt">git</span>
      <input bind:value={input} on:keydown={onKey} placeholder='commit -m "msg" · branch dev · checkout dev · merge dev · log' spellcheck="false" aria-label="git command" />
    </div>
  </div>
</figure>

<style>
  .pg { margin: 1.6rem 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .pg-cap { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--line); }
  .pg-cap .ti { color: var(--accent); font-size: 15px; }
  .pg-cap b { color: var(--accent); }
  .pg-reset { margin-left: auto; cursor: pointer; font: inherit; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
  .pg-reset:hover { color: var(--ink); border-color: var(--accent); }
  .git-body { background: var(--raise); padding: 0.6rem 0.8rem 0.8rem; }
  .git-graph { overflow: auto; }
  .git-log { font-family: var(--font-mono); font-size: 0.8rem; max-height: 120px; overflow-y: auto; margin: 0.5rem 0; color: var(--muted); }
  .g-cmd { color: var(--accent); }
  .g-err { color: #c0563c; }
  .git-row { display: flex; gap: 0.5ch; align-items: center; border: 1px solid var(--line); border-radius: 9px; padding: 0.4rem 0.6rem; background: var(--bg); font-family: var(--font-mono); }
  .git-row:focus-within { border-color: var(--accent); }
  .git-prompt { color: var(--faint); }
  .git-row input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font: inherit; color: var(--ink); }
</style>
