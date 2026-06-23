---
title: "Bisecting a Bug (git bisect & Binary-Search Thinking)"
guide: "bisecting-a-bug"
phase: 0
summary: "When something worked before and is broken now, you don't search commit by commit — you halve the suspect range each test, so 1000 commits take about 10 checks; git bisect automates the hunt, and the same halving idea finds the bad config line, input row, or dependency."
tags: [git, bisect, debugging, binary-search, regression, root-cause]
category: debugging
order: 6
difficulty: intermediate
synonyms: ["git bisect tutorial", "how to find which commit broke it", "find the commit that introduced a bug", "binary search for a bug", "what is git bisect", "find which change caused the regression"]
updated: 2026-06-19
---

# Bisecting a Bug

Something used to work. Now it doesn't. Somewhere between "fine last month" and "broken today" sits the
one change that did it — buried in a hundred commits, or a thousand-line config, or a giant input file.
The slow, miserable way is to check suspects one at a time until you stumble onto it. There's a far
faster way, and it's the same trick whether you're hunting a commit, a line, or a row.

This guide teaches you to find the needle by repeatedly throwing away half the haystack. You'll learn the
idea first, then `git bisect` (the tool that does it for commits, automatically if you let it), then how
to apply the very same method to anything that has a "before it worked / now it's broken" shape.

## How to read this

- **Need to find the bad commit right now?** Jump to [Phase 2: git bisect](02-git-bisect.md) — it's a
  full annotated session you can follow step by step.
- **Want the idea to stick for life?** Read in order. Phase 1 installs the mental model that makes
  everything else obvious, and Phase 3 shows you how far it reaches beyond Git.

## The phases

1. **[Binary-Search Thinking](01-binary-search-thinking.md)** — the powerful idea: halve the suspect
   range each test, so the search cost grows by *adding one check* when the haystack *doubles*. The three
   things you need to do it at all.
2. **[git bisect](02-git-bisect.md)** — the hands-on tool: mark one known-good and one known-bad commit,
   test each midpoint Git hands you, and let it name the exact first bad commit. Plus `git bisect run` to
   automate the whole thing.
3. **[Bisecting Beyond Git](03-bisecting-beyond-git.md)** — the method generalizes: halving to find which
   config line, which input row, which dependency, or which block of code is the culprit — and the one
   thing that quietly ruins every bisect if you skip it.

> Deep rewriting-history rescue (when a bisect or a fix leaves your branch in a tangle) lives in
> [Git Disaster Recovery](/guides/git-disaster-recovery). This guide stays focused on *finding* the bad
> change, not surgically removing it.
