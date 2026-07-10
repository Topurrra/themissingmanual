---
title: "Functions"
guide: practice-javascript
phase: 2
summary: "Wrap reusable logic in a function that takes parameters and returns a value."
tags: [javascript, functions, return]
difficulty: beginner
synonyms:
  - javascript functions
  - function parameters and return
  - write a javascript function
updated: 2026-07-08
---

# Functions

A function packages up logic you want to reuse instead of repeating it every
time you need it. It takes input through parameters, does something with them,
and hands back a result with `return` - the function stops running the moment
it hits `return`.

Without `return`, a function just runs and gives back `undefined`, which is a
common bug: the logic looks right, but nothing ever comes out the other end.
Every function you write in this module should end with an explicit `return`
unless it genuinely has nothing to hand back.

**Your task:** write a function called `sum` that takes two numbers and returns
their sum.

**You'll practice:**

- Declaring a function with parameters
- Returning a value with `return`

```lesson
{
  "language": "js",
  "starterCode": "// Write a function called sum(a, b) that returns a + b.\nfunction sum(a, b) {\n\n}",
  "solution": "function sum(a, b) {\n  return a + b;\n}",
  "hints": ["Use the function keyword: function sum(a, b) { ... }", "Use return to send back a value: return a + b;", "sum(2, 3) should be 5."],
  "tests": [
    { "name": "sum(2, 3) is 5", "code": "if (sum(2, 3) !== 5) throw new Error('sum(2, 3) should be 5');" },
    { "name": "sum(-1, 1) is 0", "code": "if (sum(-1, 1) !== 0) throw new Error('sum(-1, 1) should be 0');" }
  ]
}
```
