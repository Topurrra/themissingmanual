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
    : [activeSheet];
  $: total = needle ? results.reduce((n, s) => n + s.commands.length, 0) : activeSheet.commands.length;
  $: activeSheet = CHEATSHEETS.find((s) => s.id === active) || CHEATSHEETS[0];

  let copied = '';
  let copyError = '';
  let failedCopy = '';
  async function copy(text, trigger) {
    copied = '';
    copyError = '';
    failedCopy = '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      try {
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('Copy command failed');
      } catch (fallbackError) {
        copyError = 'Could not copy. Select the example and copy it manually.';
        failedCopy = text;
        return;
      } finally {
        textarea.remove();
        trigger?.focus();
      }
    }
    copied = text;
    setTimeout(() => { if (copied === text) copied = ''; }, 1200);
  }

  function clearSearch() {
    q = '';
  }

  const total_cmds = CHEATSHEETS.reduce((n, s) => n + s.commands.length, 0);
</script>

<Seo
  title="Cheat Sheet - The Missing Manual"
  description="A searchable command cheat sheet for Git, Bash, Docker, SQL, regex, kubectl, jq, curl, chmod and more - each command with what it does and a real, copy-paste example."
/>

<header class="cs-intro">
  <h1>Cheat Sheet</h1>
  <p class="tagline">The commands you keep forgetting, with a one-line description and a real example you can copy - {total_cmds} across {CHEATSHEETS.length} tools. Pick a tool in the sidebar, or search across all of them.</p>
</header>

<div class="cs-search-area">
  <div class="cs-search">
    <i class="ti ti-search" aria-hidden="true"></i>
    <input type="search" bind:value={q} placeholder="Search every command… e.g. commit, grep, 404, chmod" aria-label="Search every cheat sheet command" />
    {#if needle}
      <button class="cs-clear" type="button" on:click={clearSearch} aria-label="Clear command search">Clear</button>
    {/if}
  </div>
  {#if needle}
    <p class="cs-results" aria-live="polite">{total} command{total === 1 ? '' : 's'} in {results.length} tool{results.length === 1 ? '' : 's'}</p>
  {:else}
    <p class="cs-results">Showing {activeSheet.name}. Choose another tool in the sidebar, or search all {total_cmds} commands.</p>
  {/if}
  {#if copyError}
    <p class="cs-copy-error" role="status">{copyError}</p>
  {/if}
</div>

{#if needle && results.length === 0}
  <div class="cs-empty" role="status">
    <p>No commands match “{q}”.</p>
    <button type="button" on:click={clearSearch}>Clear search</button>
  </div>
{:else}
  {#each results as s (s.id)}
    <section class="cs-sheet" id={`cs-${s.id}`}>
      <div class="cs-sheet-head">
        <i class={`ti ${s.icon}`} aria-hidden="true"></i>
        <div>
          <h2>{s.name}</h2>
          <p class="cs-blurb">{s.blurb}</p>
        </div>
        <span class="cs-count">{s.commands.length} command{s.commands.length === 1 ? '' : 's'}</span>
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
                  <button class="cs-copy" class:done={copied === c.example} on:click={(event) => copy(c.example, event.currentTarget)} title={copied === c.example ? 'Copied' : failedCopy === c.example ? 'Retry copy' : 'Copy example'} aria-label={copied === c.example ? 'Example copied' : failedCopy === c.example ? 'Retry copying example' : 'Copy example'}>
                    <i class={`ti ${copied === c.example ? 'ti-check' : 'ti-copy'}`} aria-hidden="true"></i>
                    <span>{copied === c.example ? 'Copied' : failedCopy === c.example ? 'Retry' : 'Copy'}</span>
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
  .cs-intro { max-width: 48rem; margin-bottom: 1.5rem; }
  .cs-intro h1 { margin: 0 0 0.65rem; font-size: 2.5rem; line-height: 1.06; letter-spacing: -0.035em; }
  .cs-intro p { margin: 0; }

  .cs-search-area { margin-bottom: 2.4rem; }
  .cs-search {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--line); border-radius: 10px; padding: 0.75rem 0.9rem;
    background: var(--raise); max-width: 42rem;
  }
  .cs-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-tint); }
  .cs-search .ti { color: var(--faint); font-size: 18px; }
  .cs-search input { flex: 1; border: 0; outline: none; background: none; font: inherit; color: var(--ink); }
  .cs-clear { flex: none; border: 0; border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer; font: 500 0.8rem var(--font-body); padding: 0.3rem 0.35rem; }
  .cs-clear:hover { background: var(--surface); color: var(--ink); }
  .cs-results { margin: 0.65rem 0 0; color: var(--muted); font-size: 0.9rem; }
  .cs-copy-error { color: var(--muted); font-size: 0.85rem; margin: 0.65rem 0 0; }

  .cs-sheet { margin-bottom: 2.8rem; scroll-margin-top: 80px; }
  .cs-sheet-head { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 0.65rem; margin-bottom: 0.85rem; }
  .cs-sheet-head > .ti { color: var(--accent); font-size: 1.2rem; line-height: 1.5; }
  .cs-sheet-head h2 { margin: 0; font-size: 1.35rem; line-height: 1.2; letter-spacing: -0.02em; }
  .cs-blurb { margin: 0.2rem 0 0; font-size: 0.9rem; color: var(--muted); line-height: 1.5; }
  .cs-count { font: 0.72rem var(--font-mono); color: var(--faint); white-space: nowrap; padding-top: 0.2rem; }

  .cs-tablewrap { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); overflow-x: auto; }
  .cs-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  .cs-table thead th {
    text-align: left; font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--faint); font-weight: 600; padding: 0.65rem 0.75rem;
    border-bottom: 1px solid var(--line);
  }
  .cs-table td { padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--line); vertical-align: top; }
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
    align-items: center; cursor: pointer; border: 0; background: none; color: var(--faint); display: inline-flex;
    font: 0.72rem var(--font-mono); gap: 0.25rem; margin-left: 0.3rem; min-height: 1.9rem; padding: 0.2rem 0.4rem;
    border-radius: 6px; vertical-align: top;
  }
  .cs-copy:hover { color: var(--accent); background: var(--accent-tint); }
  .cs-copy.done { color: #2e9e6b; }
  .cs-copy .ti { font-size: 15px; }

  .cs-empty { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 1.25rem 0; color: var(--muted); }
  .cs-empty p { margin: 0 0 0.7rem; }
  .cs-empty button { border: 1px solid var(--line); border-radius: 8px; background: var(--raise); color: var(--ink); cursor: pointer; font: 500 0.85rem var(--font-body); min-height: 2.25rem; padding: 0.25rem 0.7rem; }
  .cs-empty button:hover { border-color: var(--accent); color: var(--accent-strong); }

  @media (max-width: 720px) {
    .cs-intro h1 { font-size: 2.25rem; }
    .cs-sheet-head { grid-template-columns: auto 1fr; }
    .cs-count { grid-column: 2; padding-top: 0; }
    .cs-table, .cs-table tbody, .cs-table tr, .cs-table td { display: block; width: 100%; }
    .cs-table thead { display: none; }
    .cs-table tr { padding: 0.65rem 0; border-bottom: 1px solid var(--line); }
    .cs-table td { border: 0; padding: 0.2rem 0; }
    .cs-table tr:last-child { border-bottom: 0; }
    .cs-desc { margin-top: 0.15rem; }
    .cs-ex { margin-top: 0.45rem; }
    .cs-cmd code { white-space: normal; }
  }
</style>
