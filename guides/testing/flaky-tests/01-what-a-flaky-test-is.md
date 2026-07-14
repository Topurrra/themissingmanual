---
title: "What a Flaky Test Actually Is"
guide: "flaky-tests"
phase: 1
summary: "A flaky test is nondeterministic: the same code yields different results because hidden inputs - time, order, randomness, the network - leak into a test that should be a pure function."
tags: [testing, flaky-tests, nondeterminism, mental-model, determinism]
difficulty: intermediate
synonyms: ["what is a flaky test", "why does a test pass and fail randomly", "what does nondeterministic test mean", "test passes sometimes", "why is my test unreliable"]
updated: 2026-07-10
---

# What a Flaky Test Actually Is

Here's the moment. The build goes red on a test you didn't touch. You frown, re-run it, and it goes green. No code changed. Nothing you did fixed it - it *decided* to pass this time. Your first instinct is relief, your second is unease, and your third, if you're being straight with yourself, is to never trust that test again.

That test isn't broken in the normal sense. It's *flaky*. And flaky isn't a vibe or a mystery - it has a precise, almost boring definition. Once you have that definition in your head, every flaky test you'll ever meet stops being spooky and starts being a thing you can reason about.

## A passing test is supposed to be a pure function

Think about what a good test promises. You give it the same code, and it gives you the same answer - pass or fail - every single time. A healthy test behaves like a **pure function**: its result depends *only* on the code under test.

```text
   healthy test:    code  ──►  [ test ]  ──►  PASS   (always)
                    code  ──►  [ test ]  ──►  PASS   (still)
                    code  ──►  [ test ]  ──►  PASS   (again)
```

*What just happened:* The same input went in three times and the same result came out three times. That repeatability is the entire point - it's what lets a green check *mean* something. When a test is deterministic, "green" is a fact about your code.

## Flaky means a hidden input snuck in

A flaky test isn't actually getting different inputs from *your code* - the code is identical run to run. It's getting different inputs from somewhere you didn't notice: the clock, the order other tests ran in, a random number, a network response, a leftover row in a database. Those are real inputs to the test. You never wrote them down.

```text
   flaky test:    code + (clock? order? random? network?)  ──►  [ test ]  ──►  PASS
                  code + (clock? order? random? network?)  ──►  [ test ]  ──►  FAIL
                       └── same code, DIFFERENT hidden inputs ──┘
```

*What just happened:* The visible input (your code) stayed the same, but invisible inputs changed between runs, so the result flipped. The test was never really a function of your code alone - it was secretly a function of your code *plus the universe*, and the universe doesn't sit still. **That's the whole disease: nondeterminism leaking into something that was supposed to be deterministic.**

📝 **Terminology.** *Deterministic* means same input, same output, every time. *Nondeterministic* means the output can vary even when the input you care about doesn't. "Flaky" is the standard industry word for a nondeterministic test. They're the same idea wearing different clothes.

## Why this is worse than a failure that tells the truth

It's tempting to file a flaky test under "minor annoyance." It isn't. A normal failing test is straight with you - it says "something's broken," you fix it, it goes green, the system told you the truth. A flaky test lies. Sometimes it cries wolf when nothing's wrong; sometimes it stays silent when something *is*. Either way, it teaches everyone the same poisonous lesson:

```text
   week 1:   red build → "probably flaky" → re-run → green → merge
   week 6:   red build → "ugh, flaky again" → re-run → merge (nobody read it)
   week 12:  red build that is a REAL bug → "just re-run it" → ships the bug
```

*What just happened:* Each flaky failure trained the team to discount red. By week 12 the muscle memory was "red means re-run," so when red finally *meant something*, nobody listened. **A flaky test doesn't cost you one test - it slowly costs you trust in every test you have.** That's why we treat flakiness as a real bug, a bug in the test suite, not as background noise.

💡 **Key point.** The fix for flakiness is never "make the test pass more often." It's "find the hidden input and pin it down." You're not chasing luck - you're hunting a specific source of nondeterminism, and there's a short list of them. That list is Phase 2.

## The reframe that makes everything easier

Hold onto this single sentence and the rest of the guide unlocks:

> A flaky test is a test that depends on something it doesn't control.

The clock it didn't freeze. The random seed it didn't set. The database it didn't clean up. The async operation it didn't wait for. The API it called for real. Every cause of flakiness is one specific uncontrolled dependency - and the cure is always the same shape: **take control of it.** Freeze the clock. Seed the randomness. Isolate the state. Await the operation. Fake the network.

🪖 **War story.** A test that "only fails on CI, never locally" panicked a team I worked with for a week - they suspected the CI machine was cursed. It wasn't cursed. It was *slower* than their laptops, which exposed a race the fast laptops always won. The CI box wasn't broken; it was hardware telling the truth, revealing an uncontrolled dependency on timing. The flaky test had been lying on their laptops the whole time - the slow machine stopped covering for it.

For builders: when you see "passes locally, fails in CI," don't reach for "CI is flaky." Reach for "CI runs in a different, often slower or more parallel environment, and that difference is *surfacing* a real nondeterminism my fast quiet laptop was hiding." CI is usually the messenger, not the problem.

## Recap

- A healthy test is **deterministic**: same code in, same result out, every time. That repeatability is what makes "green" mean something.
- A **flaky** test is **nondeterministic**: the result flips with no code change because a hidden input - time, order, randomness, the network, leftover state - leaked in.
- Flakiness is worse than a failure that tells the truth because it trains people to **ignore red**, so real failures get ignored too.
- The universal reframe: **a flaky test depends on something it doesn't control.** Every fix is "take control of that thing." Phase 2 names the usual suspects.

```quiz
[
  {
    "q": "What is the precise definition of a flaky test?",
    "choices": ["A test that is slow to run", "A test that fails the first time you write it", "A test whose result varies even when the code under test doesn't change", "A test with no assertions"],
    "answer": 2,
    "explain": "Flaky = nondeterministic: the same code can produce pass or fail because a hidden input changed between runs."
  },
  {
    "q": "Why is a flaky failure considered worse than a failure that tells the truth?",
    "choices": ["It takes longer to run", "It trains the team to ignore red, so real failures get ignored too", "It uses more CI minutes", "It can't be skipped"],
    "answer": 1,
    "explain": "A flaky test erodes trust in every test, because people learn that red doesn't necessarily mean broken - and then ignore a real red."
  },
  {
    "q": "A test passes on your laptop but fails on CI with no code change. What's the most likely explanation?",
    "choices": ["The CI server is broken", "CI's different (often slower, more parallel) environment is surfacing a real nondeterminism your laptop was hiding", "The test should be deleted", "CI runs an older version of the code"],
    "answer": 1,
    "explain": "CI is usually the messenger: a slower or more parallel environment exposes an uncontrolled dependency (often timing or order) that a fast, quiet laptop happened to mask."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: The Usual Culprits](02-the-usual-culprits.md) →
