<script>
  import { focusBoardCell } from './board-interaction.js';

  export let board;
  export let selection = null;
  export let legalTargets = [];
  export let disabled = false;
  export let onselect = () => {};
  export let pieceSet = 'chessnut';

  let focused = 0;
  const files = 'abcdefgh';

  function label(piece, index) {
    const square = `${files[index % 8]}${8 - Math.floor(index / 8)}`;
    const kind = piece ? `${piece < 0 ? 'white' : 'black'} ${Math.abs(piece) === 2 ? 'king' : 'man'}` : 'empty';
    return `${square}, ${kind}${selection?.includes(index) ? ', selected path' : ''}${legalTargets.includes(index) ? ', legal landing' : ''}`;
  }
</script>

<div class="bg-board bg-checkers" data-piece-set={pieceSet} role="group" aria-label="Checkers board. Use arrow keys to move, Enter or Space to select a square.">
  {#each board as piece, index}
    {@const row = Math.floor(index / 8)}
    {@const column = index % 8}
    <button
      type="button"
      class="bg-cell"
      class:bg-dark={(row + column) % 2 === 1}
      class:bg-selected={selection?.includes(index) ?? false}
      class:bg-legal={legalTargets.includes(index)}
      data-index={index}
      tabindex={focused === index ? 0 : -1}
      aria-label={label(piece, index)}
      aria-pressed={selection?.includes(index) ?? false}
      aria-disabled={disabled}
      onclick={() => { if (!disabled) onselect(index); }}
      onfocus={() => focused = index}
      onkeydown={(event) => focusBoardCell(event, index, 8)}
    >
      {#if piece}
        <span class="bg-checker" class:bg-white={piece < 0} aria-hidden="true">
          {#if Math.abs(piece) === 2}<span class="bg-crown">K</span>{/if}
        </span>
      {/if}
      {#if legalTargets.includes(index)}<span class="bg-target" aria-hidden="true"></span>{/if}
      {#if selection?.includes(index)}<span class="bg-selection-mark" aria-hidden="true"></span>{/if}
      {#if column === 0}<span class="bg-rank" aria-hidden="true">{8 - row}</span>{/if}
      {#if row === 7}<span class="bg-file" aria-hidden="true">{files[column]}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .bg-checkers { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); aspect-ratio: 1; }
  .bg-checkers .bg-cell { position: relative; display: grid; place-items: center; min-width: 0; min-height: 0; aspect-ratio: 1; }
  .bg-checker { display: grid; place-items: center; width: 72%; height: 72%; margin: auto; border-radius: 50%; background: var(--bg-piece-dark, #131316); border: 2px solid var(--bg-piece-dark-edge, #555); box-shadow: inset 0 0 0 3px rgb(255 255 255 / .12), 0 2px 3px rgb(0 0 0 / .2); }
  .bg-checker.bg-white { background: var(--bg-piece-light, #f2f2f4); border-color: var(--bg-piece-light-edge, #777); box-shadow: inset 0 0 0 3px rgb(0 0 0 / .1), 0 2px 3px rgb(0 0 0 / .2); }
  .bg-crown { font-size: clamp(12px, 3vw, 20px); font-weight: 700; color: #f2f2f4; }
  .bg-white .bg-crown { color: #131316; }
</style>
