<script>
  import { onMount } from 'svelte';
  import Seo from '$lib/Seo.svelte';

  export let data;
  let items = data.items;
  let voted = new Set();

  const VOTED_KEY = 'tmm-backlog-voted';

  onMount(() => {
    try {
      const v = JSON.parse(localStorage.getItem(VOTED_KEY) || '[]');
      voted = new Set(Array.isArray(v) ? v : []);
    } catch (e) {}
  });

  async function vote(item) {
    if (voted.has(item.key)) return;
    // Optimistic: bump immediately, re-sort, then confirm with the server.
    item.votes += 1;
    voted.add(item.key);
    items = [...items].sort((a, b) => b.votes - a.votes);
    try { localStorage.setItem(VOTED_KEY, JSON.stringify([...voted])); } catch (e) {}

    const res = await fetch('/backlog.vote.json', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: item.key })
    });
    const result = await res.json().catch(() => null);
    if (result && typeof result.votes === 'number') {
      item.votes = result.votes;
      items = [...items].sort((a, b) => b.votes - a.votes);
    }
  }
</script>

<Seo
  title="What should we write next? - The Missing Manual"
  description="A public backlog of topics readers searched for and didn't find, plus reader-submitted requests. Vote for what you want written next." />

<div class="crumb"><a href="/">Home</a> <span>/</span> <span>What should we write next?</span></div>
<h1 class="page-title">What should we write next?</h1>
<p class="tagline">
  Two real signals, one list: topics readers searched for and found little on, and guides readers
  asked for directly. Vote for what you want to see written - no account needed. Don't see your
  topic? <a href="/request">Request it</a>.
</p>

{#if !items.length}
  <p class="bl-empty">Nothing in the backlog right now - the library covers everything readers have searched for or asked about lately.</p>
{:else}
  <ul class="bl-list">
    {#each items as item (item.key)}
      <li class="bl-row">
        <button
          type="button"
          class="bl-vote"
          class:voted={voted.has(item.key)}
          on:click={() => vote(item)}
          disabled={voted.has(item.key)}
          aria-label={voted.has(item.key) ? 'Already voted' : 'Vote for this'}
        >
          <i class="ti ti-chevron-up" aria-hidden="true"></i>
          <span>{item.votes}</span>
        </button>
        <div class="bl-body">
          <p class="bl-label">{item.label}</p>
          <p class="bl-meta">
            {#if item.kind === 'search'}
              <i class="ti ti-search" aria-hidden="true"></i> Searched by readers · {item.hits} result{item.hits === 1 ? '' : 's'} today
            {:else}
              <i class="ti ti-message-2" aria-hidden="true"></i> Reader request
            {/if}
          </p>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .bl-empty { color: var(--muted); margin-top: 1.5rem; }
  .bl-list { list-style: none; margin: 1.6rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .bl-row {
    display: flex; align-items: center; gap: 1rem;
    border: 1px solid var(--line); border-radius: 12px; background: var(--raise);
    padding: 0.9rem 1.1rem;
  }
  .bl-vote {
    display: flex; flex-direction: column; align-items: center; gap: 0;
    flex: none; width: 52px; cursor: pointer; font: inherit;
    color: var(--body); background: var(--bg); border: 1px solid var(--line); border-radius: 10px;
    padding: 0.4rem 0; transition: border-color 0.12s var(--ease), color 0.12s var(--ease);
  }
  .bl-vote .ti { font-size: 17px; }
  .bl-vote span { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; }
  .bl-vote:not(:disabled):hover { border-color: var(--accent); color: var(--accent); }
  .bl-vote.voted { color: var(--accent); border-color: var(--accent); background: var(--accent-tint); cursor: default; }
  .bl-body { flex: 1; min-width: 0; }
  .bl-label { font-weight: 600; color: var(--ink); margin: 0 0 0.25rem; }
  .bl-meta { font-size: 0.82rem; color: var(--faint); margin: 0; display: flex; align-items: center; gap: 0.35rem; }
  .bl-meta .ti { font-size: 14px; }
</style>
