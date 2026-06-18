import { listCategories, listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  const nav = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    guides: guides.filter((g) => g.category === c.slug)
  }));
  return { nav };
}
