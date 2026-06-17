import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';

export async function load({ request, url }) {
  const onLogin = url.pathname === '/admin/login';
  const authed = await isAuthed(request.headers.get('cookie'));
  if (!authed && !onLogin) throw redirect(303, '/admin/login');
  return { authed };
}
