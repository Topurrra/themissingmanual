import { error } from '@sveltejs/kit';
import { adminApi, adminJson } from '$lib/server/adminApi.js';

export async function load({ request, params }) {
  const cookie = request.headers.get('cookie');
  const res = await adminApi(cookie, `/guides/${params.slug}`);
  if (!res.ok) throw error(404, 'Guide not found');
  const detail = await res.json(); // { guide, phases }
  const categories = (await adminJson(cookie, '/categories', [])) ?? [];
  return { ...detail, categories };
}
