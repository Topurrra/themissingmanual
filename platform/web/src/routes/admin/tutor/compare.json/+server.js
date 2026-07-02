import { json } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';
import { tutorCompareOne } from '$lib/server/tutor.js';

// Backs the admin Compare view's two independent slots - each slot calls this
// once with its own provider/model, so they can run, time out, and be
// stopped independently (unlike routeChat, there's no failover here: you
// asked for this exact provider+model, so a failure is just reported).
export async function POST({ request, fetch }) {
  if (!(await isAuthed(request.headers.get('cookie')))) return json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const provider = String(body.provider || '');
  const model = String(body.model || '');
  const prompt = String(body.prompt || '').trim();
  if (!provider || !prompt) return json({ ok: false, error: 'bad_request' }, { status: 400 });
  try {
    const r = await tutorCompareOne({ fetch, provider, model, prompt });
    return json({ ok: true, content: r.content });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}
