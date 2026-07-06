import { json } from '@sveltejs/kit';
import { removeSubscription } from '$lib/server/push.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const endpoint = String(body.endpoint || '');
  if (endpoint) removeSubscription(endpoint);
  return json({ ok: true });
}
