import { listGuides } from '$lib/api.js';

// Beginner-level guide slugs feed the Knowledge game's beginner-mode filter
// (questions restricted to beginner guides the user has finished).
export async function load({ fetch }) {
  const guides = (await listGuides(fetch)) ?? [];
  const beginnerSlugs = guides.filter((g) => g.difficulty === 'beginner').map((g) => g.slug);
  return { beginnerSlugs };
}
