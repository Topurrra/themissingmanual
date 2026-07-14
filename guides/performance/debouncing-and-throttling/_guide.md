---
title: "Debouncing and Throttling"
guide: debouncing-and-throttling
phase: 0
summary: "Two related techniques for taming a firehose of events - waiting for a pause versus capping the rate - and how to pick between them."
tags: [performance, debouncing, throttling, events, frontend]
category: performance
order: 12
difficulty: intermediate
synonyms:
  - what is debouncing
  - what is throttling
  - debounce vs throttle
  - search as you type performance
  - scroll event firing too often
  - rate limiting events in javascript
updated: 2026-07-10
---

# Debouncing and Throttling

A single keystroke, scroll, or mouse movement doesn't sound like much - but a keyboard can fire an event every hundred milliseconds while someone types, and a scroll or mousemove can fire hundreds of times a second while someone drags. A handler that does real work - hitting an API, recalculating a layout - on every one of those events does far more than the situation calls for. Debouncing and throttling are the two standard ways to bring that firehose under control, solving different versions of the problem.

## How to read this

Phase 1 lays out why the naive "run the handler on every event" approach is a real performance problem, with concrete examples. Phase 2 covers debounce - waiting for a pause before acting, the pattern behind every good search box. Phase 3 covers throttle - guaranteeing a maximum rate no matter how many events fire - and how to choose between the two.

## The phases

1. [The firehose problem](01-the-firehose-problem.md) - why running a handler on every event is a real performance problem.
2. [Debounce: wait for a pause](02-debounce.md) - the search-box pattern and the timer-reset idea.
3. [Throttle: cap the rate](03-throttle.md) - the scroll-handler pattern, and choosing between debounce and throttle.

[Phase 1: The firehose problem](01-the-firehose-problem.md) →
