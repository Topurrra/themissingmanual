---
title: "Sets: Collections of Distinct Things"
guide: "sets-relations-and-functions"
phase: 1
summary: "A set is an unordered collection of distinct elements. Membership, subsets, and the three core operations - union, intersection, difference - plus the empty set, explained with plain intuition and runnable code."
tags: [mathematics, sets, union, intersection, set-operations]
difficulty: beginner
synonyms: ["what is a set in math", "union intersection difference", "what is a subset", "empty set", "set membership"]
updated: 2026-06-25
---

# Sets: Collections of Distinct Things

Almost everything else in this guide - relations, functions, the machinery you'll lean on later - is built on one humble idea: the set. You already think in sets all the time; you haven't been handed the vocabulary yet. This phase hands it to you, slowly and with no surprises.

## What a set is

A **set** is a collection of things where two rules hold:

- **Order doesn't matter.** The collection has no "first" or "last".
- **Duplicates don't count.** A thing is either in the set or it isn't. There's no "in it twice".

That's the whole definition. The things inside are called **elements** (or **members**).

We write a set by listing its elements inside curly braces:

```
{1, 2, 3}
```

Because order doesn't matter, `{1, 2, 3}` and `{3, 1, 2}` are the *same set*. And because duplicates don't count, `{1, 2, 2, 3}` is that same set too - the repeated `2` adds nothing.

You meet sets constantly without naming them:

- **The set of weekdays:** `{Monday, Tuesday, Wednesday, Thursday, Friday}`. Listing Tuesday twice wouldn't create a second Tuesday.
- **The set of users who liked a post.** A user either liked it or didn't. Liking it twice is meaningless - they're in the set, full stop.
- **The set of vowels:** `{a, e, i, o, u}`.

The mental model to carry: a set is a **bag of distinct things where you only ever ask one question - is this thing in the bag or not?** Not *how many times*, not *in what position*. Only in or out.

## Membership: ∈ and ∉

That one question - "is this thing in the bag?" - gets its own symbol.

- `x ∈ S` reads "**x is an element of S**" (x is in the set).
- `x ∉ S` reads "**x is not an element of S**".

With `S = {a, e, i, o, u}`:

- `a ∈ S` is true.
- `b ∉ S` is true.

The `∈` symbol is a stylized "e" for *element*. If unfamiliar notation makes you tense up, that's normal and it passes - there's a gentle warm-up in [Why math isn't your enemy](/guides/why-math-isnt-your-enemy).

## The empty set

A set can have no elements at all. This is the **empty set**, written `∅` or `{ }`.

It sounds like a technicality, but it's genuinely useful - it's the answer to "which weekdays start with the letter Z?" The honest answer is *none*, and `∅` is how we write *none* as a set. Often you don't want a special case for "nothing"; you want "nothing" to be an ordinary set you can work with.

There is exactly one empty set, and it lives inside every other set's story (you'll see why in the next section).

## Subsets and equality

Sometimes one set sits entirely inside another.

`A ⊆ B` reads "**A is a subset of B**" and means: every element of A is also an element of B.

For example, if `A = {1, 2}` and `B = {1, 2, 3}`, then `A ⊆ B` - both `1` and `2` are in B.

Two things worth knowing:

- **Every set is a subset of itself.** `B ⊆ B` is always true, because every element of B is (trivially) in B.
- **The empty set is a subset of every set.** `∅ ⊆ B` is always true. There are no elements in `∅` that could fail to be in B, so the condition holds with nothing to check.

**Set equality** falls out neatly: `A = B` exactly when `A ⊆ B` *and* `B ⊆ A`. In plain words, two sets are equal when they have exactly the same elements - which is why order and duplicates never affect equality.

## The three operations

Most real work with sets comes down to combining them. There are three combinations you'll use over and over. For each, picture two overlapping circles - the classic Venn picture - and ask which region you're keeping.

### Union: A ∪ B

The **union** is everything in **either** set (or both). You keep *both whole circles*.

```
{1, 2, 3} ∪ {3, 4, 5}  =  {1, 2, 3, 4, 5}
```

The `3` appears in both inputs but only once in the result - it's still a set, so it stays distinct. Think "**combine them**".

### Intersection: A ∩ B

The **intersection** is only the things in **both** sets. You keep *just the overlap* - the lens-shaped middle where the circles cross.

```
{1, 2, 3} ∩ {3, 4, 5}  =  {3}
```

Only `3` is in both. Think "**what do they share?**" If two sets share nothing, their intersection is the empty set.

### Difference: A \ B

The **difference** `A \ B` is the things in **A that are not in B**. You keep *the part of A's circle that doesn't overlap*.

```
{1, 2, 3} \ {3, 4, 5}  =  {1, 2}
```

`3` is removed because it's also in B; `4` and `5` were never in A, so they're irrelevant. Think "**A, minus anything B also has**". Order matters here: `B \ A` would be `{4, 5}`, a different answer.

## See it run

Python has sets built in, and they behave exactly like the math. Run this:

```python runnable
a = {1, 2, 3, 3}      # the duplicate 3 collapses
b = {3, 4, 5}
print(a)              # {1, 2, 3}
print(a | b)          # union
print(a & b)          # intersection
print(a - b)          # difference
```

*What just happened:* The first line wrote `3` twice, but a set keeps each element once, so `print(a)` shows `{1, 2, 3}` - the duplicate collapsed. Then `a | b` is the **union** `{1, 2, 3, 4, 5}`, `a & b` is the **intersection** `{3}`, and `a - b` is the **difference** `{1, 2}`. In Python the symbols are `|` for union, `&` for intersection, and `-` for difference.

## For builders

If you write code, you already have this tool. Both Python and JavaScript ship a `Set` type.

- **Deduping a list.** Wrapping a list in a set throws away repeats: in Python `set([1, 1, 2, 3])` gives `{1, 2, 3}`; in JS `new Set([1, 1, 2, 3])`. It's the fastest honest way to answer "what are the unique values here?"
- **Fast membership tests.** Checking `x in my_set` is roughly **O(1)** - constant time, no matter how big the set is. Checking `x in my_list` scans the whole list, which is O(n). If you're repeatedly asking "have I seen this?", reach for a set.
- **Tags and permissions.** These are sets in disguise. "Posts tagged both `python` and `beginner`" is an **intersection**. "Everything a user can do across all their roles" is a **union** of permission sets. "Allowed actions minus the ones currently blocked" is a **difference**. Naming the operation makes the code obvious.

## Recap

- A **set** is an unordered collection of **distinct** elements: order doesn't matter, duplicates don't count.
- `x ∈ S` means x is in S; `x ∉ S` means it isn't.
- The **empty set** `∅` has no elements and is a subset of every set.
- `A ⊆ B` means every element of A is in B; `A = B` when each is a subset of the other.
- The three operations: **union** `∪` (either), **intersection** `∩` (both), **difference** `\` (in A, not B).
- In code: sets dedupe, give O(1) membership, and model tags and permissions cleanly.

> ⚠️ **A set is not a list.** Duplicates silently collapse and order is not guaranteed when you iterate - if you need ordering or repeated values, you want a list (or array), not a set. Reach for a set only when the single question "is this in the collection?" is all you care about.

A quick check before you move on:

```quiz
[
  {
    "q": "Which statement about sets is true?",
    "choices": [
      "{1, 2, 3} and {3, 2, 1} are different sets because the order differs",
      "{1, 2, 2, 3} contains the element 2 twice",
      "{1, 2, 3} and {3, 1, 2} are the same set, and duplicates don't count",
      "A set must always list its elements in increasing order"
    ],
    "answer": 2,
    "explain": "Sets are unordered and hold only distinct elements, so reordering or repeating elements doesn't create a different set."
  },
  {
    "q": "What is the intersection of {1, 2, 3} and {3, 4, 5}?",
    "choices": [
      "{1, 2, 3, 4, 5} - everything in either set",
      "{3} - only what's in both sets",
      "{1, 2} - what's in the first but not the second",
      "{ } - they share nothing"
    ],
    "answer": 1,
    "explain": "Intersection keeps only elements present in both sets. Only 3 appears in both, so the result is {3}."
  },
  {
    "q": "What is the empty set?",
    "choices": [
      "A set containing the single element 0",
      "A set with no elements, written ∅ or { }",
      "A set that can never be a subset of another set",
      "The same thing as an undefined or invalid set"
    ],
    "answer": 1,
    "explain": "The empty set ∅ (also written { }) has no elements at all, and it is a subset of every set."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Relations & Functions →](02-relations-and-functions.md)