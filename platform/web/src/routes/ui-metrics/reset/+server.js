import { API_BASE } from '$lib/server/adminApi.js';

// Same-origin passthrough that clears the per-session client UI metrics counter.
export async function POST() {
  try {
    const res = await fetch(`${API_BASE}/api/ui-metrics/reset`, { method: 'POST' });
    return new Response(null, { status: res.ok ? 204 : res.status });
  } catch (e) {
    return new Response(null, { status: 502 });
  }
}
