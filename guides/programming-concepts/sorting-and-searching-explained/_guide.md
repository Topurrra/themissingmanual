---
title: "Sorting & Searching, Explained"
guide: "sorting-and-searching-explained"
phase: 0
summary: "How computers find things fast and put things in order: linear vs. binary search, then the classic sorts - bubble, merge, and quick - with the intuition behind each one's speed, not just the code."
tags: [algorithms, sorting, searching, binary-search, bubble-sort, merge-sort, quick-sort, beginner-friendly]
category: programming-concepts
order: 16
difficulty: beginner
synonyms: ["how does binary search work", "sorting algorithms explained", "bubble sort vs merge sort", "how do computers sort a list", "linear search vs binary search"]
updated: 2026-07-10
---

# Sorting & Searching, Explained

You already call `.sort()` and `in` without thinking twice. That's fine for most code - but the moment
something is slow, or an interviewer asks "how would you find this faster," you need the picture underneath
the built-in. Two questions drive almost everything here: *how do I find a value fast?* and *how do I put
things in order in the first place?* Each answer builds on the one before it - sorting exists partly to make
searching faster.

This guide keeps the code in Python so you can run every example as you read.

## How to read this

Read in order - binary search only makes sense once you've felt *why* linear search is slow, and every sort
after bubble sort is really "here's a cleverer way to avoid bubble sort's problem."

## The phases

1. **[Linear vs. Binary Search](01-linear-vs-binary-search.md)** - the two ways to find a value, and why
   sorted order unlocks a dramatically faster search.
2. **[Binary Search, Implemented](02-binary-search-implemented.md)** - the real algorithm on a sorted array,
   its complexity, and the off-by-one bugs that catch almost everyone once.
3. **[Bubble Sort](03-bubble-sort.md)** - the simplest sort there is: compare neighbors, swap, repeat. Slow,
   but it builds the intuition every other sort refines.
4. **[Merge Sort (and Quick Sort)](04-merge-sort-and-quick-sort.md)** - divide and conquer: split the problem
   in half, solve the halves, combine. The shape behind every fast general-purpose sort.
