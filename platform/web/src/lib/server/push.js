// Server-only. Web Push subscriptions + the "comeback loop" send job.
// No accounts: a push subscription IS the identity (its endpoint is already an
// opaque, unguessable per-browser token from the push service). Same embedded
// node:sqlite pattern as tutor.js/aisearch.js - never touches the public Rust API.
//
// Honesty constraint: spaced-review state (srs.js) lives in the READER'S
// localStorage only, never sent to the server wholesale. The client instead
// reports a small summary (current due count + next-due timestamp) whenever it
// visits, and this store uses that summary to decide when to check back. The
// due count in a sent notification is always the LAST REPORTED number, phrased
// in the past tense ("you had N due") rather than claimed as live - the server
// genuinely doesn't know the live count between visits.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DATA_DIR = process.env.TUTOR_DATA_DIR || process.env.ASK_DATA_DIR || join(process.cwd(), '.data');
const DB_FILE = join(DATA_DIR, 'push.db');

// Don't re-notify a still-due subscriber more than once a day, and don't check
// back forever if a subscriber never revisits to refresh their next_check.
const RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_HORIZON_MS = 30 * 24 * 60 * 60 * 1000;

let db = null;
let mem = null;
function init() {
  if (db || mem) return;
  try {
    const { DatabaseSync } = require('node:sqlite');
    mkdirSync(DATA_DIR, { recursive: true });
    db = new DatabaseSync(DB_FILE);
    db.exec(
      `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
       CREATE TABLE IF NOT EXISTS subs (
         endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
         next_check INTEGER, due_count INTEGER NOT NULL DEFAULT 0,
         last_sent INTEGER, updated INTEGER NOT NULL
       );`
    );
  } catch {
    mem = { config: {}, subs: new Map() };
  }
}

function readConfig(key) {
  init();
  if (db) {
    const r = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return r ? r.value : null;
  }
  return mem.config[key] || null;
}
function writeConfig(key, value) {
  init();
  if (db) db.prepare('INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
  else mem.config[key] = value;
}

// The VAPID keypair identifies this server to push services (not the reader).
// Self-bootstraps on first use so there's no manual key-generation setup step.
let vapidCache = null;
async function vapidKeys() {
  if (vapidCache) return vapidCache;
  init();
  let pub = readConfig('vapid_public');
  let priv = readConfig('vapid_private');
  if (!pub || !priv) {
    const webpush = (await import('web-push')).default;
    const pair = webpush.generateVAPIDKeys();
    pub = pair.publicKey;
    priv = pair.privateKey;
    writeConfig('vapid_public', pub);
    writeConfig('vapid_private', priv);
  }
  vapidCache = { publicKey: pub, privateKey: priv };
  return vapidCache;
}

export async function getPublicKey() {
  return (await vapidKeys()).publicKey;
}

// nextDue: ms epoch of the next card that will become due, or null if nothing
// is enrolled. dueCount: how many are due right now, per the client's own clock.
export function saveSubscription(subscription, { nextDue, dueCount } = {}) {
  init();
  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) throw new Error('invalid subscription');
  const now = Date.now();
  const count = Number.isFinite(dueCount) ? Math.max(0, Math.floor(dueCount)) : 0;
  // Already-due cards: check back soon (short buffer so we don't fire mid-scroll),
  // then the send job's own cooldown prevents daily spam. Nothing due yet: check
  // back exactly when the next card is scheduled to become due. Nothing enrolled
  // at all: don't schedule anything until the reader's next visit reports state.
  let nextCheck = null;
  if (count > 0) nextCheck = now + 15 * 60 * 1000;
  else if (Number.isFinite(nextDue)) nextCheck = Math.min(nextDue, now + MAX_HORIZON_MS);

  if (db) {
    db.prepare(
      `INSERT INTO subs(endpoint, p256dh, auth, next_check, due_count, updated)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh=excluded.p256dh, auth=excluded.auth, next_check=excluded.next_check,
         due_count=excluded.due_count, updated=excluded.updated`
    ).run(endpoint, keys.p256dh, keys.auth, nextCheck, count, now);
  } else {
    const prev = mem.subs.get(endpoint) || {};
    mem.subs.set(endpoint, { ...prev, p256dh: keys.p256dh, auth: keys.auth, next_check: nextCheck, due_count: count, updated: now });
  }
}

export function removeSubscription(endpoint) {
  init();
  if (db) db.prepare('DELETE FROM subs WHERE endpoint = ?').run(endpoint);
  else mem.subs.delete(endpoint);
}

function dueRows(now) {
  init();
  if (db) {
    return db.prepare(
      `SELECT endpoint, p256dh, auth, due_count FROM subs
       WHERE next_check IS NOT NULL AND next_check <= ?
         AND (last_sent IS NULL OR last_sent < ?)`
    ).all(now, now - RESEND_COOLDOWN_MS);
  }
  const out = [];
  for (const [endpoint, s] of mem.subs) {
    if (s.next_check != null && s.next_check <= now && (!s.last_sent || s.last_sent < now - RESEND_COOLDOWN_MS)) {
      out.push({ endpoint, p256dh: s.p256dh, auth: s.auth, due_count: s.due_count });
    }
  }
  return out;
}

function markSent(endpoint, now) {
  if (db) db.prepare('UPDATE subs SET last_sent = ?, next_check = NULL WHERE endpoint = ?').run(now, endpoint);
  else { const s = mem.subs.get(endpoint); if (s) { s.last_sent = now; s.next_check = null; } }
}

// The periodic job: find subscriptions whose check time has arrived, send a
// review reminder, and clear next_check (the reader's next visit re-arms it).
// Safe to call repeatedly - each row only fires once per RESEND_COOLDOWN_MS.
export async function checkAndSend() {
  init();
  const now = Date.now();
  const rows = dueRows(now);
  if (!rows.length) return { sent: 0 };
  const webpush = (await import('web-push')).default;
  const { publicKey, privateKey } = await vapidKeys();
  webpush.setVapidDetails(process.env.SITE_URL || 'https://themissingmanual.dev', publicKey, privateKey);

  let sent = 0;
  for (const row of rows) {
    const body = row.due_count > 0
      ? `You had ${row.due_count} card${row.due_count === 1 ? '' : 's'} waiting for review.`
      : 'Cards are ready for review.';
    const payload = JSON.stringify({ title: 'Time to review', body, url: '/review' });
    const sub = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e) {
      // Gone/expired subscriptions (410/404) will never succeed again - drop them.
      if (e && (e.statusCode === 410 || e.statusCode === 404)) removeSubscription(row.endpoint);
    }
    markSent(row.endpoint, now);
  }
  return { sent };
}
