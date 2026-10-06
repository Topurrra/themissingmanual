<script>
  import { focusBoardCell } from './board-interaction.js';
  import { getPieceUrl } from './themes.js';

  export let board;
  export let selection = null;
  export let legalTargets = [];
  export let threatened = [];
  export let disabled = false;
  export let onselect = () => {};
  export let pieceSet = 'chessnut';

  let focused = 0;
  const files = 'abcdefgh';
  const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

  function label(piece, index) {
    const square = `${files[index % 8]}${8 - Math.floor(index / 8)}`;
    return `${square}, ${piece ? `${piece.color === 'w' ? 'white' : 'black'} ${names[piece.type]}` : 'empty'}${selection === index ? ', selected' : ''}${legalTargets.includes(index) ? ', legal move' : ''}${threatened.includes(index) ? ', threatened' : ''}`;
  }
</script>

<div class="bg-board bg-chess" role="group" aria-label="Chess board. Use arrow keys to move, Enter or Space to select a square.">
  {#each board as piece, index}
    {@const row = Math.floor(index / 8)}
    {@const column = index % 8}
    <button
      type="button"
      class="bg-cell"
      class:bg-dark={(row + column) % 2 === 1}
      class:bg-selected={selection === index}
      class:bg-legal={legalTargets.includes(index)}
      class:bg-threatened={threatened.includes(index)}
      data-index={index}
      tabindex={focused === index ? 0 : -1}
      aria-label={label(piece, index)}
      aria-pressed={selection === index}
      aria-disabled={disabled}
      onclick={() => { if (!disabled) onselect(index); }}
      onfocus={() => focused = index}
      onkeydown={(event) => focusBoardCell(event, index, 8)}
    >
      {#if piece}
        <img class="bg-chess-piece" src={getPieceUrl(pieceSet, piece.color, piece.type)} alt="" draggable="false" />
      {/if}
      {#if legalTargets.includes(index)}<span class="bg-target" aria-hidden="true"></span>{/if}
      {#if selection === index}<span class="bg-selection-mark" aria-hidden="true"></span>{/if}
      {#if column === 0}<span class="bg-rank" aria-hidden="true">{8 - row}</span>{/if}
      {#if row === 7}<span class="bg-file" aria-hidden="true">{files[column]}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .bg-chess { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); aspect-ratio: 1; }
  .bg-chess .bg-cell { position: relative; min-width: 0; min-height: 0; aspect-ratio: 1; }
  .bg-chess-piece { display: block; width: 92%; height: 92%; margin: 4%; object-fit: contain; pointer-events: none; }
</style>
