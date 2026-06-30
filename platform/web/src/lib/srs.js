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
    if (!state[c.id]) { state[c.id] = { ease: 2.5, interval: 0, reps: 0, due: now + delayDays * DAY }; changed = true; }
  }
  if (changed) saveState(state);
  return changed;
}

// Only enrolled cards (those with saved state) that are due now.
export function dueQueue(cards, state, { now = Date.now(), dueLimit = 60 } = {}) {
  const due = cards.filter((c) => state[c.id] && state[c.id].due <= now);
  due.sort((a, b) => state[a.id].due - state[b.id].due);
  return due.slice(0, dueLimit);
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

// SM-2-lite. grade ∈ 'again' | 'good' | 'easy'. Returns the new card state.
export function schedule(prev, grade, now = Date.now()) {
  let { ease = 2.5, interval = 0, reps = 0 } = prev || {};
  if (grade === 'again') {
    return { ease: Math.max(1.3, ease - 0.2), interval: 0, reps: 0, due: now };
  }
  if (grade === 'easy') ease += 0.15;
  if (reps === 0) interval = grade === 'easy' ? 3 : 1;
  else if (reps === 1) interval = grade === 'easy' ? 6 : 3;
  else interval = Math.max(1, Math.round(interval * ease * (grade === 'easy' ? 1.3 : 1)));
  reps += 1;
  return { ease, interval, reps, due: now + interval * DAY };
}
