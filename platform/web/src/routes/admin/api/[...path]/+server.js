import { API_BASE } from '$lib/server/adminApi.js';

// Forward any admin API call to the backend, relaying the browser's cookie.
async function proxy({ request, params, url }) {
  const target = `${API_BASE}/api/admin/${params.path}${url.search}`;
  const headers = { cookie: request.headers.get('cookie') || '' };
  const ct = request.headers.get('content-type');
  if (ct) headers['content-type'] = ct;
  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  const res = await fetch(target, { method, headers, body });
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const PUT = proxy;
