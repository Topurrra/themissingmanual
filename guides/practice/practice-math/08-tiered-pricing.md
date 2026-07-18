---
title: "Tiered pricing (capstone)"
guide: practice-math
phase: 8
summary: "Chain two real-world rules - a discount that only applies above a threshold, then tax on the discounted total - into one carefully ordered expression."
tags: [math, arithmetic, percentages, word-problems, capstone, advanced]
difficulty: advanced
synonyms:
  - tiered discount calculation
  - discount then tax order of operations
  - multi step percentage word problem
updated: 2026-07-18
---

# Tiered pricing (capstone)

Real invoices are rarely one formula - they're two or three small rules
applied in a strict order, and the order is where the money goes wrong. This
capstone is one of those: a wholesale order with a *tiered* discount, then
tax on top.

The rules:

1. The first $1,000 of an order is full price - no discount.
2. Everything *above* $1,000 gets 12% off (so that part costs 88% of list).
3. Tax of 8% applies to the whole discounted total.

The trap is rule 2: the discount applies only to the amount above the
threshold, not the whole order. `(order - 1000) * 0.88` is the discounted
upper tier; the first `1000` rides along untouched. Then the tax multiplies
the *sum* - which means the whole discounted total needs parentheses around
it before `* 1.08`, or the tax only hits the last thing you typed.

The starter shows the shape for a $1,500 order. This lesson's order is
$1,850.

**Your task:** compute the final invoice for a $1,850 order: first $1,000 at
full price, the remaining $850 at 12% off, then 8% tax on the whole thing.

**You'll practice:**

- Translating stacked business rules into one expression
- Parenthesizing so each rule applies to exactly the right part

```lesson
{
  "language": "math",
  "starterCode": "(1000 + (1500-1000)*0.88) * 1.08",
  "solution": "(1000 + (1850-1000)*0.88) * 1.08",
  "expectedOutput": "1887.84",
  "check": "output",
  "hints": [
    "Only the amount above 1000 is discounted: (1850 - 1000) * 0.88 is the upper tier's cost.",
    "Add the untouched first 1000 to the discounted tier BEFORE applying tax - the tax needs the whole subtotal.",
    "The full expression is: (1000 + (1850-1000)*0.88) * 1.08"
  ]
}
```
