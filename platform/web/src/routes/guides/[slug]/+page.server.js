import { error, redirect } from '@sveltejs/kit';
import { getGuide } from '$lib/api.js';

export async function load({ fetch, params }) {
  const detail = await getGuide(fetch, params.slug);
  if (!detail) throw error(404, 'Guide not found');
  // Practice modules live under /practice, not the reader - old links and search
  // results still point here, so bounce them to the canonical URL.
  if (detail.guide?.category === 'practice') {
    throw redirect(302, `/practice/${params.slug.replace(/^practice-/, '')}`);
  }
  return detail; // { guide, phases }
}
