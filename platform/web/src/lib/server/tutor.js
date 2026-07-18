// Server-only. AI tutor: config + secrets + budget live in a small embedded
// SQLite DB on the WEB tier (node:sqlite), same pattern as aisearch.js - never
// in the public API, so provider keys are never exposed. Admin -> Tutor edits
// the config; env vars are a fallback when nothing is stored yet.
//
// Grounding strategy (deliberately not RAG): the current phase's own markdown
// is injected directly as context, since the tutor always knows exactly which
// phase it's answering for. The one search_guides tool below covers the
// cross-guide case, reusing the site's existing Tantivy search - no vector DB.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { CLOUD, routeChat, callProvider } from './providers.js';
import { search } from '$lib/api.js';

const require = createRequire(import.meta.url);
const PROVIDER_IDS = Object.keys(CLOUD);
const DEFAULT_ORDER = ['cerebras', 'groq', 'mistral', 'openrouter', 'uncloseai', 'ollamacloud'];
const DEFAULT_COOLDOWN_SEC = 60;
const LOG_MAX = 500;

const DATA_DIR = process.env.TUTOR_DATA_DIR || process.env.ASK_DATA_DIR || join(process.cwd(), '.data');
const DB_FILE = join(DATA_DIR, 'tutor.db');

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
       CREATE TABLE IF NOT EXISTS usage (month TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
       CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, guide_slug TEXT, phase_no INTEGER, question TEXT, answer TEXT, provider TEXT, ok INTEGER NOT NULL);`
    );
    // Additive column for reader thumbs up/down - guarded because SQLite has no
    // "ADD COLUMN IF NOT EXISTS" and this runs against DBs from before the column existed.
    try { db.exec('ALTER TABLE logs ADD COLUMN rating TEXT'); } catch {}
  } catch {
    mem = { config: {}, usage: { month: monthKey(), count: 0 }, logs: [], nextLogId: 1 };
  }
}

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

// Number(x) || fallback breaks for a legitimate 0 (e.g. "pause via cap"),
// since 0 is falsy - this treats any non-finite result as "unset" instead.
function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readConfigRows() {
  init();
  if (db) {
    const out = {};
    for (const r of db.prepare('SELECT key, value FROM config').all()) out[r.key] = r.value;
    return out;
  }
  return mem.config;
}
function writeConfigKV(k, v) {
  init();
  if (db) db.prepare('INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));
  else mem.config[k] = String(v);
}

let cfgCache = null;
let cfgAt = 0;
function getConfig() {
  if (cfgCache && Date.now() - cfgAt < 5000) return cfgCache;
  const f = readConfigRows();
  const pick = (key, env) => (f[key] !== undefined ? f[key] : env || '');

  const providers = {};
  for (const id of PROVIDER_IDS) {
    const envPrefix = id.toUpperCase();
    const noKey = !!CLOUD[id].noKeyRequired;
    let apiKey = pick(`${id}Key`, process.env[`${envPrefix}_API_KEY`]);
    if (noKey && !apiKey) apiKey = 'not-required'; // uncloseai etc. accept any value as the key
    providers[id] = {
      enabled: f[`${id}Enabled`] !== undefined ? f[`${id}Enabled`] === '1' : !!process.env[`${envPrefix}_API_KEY`],
      apiKey,
      model: pick(`${id}Model`, process.env[`${envPrefix}_MODEL`]) || CLOUD[id].defaultModel
    };
  }
  let providerOrder = DEFAULT_ORDER;
  try { if (f.providerOrder) providerOrder = JSON.parse(f.providerOrder); } catch {}
  providerOrder = providerOrder.filter((id) => PROVIDER_IDS.includes(id));
  for (const id of PROVIDER_IDS) if (!providerOrder.includes(id)) providerOrder.push(id);

  const monthlyCap = numOr(f.monthlyCap !== undefined ? f.monthlyCap : process.env.TUTOR_MONTHLY_CAP, 2000);
  const cooldownSec = numOr(f.cooldownSec !== undefined ? f.cooldownSec : DEFAULT_COOLDOWN_SEC, DEFAULT_COOLDOWN_SEC);
  const routingMode = f.routingMode === 'roundrobin' ? 'roundrobin' : 'priority';
  const systemPrompt = f.systemPrompt || '';
  const hasAnyKey = PROVIDER_IDS.some((id) => providers[id].enabled && providers[id].apiKey);
  const enabled = (f.enabled !== undefined ? f.enabled === '1' : hasAnyKey) && hasAnyKey;

  cfgCache = { providers, providerOrder, monthlyCap, cooldownSec, routingMode, systemPrompt, enabled, hasAnyKey };
  cfgAt = Date.now();
  return cfgCache;
}

export function isTutorEnabled() {
  return getConfig().enabled;
}

export function getConfigMasked() {
  const c = getConfig();
  const providers = {};
  for (const id of PROVIDER_IDS) {
    const p = c.providers[id];
    const noKeyRequired = !!CLOUD[id].noKeyRequired;
    providers[id] = {
      name: CLOUD[id].name,
      note: CLOUD[id].note,
      keysUrl: CLOUD[id].keysUrl,
      noKeyRequired,
      enabled: p.enabled,
      model: p.model,
      hasKey: !noKeyRequired && !!p.apiKey,
      keyHint: !noKeyRequired && p.apiKey ? `••••${p.apiKey.slice(-4)}` : ''
    };
  }
  return {
    enabled: c.enabled,
    monthlyCap: c.monthlyCap,
    cooldownSec: c.cooldownSec,
    routingMode: c.routingMode,
    systemPrompt: c.systemPrompt,
    defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
    providerOrder: c.providerOrder,
    providers
  };
}

// Narrow accessor for the models.json endpoint - returns just one provider's
// own creds, not the whole config (so that endpoint can't leak other keys).
export function getProviderCreds(id) {
  const p = getConfig().providers[id];
  return p ? { apiKey: p.apiKey, model: p.model } : null;
}

export function setConfig(partial) {
  if (partial.enabled !== undefined) writeConfigKV('enabled', partial.enabled ? '1' : '0');
  if (partial.monthlyCap !== undefined && partial.monthlyCap !== '') writeConfigKV('monthlyCap', String(numOr(partial.monthlyCap, 2000)));
  if (partial.cooldownSec !== undefined && partial.cooldownSec !== '') writeConfigKV('cooldownSec', String(numOr(partial.cooldownSec, DEFAULT_COOLDOWN_SEC)));
  if (partial.routingMode !== undefined) writeConfigKV('routingMode', partial.routingMode === 'roundrobin' ? 'roundrobin' : 'priority');
  if (partial.systemPrompt !== undefined) writeConfigKV('systemPrompt', partial.systemPrompt); // '' = fall back to the built-in default
  if (partial.providerOrder) writeConfigKV('providerOrder', JSON.stringify(partial.providerOrder.filter((id) => PROVIDER_IDS.includes(id))));
  for (const id of PROVIDER_IDS) {
    const p = partial.providers?.[id];
    if (!p) continue;
    if (p.enabled !== undefined) writeConfigKV(`${id}Enabled`, p.enabled ? '1' : '0');
    if (p.model !== undefined && p.model !== '') writeConfigKV(`${id}Model`, p.model);
    if (p.apiKey) writeConfigKV(`${id}Key`, p.apiKey); // blank = keep existing
  }
  cfgCache = null;
  return true;
}

function usedThisMonth() {
  init();
  const m = monthKey();
  if (db) { const r = db.prepare('SELECT count FROM usage WHERE month=?').get(m); return r ? r.count : 0; }
  if (mem.usage.month !== m) mem.usage = { month: m, count: 0 };
  return mem.usage.count;
}
function bumpUsage() {
  init();
  const m = monthKey();
  if (db) db.prepare('INSERT INTO usage(month,count) VALUES(?,1) ON CONFLICT(month) DO UPDATE SET count=count+1').run(m);
  else { if (mem.usage.month !== m) mem.usage = { month: m, count: 0 }; mem.usage.count++; }
}

export function tutorStatus() {
  const c = getConfig();
  const used = usedThisMonth();
  return { enabled: c.enabled, used, cap: c.monthlyCap, remaining: Math.max(0, c.monthlyCap - used), month: monthKey() };
}

// ── usage log: every real tutorAsk() attempt (success or failure), for the
// admin "Recent activity" view. Capped at LOG_MAX rows - this is an activity
// feed for debugging/auditing, not a permanent analytics store.
// Returns the new row's id, so a successful answer can be rated later (see
// rateLog) - the client gets this id back from tutorAsk() as `logId`.
function logEvent({ guideSlug, phaseNo, question, answer, provider, ok }) {
  init();
  const row = {
    ts: Date.now(),
    guideSlug: guideSlug || '',
    phaseNo: phaseNo ?? null,
    question: String(question || '').slice(0, 2000),
    answer: String(answer || '').slice(0, 4000),
    provider: provider || '',
    ok: !!ok
  };
  if (db) {
    const info = db.prepare('INSERT INTO logs(ts,guide_slug,phase_no,question,answer,provider,ok) VALUES(?,?,?,?,?,?,?)')
      .run(row.ts, row.guideSlug, row.phaseNo, row.question, row.answer, row.provider, row.ok ? 1 : 0);
    db.prepare('DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)').run(LOG_MAX);
    return Number(info.lastInsertRowid);
  }
  row.id = mem.nextLogId++;
  mem.logs.unshift(row);
  if (mem.logs.length > LOG_MAX) mem.logs.length = LOG_MAX;
  return row.id;
}

export function recentLogs(limit = 50) {
  init();
  if (db) {
    return db.prepare('SELECT id, ts, guide_slug AS guideSlug, phase_no AS phaseNo, question, answer, provider, ok, rating FROM logs ORDER BY id DESC LIMIT ?')
      .all(limit)
      .map((r) => ({ ...r, ok: !!r.ok }));
  }
  return mem.logs.slice(0, limit);
}

// Reader thumbs up/down on a past answer - a cheap quality signal surfaced in
// admin's Recent activity, no new infra. rating is 'up' | 'down' | null (clears it).
export function rateLog(id, rating) {
  init();
  const val = rating === 'up' || rating === 'down' ? rating : null;
  if (db) {
    const info = db.prepare('UPDATE logs SET rating=? WHERE id=?').run(val, id);
    return info.changes > 0;
  }
  const row = mem.logs.find((r) => r.id === id);
  if (!row) return false;
  row.rating = val;
  return true;
}

// ── the one tool: search this site's own guides, for cross-guide questions
// the current phase's content doesn't cover. Reuses the existing Tantivy
// search - no separate index, no embeddings.
const SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_guides',
    description: "Search The Missing Manual's own guide library for pages related to a topic. Use this only when the lesson you were given doesn't cover something the student asked about.",
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'A short search query, 2-6 words.' } },
      required: ['query']
    }
  }
};
// `cited`, when passed, collects {slug, phaseNo, title} for every guide the tool
// actually surfaced to the model - the caller reads it back after the call
// completes to show the reader which guides the answer drew on.
function makeSearchExecutor(fetch, cited) {
  return async (name, args) => {
    if (name !== 'search_guides') return 'Unknown tool.';
    const hits = (await search(fetch, String(args?.query || '')).catch(() => [])) || [];
    if (!hits.length) return 'No matching guides found.';
    const top = hits.slice(0, 5);
    if (cited) for (const h of top) cited.push({ slug: h.guide_slug, phaseNo: h.phase_no, title: h.title });
    return top.map((h) => `- "${h.title}" (${h.summary}) -> /guides/${h.guide_slug}/${h.phase_no}`).join('\n');
  };
}

const DEFAULT_SYSTEM_PROMPT = `You are the tutor for The Missing Manual, a free developer knowledge library. A student is
reading one specific lesson and asked you a question about it.

Answer using the lesson text you were given as ground truth. Explain like a human, the way the
site itself is written: clear, concrete, example-driven, no hand-waving, no unnecessary jargon.
Default to a focused answer (a few sentences to a short paragraph); if the student asks to go
deeper or for more examples, do.

When the student got something WRONG (a wrong quiz choice, a failed exercise, or code with a bug
they're asking about), don't open with the correct answer. First ask yourself what misconception
would produce exactly that wrong answer, then lead with ONE short pointed question that makes the
student confront it, referencing their actual answer or output ("You picked X - what would X do
if...?"). Then give the explanation. One leading question, not a drawn-out interrogation; if the
student asks again or seems stuck, answer directly.

Also check whether the mistake really belongs to an EARLIER concept than this lesson (a wrong
answer about closures that is really about scope, a SQL join mistake that is really about NULL).
If it does, say so plainly and use search_guides to point them at the guide phase that covers that
foundation - filling the earlier gap beats re-explaining the current lesson.

Stay scoped to software/tech education. If asked something unrelated, or to do something harmful,
decline briefly and steer back to the lesson. If the lesson doesn't cover what's being asked, you
may call search_guides to check the rest of the site before answering - don't invent facts about
guides you haven't seen.`;

// The lesson is re-injected fresh every call (the server re-fetches it via
// getPhase() each time, so this is always cheap and always correct) as its
// own turn, followed by a synthetic ack - not folded into the question - so
// that multi-turn `history` (plain Q/A pairs from earlier in the same
// conversation) slots in after it without ever needing to carry the lesson
// text itself. Works identically for a single question (history = []) and a
// running conversation (history = prior turns).
function buildMessages({ question, phaseTitle, phaseMarkdown, history, systemPrompt }) {
  const lessonMsg = { role: 'user', content: `Lesson: "${phaseTitle}"\n\n"""\n${phaseMarkdown}\n"""\n\nI'll ask questions about this lesson. Wait for my question before answering.` };
  const ackMsg = { role: 'assistant', content: 'Understood - ask away.' };
  return [{ role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT }, lessonMsg, ackMsg, ...(history || []), { role: 'user', content: question }];
}

const CACHE_TTL = 1000 * 60 * 60;
const CACHE_MAX = 300;
const cache = new Map();
function cacheKey(slug, phase, question) { return `${slug}/${phase}:${question.trim().toLowerCase()}`; }
function cacheGet(k) {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL) { cache.delete(k); return null; }
  cache.delete(k); cache.set(k, e);
  return e.data;
}
function cacheSet(k, data) {
  cache.set(k, { at: Date.now(), data });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

// Per-IP sliding window (in-memory). The global monthlyCap protects the total
// budget; this stops one reader from eating a disproportionate share of it.
// Checked after the cache, so repeat/common questions stay free and unlimited.
// ponytail: in-memory per process - resets on restart, which is fine here.
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 15; // provider-backed questions per IP per window
const rlHits = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const arr = (rlHits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { rlHits.set(ip, arr); return true; }
  arr.push(now);
  rlHits.set(ip, arr);
  if (rlHits.size > 5000) rlHits.delete(rlHits.keys().next().value); // memory cap
  return false;
}

export async function tutorAsk({ fetch, guideSlug, phaseNo, phaseTitle, phaseMarkdown, question, history, ip }) {
  const c = getConfig();
  if (!c.enabled) return { enabled: false };

  // A running conversation is never cached - each turn depends on everything
  // before it, so only a fresh, context-free first question is cacheable.
  const useCache = !history || !history.length;
  const key = cacheKey(guideSlug, phaseNo, question);
  if (useCache) {
    const cached = cacheGet(key);
    if (cached) return { ...cached, cached: true };
  }

  if (rateLimited(ip)) return { enabled: true, rateLimited: true };
  if (usedThisMonth() >= c.monthlyCap) return { enabled: true, capReached: true };

  const providerList = c.providerOrder
    .map((id) => ({ id, ...c.providers[id] }))
    .filter((p) => p.enabled && p.apiKey);
  if (!providerList.length) return { enabled: true, error: 'no_providers_configured' };

  const messages = buildMessages({ question, phaseTitle, phaseMarkdown, history, systemPrompt: c.systemPrompt });
  const cited = [];
  let result;
  try {
    result = await routeChat(providerList, messages, {
      tools: [SEARCH_TOOL],
      execTool: makeSearchExecutor(fetch, cited),
      cooldownMs: c.cooldownSec * 1000,
      mode: c.routingMode
    });
  } catch (e) {
    logEvent({ guideSlug, phaseNo, question, answer: '', provider: (e.attempted || []).map((a) => a.id).join(', '), ok: false });
    return { enabled: true, error: 'all_providers_failed', attempted: e.attempted };
  }
  bumpUsage();
  const logId = logEvent({ guideSlug, phaseNo, question, answer: result.content, provider: result.providerUsed, ok: true });

  // Dedupe by slug+phase - the model can call search_guides more than once.
  const seen = new Set();
  const referenced = cited.filter((g) => {
    const k = `${g.slug}/${g.phaseNo}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const data = { enabled: true, answer: result.content, providerUsed: result.providerUsed, logId, referenced };
  if (useCache) cacheSet(key, data);
  return data;
}

// Used by the admin Compare view: run one explicit provider+model directly
// (bypasses routing/failover/order entirely - Compare picks exactly which
// provider and model to test, independent of what's live for readers), no
// budget/cache/log bookkeeping. Mirrors LocalAIs's Compare: two independent
// slots, each calling this once, run in parallel by the caller.
export async function tutorCompareOne({ fetch, provider, model, prompt }) {
  const c = getConfig();
  const p = c.providers[provider];
  if (!p?.apiKey) throw new Error('No key configured for this provider.');
  const messages = [{ role: 'system', content: c.systemPrompt || DEFAULT_SYSTEM_PROMPT }, { role: 'user', content: prompt }];
  const r = await callProvider(provider, p.apiKey, messages, { model: model || p.model, tools: [SEARCH_TOOL], execTool: makeSearchExecutor(fetch) });
  return { content: r.content };
}
