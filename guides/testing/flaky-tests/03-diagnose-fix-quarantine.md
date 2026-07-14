---
title: "Diagnose, Fix, Quarantine"
guide: "flaky-tests"
phase: 3
summary: "The playbook for killing flakiness: rerun and isolate and seed to find the cause, control time/randomness/state/externals to fix it, and quarantine - never silently ignore - when you can't fix it today."
tags: [testing, flaky-tests, quarantine, test-isolation, debugging, ci]
difficulty: intermediate
synonyms: ["how to fix flaky tests", "how to debug a flaky test", "how to quarantine a flaky test", "seed randomness in tests", "freeze the clock in tests", "fake network in tests", "reproduce flaky test"]
updated: 2026-07-10
---

# Diagnose, Fix, Quarantine

You know the disease (Phase 1) and the suspects (Phase 2). This phase is the playbook for actually killing a flaky test: **diagnose** (find the hidden input), **fix** (take control of it), **quarantine** (a holding cell for when you can't fix it this minute). Order matters - most people skip straight to fixing and guess wrong. Diagnosis is what makes the fix land.

## Step 1: Diagnose - make it fail on demand

You can't fix what you can't reproduce. Diagnosis turns an intermittent failure into a predictable one, so you can confirm the cause and confirm the fix. Three tools do most of the work.

**Rerun in a loop.** A test that fails 1-in-50 times is invisible if you run it once. Run it many times in a row and the failure rate becomes a fact you can measure - and later, a fact you can watch go to zero.

```bash
# Run one test 50 times; stop on the first failure so you can inspect it.
for i in $(seq 1 50); do
  npm test -- flaky.spec.js || { echo "FAILED on run $i"; break; }
done
```

*What just happened:* Instead of hoping to catch the flake by luck, you forced 50 attempts. A failure on run 23 gives you a reproduction and a baseline rate; 50-for-50 green after your fix is your evidence it worked.

**Isolate.** Run the suspect test completely alone. If it passes alone but fails in the suite, you've confirmed it's order or shared state (Culprit 3) - you don't even need to read the code yet. If it fails alone too, the cause lives inside the test itself (timing, async, externals).

```bash
# Run ONLY this test, nothing before it.
npm test -- --runTestsByPath flaky.spec.js
```

*What just happened:* This single comparison splits your search in half. Passes alone, fails together → look outward at other tests and shared state. Fails alone too → look inward at the test's own dependencies.

**Seed and pin the inputs.** If you suspect randomness or order, stop letting them vary. Fix the random seed and fix the run order, then re-run. If pinning them makes the flake disappear or become 100% reproducible, you've found your hidden input.

```bash
# Force a fixed test order and a fixed random seed, then loop.
npm test -- --seed=12345 --no-shuffle
```

*What just happened:* Freezing the things you suspected converts nondeterminism into determinism. A flake that vanishes under a fixed seed *was* a randomness flake; one that becomes 100% reproducible under a fixed order *was* an order flake. Pinning turns "sometimes" into "always" or "never," and both answers are useful.

💡 **Key point.** Diagnosis isn't about reading code harder. It's about *changing one variable at a time* - order, seed, isolation - until the failure becomes predictable. A flake you can reproduce on demand is already half-fixed.

## Step 2: Fix - take control of the dependency

Every fix is the same shape: take control of the thing the test didn't control. Here's the cure for each culprit from Phase 2.

**Control time.** Don't read the real clock - inject a fake one your test owns. Then "now" is whatever you say it is, on every machine, forever.

```javascript
// Before: depends on the real clock, fails near a day boundary.
expect(formatTimestamp(Date.now())).toBe('2026-06-30');

// After: freeze time so the test is deterministic.
jest.useFakeTimers().setSystemTime(new Date('2026-06-30T12:00:00Z'));
expect(formatTimestamp(Date.now())).toBe('2026-06-30');
```

*What just happened:* `setSystemTime` makes `Date.now()` return a value *you* chose, so the test no longer cares what the wall clock says or what day CI runs. A frozen clock cures every "fails near midnight" flake.

**Control randomness.** Seed the generator (or inject the value) so "random" is reproducible inside the test.

```python
import random

def test_pick_is_deterministic():
    random.seed(42)            # same seed -> same sequence, every run
    assert random.choice([1, 2, 3]) == 1
```

*What just happened:* With a fixed seed, the "random" choice is identical on every run, so the assertion is stable. You're not removing randomness from production - you're pinning it *in the test*.

**Await properly.** For async flakes, the fix is usually one keyword: actually wait for the work, or wait for the condition, before asserting.

```javascript
// Before: assertion races the save.
test('saves the user', () => {
  saveUser({ name: 'alice' });
  expect(db.count()).toBe(1);
});

// After: await the work; the assertion runs after it completes.
test('saves the user', async () => {
  await saveUser({ name: 'alice' });
  expect(db.count()).toBe(1);
});
```

*What just happened:* The `await` forces the assertion to run only after `saveUser` finishes, eliminating the race. For UI/eventual conditions, the same idea is `await waitFor(() => ...)` - never a fixed `sleep`.

**Isolate state.** Each test must set up its own world and tear it down, assuming nothing about what ran before. Reset shared state in a teardown hook so no test can leak into the next.

```javascript
afterEach(async () => {
  await db.clear();        // every test starts from a clean slate
});
```

*What just happened:* Clearing the database after each test removes the shared state that made order matter, so the suite produces the same result in order, shuffled, or parallel.

**Fake the externals.** Replace the live network/service with a controlled fake so the test only fails when *your* code is wrong, not when a third party hiccups.

```javascript
// Replace the real HTTP call with a stub that returns a fixed response.
jest.spyOn(api, 'getPrice').mockResolvedValue({ status: 200, price: 42 });
```

*What just happened:* The test no longer touches the real network, so a slow or down API can't make it flake.

> ⏭️ Faking the network, clock, and services properly - stubs, mocks, fakes, and when *not* to use them - is its own skill. See [Mocking & Test Doubles](/guides/mocking-and-test-doubles) for the full picture. Here, the takeaway: **control the edges so only your code decides the result.**

**Close what you open.** For leaks, the fix is disciplined teardown - close connections, handles, timers, and servers in an `afterEach`/`afterAll`, ideally automatically.

```javascript
afterAll(async () => {
  await pool.end();        // release connections so later runs don't exhaust the pool
});
```

*What just happened:* Releasing the connection pool at the end means a long suite can't run itself out of resources, so an innocent downstream test stops being blamed for an earlier test's leak.

⚠️ **Gotcha.** The tempting non-fix is to wrap a flaky test in a retry - "run it 3 times, pass if any pass." That doesn't fix flakiness; it *hides* it, slows the suite, and lets the underlying race survive to corrupt something subtler later. Retries belong around genuinely unreliable *externals* in end-to-end tests, not around races in your own code.

## Step 3: Quarantine - when you can't fix it today

Sometimes you find a flaky test and genuinely can't fix it this minute - it's deep, you're mid-incident, the owner is out. Two of your three options are wrong: leaving it failing randomly **poisons trust** (Phase 1's warning), and deleting it **loses coverage** silently. The right move is the third: **quarantine** it.

```javascript
// Skip until fixed - keeps the build reliably green without losing the test.
test.skip('reconnects after network drop - FLAKY, see issue #482', () => {
  // ...
});
```

*What just happened:* The test is pulled out of the gate *with a breadcrumb* - a tracking issue so it's remembered, not forgotten. The build's green means something again, with a paper trail back to the work. Quarantine is a holding cell, not a graveyard.

🪖 **War story.** The difference between a healthy team and a doomed one isn't whether they have flaky tests - everyone does. It's what they do with them. The doomed team adds a retry and moves on; a year later "CI is flaky" is a fact of life nobody questions. The healthy team quarantines with a ticket, fixes them off the critical path, and keeps the green check meaning something. Same flakes, opposite outcomes.

💡 **Key point.** Quarantine is explicit and tracked; silent ignoring is implicit and forgotten. Never `// eslint-disable` a flake into oblivion or comment it out with no trail. A skipped test with an issue number is a promise; a deleted or silently-disabled test is a lie of omission.

## The whole playbook in one breath

```text
   DIAGNOSE   rerun in a loop → isolate (alone vs suite) → pin seed + order
   FIX        control time · seed randomness · await · isolate state · fake externals · close resources
   QUARANTINE can't fix now? skip + tracking issue (never silently ignore)
```

*What just happened:* That's the entire response to any flaky test. Diagnose until reproducible, fix by taking control of the uncontrolled dependency, and if you truly can't fix it today, quarantine with a trail instead of letting it rot trust.

For builders: in CI, a flaky test is a slow leak in the thing protecting your `main` branch. Treat each flake as a bug ticket the moment it appears, not after it's worn everyone down. [Testing in CI](/guides/testing-in-ci) covers required checks and branch protection - a gate only as trustworthy as the suite behind it.

## Recap

- **Diagnose first.** Rerun in a loop, isolate (alone vs. in-suite), and pin seed + order to turn "sometimes" into "always/never." A reproducible flake is half-fixed.
- **Fix by taking control:** freeze the clock, seed randomness, `await` async work, isolate and tear down state, fake externals, close every resource you open.
- **Don't retry away a race.** Retries hide flakiness and slow the suite; they belong around unreliable externals in E2E, not your own code's races.
- **Quarantine, never silently ignore.** Can't fix today? Skip with a tracking issue so the build stays reliably green and the work is remembered.

```quiz
[
  {
    "q": "What's the FIRST thing to do with a flaky test, before trying to fix it?",
    "choices": ["Wrap it in a retry", "Make it fail on demand - rerun in a loop, isolate, and pin seed/order", "Delete it", "Add a longer sleep"],
    "answer": 1,
    "explain": "You can't confirm a fix you can't reproduce. Diagnose first: loop it, isolate it, pin the suspected inputs until the failure is predictable."
  },
  {
    "q": "Why is wrapping a flaky test in an automatic retry a bad fix for a race in your own code?",
    "choices": ["Retries are not supported by most runners", "It hides the flakiness, slows the suite, and lets the underlying race survive", "It makes the test deterministic", "It deletes the test's coverage"],
    "answer": 1,
    "explain": "A retry sweeps the coin-flip under the rug instead of removing it. Retries belong around genuinely unreliable externals in E2E, not around your own races."
  },
  {
    "q": "You found a flaky test but can't fix it right now. What's the correct move?",
    "choices": ["Delete it to keep the build green", "Leave it failing randomly", "Quarantine it: skip it with a tracking issue", "Wrap the whole suite in a retry"],
    "answer": 2,
    "explain": "Quarantine keeps the build reliably green without losing track: skip plus a tracking issue is a tracked promise to fix, unlike deleting or silently ignoring."
  }
]
```

[← Phase 2: The Usual Culprits](02-the-usual-culprits.md) · [Guide overview](_guide.md)
