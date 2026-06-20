<script>
  import { onMount } from 'svelte';
  import { generatePath } from '$lib/pathgen.js';

  export let guides = [];
  export let categories = [];
  export let currentSlug = null;

  const CFG_KEY = 'tmm-path-config';
  const DONE_KEY = 'tmm-path-done';
  const RAIL_KEY = 'tmm-pathrail';

  let ready = false;
  let hasPath = false;
  let level = 'newbie';
  let interests = [];
  let done = [];
  let collapsed = false;
  let listEl;

  $: steps = hasPath ? generatePath({ level, interests }, categories, guides) : [];
  $: total = steps.length;
  $: doneCount = steps.filter((s) => done.includes(s.slug)).length;
  $: pct = total ? Math.round((doneCount / total) * 100) : 0;
  $: currentIndex = steps.findIndex((s) => s.slug === currentSlug);

  // Group consecutive steps by category so the rail shows which topic each
  // guide belongs to (Hardware, Operating Systems, …). Items keep their global
  // index for numbering + scroll-into-view.
  $: groups = (() => {
    const out = [];
    steps.forEach((s, i) => {
      let g = out[out.length - 1];
      if (!g || g.category !== s.category) { g = { category: s.category, name: s.categoryName, items: [] }; out.push(g); }
      g.items.push({ ...s, i });
    });
    return out;
  })();

  function readConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
      if (cfg && cfg.level) {
        hasPath = true;
        level = cfg.level;
        interests = Array.isArray(cfg.interests) ? cfg.interests : [];
      } else {
        hasPath = false;
      }
    } catch (e) { hasPath = false; }
    readDone();
  }
  function readDone() {
    try {
      const d = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
      done = Array.isArray(d) ? d : [];
    } catch (e) {}
  }

  onMount(() => {
    try { collapsed = localStorage.getItem(RAIL_KEY) === 'collapsed'; } catch (e) {}
    readConfig();
    ready = true;
    // Sync if the path/progress changes in another tab.
    const onStorage = (e) => { if (!e || [CFG_KEY, DONE_KEY].includes(e.key)) readConfig(); };
    const onProgress = () => readDone();
    window.addEventListener('storage', onStorage);
    window.addEventListener('tmm-progress', onProgress);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tmm-progress', onProgress);
    };
  });

  // Re-read progress whenever the current guide changes (navigation), so marking
  // a guide done on the /paths page is reflected here too.
  $: if (ready && currentSlug !== undefined) readDone();

  // Keep the active step visible inside the rail.
  $: if (listEl && currentIndex >= 0) {
    const el = listEl.querySelector(`[data-i="${currentIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function toggleDone(slug) {
    done = done.includes(slug) ? done.filter((s) => s !== slug) : [...done, slug];
    try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch (e) {}
  }
  function toggleCollapsed() {
    collapsed = !collapsed;
    try { localStorage.setItem(RAIL_KEY, collapsed ? 'collapsed' : 'open'); } catch (e) {}
  }
</script>

{#if ready && hasPath}
  <aside class="path-rail" class:collapsed>
    {#if collapsed}
      <button class="pr-tab" on:click={toggleCollapsed} title="Show your path" aria-label="Show your path">
        <i class="ti ti-route" aria-hidden="true"></i>
        <span class="pr-tab-pct">{pct}%</span>
      </button>
    {:else}
      <div class="pr-head">
        <span class="pr-title"><i class="ti ti-route" aria-hidden="true"></i> Your path</span>
        <button class="pr-collapse" on:click={toggleCollapsed} title="Hide your path" aria-label="Hide your path">
          <i class="ti ti-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      <div class="pr-progress">
        <div class="pr-bar"><div class="pr-fill" style={`width:${pct}%`}></div></div>
        <span class="pr-frac">{doneCount}/{total} · {pct}%</span>
      </div>
      <div class="pr-list" bind:this={listEl}>
        {#each groups as g}
          <div class="pr-cat">{g.name}</div>
          <ol class="pr-cat-items">
            {#each g.items as s}
              <li class="pr-step" data-i={s.i} class:done={done.includes(s.slug)} class:current={s.slug === currentSlug}>
                <button class="pr-check" class:on={done.includes(s.slug)} on:click={() => toggleDone(s.slug)}
                  aria-label={done.includes(s.slug) ? 'Mark as not done' : 'Mark as done'}
                  title={done.includes(s.slug) ? 'Done' : 'Mark as done'}>
                  <i class="ti ti-check" aria-hidden="true"></i>
                </button>
                <a class="pr-link" href={`/guides/${s.slug}`}>{s.i + 1}. {s.title}</a>
              </li>
            {/each}
          </ol>
        {/each}
      </div>
      <a class="pr-full" href="/paths">View full path →</a>
    {/if}
  </aside>
{/if}

<style>
  .path-rail {
    position: sticky;
    top: 57px;
    height: calc(100vh - 57px);
    width: 250px;
    border-left: 1px solid var(--line);
    padding: 1.2rem 0.9rem 1.4rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .path-rail.collapsed {
    width: auto;
    padding: 1rem 0.5rem;
    border-left: 1px solid var(--line);
    align-items: center;
  }

  .pr-tab {
    display: inline-flex; flex-direction: column; align-items: center; gap: 0.2rem;
    cursor: pointer; background: none; border: 1px solid var(--line);
    border-radius: 10px; padding: 0.55rem 0.45rem; color: var(--muted);
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .pr-tab:hover { border-color: var(--accent); color: var(--ink); }
  .pr-tab .ti { font-size: 18px; color: var(--accent); }
  .pr-tab-pct { font-family: var(--font-mono); font-size: 0.62rem; }

  .pr-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
  .pr-title {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-family: var(--font-display); font-weight: 600; font-size: 0.95rem; color: var(--ink);
  }
  .pr-title .ti { color: var(--accent); font-size: 17px; }
  .pr-collapse {
    flex: none; background: none; border: 1px solid transparent; color: var(--faint);
    cursor: pointer; width: 30px; height: 30px; border-radius: 8px;
    display: inline-grid; place-items: center; transition: all 0.15s var(--ease);
  }
  .pr-collapse:hover { background: var(--surface); color: var(--ink); }
  .pr-collapse .ti { font-size: 18px; }

  .pr-progress { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.9rem; }
  .pr-bar { flex: 1; height: 6px; border-radius: 999px; background: var(--surface); overflow: hidden; }
  .pr-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s var(--ease); }
  .pr-frac { flex: none; font-family: var(--font-mono); font-size: 0.66rem; color: var(--muted); }

  .pr-list { overflow-y: auto; flex: 1; }
  .pr-cat {
    font-family: var(--font-mono); font-size: 0.62rem; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--faint);
    margin: 0.9rem 0 0.35rem; padding-left: 0.3rem;
  }
  .pr-cat:first-child { margin-top: 0; }
  .pr-cat-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .pr-step { display: flex; align-items: flex-start; gap: 0.45rem; padding: 0.25rem 0.3rem; border-radius: 8px; }
  .pr-step.current { background: var(--accent-tint); }
  .pr-check {
    flex: none; margin-top: 0.1rem; cursor: pointer;
    width: 18px; height: 18px; border-radius: 5px;
    border: 1.5px solid var(--line); background: var(--raise); color: transparent;
    display: inline-grid; place-items: center; transition: all 0.15s var(--ease);
  }
  .pr-check .ti { font-size: 12px; }
  .pr-check:hover { border-color: var(--accent); }
  .pr-check.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .pr-link {
    font-size: 0.84rem; line-height: 1.35; color: var(--muted);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .pr-link:hover { color: var(--ink); text-decoration: none; }
  .pr-step.current .pr-link { color: var(--accent); font-weight: 500; }
  .pr-step.done .pr-link { color: var(--faint); text-decoration: line-through; text-decoration-color: var(--line); }

  .pr-full {
    margin-top: 0.8rem; flex: none;
    font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.04em;
    color: var(--muted);
  }
  .pr-full:hover { color: var(--accent); }

  @media (max-width: 1100px) { .path-rail { display: none; } }
</style>
