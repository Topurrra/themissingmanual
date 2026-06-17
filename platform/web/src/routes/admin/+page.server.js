import { adminJson } from '$lib/server/adminApi.js';

export async function load({ request }) {
  const cookie = request.headers.get('cookie');
  const guides = (await adminJson(cookie, '/guides', [])) ?? [];
  const categories = (await adminJson(cookie, '/categories', [])) ?? [];
  const published = guides.filter((g) => g.status === 'published').length;
  return {
    published,
    drafts: guides.length - published,
    categoryCount: categories.length,
    recent: guides.slice(0, 8)
  };
}
