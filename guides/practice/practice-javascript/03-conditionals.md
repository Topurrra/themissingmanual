---
title: "Conditionals"
guide: practice-javascript
phase: 3
summary: "Branch on a condition with if/else if/else and return different values for different cases."
tags: [javascript, conditionals, if-else]
difficulty: beginner
synonyms:
  - javascript if else
  - conditional statements javascript
  - javascript branching logic
updated: 2026-07-08
---

# Conditionals

Most real logic isn't one straight line - it depends. `if` runs a block only
when a condition is true; `else if` gives it another condition to try when the
first one fails; `else` catches whatever's left. JavaScript checks them in
order, top to bottom, and runs the first block whose condition matches.

Inside a function, each branch usually ends in its own `return` - as soon as
one fires, the function is done, and the branches below it never run. You don't
need an `else` at the very end if the last branch already returns.

**Your task:** write a function `classify(n)` that returns `"positive"` if `n`
is greater than 0, `"negative"` if it's less than 0, and `"zero"` otherwise.

**You'll practice:**

- Chaining conditions with `if` / `else if` / `else`
- Returning different values from different branches

```lesson
{
  "language": "js",
  "starterCode": "// Write classify(n): return \"positive\", \"negative\", or \"zero\".\nfunction classify(n) {\n\n}",
  "solution": "function classify(n) {\n  if (n > 0) return \"positive\";\n  if (n < 0) return \"negative\";\n  return \"zero\";\n}",
  "hints": ["Check n > 0 first and return \"positive\" if it's true.", "Check n < 0 next for \"negative\".", "Anything left over (n === 0) is \"zero\" - no condition needed for that one."],
  "tests": [
    { "name": "classify(5) is positive", "code": "if (classify(5) !== 'positive') throw new Error('classify(5) should be \"positive\"');" },
    { "name": "classify(-3) is negative", "code": "if (classify(-3) !== 'negative') throw new Error('classify(-3) should be \"negative\"');" },
    { "name": "classify(0) is zero", "code": "if (classify(0) !== 'zero') throw new Error('classify(0) should be \"zero\"');" }
  ]
}
```
