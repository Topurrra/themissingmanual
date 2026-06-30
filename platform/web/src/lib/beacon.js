// Fire a privacy-friendly pageview beacon to the web-origin collector.
export function sendPageview(url) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  const path = url.pathname;
  let kind = 'pageview';
  let query = '';
  if (path === '/search') {
    const q = url.searchParams.get('q') || '';
    if (q) {
      kind = 'search';
      query = q;
    }
  }
  // utm_source from tagged links (the admin link builder) -> "traffic by source".
  const source = (url.searchParams.get('utm_source') || '').slice(0, 64);
  try {
    navigator.sendBeacon(
      '/analytics/collect',
      JSON.stringify({ path, kind, query, referrer: document.referrer || '', source })
    );
  } catch {}
}
