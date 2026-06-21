// Server-only. Optional Cloudflare AI Search (RAG) layer behind the "/ask" feature.
//
// Config + usage + ask-log live in a small embedded SQLite DB on the WEB tier
// (node:sqlite, built in to Node 22.5+), never in the public API — so the API
// token is never exposed. Admin → AI Search edits the config; env vars are a
// fallback when nothing is stored yet. If node:sqlite is unavailable, we degrade
// to an in-memory store rather than crash the site.
//
// Budget protection: per-query result cache + monthly soft cap. Only ever called
// on an explicit human "Ask" (never typeahead, never the agent/WebMCP tool).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DATA_DIR = process.env.ASK_DATA_DIR || join(process.cwd(), '.data');
const DB_FILE = join(DATA_DIR, 'aisearch.db');

let db = null;
let mem = null; // in-memory fallback when node:sqlite is unavailable
function init() {
  if (db || mem) return;
  try {
    const { DatabaseSync } = require('node:sqlite');
    mkdirSync(DATA_DIR, { recursive: true });
    db = new DatabaseSync(DB_FILE);
    db.exec(
      `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
       CREATE TABLE IF NOT EXISTS usage (month TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
       CREATE TABLE IF NOT EXISTS asks (qkey TEXT PRIMARY KEY, q TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0);`
    );
  } catch {
    mem = { config: {}, usage: { month: monthKey(), count: 0 }, asks: new Map() };
  }
}

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

// ── config store
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
  if (db)
    db.prepare(
      'INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
    ).run(k, String(v));
  else mem.config[k] = String(v);
}

let cfgCache = null;
let cfgAt = 0;
function getConfig() {
  if (cfgCache && Date.now() - cfgAt < 5000) return cfgCache;
  const f = readConfigRows();
  const pick = (key, env) => (f[key] !== undefined ? f[key] : env || '');
  const accountId = pick('accountId', process.env.CF_ACCOUNT_ID);
  const name = pick('name', process.env.CF_AISEARCH_NAME);
  const token = pick('token', process.env.CF_API_TOKEN);
  const monthlyCap =
    Number(f.monthlyCap !== undefined ? f.monthlyCap : process.env.CF_AISEARCH_MONTHLY_CAP ?? 18000) || 18000;
  const hasCreds = !!(accountId && name && token);
  const enabled = f.enabled !== undefined ? f.enabled === '1' : hasCreds;
  // generate=false → /search (retrieval only, free). generate=true → chat/completions
  // (RAG written answer, uses Workers AI which is billed separately). Default off.
  const generate = f.generate === '1';
  cfgCache = { accountId, name, token, monthlyCap, hasCreds, enabled, generate };
  cfgAt = Date.now();
  return cfgCache;
}

export function isAskEnabled() {
  const c = getConfig();
  return c.enabled && c.hasCreds;
}

export function getConfigMasked() {
  const c = getConfig();
  return {
    enabled: c.enabled,
    accountId: c.accountId,
    name: c.name,
    monthlyCap: c.monthlyCap,
    hasToken: !!c.token,
    tokenHint: c.token ? `••••${c.token.slice(-4)}` : '',
    hasCreds: c.hasCreds,
    generate: c.generate
  };
}

export function setConfig(partial) {
  if (partial.accountId !== undefined) writeConfigKV('accountId', String(partial.accountId).trim());
  if (partial.name !== undefined) writeConfigKV('name', String(partial.name).trim());
  if (partial.monthlyCap !== undefined && partial.monthlyCap !== '')
    writeConfigKV('monthlyCap', String(Number(partial.monthlyCap) || 18000));
  if (partial.enabled !== undefined) writeConfigKV('enabled', partial.enabled ? '1' : '0');
  if (partial.generate !== undefined) writeConfigKV('generate', partial.generate ? '1' : '0');
  if (partial.token) writeConfigKV('token', String(partial.token).trim()); // blank = keep existing
  cfgCache = null;
  return true;
}

// ── usage + ask log
function usedThisMonth() {
  init();
  const m = monthKey();
  if (db) {
    const r = db.prepare('SELECT count FROM usage WHERE month=?').get(m);
    return r ? r.count : 0;
  }
  if (mem.usage.month !== m) mem.usage = { month: m, count: 0 };
  return mem.usage.count;
}
function bumpUsage() {
  init();
  const m = monthKey();
  if (db)
    db.prepare(
      'INSERT INTO usage(month,count) VALUES(?,1) ON CONFLICT(month) DO UPDATE SET count=count+1'
    ).run(m);
  else {
    if (mem.usage.month !== m) mem.usage = { month: m, count: 0 };
    mem.usage.count++;
  }
}
function logAsk(query) {
  init();
  const q = query.trim().slice(0, 120);
  if (!q) return;
  const qkey = q.toLowerCase();
  if (db)
    db.prepare(
      'INSERT INTO asks(qkey,q,n) VALUES(?,?,1) ON CONFLICT(qkey) DO UPDATE SET n=n+1'
    ).run(qkey, q);
  else {
    const e = mem.asks.get(qkey) || { q, n: 0 };
    e.n++;
    mem.asks.set(qkey, e);
  }
}

export function askStatus() {
  const c = getConfig();
  const used = usedThisMonth();
  return {
    enabled: c.enabled && c.hasCreds,
    configured: c.hasCreds,
    used,
    cap: c.monthlyCap,
    remaining: Math.max(0, c.monthlyCap - used),
    month: monthKey()
  };
}
export function topAsks(limit = 20) {
  init();
  if (db)
    return db.prepare('SELECT q, n FROM asks ORDER BY n DESC LIMIT ?').all(limit).map((r) => ({ query: r.q, count: r.n }));
  return [...mem.asks.values()].sort((a, b) => b.n - a.n).slice(0, limit).map((e) => ({ query: e.q, count: e.n }));
}

// ── in-memory result cache (cuts repeat-query spend)
const CACHE_TTL = 1000 * 60 * 60 * 24;
const CACHE_MAX = 500;
const cache = new Map();
function cacheGet(k) {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL) {
    cache.delete(k);
    return null;
  }
  cache.delete(k);
  cache.set(k, e);
  return e.data;
}
function cacheSet(k, data) {
  cache.set(k, { at: Date.now(), data });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

// Map an ingested file key to a site URL. Handles the path style produced by
// ingesting the guides/ tree (slug/NN-title.md, slug/_guide.md) as well as the
// slug__N.md and slug.md conventions.
function keyToUrl(key) {
  let s = String(key || '').trim().replace(/^\.?\//, '').replace(/\.md$/i, '');
  if (!s) return null;
  let m = s.match(/^(.+)__(\d+)$/);
  if (m) return `/guides/${m[1]}/${parseInt(m[2], 10)}`;
  const parts = s.split('/');
  const slug = parts[0];
  const file = parts.slice(1).join('/');
  if (!file || /^_guide$/i.test(file)) return `/guides/${slug}`;
  const pm = file.match(/^(\d+)/);
  if (pm) return `/guides/${slug}/${parseInt(pm[1], 10)}`;
  return `/guides/${slug}`;
}

function keyToSource(key, titleMap) {
  const url = keyToUrl(key) || '/';
  const um = url.match(/^\/guides\/([^/]+)(?:\/(\d+))?/);
  const slug = um ? um[1] : '';
  const phase = um && um[2] ? um[2] : null;
  return { slug, phase, url, title: (titleMap && titleMap[slug]) || slug.replace(/-/g, ' ') };
}

// Rewrite inline markdown links whose target is an ingest .md key into site URLs.
function rewriteAnswerLinks(md) {
  return String(md || '').replace(/\]\(([^)\s]+\.md)\)/gi, (whole, target) => {
    const u = keyToUrl(target);
    return u ? `](${u})` : whole;
  });
}

// Turn a raw markdown chunk (which may start with YAML frontmatter and contain
// markdown syntax) into clean, readable plain text for a search-result card.
function cleanSnippet(text) {
  let t = String(text || '').replace(/\r\n/g, '\n');
  t = t.replace(/^\uFEFF?\s*---\n[\s\S]*?\n---\s*/, ''); // leading frontmatter
  t = t
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > 360) t = t.slice(0, 360).replace(/\s+\S*$/, '') + '…';
  return t;
}

export async function ask(query, { titleMap } = {}) {
  const c = getConfig();
  if (!(c.enabled && c.hasCreds)) return { enabled: false };
  const key = (c.generate ? 'a:' : 's:') + query.trim().toLowerCase();
  if (!key) return { enabled: true, answer: '', sources: [] };

  const cached = cacheGet(key);
  if (cached) {
    logAsk(query);
    return { ...cached, cached: true };
  }
  if (usedThisMonth() >= c.monthlyCap) {
    logAsk(query);
    return { enabled: true, capReached: true };
  }

  const sub = c.generate ? 'chat/completions' : 'search';
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${c.accountId}/ai-search/instances/${c.name}/${sub}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${c.token}` },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
        ai_search_options: { retrieval: { max_num_results: 8 } }
      })
    });
  } catch (e) {
    console.error('[aisearch] network error calling Cloudflare:', e?.message || e);
    return { enabled: true, error: 'network' };
  }
  logAsk(query);
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 400);
    } catch {}
    console.error(`[aisearch] Cloudflare returned ${res.status} for accounts/${c.accountId}/ai-search/instances/${c.name}: ${detail}`);
    return { enabled: true, error: `upstream_${res.status}` };
  }
  bumpUsage(); // only count successful queries against the monthly budget

  const j = await res.json().catch(() => null);

  // chat/completions returns chunks at top level; /search nests them under result.
  const chunks = (c.generate ? j?.chunks : j?.result?.chunks) || [];
  const seen = new Set();
  const sources = [];
  for (const ch of chunks) {
    const k = ch?.item?.key;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    sources.push(keyToSource(k, titleMap));
  }

  let data;
  if (c.generate) {
    const answer = rewriteAnswerLinks(j?.choices?.[0]?.message?.content || '');
    data = { enabled: true, mode: 'answer', answer, sources: sources.slice(0, 6) };
  } else {
    const results = chunks
      .map((ch) => ({ text: cleanSnippet(ch?.text), ...keyToSource(ch?.item?.key, titleMap) }))
      .filter((r) => r.text)
      .slice(0, 6);
    data = { enabled: true, mode: 'search', results, sources: sources.slice(0, 6) };
  }
  cacheSet(key, data);
  return data;
}
