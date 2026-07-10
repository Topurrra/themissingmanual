---
title: "Discount price"
guide: practice-math
phase: 3
summary: "Combine percentage-of with subtraction to find a sale price after a percent-off discount."
tags: [math, arithmetic, percentages, discount]
difficulty: beginner
synonyms:
  - percent off calculator
  - sale price formula
  - discount math
updated: 2026-07-10
---

# Discount price

Same trick as the last lesson, one step further: a "20% off" sale doesn't
hand you the discount directly, it hands you the price *after* you subtract
it. Find the discount amount first (price times the percent, as a decimal),
then subtract that from the original price.

The starter expression demonstrates the pattern (10% off $100) - swap in this
lesson's real numbers.

**Your task:** a jacket costs $89.99. It's 20% off. What's the sale price?

**You'll practice:**

- Computing a discount amount before subtracting it
- Nesting one calculation inside another with parentheses

```lesson
{
  "language": "math",
  "starterCode": "100 - (100 * 0.1)",
  "solution": "89.99 - (89.99 * 0.2)",
  "expectedOutput": "71.992",
  "check": "output",
  "hints": [
    "First find 20% of $89.99 - that's the discount amount.",
    "Subtract the discount from the original price.",
    "The full expression is: 89.99 - (89.99 * 0.2)"
  ]
}
```
