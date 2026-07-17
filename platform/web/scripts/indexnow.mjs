#!/usr/bin/env node
// Notify IndexNow about changed URLs.
//
// IndexNow does NOT accept sitemaps - only URL lists (max 10,000 per POST). So this
// reads our own /sitemap.xml and pushes the URLs from it. Submitting to one endpoint
// is enough: the spec requires the receiving engine to propagate to every other
// participant within ~10 seconds.
//
// Participants: Bing, Yandex, Seznam, Naver, Yep. NOT Google (it never adopted the
// protocol). The reason this is worth running is Bing - it gates ChatGPT's search,
// so fast Bing indexing feeds AI answer engines.
//
// The protocol says to submit when content is added/updated/deleted. Do NOT re-submit
// the whole site on every deploy: that earns 429s and dilutes the signal. Hence the
// default is "URLs whose <lastmod> is today"; --all is for the one-time seed.
//
// Usage (from platform/web):
//   node scripts/indexnow.mjs --all --dry-run   # inspect the seed list first
//   node scripts/indexnow.mjs --all             # ONE-TIME: seed every URL
//   node scripts/indexnow.mjs                   # after a deploy: today's changes
//   node scripts/indexnow.mjs --since=2026-07-01
//   node scripts/indexnow.mjs --host=https://themissingmanual.dev
//
// The key file (static/<key>.txt) must already be LIVE on the host, or IndexNow
// returns 403 - deploy before the first submit.

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DIR = join(ROOT, 'static');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000; // protocol cap per POST
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const opt = (n, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : dflt;
};

const host = opt('host', process.env.SITE_URL || 'https://themissingmanual.dev').replace(/\/+$/, '');
const dryRun = has('dry-run');
const today = new Date().toISOString().slice(0, 10);

// static/<key>.txt containing <key> is the single source of truth for the key, so the
// hosted file and the submission can never disagree.
async function findKey() {
  for (const f of await readdir(STATIC_DIR)) {
    if (!f.endsWith('.txt')) continue;
    const key = f.slice(0, -4);
    if (!KEY_RE.test(key)) continue;
    const body = (await readFile(join(STATIC_DIR, f), 'utf8')).trim();
    if (body === key) return key;
  }
  return null;
}

async function sitemapEntries() {
  const res = await fetch(`${host}/sitemap.xml`);
  if (!res.ok) throw new Error(`GET ${host}/sitemap.xml -> ${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) {
    out.push({ loc: m[1].trim(), lastmod: m[2]?.trim() || null });
  }
  return out;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// IndexNow's status codes are meaningful; a bare "it returned 4xx" wastes debugging.
function explain(status) {
  return (
    {
      200: 'OK - URLs received.',
      202: 'Accepted - received, key validation pending.',
      400: 'Bad request - malformed JSON or bad URL format.',
      // The body carries the real reason; the two seen in practice are:
      //  SiteVerificationNotCompleted -> IndexNow has not fetched <key>.txt yet. On a
      //    first-ever submit this is normal: wait and retry. If it persists for hours,
      //    something is blocking THEIR fetch of the key file - check Cloudflare's
      //    Security Events for a bot/WAF challenge on /<key>.txt and add a skip rule.
      //  KeyNotFound / mismatch -> the file really is missing or its contents differ.
      403: 'Forbidden - see errorCode in the body below.',
      422: 'Unprocessable - URLs do not belong to this host, or the key does not match.',
      429: 'Too many requests - you are submitting too often (likely re-submitting unchanged URLs).'
    }[status] || 'Unexpected status.'
  );
}

const key = await findKey();
if (!key) {
  console.error(`No IndexNow key file found in ${STATIC_DIR}.`);
  console.error('Expected a <key>.txt whose contents are exactly <key> (8-128 chars, [A-Za-z0-9-]).');
  process.exit(1);
}

const entries = await sitemapEntries();
let urls;
if (has('all')) {
  urls = entries.map((e) => e.loc);
} else {
  const since = opt('since', today);
  // Static pages carry no <lastmod>, so they only ship with --all. That is correct:
  // they rarely change, and the point of a delta submit is changed content.
  urls = entries.filter((e) => e.lastmod && e.lastmod >= since).map((e) => e.loc);
  console.log(`filter: lastmod >= ${since}`);
}

console.log(`sitemap: ${entries.length} URLs  ->  submitting: ${urls.length}`);
if (!urls.length) {
  console.log('Nothing changed - nothing to submit. (Use --all for the one-time seed.)');
  process.exit(0);
}
if (dryRun) {
  for (const u of urls.slice(0, 20)) console.log('  ' + u);
  if (urls.length > 20) console.log(`  ... and ${urls.length - 20} more`);
  console.log('\n--dry-run: nothing submitted.');
  process.exit(0);
}

const keyLocation = `${host}/${key}.txt`;
for (const batch of chunk(urls, MAX_URLS)) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(host).host, key, keyLocation, urlList: batch })
  });
  console.log(`POST ${batch.length} URLs -> ${res.status} ${explain(res.status)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (body) console.error(body.slice(0, 400));
    process.exit(1);
  }
}
