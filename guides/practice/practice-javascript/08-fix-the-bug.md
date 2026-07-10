---
title: "Fix the bug: read the stack trace"
guide: practice-javascript
phase: 8
summary: "The code below throws the moment you run it - read the real error message and stack trace to find the typo and fix it."
tags: [javascript, debugging, stack-trace, errors]
difficulty: intermediate
synonyms:
  - javascript stack trace practice
  - debug javascript error
  - read a javascript error message
updated: 2026-07-10
---

# Fix the bug: read the stack trace

So far every lesson asked you to write code from scratch. Real work is more
often the opposite: someone else's code is already there, and it's broken. The
skill that matters is reading the error the runtime hands you - it almost
always names the exact problem, if you read it instead of guessing.

The code below throws as soon as you press Run - it isn't waiting for a test
to fail it, the bug crashes it immediately. `TypeError: Cannot read properties
of undefined (reading '...')` means you tried to use a property on something
that turned out to be `undefined` - and the property name in the message is
usually the clue pointing at a typo one line up.

**Your task:** run the code, read the error, and fix the bug in `formatPrice`
so it returns the price formatted to two decimal places.

**You'll practice:**

- Reading a thrown error and stack trace instead of guessing
- Tracing a `TypeError` back to the typo that caused it

```lesson
{
  "language": "js",
  "starterCode": "// This code throws when you run it - read the error and fix the bug.\nfunction formatPrice(item) {\n  return `${item.name}: $${item.pirce.toFixed(2)}`;\n}\n\nconsole.log(formatPrice({ name: \"Mouse\", price: 19.99 }));",
  "solution": "function formatPrice(item) {\n  return `${item.name}: $${item.price.toFixed(2)}`;\n}\n\nconsole.log(formatPrice({ name: \"Mouse\", price: 19.99 }));",
  "hints": ["Run it first - the error says which property is undefined and which line it happened on.", "item.pirce doesn't exist on the object passed in - compare the spelling to the property set when the object was created.", "The fix is a one-letter typo: pirce should be price."],
  "tests": [
    { "name": "formats a price with cents", "code": "if (formatPrice({ name: 'Mouse', price: 19.99 }) !== 'Mouse: $19.99') throw new Error('formatPrice({ name: \"Mouse\", price: 19.99 }) should be \"Mouse: $19.99\"');" },
    { "name": "pads a whole number to two decimals", "code": "if (formatPrice({ name: 'Keyboard', price: 45 }) !== 'Keyboard: $45.00') throw new Error('formatPrice({ name: \"Keyboard\", price: 45 }) should be \"Keyboard: $45.00\"');" },
    { "name": "rounds to two decimal places", "code": "if (formatPrice({ name: 'Cable', price: 3.5 }) !== 'Cable: $3.50') throw new Error('formatPrice({ name: \"Cable\", price: 3.5 }) should be \"Cable: $3.50\"');" }
  ]
}
```
