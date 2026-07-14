---
title: "Floating Point and Money"
guide: floating-point-and-money
phase: 0
summary: "Why 0.1 plus 0.2 is not 0.3, what floats can and cannot represent, and the iron rule: never store money in a float."
tags: [floating-point, money, precision, rounding, decimal, numbers, ieee-754]
category: programming-concepts
order: 11
difficulty: beginner
synonyms: ["why is 0.1 + 0.2 not 0.3", "floating point rounding error", "how to store money in code", "why is my money calculation wrong", "what is a float", "decimal vs float", "floating point precision problem", "never use float for currency", "0.1 + 0.2 = 0.30000000000000004", "how to compare floats"]
updated: 2026-06-30
---

# Floating Point and Money

You typed `0.1 + 0.2` into a console once, expecting `0.3`, and got back `0.30000000000000004`. For a second you wondered if the computer was broken, or if you were. Neither. You'd run straight into how computers store fractions - and it's a wall everyone hits, usually right when real money is on the line and a total is off by a cent.

This guide makes that surprise stop being spooky. You'll see *why* it happens (it's not a bug, it's a design), where it quietly bites - money, equality checks, long running totals - and the small set of fixes that put it to rest for good. By the end you'll have one rule burned in that will save you a production incident: **never store money in a float.**

## How to read this
- **Want the one idea?** Read [Phase 1](01-why-floats-surprise-you.md). The whole guide rests on it: a float is a *binary* fraction, so most decimals can't be stored exactly.
- **Want it to stick?** Read in order. We start with why the surprise happens, then where it actually hurts, then exactly what to do instead - and when floats are completely fine.

## The phases
1. **[Why Floats Surprise You](01-why-floats-surprise-you.md)** - the mental model: a float stores numbers in binary, so values like 0.1 round on the way in. The 0.1 + 0.2 demo, decoded.
2. **[Where It Bites](02-where-it-bites.md)** - the three places rounding error turns into real bugs: money, exact equality checks, and long summations. Seen up close.
3. **[The Fixes (and When Floats Are Fine)](03-the-fixes.md)** - integer cents, a decimal type, comparing with a tolerance - and the other half of the story: where floats are exactly the right tool.

[Phase 1: Why Floats Surprise You](01-why-floats-surprise-you.md) →
