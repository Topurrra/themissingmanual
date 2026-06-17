// Block a GET search form from navigating when the query is empty.
export function guardSearchSubmit(e) {
  const input = e.currentTarget.querySelector('input[name="q"]');
  if (!input || !input.value.trim()) e.preventDefault();
}

// Escape HTML, then wrap case-insensitive query-term matches in <mark>. Returns HTML for {@html}.
export function highlight(text, query) {
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const safe = esc(text ?? '');
  if (!query || !query.trim()) return safe;
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return safe;
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}
