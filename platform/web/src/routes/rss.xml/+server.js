import { API_BASE } from '$lib/server/adminApi.js';

const RSS_TYPE = 'application/rss+xml; charset=utf-8';

// Public passthrough so the RSS feed is served on the web origin (the readers,
// the <link rel="alternate"> discovery tag, and the footer/palette affordances
// all point here). Streams the backend's RSS 2.0 XML through unchanged.
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/rss`);
    const body = await res.text();
    return new Response(body, {
      status: res.ok ? 200 : res.status,
      headers: { 'content-type': RSS_TYPE }
    });
  } catch (e) {
    return new Response('<!-- feed temporarily unavailable -->', {
      status: 502,
      headers: { 'content-type': RSS_TYPE }
    });
  }
}
