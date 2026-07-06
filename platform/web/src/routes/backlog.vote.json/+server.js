import { API_BASE } from '$lib/server/adminApi.js';

// Public passthrough so the backlog page can POST same-origin, same pattern as
// /feedback for the reader-feedback widget.
export async function POST({ request }) {
  try {
    const body = await request.text();
    const res = await fetch(`${API_BASE}/api/backlog/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });
    const data = await res.json().catch(() => null);
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
