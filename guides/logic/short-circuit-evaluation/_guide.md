---
title: "Short-Circuit Evaluation"
guide: short-circuit-evaluation
phase: 0
summary: "Why && and || stop evaluating the moment the answer is already determined, and how that becomes both a useful coding pattern and a source of subtle bugs."
tags: [short-circuit-evaluation, boolean-logic, operators, programming, logic]
category: logic
order: 9
difficulty: beginner
synonyms:
  - what is short circuit evaluation
  - why does && stop early
  - how does || work in javascript
  - guard pattern with &&
  - why is my fallback value being used unexpectedly
  - nullish coalescing vs or
updated: 2026-07-04
---

# Short-Circuit Evaluation

You've written `if (user && user.name)` without thinking twice about it. But have you ever asked what happens if `user` is `null` - does `user.name` still get evaluated, and crash? It doesn't, and the reason it doesn't is a rule built into nearly every programming language: `&&` and `||` stop evaluating the instant they already know the answer. That behavior has a name - **short-circuit evaluation** - and it's doing more work in your code than you probably realize, for better and for worse.

## How to read this

Read in order. Phase 1 is the rule itself, in its simplest form. Phase 2 shows the two everyday patterns this rule enables - patterns you've almost certainly used already. Phase 3 is the part worth slowing down for: the gotchas that show up when short-circuiting interacts with side effects and falsy values.

## The phases

1. [Why bother checking the second half](01-the-core-rule.md) - the rule: AND stops at the first false, OR stops at the first true.
2. [Where this becomes a real pattern](02-real-patterns.md) - guard checks and default values.
3. [The gotcha](03-the-gotcha.md) - skipped side effects, and the falsy-value surprise with `||`.

[Phase 1: Why bother checking the second half](01-the-core-rule.md) →
