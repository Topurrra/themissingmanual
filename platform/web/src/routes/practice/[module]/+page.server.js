import { error } from '@sveltejs/kit';
import { getPhase } from '$lib/api.js';

export async function load({ fetch, parent, params }) {
  const { modules } = await parent();
  const module = modules.find((m) => m.module === params.module);
  if (!module) throw error(404, 'Module not found');

  // Phase 0 is the guide's overview - no ```lesson fence in it, so its rendered
  // HTML needs no stripping (unlike the per-lesson phases in [phase]/+page.server.js).
  const phase0 = await getPhase(fetch, module.slug, 0);

  return { module, overviewHtml: phase0?.html ?? '' };
}
