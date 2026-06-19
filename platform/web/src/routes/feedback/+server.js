import { API_BASE } from '$lib/server/adminApi.js';

// Public passthrough so the reader feedback widget can POST same-origin (the
// browser never calls the backend cross-origin). Forwards the JSON body to the
// backend's public submit endpoint, which answers 204 No Content.
export async function POST({ request }) {
  try {
    const body = await request.text();
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    return new Response(null, { status: res.ok ? 204 : res.status });
  } catch (e) {
    return new Response(null, { status: 502 });
  }
}
