---
title: "Conditionals"
guide: practice-python
phase: 2
summary: "Branch on a condition with if/elif/else and return different values for different cases."
tags: [python, conditionals, if-elif-else]
difficulty: beginner
synonyms:
  - python if elif else
  - conditional statements python
  - python branching logic
updated: 2026-07-08
---

# Conditionals

`if` runs a block only when its condition is true. `elif` ("else if") gives
Python another condition to check when the first one fails, and `else` catches
whatever's left over. They're checked top to bottom, and only the first
matching branch runs.

Indentation is the block, in Python - there are no curly braces. Everything
lined up under an `if` (or `elif`, or `else`) belongs to that branch; the next
line back at the original indent level is outside it again.

**Your task:** write a function `classify(n)` that returns `"positive"` if `n`
is greater than 0, `"negative"` if it's less than 0, and `"zero"` otherwise.

**You'll practice:**

- Branching with `if` / `elif` / `else`
- Returning different values from different branches

```lesson
{
  "language": "python",
  "starterCode": "# Write classify(n): return \"positive\", \"negative\", or \"zero\".\ndef classify(n):\n    pass",
  "solution": "def classify(n):\n    if n > 0:\n        return \"positive\"\n    if n < 0:\n        return \"negative\"\n    return \"zero\"",
  "hints": ["Check n > 0 first and return \"positive\" if it's true.", "Check n < 0 next for \"negative\".", "Anything left over (n == 0) is \"zero\" - no condition needed for that one."],
  "tests": [
    { "name": "classify(5) is positive", "code": "assert classify(5) == \"positive\", 'classify(5) should be \"positive\"'" },
    { "name": "classify(-3) is negative", "code": "assert classify(-3) == \"negative\", 'classify(-3) should be \"negative\"'" },
    { "name": "classify(0) is zero", "code": "assert classify(0) == \"zero\", 'classify(0) should be \"zero\"'" }
  ]
}
```
