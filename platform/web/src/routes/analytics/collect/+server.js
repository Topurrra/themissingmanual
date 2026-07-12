import crypto from 'node:crypto';
import { API_BASE } from '$lib/server/adminApi.js';

const SALT = process.env.ANALYTICS_SALT || 'tmm-analytics-salt';

// Receives the browser beacon, derives a daily-rotating visitor hash server-side
// (raw IP/UA never stored), then forwards the event to the API. Fire-and-forget.
export async function POST({ request, getClientAddress, url }) {
  let data = {};
  try {
    data = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 204 });
  }
  const ip = getClientAddress();
  const ua = request.headers.get('user-agent') || '';
  const day = new Date().toISOString().slice(0, 10);
  const visitor = crypto.createHash('sha256').update(day + ip + ua + SALT).digest('hex').slice(0, 32);

  // Coarse device class from the UA (the raw UA is never stored - just this label).
  const ul = ua.toLowerCase();
  const device =
    /ipad|tablet|playbook|silk|kindle/.test(ul) || (/android/.test(ul) && !/mobile/.test(ul))
      ? 'tablet'
      : /mobi|iphone|ipod|windows phone|android.*mobile/.test(ul)
        ? 'mobile'
        : ul
          ? 'desktop'
          : '';

  let referrer = '';
  try {
    if (data.referrer) {
      const r = new URL(data.referrer);
      if (r.host && r.host !== url.host) referrer = r.host;
    }
  } catch {}

  const ALLOWED_KINDS = new Set(['search', 'dwell', 'read', 'vital', 'err']);
  const kind = ALLOWED_KINDS.has(data.kind) ? data.kind : 'pageview';
  const body = {
    kind,
    path: (data.path || '/').slice(0, 512),
    referrer,
    visitor,
    query: (data.query || '').slice(0, 255),
    device,
    source: (data.source || '').slice(0, 64),
    // numeric payload per kind: dwell=engaged ms, search=result count,
    // read=scroll-depth milestone, vital=metric ms; err always 0.
    value: kind === 'err' ? 0 : Math.max(0, Math.round(Number(data.value) || 0))
  };
  try {
    await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {}
  return new Response(null, { status: 204 });
}
