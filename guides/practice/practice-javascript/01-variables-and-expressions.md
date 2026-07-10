---
title: "Variables and expressions"
guide: practice-javascript
phase: 1
summary: "Declare variables with const, then combine them into a new value with an expression."
tags: [javascript, variables, expressions, basics]
difficulty: beginner
synonyms:
  - javascript variables
  - const vs let
  - javascript expressions
updated: 2026-07-10
---

# Variables and expressions

A variable is a name for a value. `const` declares one that can't be
reassigned - the right default for almost everything, since most values in a
program never actually need to change after they're set. `let` exists for the
rest.

An expression combines values into a new one: `width * height`, `price + tax`,
`a > b`. You've been doing this in every calculator since childhood; JavaScript
just wants the operators written out (`*` for multiply, not `x`) and a `const`
or `let` in front the first time a name appears.

**Your task:** declare `width` as `8`, `height` as `5`, and `area` as their
product.

**You'll practice:**

- Declaring a variable with `const`
- Writing an arithmetic expression
- Building one variable's value out of two others

```lesson
{
  "language": "js",
  "starterCode": "// Declare width as 8, height as 5, and area as their product.\nconst width = 0;\nconst height = 0;\nconst area = 0;",
  "solution": "const width = 8;\nconst height = 5;\nconst area = width * height;",
  "hints": ["Use const for a value that won't be reassigned: const width = 8;", "Multiply with *: area = width * height.", "area should equal 40 when width is 8 and height is 5."],
  "tests": [
    { "name": "area is width times height", "code": "if (area !== width * height) throw new Error('area should equal width * height');" },
    { "name": "area is 40", "code": "if (area !== 40) throw new Error('area should be 40 (8 * 5)');" }
  ]
}
```
