---
title: "Fix the bug: the checkout refuses a correct total"
guide: practice-javascript
phase: 20
summary: "The cart really does add up to $69.48, the receipt prints $69.48, and the guard that protects the charge still says the amounts do not match. Two of the three prices are the reason."
tags: [javascript, floating-point, money, currency, rounding, debugging]
difficulty: advanced
synonyms:
  - javascript 0.1 + 0.2 is not 0.3
  - why is my cart total off by a cent
  - javascript money floating point bug
  - tofixed does not fix rounding
  - how to store currency in javascript
  - javascript integer cents
updated: 2026-07-17
---

# Fix the bug: the checkout refuses a correct total

The checkout on your shop re-totals the cart before it charges anyone, and
refuses if that total does not match the amount the customer was quoted a moment
earlier. The guard is worth having - it is what stops a tampered-with price from
reaching the card.

Since Tuesday it has been rejecting a handful of orders a day. Support cannot
reproduce it. The carts are ordinary, the receipt prints the right amount to the
cent, and the guard still says the two do not match. Nothing throws. A refused
charge looks exactly like a safety check doing its job, which is why this one
went a week without anyone calling it a bug.

A double stores a number as a sum of halves: 1/2, 1/4, 1/8, 1/16, and so on.
`45.50` lands perfectly, because .5 is exactly 1/2. But no sum of halvings ever
reaches 1/100, so `3.99` and `19.99` cannot be stored exactly. In binary, 0.01 is
a fraction that repeats forever, the way 1/3 is 0.333... forever in decimal. A
double keeps 53 bits and drops the rest, so each of those two prices is stored a
hair off. It is the same reason `0.1 + 0.2` is `0.30000000000000004` rather than
`0.3`.

`toFixed(2)` does not repair any of that - it is why the receipt still looks
perfect. It rounds a number to two decimals **for display** and hands back a
**string**. The drift underneath is untouched, and a string will never `===` a
number, so reaching for it here hides the bug instead of fixing it.

**Your task:** fix `totalCents(items)` so it returns the cart total as an exact
whole number of cents. `matchesQuote` is already correct - leave it alone and it
will start returning `true`.

**You'll practice:**

- Reading a plausible-looking result and checking it against what you know is true
- Killing float drift at the source by counting whole cents instead of dollars

```lesson
{
  "language": "js",
  "starterCode": "// The checkout below runs fine and still refuses a correct cart. Fix totalCents.\nconst cart = [\n  { name: \"USB-C cable\", price: 3.99 },\n  { name: \"Mouse\", price: 19.99 },\n  { name: \"Keyboard\", price: 45.50 },\n];\n\n// The payment API only accepts a whole number of cents.\nfunction totalCents(items) {\n  const dollars = items.reduce((sum, item) => sum + item.price, 0);\n  return dollars * 100;\n}\n\n// Never charge a card unless the cart still totals what the customer was quoted.\nfunction matchesQuote(items, quotedCents) {\n  return totalCents(items) === quotedCents;\n}\n\nconsole.log(\"Receipt:  $\" + (totalCents(cart) / 100).toFixed(2));\nconsole.log(\"Charging:\", totalCents(cart), \"cents\");\nconsole.log(\"Customer was quoted 6948 cents. Match?\", matchesQuote(cart, 6948));",
  "solution": "const cart = [\n  { name: \"USB-C cable\", price: 3.99 },\n  { name: \"Mouse\", price: 19.99 },\n  { name: \"Keyboard\", price: 45.50 },\n];\n\n// Convert each price to whole cents at the edge, then only ever add integers.\nfunction totalCents(items) {\n  return items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);\n}\n\n// Unchanged: it was always correct. It just could not survive a float total.\nfunction matchesQuote(items, quotedCents) {\n  return totalCents(items) === quotedCents;\n}\n\nconsole.log(\"Receipt:  $\" + (totalCents(cart) / 100).toFixed(2));\nconsole.log(\"Charging:\", totalCents(cart), \"cents\");\nconsole.log(\"Customer was quoted 6948 cents. Match?\", matchesQuote(cart, 6948));",
  "hints": [
    "Press Run and read the three lines against each other. The receipt says $69.48, which is right - 3.99 + 19.99 + 45.50 really is 69.48. But the charge says 6947.999999999999 cents, and the quote check says false. The cart is correct and the code disagrees with it, so the code is wrong, not the cart.",
    "A double stores a number as a sum of halves, quarters, eighths, and so on. 45.50 lands exactly - .5 is 1/2. There is no sum of halvings that reaches 1/100, so 3.99 and 19.99 are each stored a hair off, and the sum times 100 lands just under 6948 instead of on it. toFixed(2) is why the receipt still looks perfect: it rounds for display and hands back a string, so it hides the drift instead of fixing it, and a string never === a number anyway.",
    "Stop letting money be a float. Turn each price into whole cents at the edge with Math.round, then only ever add integers:\n\nfunction totalCents(items) {\n  return items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);\n}\n\nMath.round is doing real work there, not decoration: 19.99 * 100 is 1998.9999999999998, so Math.trunc would silently bill 1998 and lose a cent. Leave matchesQuote alone - it was always right, and it starts working the moment totalCents returns an integer."
  ],
  "tests": [
    {
      "name": "the cart totals exactly 6948 cents",
      "code": "if (totalCents(cart) !== 6948) throw new Error('totalCents(cart) should be exactly 6948 (3.99 + 19.99 + 45.50 = $69.48), got ' + totalCents(cart));"
    },
    {
      "name": "the total is a whole number of cents",
      "code": "if (!Number.isInteger(totalCents(cart))) throw new Error('totalCents(cart) must be a whole number of cents, got ' + totalCents(cart));"
    },
    {
      "name": "totalCents returns a number, not a string",
      "code": "if (typeof totalCents(cart) !== 'number') throw new Error('totalCents must return a number, not a ' + typeof totalCents(cart) + ' - remember toFixed(2) hands back a string');"
    },
    {
      "name": "a different cart: $0.10 + $0.20 is 30 cents",
      "code": "const t = totalCents([{ name: 'Sticker', price: 0.10 }, { name: 'Badge', price: 0.20 }]); if (t !== 30) throw new Error('a $0.10 + $0.20 cart should total 30 cents, got ' + t);"
    },
    {
      "name": "a one-item $19.99 cart is 1999 cents",
      "code": "const t = totalCents([{ name: 'Mouse', price: 19.99 }]); if (t !== 1999) throw new Error('a single $19.99 item should total 1999 cents, got ' + t);"
    },
    {
      "name": "matchesQuote accepts the amount the customer was quoted",
      "code": "if (matchesQuote(cart, 6948) !== true) throw new Error('matchesQuote(cart, 6948) should be true - the cart really does total $69.48');"
    },
    {
      "name": "matchesQuote still rejects a quote that is off by a cent",
      "code": "if (matchesQuote(cart, 6947) !== false) throw new Error('matchesQuote(cart, 6947) should be false - do not just return true');"
    }
  ]
}
```
