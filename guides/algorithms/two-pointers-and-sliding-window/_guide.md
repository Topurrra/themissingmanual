---
title: "Two Pointers & the Sliding Window"
guide: "two-pointers-and-sliding-window"
phase: 0
summary: "Two array patterns that turn nested-loop O(n²) scans into single-pass O(n) code: converging two pointers on a sorted array, the fixed and variable sliding window, and how to spot which one a problem is quietly asking for."
tags: [algorithms, two-pointers, sliding-window, arrays, strings, big-o, beginner-friendly]
category: algorithms
order: 7
difficulty: beginner
synonyms: ["two pointer technique explained", "sliding window algorithm", "longest substring without repeating characters", "max sum of k consecutive elements", "pair with target sum sorted array", "when to use two pointers"]
updated: 2026-08-06
---

# Two Pointers & the Sliding Window

A huge number of array and string problems have an obvious solution that checks every pair with two
nested loops - and that solution is `O(n²)`, which quietly falls over the moment the input gets big. Two
patterns rescue most of those problems and bring them down to a single pass, `O(n)`: the **two-pointer**
technique and the **sliding window**. They look like tricks the first time you see them, but they're really
one idea - *keep a couple of positions moving through the array so you never re-scan what you've already
seen.*

Every example here is Python you can run as you read. Once the shape clicks, you'll start recognizing it in
problems that never mention "pointers" or "windows" at all.

## How to read this

Read in order. Two pointers comes first because it's the simpler motion (two positions walking toward each
other); the sliding window is the same instinct applied to a moving range. The last phase is the payoff:
how to look at a fresh problem and tell which pattern it wants.

## The phases

1. **[Converging Two Pointers](01-converging-two-pointers.md)** · 🟢 Basic - two positions walking inward:
   reverse a list, check a palindrome, and find a pair that sums to a target on a sorted array.
2. **[The Sliding Window](02-the-sliding-window.md)** · 🟡 Intermediate - a moving range over the data: max
   sum of `k` consecutive items, and the longest substring with no repeated character.
3. **[Choosing the Pattern](03-choosing-the-pattern.md)** · 🟢 Basic - the signals that tell you which
   pattern a problem wants, and the gotchas (unsorted input, off-by-one bounds) that bite everyone once.
