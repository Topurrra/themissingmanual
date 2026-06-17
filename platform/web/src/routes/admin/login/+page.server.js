import { fail, redirect } from '@sveltejs/kit';
import { adminApi, sessionFromSetCookie } from '$lib/server/adminApi.js';

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password');
    const res = await adminApi('', '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const msg = res.status === 429 ? 'Too many attempts. Wait a moment.' : 'Wrong password.';
      return fail(res.status, { error: msg });
    }
    const id = sessionFromSetCookie(res.headers.get('set-cookie'));
    if (!id) return fail(500, { error: 'No session returned by the API.' });
    cookies.set('admin_session', id, { path: '/', httpOnly: true, sameSite: 'strict' });
    throw redirect(303, '/admin');
  },

  logout: async ({ request, cookies }) => {
    await adminApi(request.headers.get('cookie'), '/logout', { method: 'POST' });
    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin/login');
  }
};
