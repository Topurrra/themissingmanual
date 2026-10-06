export function nextBoardIndex(index, key, width) {
  const row = Math.floor(index / width);
  const column = index % width;
  if (key === 'ArrowLeft') return column > 0 ? index - 1 : index;
  if (key === 'ArrowRight') return column < width - 1 ? index + 1 : index;
  if (key === 'ArrowUp') return row > 0 ? index - width : index;
  if (key === 'ArrowDown') return row < width - 1 ? index + width : index;
  return null;
}

export function focusBoardCell(event, index, width) {
  const next = nextBoardIndex(index, event.key, width);
  if (next === null) return null;
  event.preventDefault();
  event.currentTarget.parentElement?.querySelector(`[data-index="${next}"]`)?.focus();
  return next;
}
