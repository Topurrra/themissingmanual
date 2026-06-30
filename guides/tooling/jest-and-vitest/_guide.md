---
title: "Jest and Vitest"
guide: jest-and-vitest
phase: 0
summary: "JavaScript and TypeScript testing: Jest's batteries-included matchers, mocks, and snapshots — and Vitest, the faster, Vite-native drop-in with the same API."
tags: [jest, vitest, testing, javascript, typescript, mocks, snapshots]
category: tooling
group: "Testing Tools"
order: 37
difficulty: intermediate
synonyms: ["jest vs vitest", "how to test javascript", "jest mocks", "vitest setup", "snapshot testing", "jest fake timers", "testing async code js"]
updated: 2026-06-30
---

# Jest and Vitest

You wrote some JavaScript, it works on your machine, and now someone wants tests. You open the docs and drown in `describe`, `it`, `beforeEach`, `jest.fn()`, `toHaveBeenCalledWith`, snapshots, and two tools that look nearly identical. This guide cuts through it. You will learn one mental model that covers both Jest and Vitest, write tests you trust, and know exactly when to reach for which.

## How to read this

Read it in order the first time. Phase 1 gives you the shape of a test and why these tools exist. Phase 2 is the daily work: matchers, mocks, async, timers — the stuff you'll use every hour. Phase 3 is where tests go wrong: snapshot rot, flaky timers, mock leakage, and choosing between the two runners. If you've never written a unit test, read [Your First Unit Test](/guides/your-first-unit-test) first; this guide assumes you know what an assertion is.

## The phases

1. [The model: what a test runner does](01-the-test-runner-model.md)
2. [The daily core: matchers, mocks, async, timers](02-matchers-mocks-async.md)
3. [Production reality: snapshots, flakiness, and Jest vs Vitest](03-snapshots-flakiness-choosing.md)

[Phase 1: The model: what a test runner does](01-the-test-runner-model.md) →
