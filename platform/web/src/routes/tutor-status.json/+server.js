import { json } from '@sveltejs/kit';
import { tutorStatus } from '$lib/server/tutor.js';
import { guardJne } from '$lib/server/jneGuard.js';

// Pre-flight for JNE's Learn dock: is the shared tutor on, and how much shared
// monthly quota is left. Deliberately narrow - no cap/used/provider details.
// no-store: `remaining` is a live budget; caching it would show a stale number.
export async function GET(event) {
  const blocked = guardJne(event, { requireKey: true, max: 60 });
  if (blocked) return blocked;

  const s = tutorStatus();
  return json(
    { enabled: s.enabled, remaining: s.remaining },
    { headers: { 'cache-control': 'no-store' } }
  );
}
