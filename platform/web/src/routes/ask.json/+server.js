import { json } from '@sveltejs/kit';
import { isAskEnabled, ask } from '$lib/server/aisearch.js';
import { listGuides } from '$lib/api.js';

// slug -> title map, cached so /ask doesn't re-fetch the guide list each time.
let titleMap = null;
let titleAt = 0;
async function getTitleMap(fetch) {
  if (titleMap && Date.now() - titleAt < 3600_000) return titleMap;
  const guides = (await listGuides(fetch)) ?? [];
  titleMap = Object.fromEntries(guides.map((g) => [g.slug, g.title]));
  titleAt = Date.now();
  return titleMap;
}

export async function GET({ url, fetch }) {
  if (!isAskEnabled()) return json({ enabled: false });
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ enabled: true, answer: '', sources: [] });
  if (q.length > 300) return json({ enabled: true, error: 'too_long' }, { status: 400 });
  const map = await getTitleMap(fetch);
  const data = await ask(q, { titleMap: map });
  return json(data);
}
