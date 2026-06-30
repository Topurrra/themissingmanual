---
title: "Truth Tables"
guide: "propositional-logic"
phase: 2
summary: "A truth table lists every possible combination of true/false for the inputs and shows the result — the foolproof way to know exactly what a compound statement does, and to spot tautologies and contradictions."
tags: [logic, truth-tables, tautology, contradiction, propositional-logic]
difficulty: beginner
synonyms: ["how to build a truth table", "what is a tautology", "what is a contradiction in logic", "truth table for and or not", "evaluate a compound statement"]
updated: 2026-06-25
---

# Truth Tables

In [Phase 1](01-connectives-and-or-not.md) you met the connectives: AND, OR, NOT. Each has a
fixed meaning. But the moment you combine them, a new question shows up that the connectives
alone can't answer.

Look at this statement:

```text
(A ∧ ¬B) ∨ C
```

For exactly which inputs is the whole thing true? You could squint and guess. You could talk
yourself into an answer that *feels* right. But feeling right and being right are different
things, and with logic the gap between them is where bugs live.

There's a way to **know** — not guess, not estimate. You enumerate every possibility and check
each one. That tool is the truth table, and it's the most honest thing in logic: it can't
bluff, skip a case, or change its mind under pressure.

## What a truth table is

A truth table is a complete list of every combination of true/false values your input
variables can take, plus a column showing the result for each.

The word doing the work is **every**. That's the whole idea. You don't sample. You don't pick
the "interesting" cases. You write down *all* of them, then evaluate the statement once per row.

How many rows is "all of them"? Each variable is independent and can be true or false — two
choices. Two variables give 2 × 2 = 4 combinations. Three give 2 × 2 × 2 = 8. The pattern:

```text
n variables → 2^n rows
```

So one variable gives 2 rows, two gives 4, three gives 8, four gives 16, ten gives 1024. The
count doubles with each new variable — worth remembering, because "exhaustive" gets expensive
fast.

We usually write `T` for true and `F` for false to keep the columns narrow.

## Build one step by step

Let's build the table for `A ∧ ¬B` — "A is true and B is false."

**Step 1 — list every input combination.** Two variables, so 2^2 = 4 rows. A reliable way to
miss nothing: count in binary. Let the left column flip slowly and the right flip fast.

```text
A   B
T   T
T   F
F   T
F   F
```

That's all four cases, guaranteed, because we were mechanical rather than creative.

**Step 2 — add a column for each intermediate piece.** Our statement uses `¬B`, so compute that
first. `¬B` is B flipped:

```text
A   B   ¬B
T   T   F
T   F   T
F   T   F
F   F   T
```

**Step 3 — combine.** Now `A ∧ ¬B` is true only when A is true *and* `¬B` is true. Read across
each row and apply AND:

```text
A   B   ¬B   A ∧ ¬B
T   T   F    F
T   F   T    T
F   T   F    F
F   F   T    F
```

There's the complete answer. `A ∧ ¬B` is true in exactly one situation: A true, B false. Every
other case is false. No guessing — the table told you.

Building intermediate columns first is why this scales. You never evaluate the whole expression
in your head at once; you compute small pieces and assemble them, one column at a time.

A three-variable expression works identically, only taller. The opening statement,
`(A ∧ ¬B) ∨ C`, has three variables, so it needs 2^3 = 8 rows — the four rows above repeated
once with `C = T` and once with `C = F`, then an `(A ∧ ¬B)` column, then a final `∨ C` column.
Same recipe, more rows.

## Tautology, contradiction, contingent

Once you can read a result column, you can sort any statement into one of three buckets.

A **tautology** is true in *every* row — true no matter what the inputs do. The classic example
is `A ∨ ¬A` ("A, or not A"):

```text
A   ¬A   A ∨ ¬A
T   F    T
F   T    T
```

Either A is true or its negation is — there's no third option, so the whole thing is always
true. The result column is all `T`. That's a tautology.

A **contradiction** is the mirror image: false in *every* row. Take `A ∧ ¬A` ("A and not A"):

```text
A   ¬A   A ∧ ¬A
T   F    F
F   T    F
```

A can't be both true and false at once, so this is never satisfiable. The result column is all
`F`. That's a contradiction.

Everything else — statements whose truth *depends* on the inputs, like `A ∧ ¬B` from before — is
**contingent**. Most useful statements are contingent. They carry information, because their
answer changes with the situation.

> 📐 A tautology is true because of its *form*, not because of any fact about the world.
> `A ∨ ¬A` holds whether A means "it's raining" or "the server is up." That's what makes
> tautologies the bedrock of valid reasoning — see [Why math isn't your enemy](/guides/why-math-isnt-your-enemy)
> for more on why structure beats intuition.

## For builders

If you write code, you already work with truth tables — under another name.

- **A truth table is testing every input combination.** It's exhaustive case coverage: the
  table for a boolean function is the same as a test suite that checks all 2^n inputs. When you
  enumerate the cases, you can't miss one.

- **A contradiction is dead code.** A condition that's always false is an `if` branch the
  program can never enter — `if (loggedIn && !loggedIn)`. The body is unreachable.

- **A tautology is a redundant check.** A condition that's always true is an `if` that's
  pointless to write — `if (x > 0 || x <= 0)` is `if (true)`. The guard isn't guarding anything.

Spotting these before you ship saves you from a feature flag that's secretly never on, or a
validation check that secretly always passes.

💡 **Key point:** When you're unsure what a boolean expression does, build its truth table. Your
intuition can talk itself into a wrong answer; a complete table lists every case and evaluates
each one mechanically. It cannot lie, and it cannot skip the case that would have bitten you.

## Recap

- A **truth table** lists every combination of true/false for the inputs, plus a result column.
  It's exhaustive on purpose — that's the whole point.
- **n variables → 2^n rows.** The count doubles with each new variable.
- **Build it in steps:** list all input combinations (count in binary so you miss none), add a
  column for each intermediate piece, then combine.
- A **tautology** is true in every row (`A ∨ ¬A`). A **contradiction** is false in every row
  (`A ∧ ¬A`). Everything else is **contingent** — it depends on the inputs.
- For builders: a truth table is full case coverage, a contradiction is dead code, a tautology
  is a redundant check.

## Open-ended exercise

Build a truth table for the statement `(P ∧ Q) → R`. List all eight rows (three variables),
compute the output for each, and then ask: is this statement a tautology, a contradiction,
or neither? A tautology is true in every row; a contradiction is false in every row.
If it's neither, point to the rows that make it true and the rows that make it false.

Check yourself:

```quiz
[
  {
    "q": "A compound statement has 4 input variables. How many rows does its truth table have?",
    "choices": ["8", "16", "4", "32"],
    "answer": 1,
    "explain": "Each variable doubles the number of combinations: n variables give 2^n rows. With 4 variables that's 2^4 = 16."
  },
  {
    "q": "What is a tautology?",
    "choices": ["A statement that is false in every row of its truth table", "A statement whose truth depends on its inputs", "A statement that is true in every row of its truth table", "A statement with no variables"],
    "answer": 2,
    "explain": "A tautology is true no matter what the inputs are — its result column is all true (e.g. A ∨ ¬A). The all-false version is a contradiction; the depends-on-inputs version is contingent."
  },
  {
    "q": "What is a truth table actually used for?",
    "choices": ["To list every input combination and show the exact result for each one", "To pick the most likely value of a statement", "To shorten a statement so it has fewer variables", "To prove a statement is true without checking any cases"],
    "answer": 0,
    "explain": "A truth table enumerates every possible combination of inputs and evaluates the statement on each, so you know exactly when it's true or false — no guessing, no skipped cases."
  }
]
```

[← Phase 1: Connectives: AND, OR, NOT](01-connectives-and-or-not.md) · [Guide overview](_guide.md) · [Phase 3: Equivalences & De Morgan's Laws →](03-equivalences-and-de-morgan.md)
