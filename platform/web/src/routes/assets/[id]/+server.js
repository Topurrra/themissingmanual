import { API_BASE } from '$lib/server/adminApi.js';

// Public passthrough so uploaded images load on the web origin (admin preview + public guides).
export async function GET({ params }) {
  const res = await fetch(`${API_BASE}/assets/${params.id}`);
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream' }
  });
}
