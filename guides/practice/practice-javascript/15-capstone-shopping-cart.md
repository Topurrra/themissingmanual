---
title: "Capstone: shopping cart total"
guide: practice-javascript
phase: 15
summary: "Combine functions, arrays, and objects to total a shopping cart and flag big orders."
tags: [javascript, capstone, reduce, functions]
difficulty: intermediate
synonyms:
  - javascript capstone project
  - array reduce example
  - shopping cart javascript kata
updated: 2026-07-10
---

# Capstone: shopping cart total

Everything so far comes together here: an array of objects, a function that
processes them, and a second function built on the first. This is what most
real application code looks like - not a single trick, but small pieces
composed together.

`array.reduce((acc, item) => ..., start)` walks the array once, carrying an
accumulator (`acc`) forward and updating it on each item - perfect for turning
a list into a single total. Once you have that total, the rest is a plain
comparison.

**Your task:** using the sample `cart` array already in the editor, write
`cartTotal(items)`, returning the sum of `price * qty` across all items, and
`isBigOrder(items)`, returning `true` when `cartTotal(items)` is `100` or more.

**You'll practice:**

- Reducing an array to a single value
- Building one function on top of another

```lesson
{
  "language": "js",
  "starterCode": "const cart = [\n  { name: \"Mouse\", price: 20, qty: 2 },\n  { name: \"Keyboard\", price: 45, qty: 1 },\n];\n\n// Write cartTotal(items): sum of price * qty for every item.\nfunction cartTotal(items) {\n\n}\n\n// Write isBigOrder(items): true if cartTotal(items) >= 100.\nfunction isBigOrder(items) {\n\n}",
  "solution": "const cart = [\n  { name: \"Mouse\", price: 20, qty: 2 },\n  { name: \"Keyboard\", price: 45, qty: 1 },\n];\n\nfunction cartTotal(items) {\n  return items.reduce((sum, item) => sum + item.price * item.qty, 0);\n}\n\nfunction isBigOrder(items) {\n  return cartTotal(items) >= 100;\n}",
  "hints": ["items.reduce((sum, item) => sum + item.price * item.qty, 0) totals the cart in one pass.", "Each item contributes price * qty to the running sum.", "isBigOrder can just call cartTotal(items) and compare it to 100."],
  "tests": [
    { "name": "cartTotal sums price times qty", "code": "const t = cartTotal([{ name: 'A', price: 10, qty: 3 }, { name: 'B', price: 5, qty: 2 }]); if (t !== 40) throw new Error('cartTotal should be 40 for that cart (10*3 + 5*2)');" },
    { "name": "cartTotal works on the starter cart", "code": "if (cartTotal(cart) !== 85) throw new Error('cartTotal(cart) should be 85 (20*2 + 45*1)');" },
    { "name": "isBigOrder is true at 100 or more", "code": "if (isBigOrder([{ name: 'X', price: 100, qty: 1 }]) !== true) throw new Error('isBigOrder should be true when total is 100 or more');" },
    { "name": "isBigOrder is false under 100", "code": "if (isBigOrder(cart) !== false) throw new Error('isBigOrder(cart) should be false (total is 85)');" }
  ]
}
```
