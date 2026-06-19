// Browser-side admin client. Calls the same-origin /admin/api proxy, which forwards
// the web-origin session cookie to the backend admin API.
async function j(method, path, body) {
  const res = await fetch(`/admin/api${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const adminGet = (p) => j('GET', p);
export const adminPost = (p, b) => j('POST', p, b);
export const adminPatch = (p, b) => j('PATCH', p, b);
export const adminPut = (p, b) => j('PUT', p, b);
export const adminDelete = (p) => j('DELETE', p);

export async function adminUpload(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/admin/api/assets', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload failed');
  return res.json(); // { id, url }
}

export async function adminPreview(markdown) {
  return adminPost('/preview', { markdown });
}
