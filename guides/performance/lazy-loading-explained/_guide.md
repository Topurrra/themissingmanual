---
title: "Lazy Loading Explained"
guide: lazy-loading-explained
phase: 0
summary: "Why deferring work until it's actually needed is one of the cheapest performance wins available, and where it stops paying off."
tags: [performance, lazy-loading, images, code-splitting, frontend]
category: performance
order: 10
difficulty: beginner
synonyms:
  - what is lazy loading
  - lazy loading vs eager loading
  - 'loading="lazy" images'
  - code splitting explained
  - defer loading until needed
  - infinite scroll performance
updated: 2026-07-04
---

# Lazy Loading Explained

You open a long page. It has forty images, a chat widget, an analytics script, and a video player near the bottom. If the browser fetched and set up all of it the instant you arrived, you'd wait for things you might never scroll to. Lazy loading is the fix: don't do the work until something proves it's actually needed. This guide covers the idea, the three places you'll use it constantly, and the tradeoff that keeps it from being a free lunch.

## How to read this

Phase 1 builds the mental model — the difference between eager and lazy, and why "load everything now" is the default that quietly costs you. Phase 2 is where you'll actually use it day to day: images, route-based code, and "load more" patterns. Phase 3 is the honest tradeoff — what lazy loading can break, and when loading eagerly is the better call.

## The phases

1. [Don't do work nobody asked for yet](01-dont-do-work-nobody-asked-for.md) — the general principle, contrasted with eager loading.
2. [Where you'll actually use it](02-where-youll-use-it.md) — images, code-splitting, and infinite scroll.
3. [The tradeoff](03-the-tradeoff.md) — layout shift, missing content, and when eager wins.

[Phase 1: Don't do work nobody asked for yet](01-dont-do-work-nobody-asked-for.md) →
