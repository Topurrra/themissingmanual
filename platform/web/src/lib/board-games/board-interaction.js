// `flipped`: the board is drawn rotated 180 degrees (playing Black), so every arrow
// moves the opposite way in index space to keep moving the way it looks on screen.
const opposite = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft', ArrowUp: 'ArrowDown', ArrowDown: 'ArrowUp' };

export function nextBoardIndex(index, key, width, flipped = false) {
  if (flipped && opposite[key]) key = opposite[key];
  const row = Math.floor(index / width);
  const column = index % width;
  if (key === 'ArrowLeft') return column > 0 ? index - 1 : index;
  if (key === 'ArrowRight') return column < width - 1 ? index + 1 : index;
  if (key === 'ArrowUp') return row > 0 ? index - width : index;
  if (key === 'ArrowDown') return row < width - 1 ? index + width : index;
  return null;
}

export function focusBoardCell(event, index, width, flipped = false) {
  const next = nextBoardIndex(index, event.key, width, flipped);
  if (next === null) return null;
  event.preventDefault();
  event.currentTarget.parentElement?.querySelector(`[data-index="${next}"]`)?.focus();
  return next;
}
