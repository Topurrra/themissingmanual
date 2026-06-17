import { listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const guides = await listGuides(fetch);
  return { guides: guides ?? [] };
}
