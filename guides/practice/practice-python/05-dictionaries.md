---
title: "Dictionaries"
guide: practice-python
phase: 5
summary: "Look up values by key in a dict, total them with a generator expression, and fall back to a default with .get() when a key might be missing."
tags: [python, dictionaries, dict, generator-expression, get]
difficulty: beginner
synonyms:
  - python dictionaries
  - python dict lookup
  - sum generator expression python
  - python dict get default
updated: 2026-07-10
---

# Dictionaries

A dict maps keys to values: `{"apple": 2, "bread": 3}` looks up a price by
name instead of by position, the way a list would. `prices["apple"]` reads the
value stored under the key `"apple"` - and it throws a `KeyError` if that key
doesn't exist, so you're always looking up something that's actually there in
this lesson.

`sum(x for x in items)` totals a generator expression - like a list
comprehension without the brackets, built to be summed (or looped) instead of
collected into a list first.

Sometimes a key might *not* be there, and a `KeyError` would be the wrong
behavior. `prices.get(key, default)` reads a value the same way `[]` does, but
returns `default` instead of raising when the key is missing - the safe way to
look something up when you're not sure it exists.

**Your task:** write `total_cost(items, prices)`, which takes a list of item
names and returns the sum of their prices, looked up in `prices`. Then write
`total_cost_safe(items, prices)`, doing the same thing but treating any item
*not* in `prices` as costing `0` instead of raising.

**You'll practice:**

- Looking up values in a dict with `[]`
- Summing a generator expression
- Falling back to a default with `.get(key, default)` when a key might be missing

```lesson
{
  "language": "python",
  "starterCode": "prices = {\"apple\": 2, \"bread\": 3, \"milk\": 4}\n\n# Write total_cost(items, prices): sum of prices[item] for each item in items.\ndef total_cost(items, prices):\n    pass\n\n# Write total_cost_safe(items, prices): same, but items missing from prices count as 0.\ndef total_cost_safe(items, prices):\n    pass",
  "solution": "prices = {\"apple\": 2, \"bread\": 3, \"milk\": 4}\n\ndef total_cost(items, prices):\n    return sum(prices[item] for item in items)\n\ndef total_cost_safe(items, prices):\n    return sum(prices.get(item, 0) for item in items)",
  "hints": ["Look up a dict value with prices[key].", "sum(x for x in ...) totals a generator expression - no brackets needed.", "prices.get(item, 0) returns 0 instead of raising when item isn't a key in prices."],
  "tests": [
    { "name": "total_cost sums looked-up prices", "code": "assert total_cost([\"apple\", \"milk\"], prices) == 6, 'total_cost([\"apple\", \"milk\"], prices) should be 6'" },
    { "name": "total_cost handles repeats", "code": "assert total_cost([\"bread\", \"bread\"], prices) == 6, 'total_cost([\"bread\", \"bread\"], prices) should be 6'" },
    { "name": "total_cost_safe treats a missing item as 0", "code": "assert total_cost_safe([\"apple\", \"kiwi\"], prices) == 2, 'total_cost_safe([\"apple\", \"kiwi\"], prices) should be 2 (kiwi is missing, counts as 0)'" },
    { "name": "total_cost_safe matches total_cost when nothing is missing", "code": "assert total_cost_safe([\"bread\", \"milk\"], prices) == 7, 'total_cost_safe([\"bread\", \"milk\"], prices) should be 7'" }
  ]
}
```
