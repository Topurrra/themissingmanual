// Local, account-free streak tracking. A day "counts" the first time the
// reader finishes a quiz or a review session that day - deliberately not
// every page view, so the streak reflects actual practice, not browsing.
const KEY = 'tmm-streak';
const DAY = 86400000;

// Calendar-day key in the reader's own timezone, not a rolling 24h window -
// so "today" means the same thing a person means by it.
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}

// Call once per completed quiz/review session. Idempotent within a day.
export function recordActivity(now = Date.now()) {
  const s = load();
  const today = dayKey(now);
  if (s.lastDay === today) return s; // already counted today

  const yesterday = dayKey(now - DAY);
  const current = s.lastDay === yesterday ? (s.current || 0) + 1 : 1;
  const next = { current, longest: Math.max(current, s.longest || 0), lastDay: today, lastTs: now };
  save(next);
  return next;
}

// Read-only: does NOT extend or reset the streak, just reports it - a streak
// only breaks the next time the reader actually shows up and it's checked.
export function getStreak(now = Date.now()) {
  const s = load();
  if (!s.lastDay) return { current: 0, longest: 0 };
  const today = dayKey(now);
  const yesterday = dayKey(now - DAY);
  // The streak is still "alive" through today even if not yet extended today -
  // it only actually breaks once a full day is skipped.
  const alive = s.lastDay === today || s.lastDay === yesterday;
  return { current: alive ? (s.current || 0) : 0, longest: s.longest || 0 };
}
