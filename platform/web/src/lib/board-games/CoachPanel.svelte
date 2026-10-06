<script>
  import { onMount } from 'svelte';
  export let game;
  export let status;
  export let facts = [];
  export let hint = '';
  export let history = [];
  export let guides = [];
  // Smarter coaching: a review of your last move, the engine's evaluation in words,
  // things to notice right now, and links to the guide phase that teaches each idea.
  export let review = null;
  export let evaluation = '';
  export let insights = [];
  export let hintGuide = null;
  const RATING = { best: 'Best move', good: 'Good move', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder' };
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
    {#if review}
      <div class="bg-review" data-rating={review.rating} role="status">
        <strong>{review.label ?? 'Your last move'}: {RATING[review.rating] ?? review.rating}</strong>
        <span>{review.text}</span>
        {#if review.guide}<a href={review.guide}>Learn this idea</a>{/if}
      </div>
    {/if}
    {#if evaluation}<p class="bg-eval">{evaluation}</p>{/if}
    <p>{hint || status?.message || 'Choose a position to explore your options.'}{#if hint && hintGuide}{' '}<a href={hintGuide}>Learn this idea</a>{/if}</p>
    {#if insights.length}
      <h3>What to notice</h3>
      <ul class="bg-insights">
        {#each insights as tip}
          <li>{tip.text}{#if tip.guide}{' '}<a href={tip.guide}>Learn</a>{/if}</li>
        {/each}
      </ul>
    {/if}
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
