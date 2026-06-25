---
title: "Permutations & Combinations"
guide: "counting-and-combinatorics"
phase: 2
summary: "When order matters, you count permutations (n! and nPr). When order doesn't matter, you count combinations (nCr). Knowing which question you're asking is the whole game."
tags: [mathematics, permutations, combinations, factorial]
difficulty: beginner
synonyms: ["permutations vs combinations", "what is a factorial", "nCr formula", "when does order matter", "how many ways to choose"]
updated: 2026-06-25
---

# Permutations & Combinations

In [Phase 1](01-the-multiplication-principle.md) you learned to count step by step: if a
choice has *a* options and the next has *b* options, the two together have *a × b*
outcomes. That idea powers everything here. This phase asks two of the most common
counting questions you'll ever meet — and the only thing separating them is a question
you have to learn to ask out loud.

## The two questions

Almost every "how many ways…" problem is one of these:

- **Order matters.** Gold, silver, bronze are different. Seat 1 and seat 2 are different.
  Counting these is **permutations**.
- **Order doesn't matter.** A handful of pizza toppings is the same handful in any order.
  A committee is the same committee no matter who you name first. Counting these is
  **combinations**.

Same raw ingredients — pick *r* things from *n* — but two very different counts. Before
any formula, build the reflex: *does swapping two of my chosen things change the answer?*
If yes, order matters. If no, it doesn't.

## Factorial: counting orderings

Start with the simplest "order matters": arrange *all* of your items.

How many ways can 3 books sit on a shelf? Pick the leftmost: 3 choices. The next:
2 books remain. The last spot: 1 book left. By the multiplication principle that's
`3 × 2 × 1 = 6`.

That product — multiply every whole number from *n* down to 1 — is the **factorial**,
written `n!`:

```
n! = n × (n − 1) × (n − 2) × … × 1
```

So `5! = 5 × 4 × 3 × 2 × 1 = 120`. Factorials grow ferociously fast: `10!` is already
over three million.

One value surprises people: `0! = 1`. Read it as "how many ways are there to arrange
nothing?" Exactly one — the empty arrangement. It isn't a typo or a special case bolted
on; it's the value that keeps the formulas below from breaking, as you'll see in a
moment.

## Permutations: arranging a few of many

Often you arrange a *few* items, not all of them.

**Eight runners, and you want the top three: gold, silver, bronze.** Order absolutely
matters (gold is not bronze). Walk it like Phase 1:

- Gold: 8 runners could win it.
- Silver: 7 remain.
- Bronze: 6 remain.

That's `8 × 7 × 6 = 336` possible podiums.

Notice you multiplied only 3 of the factors of `8!`, then stopped. The formula captures
exactly that "stop early":

```
nPr = n! / (n − r)!
```

The `(n − r)!` in the denominator cancels off the factors you *didn't* use. Check it:
`8! / 5! = (8 × 7 × 6 × 5!) / 5! = 8 × 7 × 6 = 336`. The 5! divides clean away, leaving
the three factors you actually counted.

Here *n* = 8 (the pool), *r* = 3 (the spots), and the order of those 3 is part of what
makes each podium distinct.

## Combinations: choosing without order

Now change one word in the question.

**Eight pizza toppings, and you want three of them.** Mushroom-pepper-onion is the *same
pizza* as onion-mushroom-pepper. Order doesn't matter, so we should count *fewer* than
336 — because we decided a bunch of those 336 were duplicates.

How many duplicates? Any single group of 3 toppings can be listed in `3! = 6` orders,
and the permutation count treated all 6 as separate. So we overcounted every real
selection by a factor of `3!`. Divide it back out:

```
336 / 6 = 56
```

That's the **combination** count, and the formula bakes in that division:

```
nCr = n! / (r! (n − r)!)
```

It's `nPr` with one extra `r!` in the denominator — the exact factor by which order
inflated the count. Same eight things, same three picks, but 56 instead of 336.

## See it run

Python has all three built in. Run this:

```python runnable
import math
print(math.factorial(5))   # 120
print(math.perm(8, 3))     # ordered: 8*7*6 = 336
print(math.comb(8, 3))     # unordered: 56
```

*What just happened:* `math.factorial(5)` printed **120** — the orderings of 5 items.
`math.perm(8, 3)` printed **336** — the ordered top-3 podiums (`8 × 7 × 6`).
`math.comb(8, 3)` printed **56** — the unordered 3-topping selections. The permutation count
is larger than the combination count because order multiplies in extra arrangements: every
one of those 56 selections shows up `3! = 6` times when order is tracked, and `56 × 6 = 336`.

## The deciding question, side by side

Hold the contrast in your head — the numbers are identical and the answers are not:

| Question | Order? | Count |
|---|---|---|
| Top-3 finishers (gold/silver/bronze) from 8 runners | matters | 336 |
| 3-person committee from 8 people | doesn't | 56 |

Both pick 3 from 8. The committee is six times smaller for one reason: a committee of
{Ana, Ben, Cleo} is one committee, but as a ranking it's six different podiums. Decide
*order or not* first; the formula is the easy part.

## For builders

This shows up the moment you count possibilities in code or size a problem:

- **Choosing a subset → combinations (`nCr`).** Feature flags turned on, cards dealt from
  a deck, which sensors to sample, which test cases to bundle. The selection is a *set*;
  order is meaningless.
- **Arranging or ranking → permutations (`nPr`).** Tournament seedings, leaderboard top-N,
  the order tasks run in, password/PIN spaces where position matters.

Gut check before you reach for a library: if reordering your answer gives you "the same
thing," you want `comb`. If reordering gives you "a different thing," you want `perm`.
Both live in Python's `math` module, so you rarely write the factorials by hand.

> ⚠️ **The classic mistake:** using permutations when order doesn't matter. You'll overcount
> by exactly a factor of `r!`. That isn't a coincidence — it *is* the `r!` sitting in the
> denominator of `nCr`. If a count comes out suspiciously large (your 56 committees ballooned
> to 336), ask whether you accidentally counted the same group in every possible order.

## Recap

- `n!` counts the orderings of *n* distinct items; `0! = 1`.
- **Permutations** (`nPr = n! / (n − r)!`) count arrangements — order matters.
- **Combinations** (`nCr = n! / (r! (n − r)!)`) count selections — order doesn't.
- The difference between them is the factor `r!`, the number of ways to reorder your *r* picks.
- Always ask the deciding question first: *does order matter?* Everything else follows.

This whole machine is built from the multiplication principle and the idea of distinct
items — if "distinct" feels slippery, [Sets, relations, and functions](/guides/sets-relations-and-functions)
makes the notion of a set (order-free, no repeats) precise. And if the formulas still
feel like spells, [Why math isn't your enemy](/guides/why-math-isnt-your-enemy) is worth
a detour.

Quick check before moving on:

```quiz
[
  {
    "q": "What does n! (n factorial) count?",
    "choices": [
      "The number of ways to arrange n distinct items in order",
      "The number of ways to choose some of n items, ignoring order",
      "The sum of all whole numbers from 1 to n",
      "The number of subsets of an n-item set"
    ],
    "answer": 0,
    "explain": "n! = n × (n−1) × … × 1 multiplies the choices at each position, which is exactly the count of orderings of n distinct items."
  },
  {
    "q": "You're choosing a 3-person committee from 10 people. Permutation or combination?",
    "choices": [
      "Permutation, because you pick people one at a time",
      "Combination, because the committee is the same regardless of the order you name people",
      "Permutation, because 3 is smaller than 10",
      "Neither — it's a plain factorial"
    ],
    "answer": 1,
    "explain": "Reordering the committee members gives the same committee, so order doesn't matter. That's a combination (nCr)."
  },
  {
    "q": "How many ways can you choose 2 toppings from 4 (order doesn't matter)?",
    "choices": [
      "12",
      "8",
      "6",
      "4"
    ],
    "answer": 2,
    "explain": "nCr = 4! / (2! · 2!) = 24 / 4 = 6. (As a permutation it would be 4 × 3 = 12, which double-counts each pair.)"
  }
]
```

[← Phase 1: The Multiplication Principle](01-the-multiplication-principle.md) · [Guide overview](_guide.md) · [Phase 3: Why Counting Matters →](03-why-counting-matters.md)