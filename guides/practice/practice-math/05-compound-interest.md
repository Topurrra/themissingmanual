---
title: "Compound interest (capstone)"
guide: practice-math
phase: 5
summary: "Put order of operations, percentages, and exponents together in the real formula banks use to grow a balance over time."
tags: [math, arithmetic, compound-interest, exponents, capstone]
difficulty: intermediate
synonyms:
  - compound interest formula
  - compound interest calculator
  - a equals p times 1 plus r over n
updated: 2026-07-10
---

# Compound interest (capstone)

This lesson pulls together everything so far - percentages, order of
operations, and exponents - into one real formula: the one a bank actually
uses to grow a balance that earns interest more than once a year.

```text
A = P * (1 + r/n)^(n*t)

A = the final amount
P = the principal (starting balance)
r = the annual interest rate, as a decimal
n = how many times per year it compounds
t = the number of years
```

Read it as a sentence: start with `P`, and for every one of the `n * t`
compounding periods, multiply by a little bit of growth (`1 + r/n`). The
exponent is doing the "apply this growth repeatedly" work.

The starter expression shows the shape with easy numbers ($100 at 10%,
compounded once, for one year) - swap in this lesson's real numbers.

**Your task:** $1000 principal, 5% annual interest rate, compounded monthly
(12 times a year), for 3 years. What's the final amount?

**You'll practice:**

- Reading a multi-variable formula and substituting real numbers directly
- Nesting parentheses correctly so the exponent applies to the whole growth factor

```lesson
{
  "language": "math",
  "starterCode": "100 * (1 + 0.1/1)^(1*1)",
  "solution": "1000 * (1 + 0.05/12)^(12*3)",
  "expectedOutput": "1161.4722",
  "check": "output",
  "hints": [
    "P = 1000, r = 0.05, n = 12, t = 3 - substitute each one into A = P * (1 + r/n)^(n*t).",
    "The exponent is n * t (12 * 3 = 36 compounding periods), not just t.",
    "The full expression is: 1000 * (1 + 0.05/12)^(12*3)"
  ]
}
```
