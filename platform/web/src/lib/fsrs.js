// FSRS scheduling (FSRS-4.5 formulas, default weights) - pure math, no imports,
// no storage. Replaces the old SM-2-lite: instead of one "ease" knob, each card
// carries a memory-stability estimate S (days until recall probability drops to
// 90%) and a difficulty D (1..10), both updated from the actual outcome and the
// actual time elapsed since the last look. The next interval is simply the time
// until predicted retrievability falls to the 90% target.
//
// Grades: 'again' (failed), 'good' (recalled), 'easy' (recalled effortlessly).
// Card state: { s, d, reps, lapses, last, due } (+ legacy { ease, interval } migrated).

const DAY = 86400000;
const DECAY = -0.5;
const FACTOR = 19 / 81; // FSRS-4.5: R(t) = (1 + FACTOR * t/S)^DECAY
const TARGET_R = 0.9;
const MAX_INTERVAL = 365; // days; free content, no reason to schedule further out

// FSRS-4.5 default weights.
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755
];

const GRADE_NUM = { again: 1, hard: 2, good: 3, easy: 4 };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

function initDifficulty(g) {
  return clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
}

function nextDifficulty(d, g) {
  const nd = d - W[6] * (g - 3);
  return clamp(W[7] * initDifficulty(4) + (1 - W[7]) * nd, 1, 10);
}

export function retrievability(elapsedDays, s) {
  if (!(s > 0)) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / s, DECAY);
}

function nextStabilityOnSuccess(s, d, r, g) {
  const hardPenalty = g === 2 ? W[15] : 1;
  const easyBonus = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hardPenalty * easyBonus);
}

function nextStabilityOnLapse(s, d, r) {
  return W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
}

function intervalFor(s) {
  // Solve R(t) = TARGET_R for t: at 90% this works out to t ≈ s by design.
  const days = (s / FACTOR) * (Math.pow(TARGET_R, 1 / DECAY) - 1);
  return clamp(Math.round(days), 1, MAX_INTERVAL);
}

// Legacy SM-2-lite cards ({ease, interval, reps}) carry over: the last interval is
// the best available stability estimate, and ease maps roughly onto difficulty.
function migrate(prev) {
  const s = Math.max(prev.interval || 0, 0.5);
  const d = clamp(11 - (prev.ease || 2.5) * 3, 1, 10);
  return { s, d, reps: prev.reps || 0, lapses: 0, last: null };
}

/** Schedule the next review. Returns the full new card state (incl. `due`). */
export function schedule(prev, grade, now = Date.now()) {
  const g = GRADE_NUM[grade] || 3;
  let { s, d, reps = 0, lapses = 0, last = null } =
    prev && prev.s != null ? prev : prev && prev.ease != null ? migrate(prev) : {};

  if (s == null) {
    // First real review: initial stability/difficulty from this first grade.
    s = W[g - 1];
    d = initDifficulty(g);
    reps = 1;
    if (g === 1) {
      // Failed the very first look: keep it in the session (due now), tiny stability.
      return { s, d, reps: 0, lapses: 1, last: now, due: now };
    }
    return { s, d, reps, lapses, last: now, due: now + intervalFor(s) * DAY };
  }

  // Elapsed time since the last look; if unknown (migrated card), assume the
  // card was seen right when it was due (elapsed ≈ its old interval ≈ s).
  const elapsed = last != null ? (now - last) / DAY : s;
  const r = retrievability(elapsed, s);
  d = nextDifficulty(d, g);

  if (g === 1) {
    s = Math.max(0.1, nextStabilityOnLapse(s, d, r));
    // Same-session requeue, matching the old 'again' behavior.
    return { s, d, reps: 0, lapses: lapses + 1, last: now, due: now };
  }

  s = Math.max(s, nextStabilityOnSuccess(s, d, r, g)); // stability never shrinks on success
  reps += 1;
  return { s, d, reps, lapses, last: now, due: now + intervalFor(s) * DAY };
}
