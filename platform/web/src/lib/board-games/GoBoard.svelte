<script>
  import { focusBoardCell } from './board-interaction.js';

  export let board;
  export let selection = null;
  export let legalTargets = [];
  export let dead = [];
  export let lastMove = null;
  export let disabled = false;
  export let onselect = () => {};
  export let pieceSet = 'chessnut';

  let focused = 0;
  const files = 'ABCDEFGHJ';

  function label(stone, index) {
    const point = `${files[index % 9]}${9 - Math.floor(index / 9)}`;
    return `${point}, ${stone === 1 ? 'black stone' : stone === 2 ? 'white stone' : 'empty intersection'}${selection === index ? ', selected' : ''}${dead.includes(index) ? ', marked dead' : ''}${lastMove === index ? ', last move' : ''}${legalTargets.includes(index) ? ', legal move' : ''}`;
  }
</script>

<div class="bg-board bg-go" data-piece-set={pieceSet} role="group" aria-label="Nine by nine Go board. Use arrow keys to move, Enter or Space to select an intersection.">
  {#each board as stone, index}
    {@const row = Math.floor(index / 9)}
    {@const column = index % 9}
    <button
      type="button"
      class="bg-cell"
      class:bg-selected={selection === index}
      class:bg-legal={legalTargets.includes(index)}
      class:bg-dead={dead.includes(index)}
      class:bg-last-move={lastMove === index}
      class:bg-top={row === 0}
      class:bg-bottom={row === 8}
      class:bg-left={column === 0}
      class:bg-right={column === 8}
      data-index={index}
      tabindex={focused === index ? 0 : -1}
      aria-label={label(stone, index)}
      aria-pressed={selection === index}
      aria-disabled={disabled}
      onclick={() => { if (!disabled) onselect(index); }}
      onfocus={() => focused = index}
      onkeydown={(event) => focusBoardCell(event, index, 9)}
    >
      <span class="bg-go-lines" aria-hidden="true"></span>
      {#if [20, 22, 40, 58, 60].includes(index) && !stone}<span class="bg-star" aria-hidden="true"></span>{/if}
      {#if stone}<span class="bg-stone" class:bg-white={stone === 2} aria-hidden="true"></span>{/if}
      {#if legalTargets.includes(index) && !stone}<span class="bg-target" aria-hidden="true"></span>{/if}
      {#if selection === index}<span class="bg-selection-mark" aria-hidden="true"></span>{/if}
      {#if dead.includes(index)}<span class="bg-dead-mark" aria-hidden="true">×</span>{/if}
      {#if lastMove === index}<span class="bg-last-mark" aria-hidden="true"></span>{/if}
      {#if column === 0}<span class="bg-rank" aria-hidden="true">{9 - row}</span>{/if}
      {#if row === 8}<span class="bg-file" aria-hidden="true">{files[column]}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .bg-go { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); aspect-ratio: 1; padding: 4%; }
  .bg-go .bg-cell { position: relative; min-width: 0; min-height: 0; aspect-ratio: 1; }
  .bg-go-lines { position: absolute; inset: 0; background: linear-gradient(var(--bg-go-line, #78654b), var(--bg-go-line, #78654b)) center / 1px 100% no-repeat, linear-gradient(var(--bg-go-line, #78654b), var(--bg-go-line, #78654b)) center / 100% 1px no-repeat; pointer-events: none; }
  .bg-top .bg-go-lines { clip-path: inset(50% 0 0 0); }
  .bg-bottom .bg-go-lines { clip-path: inset(0 0 50% 0); }
  .bg-left .bg-go-lines { background-size: 1px 100%, 50% 1px; background-position: center, right center; }
  .bg-right .bg-go-lines { background-size: 1px 100%, 50% 1px; background-position: center, left center; }
  .bg-star { position: absolute; width: 10%; height: 10%; left: 45%; top: 45%; border-radius: 50%; background: var(--bg-go-line, #78654b); }
  .bg-stone { position: absolute; width: 76%; height: 76%; left: 12%; top: 12%; border-radius: 50%; background: var(--bg-piece-dark, #131316); border: 1px solid var(--bg-piece-dark-edge, #555); box-shadow: 0 2px 3px rgb(0 0 0 / .2); }
  .bg-stone.bg-white { background: var(--bg-piece-light, #f2f2f4); border-color: var(--bg-piece-light-edge, #777); }
  .bg-dead-mark { position: absolute; inset: 0; display: grid; place-items: center; font-size: 1.5em; font-weight: 700; color: #d34838; }
  .bg-last-mark { position: absolute; width: 12%; height: 12%; left: 44%; top: 44%; border-radius: 50%; background: #d34838; }
</style>
