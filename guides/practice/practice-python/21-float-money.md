---
title: "Fix the bug: the till is a penny short"
guide: practice-python
phase: 21
summary: "The total runs clean and prints a perfectly reasonable number, then charges a penny less than the receipt says. One 10c carrier bag is doing it."
tags: [python, floats, money, rounding, debugging, decimal]
difficulty: advanced
synonyms:
  - python 0.1 + 0.2 not equal 0.3
  - why is my python total off by a penny
  - python float money rounding error
  - should i use float for currency python
  - python decimal vs float for money
  - float sum wrong last digit python
updated: 2026-07-17
---

# Fix the bug: the till is a penny short

The shop started charging 10c for a carrier bag last month. Since then the
end-of-day reconciliation has drifted - not every day, and never by much. A penny
here, a penny there. Nobody can find the broken line, because no line looks broken.

`total_cents` takes a basket of prices in dollars and returns the total in whole
cents, which is the only thing the card processor accepts. Today's basket is a
$2.50 notebook, a $1.25 pen, a $0.75 eraser and the 10c bag. Add it up on paper:
$4.60, so 460 cents. Run the code. It prints 459.

Nothing throws. Nothing warns. The number even looks reasonable - without the
receipt in your hand you would never think to question it. The till just charges a
penny less than it should, and the books stop balancing.

The part worth noticing: this code was correct for a year. $2.50, $1.25 and $0.75
are halves and quarters, and a float stores those exactly. The bag is the value
that broke it.

**Your task:** fix `total_cents` so it returns the exact number of cents in the
basket. Today's basket is 460.

**You'll practice:**

- Checking a plausible-looking number against the answer a human would write down
- Converting money to whole cents before the arithmetic instead of after

```lesson
{
  "language": "python",
  "starterCode": "# The card processor only takes whole cents. This basket - a $2.50 notebook, a\n# $1.25 pen, a $0.75 eraser and a 10c bag - is $4.60, so this should print 460.\n# It runs without a single error. It prints 459. Fix total_cents.\ndef total_cents(prices):\n    total = 0.0\n    for price in prices:\n        total += price\n    return int(total * 100)\n\nprint(total_cents([2.50, 1.25, 0.75, 0.10]))",
  "solution": "def total_cents(prices):\n    total = 0\n    for price in prices:\n        total += round(price * 100)\n    return total\n\nprint(total_cents([2.50, 1.25, 0.75, 0.10]))",
  "hints": [
    "Run it. It prints 459. Now add the basket up the way a cashier would: 2.50 + 1.25 + 0.75 + 0.10 = 4.60, which is 460 cents. The receipt is not wrong, so the arithmetic is. A number that looks sensible is still a claim - check it against the answer you already know.",
    "Print total just before the return: it shows 4.6, which looks perfect. Now print total * 100: 459.99999999999994. A float is a binary fraction - it stores halves, quarters, eighths, and sums of those, exactly. 2.50, 1.25 and 0.75 are precisely that, which is why this code was right for a year. One tenth is not: in binary, 1/10 is 0.0001100110011... repeating forever, the same way 1/3 is 0.333... forever in decimal. Python has to cut it off somewhere. 4.60 cannot be stored exactly either, and the nearest float to it sits just below 4.60 - so total * 100 lands at 459.99999999999994, and int() throws the fraction away rather than rounding, giving 459.",
    "Convert each price to whole cents as it comes in, then stay in integers - integers never drift:\n\ndef total_cents(prices):\n    total = 0\n    for price in prices:\n        total += round(price * 100)\n    return total\n\nDo it per price, not once at the end. Rounding the final float would paper over this basket, but converting at the door is what keeps a 3-item basket and a 3000-item one both exact. When you need fractional cents (tax, interest, currency conversion), decimal.Decimal is the other standard answer."
  ],
  "tests": [
    { "name": "the basket with the 10c bag", "code": "assert total_cents([2.50, 1.25, 0.75, 0.10]) == 460, 'a $2.50 notebook, $1.25 pen, $0.75 eraser and a 10c bag is $4.60, so total_cents should be 460'" },
    { "name": "a different basket, same 10c bag", "code": "assert total_cents([1.20, 2.90, 0.10]) == 420, 'a $1.20 marker, $2.90 folder and a 10c bag is $4.20, so total_cents should be 420'" },
    { "name": "the same basket before the bag charge existed", "code": "assert total_cents([2.50, 1.25, 0.75]) == 450, 'a $2.50 notebook, $1.25 pen and $0.75 eraser is $4.50, so total_cents should be 450'" }
  ]
}
```
