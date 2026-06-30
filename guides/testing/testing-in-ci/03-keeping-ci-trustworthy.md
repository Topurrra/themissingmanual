---
title: "Keeping CI Trustworthy"
guide: "testing-in-ci"
phase: 3
summary: "Flaky tests - ones that pass or fail randomly - are what destroy CI's value, because people start ignoring red; here's why flakiness happens (timing, order, shared state), how to keep the suite fast and reliable, and how required checks protect main."
tags: [testing, ci, flaky-tests, required-checks, test-reliability, branch-protection]
difficulty: intermediate
synonyms: ["what are flaky tests", "why do my tests pass and fail randomly", "how to fix flaky tests", "why does ci fail intermittently", "what are required status checks", "how to make ci faster", "branch protection rules"]
updated: 2026-06-19
---

# Keeping CI Trustworthy

CI only works if people believe it. A green check is a promise - "this code is safe to merge" - and the
entire value of CI rests on that promise being true. The fastest way to destroy a CI setup isn't a
broken server or a bad config. It's something quieter and far more corrosive: tests that lie. Once the
team stops trusting red, you've lost the gate, and you didn't even get a warning. This phase is about
protecting that trust.

## The cheat-card: red check, calm response

When a check goes red, work down this list before assuming you broke something:

| Symptom | Likely cause | Calm first move |
|---|---|---|
| Red in CI, green locally | Something on your machine isn't in the repo | Check for uncommitted files / undeclared deps (see [Phase 1](01-what-ci-testing-actually-is.md)) |
| Red on *install*, before tests run | Dependency / lockfile problem, not a test | Read the log - fix the environment, not the test |
| Red on one matrix cell only | OS- or version-specific bug | Reproduce on *that* version/OS |
| **Passed, then re-ran and passed** (was red) | **Flaky test** | Don't shrug - quarantine and fix it (below) |
| Red on a clear assertion failure | A real bug your test caught | Read expected vs. actual; fix the code |

The dangerous row is the flaky one. Let's give it the attention it deserves.

## ⚠️ Flaky tests: the thing that kills CI

**What it actually is.** A *flaky test* is a test that **passes or fails randomly on the exact same
code.** You change nothing, re-run the build, and the result flips. It's not testing your code anymore -
it's flipping a coin.

📝 **Terminology.** "Flaky" is the standard industry word for *non-deterministic* test results: the same
input doesn't always give the same output. A reliable test is *deterministic* - same code, same result,
every time.

**Why this is so much worse than a normal failure.** A real failure is honest: it tells you something is
broken, you fix it, it goes green. A flaky failure teaches the team a poison lesson - *red doesn't
necessarily mean broken.* And once people learn that, here's what happens, every time:

```text
   Day 1:   Red build.  "Probably just flaky." → click re-run → green → merge.
   Day 30:  Red build.  "Just re-run it." → green → merge.  (Nobody reads it.)
   Day 90:  Red build that is a REAL bug.  → "just re-run it" → still red →
            "ugh, the CI is flaky again" → merge anyway → ships the bug.
```

That last line is the catastrophe. The flaky tests trained everyone to ignore red, so when red finally
*meant* something, nobody listened. **A flaky suite is worse than no suite,** because no suite at least
doesn't lull you into false confidence.

💡 **Key point.** Flakiness doesn't cost you one test. It slowly costs you the team's trust in *every*
test. Treat a flaky test as a real bug - a bug in your test suite - not as background noise.

## Why tests go flaky

Flakiness almost always traces back to one of three sources. Knowing them lets you spot a flaky test by
its shape:

**1. Timing.** The test assumes something finished by now, when sometimes it hasn't.

```javascript
// Flaky: hopes the data loads within 100ms. On a busy CI machine, sometimes it doesn't.
await sleep(100);
expect(screen.getText()).toBe('Loaded');

// Reliable: waits for the actual condition, however long it takes.
await waitFor(() => expect(screen.getText()).toBe('Loaded'));
```

*What just happened:* The first version races the clock - a `sleep` is a guess, and a CI machine under
load is slower than your laptop, so the guess sometimes loses. The second waits for the *thing you
actually care about* (the text appearing) instead of a fixed delay. **Fixed sleeps are the single most
common source of flakiness.** Wait for conditions, not for time.

**2. Test order / shared state.** A test passes alone but fails when run after another, because they
share something - a database row, a global variable, a file, a clock.

```text
   test A:  creates user "alice", does NOT clean up
   test B:  asserts "no users exist"   ← passes alone, FAILS after A

   Run order [A, B] → B fails.   Run order [B, A] → B passes.
   CI shuffles or parallelizes order → result flips → "flaky."
```

*What just happened:* Neither test is wrong in isolation, but they leak state into each other. The fix
is **isolation**: each test sets up and tears down its own data, assuming nothing about what ran before.
A test that depends on running order isn't really one test - it's a hidden dependency waiting to flip.

**3. External dependencies.** The test reaches out to a real network service, a live API, a real clock,
or randomness. Anything outside your control can hiccup, and your test fails for a reason that has
nothing to do with your code. The fix is to *control* those edges - fake the network, fix the clock,
seed the randomness - so the test only fails when *your* code is actually wrong.

⚠️ **Gotcha.** The instinct when a test flakes is to add a retry or a longer `sleep` and move on. That
doesn't fix flakiness - it *hides* it, makes the suite slower, and lets the underlying race survive to
bite again. A retry around a genuinely flaky test is sweeping the coin-flip under the rug.

## When you can't fix it right now: quarantine

Sometimes you find a flaky test and can't fix it this minute. The right move isn't to leave it failing
randomly (poisoning trust) or to delete it (losing coverage) - it's to **quarantine** it: mark it as
skipped, with a tracking ticket, so the build goes reliably green again while the flaky test waits to be
fixed.

```javascript
// Skip until fixed - keeps the build trustworthy without losing the test.
test.skip('reconnects after network drop - FLAKY, see issue #482', () => {
  // ...
});
```

*What just happened:* The test is temporarily removed from the gate, with a breadcrumb (`#482`) so it's
tracked, not forgotten. The build's green is honest again. Quarantine is a holding cell, not a graveyard
- the goal is always to fix and restore it.

## Keeping the suite fast (so people run it)

A slow suite causes flakiness's cousin: people stop waiting for it. If CI takes 40 minutes, developers
merge before it finishes, context-switch away, and the feedback loop you built for safety becomes a
formality. Speed is a reliability feature.

The biggest lever is the **shape** of your suite - and that's where the test pyramid comes in. Many fast,
isolated unit tests at the base; fewer integration tests in the middle; a handful of slow end-to-end
tests at the top. A suite that's mostly slow E2E tests is both *slow* and *flaky-prone* (E2E tests touch
the most moving parts). The pyramid keeps CI fast *and* reliable at the same time.

> ⏭️ The pyramid - what each layer tests and why the proportions matter - is its own topic. See
> [Unit, Integration & E2E](/guides/unit-integration-e2e) for the full picture. Here, the takeaway:
> **the pyramid is what keeps CI fast enough to trust.**

A few other practical levers, in rough order of payoff:

- **Run tests in parallel** across CPUs or machines - most runners support it.
- **Cache dependencies** between runs so `install` doesn't re-download the world every time.
- **Fix or quarantine flaky tests promptly** - a flaky suite wastes time on re-runs, which is its own
  slowness tax.

## Required checks: making the gate real

**What it actually is.** A *required status check* is a repository setting that says: *this check must be
green before the merge button is enabled.* It's what turns "we have CI" into "CI actually protects
`main`."

**Why you need it.** Without it, CI is advisory - a red check is just a suggestion someone can merge
right past. With required checks, the platform refuses the merge until the gate is green. On GitHub this
lives under **branch protection rules** for `main`:

```text
   Branch protection on `main`:
     ☑ Require status checks to pass before merging
         └ required check:  CI / test
     ☑ Require branches to be up to date before merging
     ☑ Require a pull request before merging
```

*What just happened:* With these on, nobody - including admins, unless they explicitly override - can
merge into `main` until the `CI / test` check is green and the branch includes the latest `main`. The
gate is no longer a social norm you hope people honor; it's enforced by the platform for everyone.

📝 **Terminology.** **Branch protection** (GitHub's name; GitLab calls them *protected branches* with
*merge request approval rules*) is the set of rules guarding a branch - required checks, required
reviews, "must be up to date." Required *status checks* are the CI piece of that.

🪖 **War story.** I've watched a team add CI, feel safe, and keep shipping bugs to `main` for weeks -
because the checks ran but were never marked *required.* People glanced at red, judged it "probably
flaky," and merged anyway. The fix was one checkbox: make the check required. Suddenly red meant
*blocked*, not *ignorable*, and the bugs stopped reaching `main`. CI you can merge past isn't a gate;
it's a decoration.

## Recap

1. CI's whole value is **trust in the green check** - protect it ruthlessly.
2. **Flaky tests** (pass/fail randomly on the same code) are the top threat: they teach the team that
   red is ignorable, so real failures get ignored too. A flaky suite is worse than no suite.
3. Flakiness comes from **timing** (fixed sleeps), **shared state / order**, and **external
   dependencies** - fix by waiting on conditions, isolating tests, and controlling the edges.
4. Can't fix now? **Quarantine** the test (skip + tracking ticket) so the build is honestly green.
5. Keep the suite **fast** - mostly via the test pyramid ([Unit, Integration & E2E](/guides/unit-integration-e2e)),
   plus parallelism and caching - so people actually wait for it.
6. **Required status checks / branch protection** make the gate real: the merge button stays blocked
   until CI is green. CI you can merge past is decoration, not protection.

---

[← Phase 2: Inside the Pipeline](02-inside-the-pipeline.md) · [Guide overview](_guide.md)
