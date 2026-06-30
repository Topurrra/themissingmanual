import { listGuides } from '$lib/api.js';

// Beginner-level guide slugs feed the Knowledge game's beginner-mode filter
// (questions restricted to beginner guides the user has finished).
export async function load({ fetch }) {
  // The games need no API; only the Knowledge round's beginner filter uses this.
  // If the API is unreachable, still render the page with an empty list.
  try {
    const guides = (await listGuides(fetch)) ?? [];
    return { beginnerSlugs: guides.filter((g) => g.difficulty === 'beginner').map((g) => g.slug) };
  } catch (e) {
    return { beginnerSlugs: [] };
  }
}
