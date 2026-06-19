---
title: "Getting the Mix Right"
guide: "unit-integration-e2e"
phase: 3
summary: "The practical strategy: lots of unit, some integration, a few E2E; how to decide which level a given risk belongs at; and why the 'ice-cream cone' anti-pattern of all-E2E quietly wrecks teams."
tags: [testing, test-strategy, testing-pyramid, ice-cream-cone, ci, test-mix]
difficulty: intermediate
synonyms: ["how many e2e tests should i write", "ice cream cone anti-pattern", "what level should this test be", "right mix of unit integration e2e", "too many e2e tests slow ci", "how to decide test level"]
updated: 2026-06-19
---

# Getting the Mix Right

You know the three levels now, and you know the pyramid says "many at the bottom, few at the top." This phase turns that shape into decisions you can actually make on a Tuesday afternoon: how much of each, how to decide where a specific test belongs, and how to recognize the anti-pattern that gets all of this exactly backwards.

## The decision cheat-card

> **Looking at a feature and not sure where its tests go? Start here, then read below.**

| The risk you're worried about | The level that fits |
|---|---|
| "Is this logic / math / edge case correct?" | **Unit** — fast, precise, write many |
| "Does my code agree with the database / another service?" | **Integration** — some, on the real seams |
| "Can a user actually complete this critical journey?" | **E2E** — a few, on the journeys that matter most |
| "I want to test five branches of one function" | **Unit** — five units, not five E2E tests |
| "I want to know checkout works before every release" | **One E2E** for the happy path; unit-test the pieces |

## The mix, stated plainly

The healthy shape, in rough proportions (these are a rule of thumb, not a measured law):

```text
   a few         E2E          critical journeys only: login, checkout
   some       Integration     the real seams: code↔database, code↔service
   lots          Unit         every branch, edge case, and bit of logic
```

The instinct to fight is "more E2E = more confidence." It feels true — E2E tests look the most like real usage, so surely they prove the most? But re-read Phase 1: an E2E test is slow and, when it fails, points at a whole region instead of a bug. A suite built mostly of them is slow to run and slow to diagnose. You get the *most realistic* tests and the *least usable* suite. Confidence you can't run often, and can't act on quickly, isn't worth what it costs.

💡 **Key point.** Push every test **down** to the lowest level that can honestly catch the bug you're worried about. If a unit test can catch it, that's where it goes. Reserve the slow, blunt, expensive E2E tests for the handful of journeys where "the whole thing works end to end" is the actual risk — and let units and integration carry everything below that.

## How to decide the level for a given risk

When you're staring at a specific thing to test, ask in this order — and stop at the first "yes":

1. **Is this a question about logic inside one piece?** (Does the discount round correctly? Does the validator reject a bad email?) → **Unit.** Don't drag a database or a browser into a question about one function's math.
2. **Is this a question about whether two real things agree?** (Does what I save load back correctly? Does the other service return the shape I expect?) → **Integration.** This is the seam units are blind to.
3. **Is this a question about a whole user journey working?** (Can someone sign up, add to cart, and check out?) → **E2E** — and only for the journeys important enough to justify the cost.

The trap is answering a level-1 question with a level-3 test. If you want to check five branches of a pricing function, that's five unit tests — fast, each pointing at its own branch. Doing it through the UI gives you five slow, flaky tests that all point at "somewhere in the request." Same coverage on paper; far worse suite in practice.

## ⚠️ The anti-pattern: the ice-cream cone

Here's the shape teams drift into when nobody's steering — the pyramid flipped on its head:

```text
          ╲─────────────────╱
           ╲   lots of E2E  ╱     slow, flaky, vague failures
            ╲─────────────╱
             ╲  some integ ╱
              ╲─────────╱
               ╲ a few  ╱
                ╲ unit ╱
                 ╲────╱
                   ▼  (almost no fast tests at the bottom)
```

It's called the **ice-cream cone** (a fat scoop of E2E on top, tapering to almost no units at the base), and it's the single most common testing-strategy failure. It usually grows by accident: testing through the UI feels the most "real," QA writes end-to-end checks, nobody pushes logic down into units, and one day you look up and your suite is a tower of slow E2E tests balanced on nothing.

**Why it hurts — concretely:**

- **The suite is slow, so people stop running it.** When the full run takes many minutes, developers skip it locally and lean on CI, and bugs slip further down the line before anyone notices.
- **Failures don't point anywhere.** Every red test means "something in the whole chain broke" — so every failure is an investigation, not a fix. (That's the Phase 1 pointing-power problem, multiplied across the whole suite.)
- **Flakiness erodes trust.** E2E tests fail intermittently from timing and network wobble. A suite that's mostly E2E is mostly flaky — and the moment people start saying "oh, that test is always red, ignore it," the suite has stopped protecting you. A test you've trained yourself to ignore is worse than no test: it cost you time to write and protects you from nothing.
- **It's expensive to grow.** Each new E2E test adds real seconds to every run, forever. The base of the pyramid scales; the tip does not.

🪖 **War story.** Plenty of teams have lived the version where the only real safety net was a giant E2E suite. It was "thorough" on paper and miserable in practice: a single failure meant an afternoon of bisecting the request path to find which layer actually broke, and the flaky ones got muted one by one until the green checkmark meant nothing. The fix is never "write even more E2E tests" — it's pushing the logic down into fast unit tests so the failures point somewhere and the suite runs in seconds.

The cure isn't to delete your E2E tests. It's to **invert the cone**: for each broad E2E test, ask "what's the actual risk here, and could a unit or integration test catch most of it?" Move that coverage down. Keep a *few* E2E tests on the journeys that genuinely need full-system proof, and let the fast base do the heavy lifting.

## Where this meets the rest of your workflow

- **This is what makes CI bearable.** A pyramid-shaped suite is fast enough to run on every push and gives failures you can act on — exactly what a continuous-integration pipeline needs to stay useful instead of becoming the thing everyone waits on and resents. How tests get wired into that pipeline (and run in the right order — fast units first, slow E2E last) is covered in [Testing in CI](/guides/testing-in-ci).
- **The base of the pyramid depends on good test doubles.** "Lots of fast unit tests" is only possible because you can replace the slow real collaborators (database, network, clock) with stand-ins. Doing that cleanly — without faking so much that the test stops meaning anything — is its own skill: see [Mocking & Test Doubles](/guides/mocking-and-test-doubles).
- **And if you haven't written that first unit test yet,** start at the base: [Your First Unit Test](/guides/your-first-unit-test).

## Recap

1. **Push every test down** to the lowest level that can honestly catch the bug — unit if it can, integration for the seams, E2E only for whole journeys that matter.
2. The healthy mix is **lots of unit, some integration, a few E2E** — and "more E2E" buys realism at the cost of a slow, hard-to-diagnose, flaky suite.
3. To place a specific test, ask: *one piece's logic?* → unit · *two things agreeing?* → integration · *a whole journey?* → E2E. Stop at the first yes.
4. The **ice-cream cone** (mostly E2E, almost no units) is the common failure: slow, vague, flaky, expensive — invert it by moving coverage down, not by adding more E2E.
5. A pyramid-shaped suite is what makes [CI](/guides/testing-in-ci) fast and trustworthy, and it rests on solid [test doubles](/guides/mocking-and-test-doubles) at the base.

You can now look at any feature and place its tests deliberately — fast where you can, broad only where you must — and recognize when a suite is drifting upside-down before it costs the team its afternoons.

---

[← Phase 2: The Three Levels](02-the-three-levels.md) · [Guide overview](_guide.md)
