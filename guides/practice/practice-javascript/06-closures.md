---
title: "Closures"
guide: practice-javascript
phase: 6
summary: "Write a factory function that returns private state no outside code can touch directly - the everyday job a closure does."
tags: [javascript, closures, scope, private-state]
difficulty: intermediate
synonyms:
  - javascript closures
  - private state javascript
  - closure factory function
updated: 2026-07-10
---

# Closures

A closure is a function plus the variables it remembers from where it was
written. When a function returns another function (or a group of them), those
inner functions keep access to the outer function's variables forever - even
after the outer function has finished running and nothing else can see inside
it.

That's how you get real private state in JavaScript: a variable declared
inside a factory function is invisible from the outside, but any function
returned from that factory can still read and change it. Call the factory
again and you get a brand-new variable, completely separate from the first
one - each call builds its own private world.

**Your task:** write `makeCounter()`, a function that returns an object with
two methods: `increment()`, which adds `1` to a hidden counter and returns the
new value, and `value()`, which returns the current count without changing it.
Nothing outside the returned object should be able to read or set the counter
directly.

**You'll practice:**

- Returning functions that share one captured variable
- Building private state with a closure instead of a public property

```lesson
{
  "language": "js",
  "starterCode": "// Write makeCounter(): returns { increment(), value() } sharing one\n// private counter that nothing outside the object can touch.\nfunction makeCounter() {\n\n}",
  "solution": "function makeCounter() {\n  let count = 0;\n  return {\n    increment() {\n      count += 1;\n      return count;\n    },\n    value() {\n      return count;\n    }\n  };\n}",
  "hints": ["Declare let count = 0; inside makeCounter, then return an object literal with increment and value methods.", "increment() should do count += 1; and then return count;", "Each call to makeCounter() should create its own separate count - don't use a variable outside the function."],
  "tests": [
    { "name": "increment adds one and returns the new count", "code": "const c = makeCounter(); if (c.increment() !== 1) throw new Error('first increment() should return 1'); if (c.increment() !== 2) throw new Error('second increment() should return 2');" },
    { "name": "value reads without changing the count", "code": "const c = makeCounter(); c.increment(); if (c.value() !== 1) throw new Error('value() should be 1 after one increment()'); if (c.value() !== 1) throw new Error('calling value() again should still be 1');" },
    { "name": "two counters do not share state", "code": "const a = makeCounter(); const b = makeCounter(); a.increment(); a.increment(); if (b.value() !== 0) throw new Error('a separate makeCounter() call should start its own counter at 0');" }
  ]
}
```
