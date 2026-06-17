import { fail, redirect } from '@sveltejs/kit';
import { adminApi, adminJson } from '$lib/server/adminApi.js';

export async function load({ request }) {
  const cookie = request.headers.get('cookie');
  const guides = (await adminJson(cookie, '/guides', [])) ?? [];
  const categories = (await adminJson(cookie, '/categories', [])) ?? [];
  return { guides, categories };
}

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const slug = (data.get('slug') || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) return fail(400, { error: 'A slug is required.' });
    const body = {
      slug,
      title: data.get('title') || slug,
      summary: '',
      category: data.get('category') || '',
      difficulty: data.get('difficulty') || 'beginner'
    };
    const res = await adminApi(request.headers.get('cookie'), '/guides', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return fail(res.status, { error: 'Could not create topic (the slug may already exist).' });
    throw redirect(303, `/admin/content/${slug}`);
  }
};
