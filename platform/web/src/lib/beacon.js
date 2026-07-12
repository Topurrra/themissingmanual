// Fire a privacy-friendly pageview beacon to the web-origin collector.
// Search is recorded separately (see sendSearchResult) once the result count is
// known, so /search visits still count as pageviews here but aren't double-counted.
export function sendPageview(url) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  const path = url.pathname;
  // utm_source from tagged links (the admin link builder) -> "traffic by source".
  const source = (url.searchParams.get('utm_source') || '').slice(0, 64);
  try {
    navigator.sendBeacon(
      '/analytics/collect',
      JSON.stringify({ path, kind: 'pageview', query: '', referrer: document.referrer || '', source })
    );
  } catch {}
}

// Fire once per search, when the result count is known (query + result_count).
export function sendSearchResult(query, count) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon || !query) return;
  try {
    navigator.sendBeacon(
      '/analytics/collect',
      JSON.stringify({ path: '/search', kind: 'search', query, value: count })
    );
  } catch {}
}
