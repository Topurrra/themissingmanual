---
title: "Converse, Inverse, Contrapositive"
guide: "implication-and-conditionals"
phase: 2
summary: "From 'if P then Q' you can form three variants. The contrapositive ('if not Q then not P') is always equivalent; the converse and inverse are not - and assuming they are is the most common reasoning error there is."
tags: [logic, contrapositive, converse, inverse, fallacy]
difficulty: beginner
synonyms: ["converse inverse contrapositive", "is the converse always true", "affirming the consequent", "denying the antecedent", "is the contrapositive equivalent"]
updated: 2026-07-10
---

# Converse, Inverse, Contrapositive

In Phase 1 you saw what `P → Q` claims: whenever `P` holds, `Q` holds too. Shuffle its pieces
around and you get three close relatives that look almost identical and use the same two ideas.
Here's the trap: one relative says exactly the same thing as the original, two say something
completely different - yet all three *feel* like they should follow. Get this right and you're
inoculated against the most common reasoning mistake there is; get it wrong and you'll confidently
"prove" things that aren't true, in code reviews, arguments, and your own debugging.

## The original conditional

> **If it rained, then the street is wet.**

In symbols: `P → Q`, where `P` is "it rained" and `Q` is "the street is wet."

It promises one direction only: rain forces wetness. It says nothing about what happens when it
*didn't* rain, and nothing about what wetness implies on its own. Now form the three variants by
flipping and negating the two parts.

## The four forms

Same two ideas - "it rained" and "the street is wet" - rearranged four ways.

- **Original:** `P → Q` - *If it rained, then the street is wet.*
- **Converse:** `Q → P` - *If the street is wet, then it rained.* (You swapped the two parts.)
- **Inverse:** `¬P → ¬Q` - *If it did not rain, then the street is not wet.* (You negated both parts.)
- **Contrapositive:** `¬Q → ¬P` - *If the street is not wet, then it did not rain.* (You swapped **and** negated.)

The `¬` symbol means "not." So `¬P` is "it did not rain" and `¬Q` is "the street is not wet."

Feel the difference in plain language:

- The **converse** says wetness proves rain. But a sprinkler, a burst pipe, or a street cleaner
  could wet the street. So the converse can be false even when the original is rock solid.
- The **inverse** says no rain means a dry street. Same problem - the sprinkler still wets it. So the
  inverse can also be false.
- The **contrapositive** says a dry street proves it did not rain. Think about that. If it had
  rained, the street *would* be wet (the original promise). The street is dry. So it cannot have
  rained. That reasoning is airtight - and it always is.

## The key facts

Here's what's true, and it's worth memorizing:

- The **contrapositive is always equivalent to the original.** If `P → Q` is true, then `¬Q → ¬P` is
  true, and vice versa. They are two phrasings of one fact.
- The **converse and the inverse are NOT equivalent to the original.** Each can be false while the
  original is true.
- The converse and the inverse *are* equivalent to **each other** - because the inverse is the
  contrapositive of the converse. (Apply the always-equivalent rule to `Q → P` and you get
  `¬P → ¬Q`.)

You can confirm all of this with a truth table (`T`/`F`, every combination of `P` and `Q`, each
form evaluated):

```text
 P | Q | ¬P | ¬Q | P→Q  | Q→P  | ¬P→¬Q | ¬Q→¬P
   |   |    |    | orig | conv | inv   | contra
---+---+----+----+------+------+-------+-------
 T | T | F  | F  |  T   |  T   |  T    |  T
 T | F | F  | T  |  F   |  T   |  T    |  F
 F | T | T  | F  |  T   |  F   |  F    |  T
 F | F | T  | T  |  T   |  T   |  T    |  T
```

Look at the **orig** column and the **contra** column: `T F T T` and `T F T T`. Identical, every row.
That is what "always equivalent" means.

Now look at **orig** versus **conv**: `T F T T` versus `T T F T` - they disagree on rows 2 and 3,
genuinely different statements. And **conv** matches **inv** (`T T F T` both) - the converse and
inverse are the equivalent pair. The contrapositive isn't a coincidence; it falls straight out of
negation and implication rules from [propositional logic](/guides/propositional-logic).

## The two classic fallacies - name them

When someone wrongly treats the converse or inverse as the original, that mistake has a name. Naming
it makes it easy to catch.

### Affirming the consequent

You have `P → Q`. You observe `Q`. You conclude `P`. That is **affirming the consequent**, and it is
invalid.

> *If it rained, the street is wet.* The street is wet. Therefore it rained.

But the sprinkler could have done it - observing `Q` does not get you back to `P`. You've assumed
the **converse** (`Q → P`) was available, and it wasn't. This is, by a wide margin, the most common
error people make. It feels like logic. It isn't.

### Denying the antecedent

You have `P → Q`. You observe `¬P`. You conclude `¬Q`. That is **denying the antecedent** - also
invalid.

> *If it rained, the street is wet.* It did not rain. Therefore the street is not wet.

Again the sprinkler ruins it - no rain, still a wet street. Here you've leaned on the **inverse**
(`¬P → ¬Q`), which the original never promised. Both fallacies share one root: treating a one-way
claim as if it ran both ways.

## The two valid forms - name them

Two inferences *are* always sound. Learn these as the safe paths.

### Modus ponens

You have `P → Q`. You observe `P`. You conclude `Q`.

> *If it rained, the street is wet.* It rained. Therefore the street is wet.

The original used forward, exactly as written. Nothing flipped, nothing negated. Solid.

### Modus tollens

You have `P → Q`. You observe `¬Q`. You conclude `¬P`.

> *If it rained, the street is wet.* The street is not wet. Therefore it did not rain.

This is the **contrapositive in action**: because `¬Q → ¬P` is equivalent to the original, you can
run it backward from a denied conclusion and stay airtight.

The pattern is clean: affirm the *first* part (modus ponens) or deny the *second* part (modus
tollens) and you're safe. Affirm the second part or deny the first, and you've stepped into a fallacy.

## One table to keep

The whole picture in one place - the four forms and whether each matches the original.

| Form | Shape | Rain example | Equivalent to original? |
|---|---|---|---|
| Original | `P → Q` | If it rained, the street is wet | - (this is the original) |
| Converse | `Q → P` | If the street is wet, it rained | **No** |
| Inverse | `¬P → ¬Q` | If it didn't rain, the street isn't wet | **No** |
| Contrapositive | `¬Q → ¬P` | If the street isn't wet, it didn't rain | **Yes - always** |

If you remember only one row, remember the last one.

## For builders

Suppose your system follows the rule **"if there's an error, then it logs."** That's `P → Q`. It's
tempting to read a log line and conclude an error happened - *"if it logged, then there's an error."*
That's the converse, a different claim: maybe you also log on retries, info events, or startup. A
log line alone does not prove an error - reading it as proof is affirming the consequent, and it
sends you chasing failures that aren't there.

The contrapositive is a debugging gift, though. Take a pipeline stage whose rule is **"if the bug is
in this stage, then the output is wrong."** The contrapositive is **"if the output is correct, then
the bug is not in this stage"** - that's modus tollens. Verify a stage's output is correct, and
you've genuinely *eliminated* that stage, using a form that's always valid to shrink the search
space. This is the engine behind binary-search debugging: each correct checkpoint validly rules out
everything behind it. Takeaway: a one-way "if" never runs backward for free. Only the contrapositive
comes along for the ride.

## Recap

- From `P → Q` you can write the **converse** (`Q → P`), **inverse** (`¬P → ¬Q`), and **contrapositive**
  (`¬Q → ¬P`).
- The **contrapositive is always equivalent** to the original. The **converse and inverse are not** -
  though they are equivalent to each other.
- **Affirming the consequent** (observe `Q`, conclude `P`) misuses the converse. **Denying the
  antecedent** (observe `¬P`, conclude `¬Q`) misuses the inverse. Both are invalid.
- **Modus ponens** (have `P`, conclude `Q`) and **modus tollens** (have `¬Q`, conclude `¬P`) are the
  two always-valid moves.
- In practice: "if error then log" does not mean "if logged then error" - but "output correct"
  validly clears a stage.

## Open-ended exercise

A security policy states: "If a user has admin privileges, then their sessions are logged."
Write out the converse, inverse, and contrapositive of this conditional in plain English.
Then evaluate: which of the three, if any, would you want to *enforce* as a separate rule,
and why? The answer reveals which form carries the same guarantee as the original.

A quick check before you move on.

```quiz
[
  {
    "q": "You're told 'If P then Q.' Which of the following always says the exact same thing?",
    "choices": [
      "The contrapositive: if not Q, then not P",
      "The converse: if Q, then P",
      "The inverse: if not P, then not Q",
      "None of them - every variant differs from the original"
    ],
    "answer": 0,
    "explain": "The contrapositive is always equivalent to the original - swap and negate both parts and the truth values match on every row. The converse and inverse are not equivalent (they match each other instead)."
  },
  {
    "q": "Rule: 'If it rained, the street is wet.' Someone sees the street is wet and concludes it rained. What error is this?",
    "choices": [
      "Affirming the consequent (misusing the converse)",
      "Modus tollens (a valid inference)",
      "Denying the antecedent (misusing the inverse)",
      "Modus ponens (a valid inference)"
    ],
    "answer": 0,
    "explain": "They observed Q (wet) and concluded P (rained), which assumes the converse Q → P. A sprinkler could wet the street, so this is invalid - it's affirming the consequent."
  },
  {
    "q": "Rule: 'If the service is down, the health check fails.' The health check did NOT fail. Which conclusion is VALID?",
    "choices": [
      "The service is not down (modus tollens)",
      "The service is down (modus ponens)",
      "Nothing can be concluded at all",
      "The health check must have an error (affirming the consequent)"
    ],
    "answer": 0,
    "explain": "Denying the consequent (health check did not fail, ¬Q) lets you validly deny the antecedent (service is not down, ¬P). That's modus tollens - the contrapositive in action, and it's always sound."
  }
]
```

[← Phase 1: What "If P Then Q" Really Means](01-what-if-p-then-q-means.md) · [Guide overview](_guide.md) · [Phase 3: Necessary vs Sufficient Conditions →](03-necessary-and-sufficient.md)
