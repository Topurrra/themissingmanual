<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { CHEATSHEETS } from '$lib/cheatsheets.js';
  import Seo from '$lib/Seo.svelte';

  let q = '';
  // Deep link from /search (?q=) prefills the filter.
  onMount(() => { const pq = $page.url.searchParams.get('q'); if (pq) q = pq; });
  $: needle = q.trim().toLowerCase();
  // The active tool comes from the sidebar via ?tool=; default to the first.
  // 'sed-awk' was split into separate sheets - keep old shared links working.
  $: active = ($page.url.searchParams.get('tool') || CHEATSHEETS[0].id).replace(/^sed-awk$/, 'sed');

  const matches = (c) =>
    c.cmd.toLowerCase().includes(needle) ||
    c.desc.toLowerCase().includes(needle) ||
    c.example.toLowerCase().includes(needle);

  $: results = needle
    ? CHEATSHEETS.map((s) => ({ ...s, commands: s.commands.filter(matches) })).filter((s) => s.commands.length)
    : CHEATSHEETS.filter((s) => s.id === active);
  $: total = needle ? results.reduce((n, s) => n + s.commands.length, 0) : 0;

  let copied = '';
  function copy(text) {
    try {
      navigator.clipboard.writeText(text);
      copied = text;
      setTimeout(() => { if (copied === text) copied = ''; }, 1200);
    } catch (e) {}
  }

  const total_cmds = CHEATSHEETS.reduce((n, s) => n + s.commands.length, 0);
</script>

<Seo
  title="Cheat Sheet - The Missing Manual"
  description="A searchable command cheat sheet for Git, Bash, Docker, SQL, regex, kubectl, jq, curl, chmod and more - each command with what it does and a real, copy-paste example."
/>

<header class="cs-intro">
  <span class="eyebrow">Reference</span>
  <h1>Cheat Sheet</h1>
  <p class="tagline">The commands you keep forgetting, with a one-line description and a real example you can copy - {total_cmds} across {CHEATSHEETS.length} tools. Pick a tool in the sidebar, or search across all of them.</p>
</header>

<div class="cs-search">
  <i class="ti ti-search" aria-hidden="true"></i>
  <input type="search" bind:value={q} placeholder="Search every command… e.g. commit, grep, 404, chmod" aria-label="Search cheat sheet" />
  {#if needle}<span class="cs-hits">{total} match{total === 1 ? '' : 'es'}</span>{/if}
</div>

{#if needle && results.length === 0}
  <p class="cs-empty">No commands match “{q}”.</p>
{:else}
  {#each results as s (s.id)}
    <section class="cs-sheet" id={`cs-${s.id}`}>
      <div class="cs-sheet-head">
        <i class={`ti ${s.icon}`} aria-hidden="true"></i>
        <h2>{s.name}</h2>
        <span class="cs-blurb">{s.blurb}</span>
      </div>
      <div class="cs-tablewrap">
        <table class="cs-table">
          <thead>
            <tr><th>Command</th><th>What it does</th><th>Example</th></tr>
          </thead>
          <tbody>
            {#each s.commands as c}
              <tr>
                <td class="cs-cmd"><code>{c.cmd}</code></td>
                <td class="cs-desc">{c.desc}</td>
                <td class="cs-ex">
                  <code>{c.example}</code>
                  <button class="cs-copy" class:done={copied === c.example} on:click={() => copy(c.example)} title="Copy example" aria-label="Copy example">
                    <i class={`ti ${copied === c.example ? 'ti-check' : 'ti-copy'}`} aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/each}
{/if}

<style>
  .cs-intro { margin-bottom: 1.4rem; }
  .cs-intro h1 { margin: 0.5rem 0 0.6rem; }

  .cs-search {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--line); border-radius: 12px; padding: 0.6rem 0.9rem;
    background: var(--raise); margin-bottom: 1.6rem; max-width: 520px;
  }
  .cs-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .cs-search .ti { color: var(--faint); font-size: 18px; }
  .cs-search input { flex: 1; border: 0; outline: none; background: none; font: inherit; color: var(--ink); }
  .cs-hits { font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); white-space: nowrap; }

  .cs-sheet { margin-bottom: 2rem; scroll-margin-top: 80px; }
  .cs-sheet-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
  .cs-sheet-head .ti { color: var(--accent); font-size: 20px; }
  .cs-sheet-head h2 { margin: 0; font-size: 1.3rem; }
  .cs-blurb { flex-basis: 100%; font-size: 0.86rem; color: var(--muted); }

  .cs-tablewrap { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .cs-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  .cs-table thead th {
    text-align: left; font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--faint); font-weight: 600;
    padding: 0.6rem 0.9rem; background: var(--surface); border-bottom: 1px solid var(--line);
  }
  .cs-table td { padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  .cs-table tr:last-child td { border-bottom: 0; }
  .cs-table tbody tr:hover { background: var(--surface); }
  .cs-cmd code { font-family: var(--font-mono); font-size: 0.86rem; color: var(--accent-strong); white-space: nowrap; }
  .cs-desc { color: var(--body); line-height: 1.5; min-width: 180px; }
  .cs-ex { position: relative; }
  .cs-ex code {
    font-family: var(--font-mono); font-size: 0.84rem; color: var(--ink);
    background: var(--surface); border: 1px solid var(--line); border-radius: 7px;
    padding: 0.2rem 0.45rem; display: inline-block; white-space: pre-wrap; word-break: break-word;
  }
  .cs-copy {
    cursor: pointer; border: 0; background: none; color: var(--faint); padding: 0.15rem 0.3rem;
    margin-left: 0.3rem; border-radius: 6px; vertical-align: top;
  }
  .cs-copy:hover { color: var(--accent); background: var(--accent-tint); }
  .cs-copy.done { color: #2e9e6b; }
  .cs-copy .ti { font-size: 15px; }

  .cs-empty { color: var(--muted); }

  @media (max-width: 720px) {
    .cs-table, .cs-table tbody, .cs-table tr, .cs-table td { display: block; width: 100%; }
    .cs-table thead { display: none; }
    .cs-table tr { padding: 0.5rem 0; border-bottom: 1px solid var(--line); }
    .cs-table td { border: 0; padding: 0.2rem 0.9rem; }
    .cs-cmd code { white-space: normal; }
  }
</style>
