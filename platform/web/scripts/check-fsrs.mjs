// Self-check for the FSRS scheduler: node scripts/check-fsrs.mjs
// The smallest set of assertions that fails if the scheduling logic breaks.
import assert from 'node:assert';
import { schedule, retrievability } from '../src/lib/fsrs.js';

const DAY = 86400000;
const now = 1_700_000_000_000;

// 1. First 'good' review schedules ~3 days out (initial stability W[2] ≈ 3.7).
let st = schedule(undefined, 'good', now);
const firstIvl = (st.due - now) / DAY;
assert.ok(firstIvl >= 2 && firstIvl <= 6, `first good interval sane: ${firstIvl}`);

// 2. 'easy' starts further out than 'good'.
const easy = schedule(undefined, 'easy', now);
assert.ok(easy.due > st.due, 'easy schedules further than good');

// 3. Repeated on-time successes grow the interval monotonically.
let t = now, prevIvl = 0;
st = schedule(undefined, 'good', t);
for (let i = 0; i < 5; i++) {
  t = st.due; // review exactly when due
  const before = st.s;
  st = schedule(st, 'good', t);
  const ivl = (st.due - t) / DAY;
  assert.ok(st.s >= before, 'stability never shrinks on success');
  assert.ok(ivl >= prevIvl, `interval grows: ${prevIvl} -> ${ivl}`);
  prevIvl = ivl;
}
assert.ok(prevIvl > 10, `after 6 successes the interval is long: ${prevIvl}`);

// 4. A lapse collapses stability and requeues now; recovery restarts short.
const lapsed = schedule(st, 'again', t + DAY);
assert.equal(lapsed.due, t + DAY, 'again requeues immediately');
assert.ok(lapsed.s < st.s, 'lapse shrinks stability');
assert.equal(lapsed.lapses, 1);

// 5. Late reviews (low retrievability) give a bigger stability boost than
// on-time ones - the spacing effect the whole model exists for.
const base = schedule(undefined, 'good', now);
const onTime = schedule(base, 'good', base.due);
const late = schedule(base, 'good', base.due + 20 * DAY);
assert.ok(late.s > onTime.s, `late success boosts stability more: ${onTime.s.toFixed(1)} vs ${late.s.toFixed(1)}`);

// 6. Legacy SM-2 cards migrate: interval becomes the stability estimate.
const legacy = { ease: 2.5, interval: 12, reps: 3, due: now };
const mig = schedule(legacy, 'good', now);
assert.ok(mig.s > 12, `migrated stability grows from old interval: ${mig.s.toFixed(1)}`);
assert.ok((mig.due - now) / DAY >= 12, 'migrated card schedules at least as far as before');

// 7. Retrievability decays with time.
assert.ok(retrievability(0, 10) > 0.99);
assert.ok(retrievability(10, 10) < 0.95 && retrievability(10, 10) > 0.85, 'R(t=S) ≈ 90%');
assert.ok(retrievability(100, 10) < retrievability(10, 10));

console.log('fsrs self-check: all assertions passed');
