---
title: "Capstone: the average that reads too low"
guide: practice-python
phase: 22
summary: "The weekly report runs clean and prints 50.0. The real average order value is 75.0. Two records the API never filled in are sitting in the denominator."
tags: [python, debugging, dictionaries, none, average, api-data]
difficulty: advanced
synonyms:
  - python get or 0 gives wrong average
  - dict get returns none for missing key
  - python average wrong with missing values
  - skip none values when averaging python
  - python or 0 turns none into zero
  - difference between missing and zero python
updated: 2026-07-17
---

# Capstone: the average that reads too low

Finance pulled the weekly order report and asked why average order value is
`50.0`. Nothing about the business changed, and the orders they can see on their
own screen are 40, 120, 65 and 75 - which average 75.

Nothing crashed. No traceback, no red text. This function has run every Monday
for months and handed back a clean, believable number every time. It is just the
wrong number, which is the only kind of bug that gets to live for months.

Here is what the payments API actually sends. An order cancelled before payment
comes back with no `amount` key at all. A refunded order comes back as
`"amount": null`, which `json.loads` hands you as `None`. Both mean the same
thing here: no money was ever recorded against that order.

The function reaches for `order.get("amount") or 0`, an idiom you have written a
hundred times. Back in lesson 5, defaulting a missing key to `0` was the right
call - the value fed a `sum`, and adding 0 to a total changes nothing. Here the
value also feeds a **count**. A missing amount becomes an order worth 0, an order
worth 0 is a real order, and so it gets a seat in the denominator.

**Your task:** fix `average_order_value(orders)` so it averages only the orders
that actually have an amount. On the batch below that is `75.0`, not `50.0`. An
order whose amount really is `0` is data, not missing - it stays in.

**You'll practice:**

- Reading a plausible number as a claim, then checking the claim by hand
- Keeping "missing" and "zero" apart instead of letting `or 0` merge them

```lesson
{
  "language": "python",
  "starterCode": "# The weekly order report. It runs clean and prints a number - the wrong one. Fix it.\norders = [\n    {\"id\": \"A-1001\", \"amount\": 40},\n    {\"id\": \"A-1002\", \"amount\": 120},\n    {\"id\": \"A-1003\"},\n    {\"id\": \"A-1004\", \"amount\": 65},\n    {\"id\": \"A-1005\", \"amount\": None},\n    {\"id\": \"A-1006\", \"amount\": 75},\n]\n\ndef average_order_value(orders):\n    total = 0\n    count = 0\n    for order in orders:\n        amount = order.get(\"amount\") or 0\n        total += amount\n        count += 1\n    return total / count\n\nprint(average_order_value(orders))",
  "solution": "orders = [\n    {\"id\": \"A-1001\", \"amount\": 40},\n    {\"id\": \"A-1002\", \"amount\": 120},\n    {\"id\": \"A-1003\"},\n    {\"id\": \"A-1004\", \"amount\": 65},\n    {\"id\": \"A-1005\", \"amount\": None},\n    {\"id\": \"A-1006\", \"amount\": 75},\n]\n\ndef average_order_value(orders):\n    total = 0\n    count = 0\n    for order in orders:\n        amount = order.get(\"amount\")\n        if amount is None:\n            continue\n        total += amount\n        count += 1\n    return total / count\n\nprint(average_order_value(orders))",
  "hints": [
    "Press Run. It prints 50.0, nothing goes red, and 50.0 is a perfectly believable average - which is exactly why this bug survived. Now do it by hand: the amounts you can actually see are 40, 120, 65 and 75. They add up to 300, and there are four of them, so the answer is 75.0. To land on 50.0 the function divided that same 300 by six. Which two records did it count as orders?",
    "order.get(\"amount\") returns None twice in this batch: for A-1003, which has no \"amount\" key at all, and for A-1005, whose amount is literally None. Then the expression None or 0 evaluates to 0, because or hands back its right side whenever the left side is falsy, and None is falsy. So both records become an order worth 0. Adding 0 to total changes nothing, which is why the sum stayed correct - but count += 1 still runs for them, so both take a seat in the denominator and drag the average down.",
    "Ask what the value is, not whether it is truthy, and skip the record before it reaches either counter: set amount = order.get(\"amount\"), then if amount is None: continue, and only then run total += amount and count += 1. The test amount is None is true for both the missing key and the real None, and false for a genuine 0 - so an order that really was 0 stays in the average, which is what you want."
  ],
  "tests": [
    { "name": "a record with no amount key is not an order for 0", "code": "assert average_order_value([{\"id\": \"B-1\", \"amount\": 40}, {\"id\": \"B-2\"}, {\"id\": \"B-3\", \"amount\": 80}]) == 60.0, 'a record with no \"amount\" key must not count as a 0 order - the average of 40 and 80 is 60.0'" },
    { "name": "an amount of None is not an order for 0", "code": "assert average_order_value([{\"id\": \"C-1\", \"amount\": 50}, {\"id\": \"C-2\", \"amount\": None}, {\"id\": \"C-3\", \"amount\": 100}]) == 75.0, 'an amount of None must not count as a 0 order - the average of 50 and 100 is 75.0'" },
    { "name": "an order that really was 0 still counts", "code": "assert average_order_value([{\"id\": \"D-1\", \"amount\": 0}, {\"id\": \"D-2\", \"amount\": 100}]) == 50.0, 'an amount of 0 is data, not missing - it stays in the average, so this is 50.0'" },
    { "name": "the weekly batch averages 75.0, not 50.0", "code": "assert average_order_value([{\"id\": \"A-1001\", \"amount\": 40}, {\"id\": \"A-1002\", \"amount\": 120}, {\"id\": \"A-1003\"}, {\"id\": \"A-1004\", \"amount\": 65}, {\"id\": \"A-1005\", \"amount\": None}, {\"id\": \"A-1006\", \"amount\": 75}]) == 75.0, 'the batch has four real amounts (40, 120, 65, 75) and averages 75.0, not 50.0'" }
  ]
}
```
