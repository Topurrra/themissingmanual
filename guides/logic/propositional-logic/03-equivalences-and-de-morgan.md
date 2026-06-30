---
title: "Equivalences & De Morgan's Laws"
guide: "propositional-logic"
phase: 3
summary: "Two statements are logically equivalent when they have identical truth tables. De Morgan's laws - how to correctly distribute a NOT across AND/OR - are the equivalence you'll use most when negating and simplifying conditions."
tags: [logic, equivalence, de-morgan, simplification, propositional-logic]
difficulty: beginner
synonyms: ["what is logical equivalence", "de morgan's laws", "how to negate an and condition", "simplify a boolean expression", "not (a and b)"]
updated: 2026-06-25
---

# Equivalences & De Morgan's Laws

In Phase 2 you learned to build truth tables - the row-by-row record of when a statement
is true and when it's false. This phase puts that tool to work. Once you can write a
statement's truth table, you can answer a deeper question: *are these two statements
actually the same?* And from that comes the single most useful rule in everyday logic -
De Morgan's laws - what you reach for every time you need to flip a condition around.

## When two statements are the same

Look at these two sentences:

- "It is not the case that the door is unlocked."
- "The door is locked."

Different words, same meaning. In logic we want a way to say "same meaning" that doesn't
depend on how clever you are with English. The answer is the truth table.

Two statements are **logically equivalent** when they have the *same truth table* - the
same true/false result in every single row, for every combination of inputs. We write it
with a three-bar sign:

```text
A ≡ B   means   A and B are true in exactly the same situations
```

Why it matters: equivalent statements are **interchangeable**. Swap one for the other
anywhere, and nothing about when things come out true or false changes. That's what lets
you take a tangled condition and replace it with a cleaner one that means the exact same
thing.

Note what equivalence is *not*: not "they're true right now," but "they agree in every
possible row." You check it by lining up the two truth tables and confirming the final
columns match top to bottom.

## De Morgan's laws

Here's the situation you'll hit constantly. You have a statement built with AND or OR, and
you need its opposite - its negation. The tempting move is to stick a NOT in front and
leave everything else alone. That move is a trap, and De Morgan's laws get it right.

There are two of them:

```text
¬(A ∧ B) ≡ ¬A ∨ ¬B
¬(A ∨ B) ≡ ¬A ∧ ¬B
```

In plain English:

- **not (both A and B)** is the same as **(not A) OR (not B)**.
  If it's not true that you have *both*, then at least one is missing.
- **not (either A or B)** is the same as **(not A) AND (not B)**.
  If it's not true that you have *either one*, then you're missing *both*.

A real example for the first law. Say the rule is "you need both a ticket AND a passport."
When is that rule violated? When you're missing the ticket, OR missing the passport, OR
missing both. You don't need to be missing both to fail - missing *one* is enough. That's
exactly `¬A ∨ ¬B`.

### Proving one of them

Let's not take it on faith. Here's the truth table for `¬(A ∧ B)` and `¬A ∨ ¬B` side by
side. If the last two columns match in every row, they're equivalent.

```text
 A     B    A∧B   ¬(A∧B) | ¬A    ¬B    ¬A∨¬B
----- ----- ----- ------ | ----- ----- ------
 T     T     T      F    |  F     F      F
 T     F     F      T    |  F     T      T
 F     T     F      T    |  T     F      T
 F     F     F      T    |  T     T      T
```

Compare the `¬(A∧B)` column with the `¬A∨¬B` column: `F, T, T, T` in both. They agree in
all four rows. That's the proof - they're equivalent. The other law,
`¬(A ∨ B) ≡ ¬A ∧ ¬B`, checks out the same way; building that table is a worthwhile exercise
to convince yourself.

## The key insight: NOT flips the connective

Look closely at what happened. We started with an AND inside the parentheses. After pushing
the NOT inward, we ended up with an OR. The connective changed.

This is the heart of De Morgan, and the part people get wrong:

> When you push a NOT inside a group, **AND flips to OR, and OR flips to AND.**

You can't sprinkle NOTs on the pieces and keep the same connective. The connective itself
has to switch. Say it as a chant: *negate each part, and flip the operator.* That single
habit prevents the most common logic bug there is.

## A few more equivalences worth knowing

De Morgan is the star, but a handful of others round out your toolkit. Each is worth a
single line:

- **Double negation:** `¬¬A ≡ A` - two NOTs cancel out. "Not not raining" means "raining."
- **Commutativity:** `A ∧ B ≡ B ∧ A` and `A ∨ B ≡ B ∨ A` - order doesn't matter for a plain
  AND or OR.
- **Distribution:** `A ∧ (B ∨ C) ≡ (A ∧ B) ∨ (A ∧ C)` - an AND spreads across an OR much
  like multiplication spreads across addition.

You don't need to memorize these the way you need De Morgan. But recognizing them helps
when you're simplifying a messy expression and want to know which rewrites are legal.

## Two equivalences that change how you read code

These two are less about simplification and more about *translation* - they let you
rewrite a condition into a shape that's easier to think about.

**Implication as disjunction:** `P → Q ≡ ¬P ∨ Q`

An "if… then…" is logically the same as "either the if-part is false, or the then-part
is true." This is the bridge between propositional logic and the `if` statements you
write. When you see `if (P) { Q }`, the condition that makes the block *not* run is
`¬P` - and the whole statement `P → Q` is only false when `P` is true and `Q` is false.

**Biconditional (if and only if):** `P ↔ Q ≡ (P → Q) ∧ (Q → P)`

"P if and only if Q" means both directions hold: P implies Q *and* Q implies P. In code,
this is the "both or neither" pattern - you want either both conditions true or both
false. The biconditional is `true` when P and Q agree (both true or both false) and
`false` when they differ.

```text
P ↔ Q   is true when:
  P = true,  Q = true   (both)
  P = false, Q = false  (neither)

P ↔ Q   is false when:
  P = true,  Q = false  (mismatch)
  P = false, Q = true   (mismatch)
```

The XOR gate you met in [boolean algebra](/guides/boolean-algebra-and-logic-gates) is
the *negation* of the biconditional: `P ⊕ Q ≡ ¬(P ↔ Q)`. XOR fires on mismatch;
biconditional fires on match.

## For builders

The implication-as-disjunction rewrite is how you read complex guards. Suppose you have:

```text
if (isAdmin || isOwner) { canEdit() }
```

The *only* case where `canEdit()` does *not* run is when both `isAdmin` and `isOwner`
are false - which is exactly `¬(isAdmin ∨ isOwner) ≡ ¬isAdmin ∧ ¬isOwner` by De Morgan.
The "block" branch is the negated condition, and De Morgan tells you its shape.

The biconditional shows up in validation: "the form is valid *if and only if* all required
fields are filled." That means filling all fields is *necessary* (without them, invalid)
and *sufficient* (with them, valid). Both directions. [Implication & Conditionals](/guides/implication-and-conditionals)
explores necessary and sufficient in depth.

## ⚠️ The classic bug: negating an AND wrong

This mistake is everywhere. You have a condition `a && b` and you want its opposite. Your
instinct is to negate each piece and keep the AND:

```text
WRONG:   not (a && b)   →   !a && !b
RIGHT:   not (a && b)   →   !a || !b
```

The wrong version says "*both* are false." But the opposite of "both true" isn't "both
false" - it's "*not* both true," which means at least one is false. That's an OR, not an AND.

Concrete check: suppose `a` is true and `b` is false. Then `a && b` is false, so its
negation should be **true**. The wrong version `!a && !b` evaluates to `false && true`
= `false` - wrong answer. The right version `!a || !b` evaluates to `false || true` = `true`
- correct. The AND-to-OR flip is doing real work, and skipping it silently breaks your logic.

## For builders

This shows up the moment you write `if` statements and loop guards.

Suppose you let someone through only when they're logged in *and* verified:

```text
if (loggedIn && verified) { allow() }
```

Now you want the "block them" branch - the inverse condition. De Morgan tells you exactly
how to write it:

```text
if (!loggedIn || !verified) { block() }
```

NOT, applied to `loggedIn && verified`, becomes `!loggedIn || !verified`. The AND became an
OR. Anyone missing *either* requirement gets blocked, which is what you want.

The same rule rescues you when you flip a loop guard. A loop that runs *while* both
conditions hold:

```text
while (hasNext && !error) { ... }
```

stops when that guard goes false - that is, when `!hasNext || error`. Reading the stop
condition correctly means applying De Morgan in your head.

Two practical habits:

- **When you invert a condition, apply De Morgan - don't eyeball it.** Negate each part and
  flip every `&&` to `||` and every `||` to `&&`. Mishandling this is a frequent source of
  "the check passes when it shouldn't" bugs.
- **Use it to simplify.** A condition like `!(x > 0 && x < 10)` is often clearer rewritten as
  `x <= 0 || x >= 10`. (Note the comparisons flipped too - the negation of `>` is `<=`, and of
  `<` is `>=`.) Same meaning, easier to read.

## Recap, and where this guide lands

You now have the three ideas that make propositional logic *useful* rather than merely true:

- **Logical equivalence** means two statements share an identical truth table, which makes
  them interchangeable.
- **De Morgan's laws** let you correctly negate AND/OR: `¬(A ∧ B) ≡ ¬A ∨ ¬B` and
  `¬(A ∨ B) ≡ ¬A ∧ ¬B`.
- **Pushing a NOT inward flips the connective** - AND becomes OR, OR becomes AND - and that
  flip is the part everyone forgets.

Across this guide you went from "what is a proposition" to building truth tables to
transforming statements while preserving their meaning. That's the whole core of
propositional logic, and it's the machinery underneath every conditional you'll ever write.

There's one connective we've been circling but never opened up: implication - "if A, then B."
It surprises almost everyone the first time (an implication can be true even when its "if"
part never happens), and it's the backbone of reasoning, proofs, and the conditionals in your
code. That's the natural next step: implication and conditionals, where logic starts to look a
lot like the `if` statements you already write.

## Logic you already use: regular expressions

If you've written a regex, you've written propositional logic. A regex pattern is a
compound condition over a string - exactly the kind of thing you've been studying.

- `a && b` in code is `a.*b` in regex: both must appear, in order.
- `a || b` is `a|b`: either one matches.
- `!a` is `[^a]` or a negative lookahead `(?!a)`: "not this character."
- `(a && b) || c` is `(a.*b)|c`: group the AND, then OR with c.

The operators are different, but the *shape* of the reasoning is identical. De Morgan
works on regex conditions too: the opposite of "must contain a digit *and* a letter"
is "missing a digit *or* missing a letter."

Regex adds one thing pure logic doesn't: **repetition** (`*`, `+`, `?`) and **capture**.
But the core - what counts as a match, what the pattern requires - is propositional
logic wearing a different costume.

## A bridge to computer science: Boolean satisfiability

There's one question propositional logic asks that turns out to be deeply important in
computer science: **"Is there any assignment of true/false that makes this whole
expression true?"**

That question is called **Boolean satisfiability**, or SAT. It sounds simple, but it's
the engine behind a surprising range of real systems:

- **Constraint solvers** in package managers, build systems, and databases.
- **Type checkers** that ask "can these types line up?"
- **Model checkers** that verify hardware designs have no deadlock.
- **SMT solvers** that power formal verification tools.

The reason SAT matters is that many real problems can be *translated* into a boolean
expression. Once you have the expression, asking "is it satisfiable?" is asking "does
any solution exist?" The P vs NP question - one of the biggest open problems in math -
is fundamentally about how hard it is to answer that question for large expressions.

You don't need to solve SAT instances today. But knowing that "can this be true?" is
a *named, studied problem* - not just a casual question - changes how you see the
boolean expressions in your own code. They're not just guards; they're constraints,
and there's a whole field that thinks about them systematically.

A quick check before you go:

```quiz
[
  {
    "q": "Two statements are logically equivalent when:",
    "choices": [
      "They use the same connectives",
      "They have identical truth tables - the same result in every row",
      "They are both true right now",
      "They contain the same variables"
    ],
    "answer": 1,
    "explain": "Equivalence is about agreeing in every possible situation, which is exactly what an identical truth table captures. Same words or same current truth value isn't enough."
  },
  {
    "q": "By De Morgan's law, ¬(A ∧ B) is equivalent to:",
    "choices": [
      "¬A ∧ ¬B",
      "A ∨ B",
      "¬A ∨ ¬B",
      "¬A ∧ B"
    ],
    "answer": 2,
    "explain": "Negate each part and flip the connective: the AND becomes an OR, giving ¬A ∨ ¬B. 'Not both' means 'at least one is missing.'"
  },
  {
    "q": "What is the correct negation of the condition a && b?",
    "choices": [
      "!a && !b",
      "!a || !b",
      "a || b",
      "!(a || b)"
    ],
    "answer": 1,
    "explain": "The opposite of 'both true' is 'not both true' - at least one is false - which is !a || !b. Keeping the AND (!a && !b) is the classic bug; that says 'both false.'"
  }
]
```

[← Phase 2: Truth Tables](02-truth-tables.md) · [Guide overview](_guide.md)
