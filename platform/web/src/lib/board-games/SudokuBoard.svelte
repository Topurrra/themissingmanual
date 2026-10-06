<script>
  import { focusBoardCell } from './board-interaction.js';

  export let board;
  export let selection = null;
  export let legalTargets = [];
  export let highlighted = [];
  export let notes = [];
  export let givens = [];
  export let disabled = false;
  export let onselect = () => {};
  export let oninput = () => {};
  export let pieceSet = 'chessnut';

  let focused = 0;

  function label(value, index) {
    const cell = `row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}`;
    const content = value ? `${givens[index] ? 'given' : 'entered'} ${value}` : notes[index]?.length ? `empty, notes ${notes[index].join(', ')}` : 'empty';
    return `${cell}, ${content}${selection === index ? ', selected' : ''}${highlighted.includes(index) ? ', highlighted' : ''}`;
  }

  function handleKeydown(event, index) {
    if (focusBoardCell(event, index, 9) !== null || disabled) return;
    if (/^[1-9]$/.test(event.key) && !givens[index]) {
      event.preventDefault();
      oninput(index, Number(event.key));
    } else if (['0', 'Backspace', 'Delete'].includes(event.key) && !givens[index]) {
      event.preventDefault();
      oninput(index, 0);
    }
  }
</script>

<div class="bg-board bg-sudoku" data-piece-set={pieceSet} role="group" aria-label="Sudoku grid. Use arrow keys to move, digits to enter, Backspace or Delete to erase.">
  {#each board as value, index}
    {@const row = Math.floor(index / 9)}
    {@const column = index % 9}
    <button
      type="button"
      class="bg-cell"
      class:bg-selected={selection === index}
      class:bg-legal={legalTargets.includes(index)}
      class:bg-highlighted={highlighted.includes(index)}
      class:bg-given={!!givens[index]}
      class:bg-box-right={column === 2 || column === 5}
      class:bg-box-bottom={row === 2 || row === 5}
      data-index={index}
      tabindex={focused === index ? 0 : -1}
      aria-label={label(value, index)}
      aria-pressed={selection === index}
      aria-disabled={disabled}
      onclick={() => { if (!disabled) onselect(index); }}
      onfocus={() => focused = index}
      onkeydown={(event) => handleKeydown(event, index)}
    >
      {#if value}
        <span class="bg-digit">{value}</span>
      {:else if notes[index]?.length}
        <span class="bg-notes" aria-hidden="true">
          {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as candidate}
            <span>{notes[index].includes(candidate) ? candidate : ''}</span>
          {/each}
        </span>
      {/if}
      {#if selection === index}<span class="bg-selection-mark" aria-hidden="true"></span>{/if}
    </button>
  {/each}
</div>

<style>
  .bg-sudoku { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); aspect-ratio: 1; }
  .bg-sudoku .bg-cell { position: relative; min-width: 0; min-height: 0; aspect-ratio: 1; }
  .bg-notes { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; height: 100%; align-items: center; font-size: clamp(7px, 1.6vw, 11px); line-height: 1; }
</style>
