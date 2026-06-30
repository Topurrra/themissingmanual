---
title: "Unit, Integration & E2E Tests, Explained"
guide: "unit-integration-e2e"
phase: 0
summary: "What the three levels of testing actually are, what each one catches and costs, and how to get the mix right so your suite stays fast and your failures point somewhere useful."
tags: [testing, unit-tests, integration-tests, e2e-tests, testing-pyramid, test-strategy]
category: testing
difficulty: intermediate
order: 3
synonyms: ["difference between unit integration and e2e tests", "what is the testing pyramid", "how many e2e tests should i write", "unit vs integration vs end to end", "what level should this test be", "ice cream cone anti-pattern testing"]
updated: 2026-06-19
---

# Unit, Integration & E2E Tests, Explained

You've heard the words thrown around in standups and PR reviews - "this needs a unit test," "the integration tests are flaky again," "don't bother with E2E for that." And maybe you've nodded along while quietly wondering: what actually *makes* a test one kind versus another? Is it the folder it lives in? The framework? Something deeper?

Here's the part nobody sat you down to explain: the three levels aren't about tools. They're about **how much of the system each test runs at once** - and that single choice decides how fast the test is, how often it fails for dumb reasons, and how precisely a failure tells you where the bug lives. Once you see that, "what level should this be?" stops being a guess.

This guide gives you the mental model (the pyramid), walks the three levels one at a time with real examples, and then shows you how to mix them so your suite is fast, trustworthy, and actually catches the bugs that matter.

## How to read this
- **Want it to finally make sense?** Read in order - each phase builds on the last. The pyramid in Phase 1 is the lens everything else uses.
- **Already know the levels and just want the strategy?** Skip to [Phase 3: Getting the Mix Right](03-getting-the-mix-right.md) - but the decision rules there lean on the cost/coverage trade-offs explained in [Phase 2](02-the-three-levels.md).

## The phases
1. **[The Testing Pyramid](01-the-testing-pyramid.md)** - the mental model: many small fast tests at the bottom, fewer big slow ones at the top, and *why* that shape is the one that holds up.
2. **[The Three Levels](02-the-three-levels.md)** - unit, integration, and end-to-end, one at a time: what each catches, what each costs in speed and flakiness, and a concrete example of each.
3. **[Getting the Mix Right](03-getting-the-mix-right.md)** - lots of unit, some integration, a few E2E; how to decide what level a given risk belongs at; and the "ice-cream cone" anti-pattern that quietly wrecks teams.

> This guide is about the *levels* and the *mix*. Writing your first actual unit test is covered in [Your First Unit Test](/guides/your-first-unit-test); replacing slow dependencies so unit tests stay fast is covered in [Mocking & Test Doubles](/guides/mocking-and-test-doubles).
