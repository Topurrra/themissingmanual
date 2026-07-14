import { json } from '@sveltejs/kit';
import { CHEATSHEETS } from '$lib/cheatsheets.js';
import { guardJne } from '$lib/server/jneGuard.js';

// The cheat-sheet data (git, bash, docker, ...) as JSON for JNE's Learn dock -
// the same source of truth the /cheat-sheet page renders. Static, so cache hard.
// `icon` (Tabler class ids) is kept in the payload only so the two clients stay
// in sync at no cost; JNE ignores it or maps its own. Guarded: JNE key + rate limit.
export async function GET(event) {
  const blocked = guardJne(event, { requireKey: true, max: 60 });
  if (blocked) return blocked;

  return json({ sheets: CHEATSHEETS }, { headers: { 'cache-control': 'max-age=86400' } });
}
