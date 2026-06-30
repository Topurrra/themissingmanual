---
title: "Counting & Combinatorics"
guide: "counting-and-combinatorics"
phase: 0
summary: "How to count possibilities without listing them: multiply independent choices, and know when order matters (permutations) versus when it doesn't (combinations). It's the math behind probability, password strength, and why brute force blows up."
tags: [mathematics, combinatorics, permutations, combinations, counting, beginner-friendly]
category: mathematics
order: 4
difficulty: intermediate
synonyms: ["how to count possibilities", "permutations vs combinations", "what is a factorial", "multiplication principle", "how many combinations", "combinatorics basics"]
updated: 2026-06-25
---

# Counting & Combinatorics

"How many ways are there to…?" sounds like a question you answer by listing them all and counting. For
anything real — possible passwords, lottery tickets, ways to seat a team — that list is astronomically
long, and listing is hopeless. Combinatorics is the art of getting the count *without* the list, and it
rests on a few small, powerful rules.

This guide builds them up: the multiplication principle (the engine behind almost all counting), then
the crucial fork between **permutations** (when order matters) and **combinations** (when it doesn't),
and finally why this matters far beyond puzzles — it's the foundation of probability, the reason a long
password is strong, and the reason some problems are too big to brute-force. By the end, "how many ways"
becomes a calculation, not a guess.

## How to read this
- **Want the one rule that does the most?** [Phase 1](01-the-multiplication-principle.md) — the
  multiplication principle.
- **Want the whole toolkit?** Read in order — permutations and combinations (Phase 2) build on it.

## The phases
1. **[The Multiplication Principle](01-the-multiplication-principle.md)** — counting independent choices
   by multiplying, and the "and vs or" rule.
2. **[Permutations & Combinations](02-permutations-and-combinations.md)** — order matters vs order
   doesn't, factorials, and the formulas (with runnable code).
3. **[Why Counting Matters](03-why-counting-matters.md)** — the bridge to probability, password
   strength, and combinatorial explosion (why brute force fails).

> This builds on [Numbers & Number Systems](/guides/numbers-and-number-systems) and the set idea from
> [Sets, Relations & Functions](/guides/sets-relations-and-functions). It sets up the last foundation:
> probability and statistics.

---

[Phase 1: The Multiplication Principle →](01-the-multiplication-principle.md)
