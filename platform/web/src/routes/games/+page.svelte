<script>
  import Seo from '$lib/Seo.svelte';
  import '$lib/board-games/games.css';
  const games = [
    {id:'chess',name:'Chess',icon:'ti-chess',description:'Read the position. Protect your king. Build a plan.',details:'Classic chess · Computer practice'},
    {id:'checkers',name:'Checkers',icon:'ti-circles',description:'Look beyond the next jump. Every capture changes the board.',details:'English checkers · Computer practice'},
    {id:'sudoku',name:'Sudoku',icon:'ti-grid-dots',description:'Find what must be true, one deduction at a time.',details:'Unique 9×9 puzzles · Three difficulties'}
  ];
</script>
<Seo title="Games" description="Play chess, checkers and Sudoku. Choose a clear board or contextual coaching, and learn at your own pace." />
<div class="bg-hub">
  <a class="bg-back" href="/train">← Brain workouts</a>
  <h1>A little room to think.</h1>
  <p class="bg-intro">Three games. Time to find your next move.</p>
  <p>Choose <strong>Focus</strong> for a quiet board, or <strong>Coach</strong> for explanations as you play. Your game stays with you when you switch.</p>
  <div class="bg-game-list">
    {#each games as game}
      <a class="bg-game-link" href={'/games/' + game.id}>
        <i class={'ti ' + game.icon} aria-hidden="true"></i>
        <div><h2>{game.name}</h2><p>{game.description}</p><span>{game.details}</span></div>
        <i class="ti ti-arrow-up-right" aria-hidden="true"></i>
      </a>
    {/each}
  </div>
  <p class="bg-hub-note">Games save on this device. <a href="/categories/games">Explore the game guides</a> to learn the rules and ideas behind the board.</p>
</div>
