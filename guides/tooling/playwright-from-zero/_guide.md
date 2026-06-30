---
title: "Playwright, From Zero"
guide: playwright-from-zero
phase: 0
summary: "Reliable browser end-to-end tests: auto-waiting locators that kill flakiness, cross-browser runs, tracing, and codegen to record a test by clicking."
tags: [playwright, e2e, testing, browser, automation, flaky-tests]
category: tooling
group: "Testing Tools"
order: 38
difficulty: intermediate
synonyms: ["playwright tutorial", "playwright vs selenium", "end to end testing", "browser automation testing", "playwright auto waiting", "playwright trace viewer", "playwright codegen"]
updated: 2026-06-30
---

# Playwright, From Zero

You wrote an end-to-end test. It passed five times, then failed on CI for no reason you can name. You added a `sleep(2)`, it passed, you moved on, and it failed again next week. That's not your fault - it's the tool fighting you. Playwright was built by people who lived that exact pain, and it removes most of it by design.

This guide gets you from nothing to a test suite you actually trust: tests that wait for the right thing automatically, run across Chromium, Firefox, and WebKit, and hand you a time-travel recording when something breaks.

## How to read this

Read the phases in order the first time. Phase 1 is the mental model - what Playwright is and why auto-waiting locators are the whole point. Phase 2 is the daily loop: writing, running, and debugging tests. Phase 3 is the stuff that bites you in real projects. Type the commands as you go; that's how this sticks.

## The phases

1. [The mental model: a browser you can boss around](01-the-mental-model.md) - what Playwright is, and why auto-waiting kills flakiness.
2. [The everyday loop: write, run, debug](02-the-everyday-loop.md) - locators, web-first assertions, codegen, and the trace viewer.
3. [Production reality: the things that bite](03-production-reality.md) - auth state, parallelism, network mocking, CI, and the classic traps.

[Phase 1: The mental model](01-the-mental-model.md) →
