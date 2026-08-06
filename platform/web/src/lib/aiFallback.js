// Client-side "keyword found nothing, try AI" fallback for the compact search
// surfaces (header typeahead + command palette). The /search page has its own
// AskPanel; this is the shared bit for the small menus.
//
// Deliberately NOT per keystroke - the original rule was "AI is never called from
// typeahead" to protect the budget. This keeps that spirit: it only fires after the
// user pauses (`delay`), only when the keyword search already came back empty, and
// always on the free retrieval path (`?mode=search`). A stale-guard (`seq`) drops
// responses for a query the user has since typed past.
export function createAiFallback({ delay = 550, minLen = 3, max = 3 } = {}) {
  let timer = null;
  let seq = 0;

  return {
    // Schedule an AI retrieval for `query`; calls onRows([{title,url,text}...]) with
    // up to `max` rows, or onRows([]) when there's nothing / it's disabled / it errors.
    schedule(query, onRows) {
      clearTimeout(timer);
      const text = (query || '').trim();
      const my = ++seq;
      if (text.length < minLen) {
        onRows([]);
        return;
      }
      timer = setTimeout(async () => {
        try {
          const res = await fetch(`/ask.json?q=${encodeURIComponent(text)}&mode=search`);
          const data = await res.json().catch(() => null);
          if (my !== seq) return; // superseded by a newer query
          onRows((data && Array.isArray(data.results) ? data.results : []).slice(0, max));
        } catch {
          if (my === seq) onRows([]);
        }
      }, delay);
    },

    // Cancel any pending call and invalidate in-flight responses.
    cancel() {
      clearTimeout(timer);
      seq++;
    }
  };
}
