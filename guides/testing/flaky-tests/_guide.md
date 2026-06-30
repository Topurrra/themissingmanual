---
title: "Flaky Tests"
guide: "flaky-tests"
phase: 0
summary: "Why a test passes and fails with no code change, the usual culprits, and how to kill flakiness for good instead of hiding it behind retries."
tags: [testing, flaky-tests, nondeterminism, async, test-isolation, ci]
category: testing
order: 8
difficulty: intermediate
synonyms: ["why does my test pass and fail randomly", "how to fix flaky tests", "test passes locally fails in ci", "intermittent test failures", "test fails only sometimes", "how to make tests deterministic", "test order dependency", "async test race condition"]
updated: 2026-06-30
---

# Flaky Tests

You wrote a test. It passed. You changed nothing - and on the next run it failed. Re-run it, green again. That little flip of the stomach, the "is it me or is it the test?" - that's a flaky test, and it's quietly the most demoralizing thing in a test suite. This guide gives you the mental model for *why* a test does this, a field guide to the usual culprits, and a calm playbook for killing flakiness instead of papering over it.

## How to read this

- **Need to understand what's happening?** Read [Phase 1](01-what-a-flaky-test-is.md) - it's the whole mental model in one phase: a flaky test is nondeterministic, and here's where the nondeterminism sneaks in.
- **Staring at one right now?** Phase 2 is the field guide to the specific culprits - time, async, order, shared state, real externals - with the shape each one has.
- **Want to fix it for good?** Phase 3 is the diagnose-and-fix-and-quarantine playbook.

## The phases

1. **[What a Flaky Test Actually Is](01-what-a-flaky-test-is.md)** - the mental model: a passing test is a deterministic function, and flakiness is hidden nondeterminism leaking into it. Once you see tests this way, every culprit in Phase 2 has the same shape.
2. **[The Usual Culprits](02-the-usual-culprits.md)** - a field guide to the five everyday sources of flakiness: timing and sleeps, async not awaited, test order and shared state, real network/clock/randomness, and leaked resources. How to recognize each by its fingerprint.
3. **[Diagnose, Fix, Quarantine](03-diagnose-fix-quarantine.md)** - the playbook: rerun and isolate and seed to find the cause, control time/randomness/state/externals to fix it, and quarantine (never silently ignore) when you can't fix it today.

[Phase 1: What a Flaky Test Actually Is](01-what-a-flaky-test-is.md) →
