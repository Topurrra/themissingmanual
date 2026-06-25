---
title: "Boolean Algebra: The Laws"
guide: "boolean-algebra-and-logic-gates"
phase: 1
summary: "Treat true/false as 1/0 and AND/OR/NOT as operations, and you get an algebra with laws — identity, complement, distribution, De Morgan — that let you simplify a tangled condition the way you simplify ordinary algebra."
tags: [logic, boolean-algebra, laws, simplification, de-morgan]
difficulty: beginner
synonyms: ["what is boolean algebra", "boolean algebra laws", "simplify a boolean expression", "boolean identity laws", "and or not algebra"]
updated: 2026-06-25
---

# Boolean Algebra: The Laws

You already push true and false around with words — and, or, not. Boolean algebra swaps the
words for symbols, so you can *calculate* with truth the way you calculate with numbers. The
payoff is real: a condition that looks like a tangle of `&&`, `||`, and `!` often collapses
into something short once you know a handful of rules.

This phase builds on [propositional logic](/guides/propositional-logic), where AND, OR, and
NOT were connectives between statements. Here they're operations in an algebra — and an algebra
comes with laws you can lean on.

## Two values, three operations

Boolean algebra is built from exactly two values:

- `1` means **true**
- `0` means **false**

That's the whole number system. No 2, no 5, no -1. Only on and off.

Three operations combine these values. Each has more than one common notation, and you'll meet
all of them in the wild, so see them side by side:

```text
AND   written   A · B    or   A ∧ B    or AB
OR    written   A + B    or   A ∨ B
NOT   written   ¬A       or   Ā  (an overbar)
```

The shorthand `AB` (two things side by side) means AND, the way `xy` means "x times y" in
ordinary algebra. This guide uses `·` for AND, `+` for OR, and `¬` for NOT, with the overbar
where it reads more cleanly.

A reminder of what each does, in case the symbols are new:

```text
A · B   is 1 only when BOTH A and B are 1
A + B   is 1 when EITHER A or B (or both) is 1
¬A      flips: ¬1 = 0, and ¬0 = 1
```

## The laws

Here's what makes this an *algebra*. These identities hold for any values of A, B, and C. Read
each as a sentence — that's how they stick.

**Identity** — combining with the "do nothing" value leaves you unchanged.

```text
A · 1 = A      AND-ing with true changes nothing
A + 0 = A      OR-ing with false changes nothing
```

**Domination (null)** — one value swallows everything.

```text
A · 0 = 0      AND-ing with false is always false
A + 1 = 1      OR-ing with true is always true
```

**Idempotent** — repeating yourself adds nothing.

```text
A · A = A      "A and A" is only A
A + A = A      "A or A" is only A
```

**Complement** — a thing and its opposite.

```text
A · ¬A = 0     something can't be true and false at once
A + ¬A = 1     something is either true or false — always
```

**Double negation** — two flips cancel.

```text
¬¬A = A        "not not A" is A
```

**Commutative** — order doesn't matter.

```text
A · B = B · A
A + B = B + A
```

**Associative** — grouping doesn't matter.

```text
(A · B) · C = A · (B · C)
(A + B) + C = A + (B + C)
```

**Distributive** — here boolean algebra goes beyond ordinary arithmetic. AND distributes over
OR, *and* OR distributes over AND (that second one fails for regular numbers).

```text
A · (B + C) = A·B + A·C
A + (B · C) = (A + B) · (A + C)
```

**Absorption** — a shortcut that collapses a redundant term.

```text
A + A·B = A     if A alone is enough, the extra AND doesn't matter
```

**De Morgan** — the rule for pushing a NOT through a group. A negated AND becomes an OR of
negations, and a negated OR becomes an AND of negations.

```text
¬(A · B) = ¬A + ¬B
¬(A + B) = ¬A · ¬B
```

De Morgan is the most useful law for cleaning up code conditions: it moves an outer `!` inward,
rewriting "not (this and that)" as something more readable. You met the truth-table version in
[propositional logic](/guides/propositional-logic); here it's a mechanical rewrite you apply on
sight.

## A worked simplification

Laws stay abstract until you watch them collapse a real expression. Let's simplify
`A + ¬A·B` down to `A + B`. Each step names the law that justifies it.

```text
Start:                A + ¬A·B

Distributive          (A + ¬A) · (A + B)
  (OR over AND):      we factor the A out across the +

Complement:           1 · (A + B)
  A + ¬A = 1          the left group is always true

Identity:             A + B
  1 · X = X           AND-ing with true changes nothing

Result:               A + B
```

Three named steps, and a five-symbol expression became three. `¬A·B` folds in because whenever
A is false, `¬A·B` is B — so the whole thing behaves like "A or B" anyway.

Here's a shorter one using absorption, simplifying `A · (A + B)` to `A`:

```text
Start:                A · (A + B)

Distributive:         A·A + A·B

Idempotent:           A + A·B
  A · A = A

Absorption:           A
  A + A·B = A

Result:               A
```

If A is true the whole thing is true; if A is false the whole thing is false. The expression
never depends on B — and the algebra proves it without you checking a single row of a truth
table.

## For builders

This is not a math-class party trick. Every time you write a condition like:

```text
if (isAdmin && !(isAdmin && isSuspended)) { ... }
```

you've shipped something harder to read than it needs to be. Apply De Morgan to the inner group,
then absorption, and it reduces to `isAdmin && !isSuspended`. Same behavior, half the surface
area for a bug to hide in.

Simplifying boolean conditions buys you three concrete things:

- **Clearer guards.** A short condition is one a reviewer can hold in their head.
- **Fewer bugs.** Redundant terms (`A + A·B`) are where a future edit changes one copy and
  forgets the other.
- **Honest intent.** When the code says `isAdmin && !isSuspended`, the rule is obvious; the
  tangled version leaves everyone guessing what it tests.

You don't have to do this by hand every time. But knowing the laws means you can *recognize*
when a condition is more complicated than the logic requires.

> ⚠️ **`+` is OR, not addition.** In boolean algebra `1 + 1 = 1`, not 2. The `+` means OR, so
> "true or true" is true — there's no value above 1 to land on. If you carry arithmetic
> instincts into these expressions, this is the trap that gets you. `A + A = A`, not `2A`.

## Recap

- Boolean algebra has exactly two values: `1` (true) and `0` (false).
- Three operations: AND (`·`), OR (`+`), NOT (`¬`) — each with several notations.
- The laws (identity, domination, idempotent, complement, double negation, commutative,
  associative, distributive, absorption, De Morgan) let you rewrite expressions while
  preserving their meaning.
- **De Morgan** pushes a NOT through a group; **absorption** drops redundant terms — together
  they clean up most real-world conditions.
- `+` means OR, so `1 + 1 = 1`. It is not arithmetic.

A quick check before you move on:

```quiz
[
  {
    "q": "In boolean algebra, what do the symbols 1 and 0 stand for?",
    "choices": ["The numbers one and zero, used for counting", "True and false, respectively", "On and off, where 0 is true", "Maximum and minimum signal strength"],
    "answer": 1,
    "explain": "Boolean algebra has only two values: 1 means true and 0 means false. There are no other numbers in the system."
  },
  {
    "q": "What does A + 1 simplify to?",
    "choices": ["A", "1", "0", "It depends on the value of A"],
    "answer": 1,
    "explain": "This is the domination (null) law: A + 1 = 1. OR-ing anything with true gives true, regardless of A. (And remember + is OR, not addition.)"
  },
  {
    "q": "Simplify A · (A + B).",
    "choices": ["A · B", "A + B", "A", "B"],
    "answer": 2,
    "explain": "By absorption (via distribution and idempotence), A · (A + B) = A. The result never depends on B: if A is true it's true, if A is false it's false."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Logic Gates: Logic Made Physical →](02-logic-gates-logic-made-physical.md)