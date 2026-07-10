---
title: "Curry and partial application"
guide: practice-javascript
phase: 9
summary: "Write a function that works two ways - called with both arguments at once, or with one argument now and the second later."
tags: [javascript, currying, partial-application, closures, higher-order-functions]
difficulty: intermediate
synonyms:
  - javascript currying
  - partial application javascript
  - function returning a function
updated: 2026-07-10
---

# Curry and partial application

A closure (Phase 6) doesn't just hide private state - it can also hold onto
an argument for later. **Partial application** means fixing one argument now
and getting back a smaller function that only needs the rest. **Currying**
takes that idea further: a function that normally takes several arguments is
rewritten to take them one at a time, each call returning a new function
until enough arguments have arrived.

The trick is a single `if`: check whether the second argument showed up. If
it did, you have everything you need - finish the job now. If it didn't,
return a new function that remembers the first argument (through a closure)
and waits for the rest.

**Your task:** write `add(a, b)` so it works both ways - `add(2, 3)` returns
`5` immediately, and `add(2)(3)` also returns `5`, by returning a function
that remembers `2` and waits for the second number.

**You'll practice:**

- Checking whether an argument was actually passed
- Returning a function that closes over an already-received argument

```lesson
{
  "language": "js",
  "starterCode": "// Write add(a, b): if called with two args, return a + b right away.\n// If called with just one arg, return a function that takes the second\n// arg and returns the sum - so both add(2, 3) and add(2)(3) equal 5.\nfunction add(a, b) {\n\n}",
  "solution": "function add(a, b) {\n  if (b !== undefined) {\n    return a + b;\n  }\n  return (b2) => a + b2;\n}",
  "hints": ["Check b first: if (b !== undefined) means add was called with two arguments - just return a + b.", "If b is undefined, add was called with one argument - return a new function that takes the missing one: (b2) => a + b2.", "add(2) should return a function, not a number - only add(2)(3) or add(2, 3) produce the final sum."],
  "tests": [
    { "name": "two-argument call adds immediately", "code": "if (add(2, 3) !== 5) throw new Error('add(2, 3) should be 5');" },
    { "name": "one-argument call returns a function", "code": "if (typeof add(2) !== 'function') throw new Error('add(2) should return a function');" },
    { "name": "curried call adds the same total", "code": "if (add(2)(3) !== 5) throw new Error('add(2)(3) should be 5');" },
    { "name": "works with different numbers", "code": "if (add(10)(5) !== 15) throw new Error('add(10)(5) should be 15'); if (add(-1, 1) !== 0) throw new Error('add(-1, 1) should be 0');" }
  ]
}
```
