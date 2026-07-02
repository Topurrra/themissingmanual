// Local skill map / roadmap data layer - pure, read-only derivations of data the
// site already fetches (guides + categories from the API) and localStorage it
// already writes elsewhere (Quiz.svelte, Exercise.svelte, the paths wizard, srs.js).
// No new backend endpoint, no accounts: this only reads what's already there.
import { loadState as loadSrsState, allCards } from '$lib/srs.js';

const DONE_KEY = 'tmm-path-done';
const PORTABLE_KEY_RE = /^tmm-(quiz|exercise):/;

function readDone() {
  try {
    const d = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
    return new Set(Array.isArray(d) ? d : []);
  } catch (e) {
    return new Set();
  }
}

// One pass over every localStorage key, bucketing "this guide has at least one
// attempted quiz or exercise" - avoids needing to know a guide's phase count.
function readStarted() {
  const started = new Set();
  if (typeof localStorage === 'undefined') return started;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const m = k && k.match(/^tmm-(?:quiz|exercise):([^/]+)\//);
    if (m) started.add(m[1]);
  }
  return started;
}

// slug -> 'done' | 'started' | 'new'. Done comes from tmm-path-done (written by a
// perfect quiz score OR a manual tick on /paths - already the site's one general
// "I finished this guide" signal). Started is "touched but not finished."
export function guideStatuses(guides) {
  const done = readDone();
  const started = readStarted();
  const out = {};
  for (const g of guides || []) {
    out[g.slug] = done.has(g.slug) ? 'done' : started.has(g.slug) ? 'started' : 'new';
  }
  return out;
}

// One category's rollup against its own guide list.
export function categoryMastery(categorySlug, guides, statuses) {
  const inCat = (guides || []).filter((g) => g.category === categorySlug);
  const total = inCat.length;
  let done = 0;
  let started = 0;
  for (const g of inCat) {
    const s = statuses[g.slug];
    if (s === 'done') done++;
    else if (s === 'started') started++;
  }
  return { done, started, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Per-guide spaced-review health: how many enrolled cards, how many due now.
// Layered on top of done/started as a lighter "are you retaining this" signal.
export function reviewDueByGuide() {
  const state = loadSrsState();
  const now = Date.now();
  const out = {};
  for (const c of allCards()) {
    const st = state[c.id];
    if (!st) continue;
    const bucket = (out[c.guide] ||= { enrolled: 0, due: 0 });
    bucket.enrolled++;
    if (st.due <= now) bucket.due++;
  }
  return out;
}

// Portable progress file: every done/started/review signal, bundled for download
// and re-import - moves progress between browsers with no account.
export function exportSkillState() {
  const bundle = {};
  if (typeof localStorage === 'undefined') return bundle;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === DONE_KEY || k === 'tmm-srs' || PORTABLE_KEY_RE.test(k)) bundle[k] = localStorage.getItem(k);
  }
  return bundle;
}
export function importSkillState(bundle) {
  if (!bundle || typeof bundle !== 'object') return false;
  for (const [k, v] of Object.entries(bundle)) {
    if (k === DONE_KEY || k === 'tmm-srs' || PORTABLE_KEY_RE.test(k)) {
      try { localStorage.setItem(k, v); } catch (e) {}
    }
  }
  return true;
}
