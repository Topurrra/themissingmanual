---
title: "Hashing for Speed"
guide: "hashing-for-speed"
phase: 0
summary: "Why a hash map turns an O(n) scan into an O(1) average lookup: buckets and hash functions explained plainly, frequency counting, the one-pass two-sum, set membership and de-duplication, plus the gotchas - unhashable keys, worst-case collisions, and unordered results."
tags: [algorithms, hashing, hash-map, dictionary, set, big-o, beginner-friendly]
category: algorithms
order: 8
difficulty: beginner
synonyms: ["how does a hash map work", "why are dictionaries O(1)", "hash map vs list lookup speed", "two sum hash map one pass", "frequency counting with a dictionary", "set membership deduplication"]
updated: 2026-08-06
---

# Hashing for Speed

The single most useful trick in everyday programming isn't a clever algorithm - it's a data structure. A
**hash map** (Python's `dict`, JavaScript's `Map`, Java's `HashMap`) lets you look something up in roughly
**constant time** no matter how much data you've stored, where a plain list forces you to scan item by item.
Learn to reach for it, and a whole class of "this is too slow" problems just evaporate.

This guide starts with *why* that constant-time lookup is even possible - the bucket-and-hash idea underneath
- and then puts it to work on three patterns you'll use constantly: counting things, finding pairs in one
pass, and testing membership / removing duplicates. Every example is runnable Python.

## How to read this

Read in order. Phase 1 builds the mental model of why lookups are fast, which makes the patterns in Phases 2
and 3 feel obvious instead of magical. If you've just read
[Two Pointers & the Sliding Window](/guides/two-pointers-and-sliding-window), you'll see the hash map solve
the same two-sum problem from a completely different angle - and without needing sorted input.

## The phases

1. **[Why Hash Maps Are Fast](01-why-hash-maps-are-fast.md)** · 🟢 Basic - scanning a list vs a hash lookup,
   and the buckets-plus-hash-function idea that makes O(1) average lookup possible.
2. **[Frequency Counting & Two-Sum](02-frequency-counting-and-two-sum.md)** · 🟡 Intermediate - counting
   occurrences with a dictionary, then the classic two-sum solved in a single pass.
3. **[Sets, Membership & Dedup](03-sets-membership-and-dedup.md)** · 🟢 Basic - the set for fast membership
   and de-duplication, and the gotchas: unhashable keys, worst-case collisions, and unordered results.
