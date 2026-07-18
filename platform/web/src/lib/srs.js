// Spaced-repetition engine - pure client-side, no server, no accounts.
//
// IMPORTANT: Review only ever contains material you've ACTUALLY finished. A card
// enters the system when its chapter's quiz is completed (see seedChapter), which
// creates its first scheduling entry. Until seeded, a card is invisible here - so
// Review is the "don't forget what you learned" layer, distinct from Train (a game
// you can play over anything). Cards come from the quiz bank + the glossary terms
// that belong to the finished guide. State lives in localStorage.
import { QUIZZES } from '$lib/quizzes.js';
import glossary from '$lib/glossary.json';

const KEY = 'tmm-srs';
const DAY = 86400000;

// Full catalogue of possible cards, each with a stable id + its source guide.
export function allCards() {
  const cards = [];
  for (const [k, arr] of Object.entries(QUIZZES)) {
    const guide = k.split('/')[0];
    arr.forEach((q, i) => cards.push({ id: `q:${k}#${i}`, type: 'quiz', guide, key: k, q }));
  }
  for (const e of glossary) cards.push({ id: `t:${e.slug}`, type: 'term', term: e.term, def: e.def, guide: e.guide });
  return cards;
}

export function loadState() {
  if (typeof localStorage === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
}
export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}

// Called when a chapter's quiz is finished: enrol that phase's quiz questions plus
// the finished guide's glossary terms into spaced review (first due after a delay).
// Idempotent - already-enrolled cards keep their schedule.
export function seedChapter(guide, phase, { now = Date.now(), delayDays = 1 } = {}) {
  const state = loadState();
  let changed = false;
  for (const c of allCards()) {
    const isPhaseQuiz = c.type === 'quiz' && c.key === `${guide}/${phase}`;
    const isGuideTerm = c.type === 'term' && c.guide === guide;
    if (!isPhaseQuiz && !isGuideTerm) continue;
    if (!state[c.id]) { state[c.id] = { reps: 0, due: now + delayDays * DAY }; changed = true; }
  }
  if (changed) saveState(state);
  return changed;
}

// Only enrolled cards (those with saved state) that are due now. The session is
// interleaved across guides: cards seeded together share a due date, so a plain
// due-order session would run all of one guide's cards back to back - blocked
// practice, the weaker order (Rohrer & Taylor: interleaving ~doubles next-day
// retention). Round-robin by source guide instead; due order still picks WHICH
// cards make the session.
export function dueQueue(cards, state, { now = Date.now(), dueLimit = 60 } = {}) {
  const due = cards.filter((c) => state[c.id] && state[c.id].due <= now);
  due.sort((a, b) => state[a.id].due - state[b.id].due);
  return interleaveByGuide(due.slice(0, dueLimit));
}

function interleaveByGuide(cards) {
  const groups = new Map();
  for (const c of cards) {
    const k = c.guide || '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  if (groups.size <= 1) return cards;
  const lists = [...groups.values()];
  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const l of lists) {
      if (l.length) { out.push(l.shift()); added = true; }
    }
  }
  return out;
}

export function countDue(cards, state, now = Date.now()) {
  let n = 0;
  for (const c of cards) if (state[c.id] && state[c.id].due <= now) n++;
  return n;
}

// Total enrolled cards, and the next due time (for "nothing due yet" messaging).
export function enrolledStats(cards, state, now = Date.now()) {
  let enrolled = 0, nextDue = Infinity;
  for (const c of cards) {
    const st = state[c.id];
    if (!st) continue;
    enrolled++;
    if (st.due > now && st.due < nextDue) nextDue = st.due;
  }
  return { enrolled, nextDue: nextDue === Infinity ? null : nextDue };
}

// FSRS scheduling (see fsrs.js). grade ∈ 'again' | 'good' | 'easy'. Legacy
// SM-2-lite card states ({ease, interval, ...}) are migrated on their next review.
export { schedule } from '$lib/fsrs.js';
