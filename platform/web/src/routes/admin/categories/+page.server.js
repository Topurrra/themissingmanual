import { adminJson } from '$lib/server/adminApi.js';

export async function load({ request }) {
  const categories = (await adminJson(request.headers.get('cookie'), '/categories', [])) ?? [];
  return { categories };
}
