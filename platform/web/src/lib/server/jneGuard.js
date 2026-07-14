// Guard for the JNE-facing JSON endpoints: an access-key check plus a per-IP rate
// limit.
//
// These endpoints are NOT a public API - they're a private integration surface for
// JNE. The shared key (JNE_KEY) lives in a .env on both sides (never in the repo or
// the shipped binary), so requests without it are rejected; JNE sends the same value.
// The rate limit is defense-in-depth on top. Note /search.json is the one exception:
// TMM's own command palette calls it from the browser, so it can't carry a secret
// without exposing it in client JS - it stays key-less and relies on the rate limit.
// The guide CONTENT is separately free via the open routes (markdown negotiation,
// /mcp, guide pages); gating these JSON endpoints just keeps them JNE-only. For heavy
// DDoS, Cloudflare rate-limiting rules are the outer layer; this is the in-app backstop.

const WINDOW_MS = 60_000;
const hits = new Map(); // ip -> number[] (request timestamps in the current window)
let lastSweep = 0;

// Real client IP: Cloudflare (which fronts the site) always sets CF-Connecting-IP
// to the actual visitor; fall back to the adapter's address for local/dev.
function clientIp(event) {
  return event.request.headers.get('cf-connecting-ip') || event.getClientAddress();
}

function rateLimited(ip, max) {
  const now = Date.now();
  // Occasional sweep so the Map doesn't grow unbounded with one-off IPs.
  if (now - lastSweep > WINDOW_MS) {
    for (const [k, arr] of hits) if (!arr.some((t) => now - t < WINDOW_MS)) hits.delete(k);
    lastSweep = now;
  }
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

// Returns a Response to short-circuit with (401/429), or null if the request may proceed.
// requireKey: enforce the shared key when JNE_KEY is set (leave false for endpoints
// TMM's own frontend also calls, e.g. /search.json).
export function guardJne(event, { requireKey = false, max = 60 } = {}) {
  const key = process.env.JNE_KEY;
  if (requireKey && key) {
    if (event.request.headers.get('x-jne-key') !== key) {
      return new Response('unauthorized', { status: 401 });
    }
  }
  if (rateLimited(clientIp(event), max)) {
    return new Response('rate limited', { status: 429, headers: { 'retry-after': '60' } });
  }
  return null;
}
