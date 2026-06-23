import { API_BASE } from '$lib/server/adminApi.js';

// Same-origin passthrough for lightweight client UI metrics: forwards the JSON
// body to the backend and relays its JSON response (the browser never calls the
// backend cross-origin).
export async function POST({ request }) {
  try {
    const body = await request.text();
    const res = await fetch(`${API_BASE}/api/ui-metrics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(null, { status: 502 });
  }
}
