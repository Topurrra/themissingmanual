---
title: "Probability calculator"
guide: practice-python
phase: 15
summary: "Simulate drawing colored balls from a bag with replacement, using a provided deterministic random-number generator so the result is exactly reproducible."
tags: [python, probability, simulation, generators]
difficulty: intermediate
synonyms:
  - python probability simulation
  - simulate random draws python
  - deterministic random number generator python
  - monte carlo simulation python
updated: 2026-07-10
---

# Probability calculator

Simulating randomness usually means `import random` - but that makes a lesson
impossible to grade with an exact `==`, since the "right" answer changes
every run. The fix: a **linear congruential generator (LCG)**, a tiny formula
that produces a deterministic stream of numbers that *look* random but are
100% reproducible from a fixed `seed`. Same seed in, same numbers out, every
single time.

You're given the generator already written - it's not something you need to
implement:

```python
def lcg(seed):
    state = seed
    while True:
        state = (state * 1103515245 + 12345) % (2**31)
        yield state / (2**31)
```

`lcg(seed)` is a generator (phase 7): calling `next()` on it gives you the
next float in `[0, 1)`. To use one of those floats to pick an item from
`bag` (a list of color-name strings, with duplicates - e.g. `['red']*5 +
['blue']*3` for a bag weighted 5-to-3 toward red), scale it into a valid
index: `bag[int(r * len(bag))]`.

**Your task:** write `simulate_draws(bag, n, seed)`. Create one generator
with `lcg(seed)`, then draw from `bag` **with replacement** `n` times - each
draw pulls the next float from the generator and uses it to pick one item
from `bag` as described above. Return a dict mapping each color that was
drawn to how many times it came up.

**You'll practice:**

- Driving a generator with `next()` to get a reproducible sequence of values
- Turning a `[0, 1)` float into a valid list index
- Building up a count dict across `n` iterations

```lesson
{
  "language": "python",
  "starterCode": "def lcg(seed):\n    state = seed\n    while True:\n        state = (state * 1103515245 + 12345) % (2**31)\n        yield state / (2**31)\n\n# Write simulate_draws(bag, n, seed): draw from bag WITH replacement n times,\n# using lcg(seed) for randomness - next(gen) gives r in [0, 1), and\n# bag[int(r * len(bag))] picks one item. Return {color: count}.\ndef simulate_draws(bag, n, seed):\n    pass",
  "solution": "def lcg(seed):\n    state = seed\n    while True:\n        state = (state * 1103515245 + 12345) % (2**31)\n        yield state / (2**31)\n\ndef simulate_draws(bag, n, seed):\n    gen = lcg(seed)\n    counts = {}\n    for _ in range(n):\n        r = next(gen)\n        color = bag[int(r * len(bag))]\n        counts[color] = counts.get(color, 0) + 1\n    return counts",
  "hints": ["Create the generator once, outside the loop: gen = lcg(seed).", "Each draw: r = next(gen), then color = bag[int(r * len(bag))].", "Build up counts the same way as the word-counter capstone: counts[color] = counts.get(color, 0) + 1."],
  "tests": [
    { "name": "1000 draws with seed 42 matches the exact reproducible result", "code": "bag = ['red'] * 5 + ['blue'] * 3\nassert simulate_draws(bag, 1000, seed=42) == {'red': 617, 'blue': 383}, \"simulate_draws(bag, 1000, seed=42) should be {'red': 617, 'blue': 383}\"" },
    { "name": "500 draws with a different seed gives a different, still exact result", "code": "bag = ['red'] * 5 + ['blue'] * 3\nassert simulate_draws(bag, 500, seed=7) == {'red': 318, 'blue': 182}, \"simulate_draws(bag, 500, seed=7) should be {'red': 318, 'blue': 182}\"" },
    { "name": "total draws always equals n", "code": "bag = ['red'] * 5 + ['blue'] * 3\nresult = simulate_draws(bag, 1000, seed=42)\nassert sum(result.values()) == 1000, 'the counts should add up to the total number of draws'" }
  ]
}
```
