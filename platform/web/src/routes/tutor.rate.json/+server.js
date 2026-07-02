import { json } from '@sveltejs/kit';
import { rateLog } from '$lib/server/tutor.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isFinite(id)) return json({ ok: false }, { status: 400 });

  const rating = body.rating === 'up' || body.rating === 'down' ? body.rating : null;
  const ok = rateLog(id, rating);
  return json({ ok });
}
