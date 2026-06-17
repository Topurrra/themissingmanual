const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

// Server-side fetch to the admin API, forwarding the browser's cookie header.
export async function adminApi(cookieHeader, path, opts = {}) {
  return fetch(`${BASE}/api/admin${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie: cookieHeader || '' }
  });
}

// Is the current request authenticated? (calls /me)
export async function isAuthed(cookieHeader) {
  try {
    const res = await adminApi(cookieHeader, '/me');
    return res.ok;
  } catch {
    return false;
  }
}

// Convenience: GET an admin endpoint and parse JSON (returns fallback on failure).
export async function adminJson(cookieHeader, path, fallback = null) {
  try {
    const res = await adminApi(cookieHeader, path);
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

// Parse the admin_session value out of an API Set-Cookie header.
export function sessionFromSetCookie(setCookie) {
  const m = setCookie && setCookie.match(/admin_session=([^;]+)/);
  return m ? m[1] : null;
}

export const API_BASE = BASE;
