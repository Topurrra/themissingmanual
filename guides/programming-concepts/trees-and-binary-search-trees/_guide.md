---
title: "Trees & Binary Search Trees"
guide: "trees-and-binary-search-trees"
phase: 0
summary: "What a tree actually is - nodes, root, children, leaves - then the binary search tree specifically: the ordering rule that makes search and insert fast, with real code building and searching one."
tags: [data-structures, trees, binary-search-tree, bst, nodes, beginner-friendly]
category: programming-concepts
order: 17
difficulty: beginner
synonyms: ["what is a tree data structure", "what is a binary search tree", "how does a bst work", "bst insert and search explained", "tree vs linked list"]
updated: 2026-07-10
---

# Trees & Binary Search Trees

A file system has folders inside folders. An org chart has a CEO with reports, who have their own reports.
An HTML page has elements nested inside elements. All three are the same shape wearing different clothes:
a **tree** - and once you can see that shape, a whole category of real code stops looking mysterious.

This guide starts with what a tree actually is, then narrows to one specific, hugely useful kind: the
**binary search tree**, which turns the ordering trick from
[Sorting & Searching, Explained](/guides/sorting-and-searching-explained) into a data structure you can
insert into and search on the fly.

## How to read this

Read in order - Phase 2's binary search tree only makes sense once "node," "child," and "leaf" from Phase 1
are second nature.

## The phases

1. **[What a Tree Is](01-what-a-tree-is.md)** - nodes, root, children, leaves, and why so many real-world
   structures turn out to be trees.
2. **[Binary Search Trees](02-binary-search-trees.md)** - the one ordering rule that makes a tree fast to
   search and insert into, with real code building one from scratch.
3. **[BST Performance & Gotchas](03-bst-performance-and-gotchas.md)** - why a BST is usually `O(log n)`,
   how it can silently degrade to `O(n)`, and what fixes that.
