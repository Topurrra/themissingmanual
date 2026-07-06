import { json } from '@sveltejs/kit';
import { saveSubscription } from '$lib/server/push.js';

// Body: { subscription: PushSubscriptionJSON, nextDue: number|null, dueCount: number }
// Called on opt-in, and again (cheap, fire-and-forget) on later visits so the
// server's record of "when to check back" stays roughly current.
export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  try {
    saveSubscription(body.subscription, { nextDue: body.nextDue, dueCount: body.dueCount });
  } catch (e) {
    return json({ ok: false, error: 'invalid_subscription' }, { status: 400 });
  }
  return json({ ok: true });
}
