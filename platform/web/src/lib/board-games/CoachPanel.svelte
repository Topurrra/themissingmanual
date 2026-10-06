<script>
  import { onMount } from 'svelte';
  export let game;
  export let status;
  export let facts = [];
  export let hint = '';
  export let history = [];
  export let guides = [];
  let tab = 'coach';
  let expanded = true;
  onMount(() => { expanded = !matchMedia('(max-width: 760px)').matches; });
</script>

<aside class="bg-coach" aria-label="Game assistance">
  <details open={expanded} ontoggle={(event) => expanded = event.currentTarget.open}>
  <summary>Coach and {game === 'sudoku' ? 'progress' : 'moves'}</summary>
  <div class="bg-panel-tabs" role="group" aria-label="Learning panel">
    <button type="button" aria-pressed={tab === 'coach'} onclick={() => tab = 'coach'}>Coach</button>
    <button type="button" aria-pressed={tab === 'moves'} onclick={() => tab = 'moves'}>{game === 'sudoku' ? 'Progress' : 'Moves'}</button>
  </div>
  <div hidden={tab !== 'coach'}>
    <h2>{status?.phase === 'review' ? 'Review the score' : 'Think through this position'}</h2>
    <p>{hint || status?.message || 'Choose a position to explore your options.'}</p>
    {#if facts.length}
      <dl class="bg-facts">
        {#each facts as fact}
          <div><dt>{fact[0]}</dt><dd>{fact[1]}</dd></div>
        {/each}
      </dl>
    {/if}
    {#if guides.length}
      <div class="bg-guide-links">
        <h3>Keep learning</h3>
        {#each guides as guide}
          <a href={guide.href ?? guide.url ?? `/guides/${encodeURIComponent(guide.slug)}`}>{guide.title ?? guide.name}</a>
        {/each}
      </div>
    {/if}
  </div>
  <div hidden={tab !== 'moves'}>
    <h2>{game === 'sudoku' ? 'Your progress' : 'Recent moves'}</h2>
    {#if history.length}
      <ol class="bg-history">
        {#each history as item}<li>{item}</li>{/each}
      </ol>
    {:else}
      <p>No moves yet.</p>
    {/if}
  </div>
  </details>
</aside>
