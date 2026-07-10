---
title: "Order of operations"
guide: practice-math
phase: 1
summary: "Evaluate a mixed expression the way a calculator does: exponents before multiplication and division, then addition and subtraction, left to right."
tags: [math, arithmetic, order-of-operations, pemdas]
difficulty: beginner
synonyms:
  - pemdas practice
  - order of operations calculator
  - math expression evaluator
updated: 2026-07-10
---

# Order of operations

There's no code here - just an expression editor. Type a formula, hit Run,
and it evaluates immediately, the same way a calculator would. `^` is
exponent (`2^3` is 2 cubed), and `*` / `/` bind tighter than `+` / `-`, exactly
like the order of operations you already know.

The starter expression below evaluates to something - run it and see what you
get. It isn't the answer to this lesson's task; it's just there to show you
the syntax works.

**Your task:** write and run this exact expression: `10 + 10 / 10 * 10^2`.
Work it out by hand first if you want to check yourself: exponent first
(`10^2 = 100`), then the division (`10 / 10 = 1`), then multiply
(`1 * 100 = 100`), then add (`10 + 100 = 110`).

**You'll practice:**

- Typing a bare arithmetic expression instead of code
- Order of operations: exponents, then `*`/`/`, then `+`/`-`

```lesson
{
  "language": "math",
  "starterCode": "2 + 3 * 4^2",
  "solution": "10 + 10 / 10 * 10^2",
  "expectedOutput": "110",
  "check": "output",
  "hints": [
    "Exponents happen before multiplication and division.",
    "Work left to right through * and / once exponents are resolved, then handle + last.",
    "The full expression is: 10 + 10 / 10 * 10^2"
  ]
}
```
