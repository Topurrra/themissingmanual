import { json } from '@sveltejs/kit';
import { isTutorEnabled, tutorAsk } from '$lib/server/tutor.js';
import { getPhase } from '$lib/api.js';

export async function POST({ request, fetch }) {
  if (!isTutorEnabled()) return json({ enabled: false });

  const body = await request.json().catch(() => ({}));
  const guideSlug = String(body.guideSlug || '').trim();
  const phaseNo = Number(body.phaseNo);
  const question = String(body.question || '').trim();

  if (!guideSlug || !Number.isFinite(phaseNo)) return json({ enabled: true, error: 'bad_request' }, { status: 400 });
  if (!question) return json({ enabled: true, answer: '' });
  if (question.length > 500) return json({ enabled: true, error: 'too_long' }, { status: 400 });

  const phase = await getPhase(fetch, guideSlug, phaseNo);
  if (!phase) return json({ enabled: true, error: 'phase_not_found' }, { status: 404 });

  // Optional prior turns for a running conversation - capped so a client can't
  // balloon token usage per request with a fabricated history.
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const data = await tutorAsk({
    fetch,
    guideSlug,
    phaseNo,
    phaseTitle: phase.title,
    phaseMarkdown: phase.markdown,
    question,
    history
  });
  return json(data);
}
