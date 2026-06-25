---
title: "Boolean Algebra & Logic Gates"
guide: "boolean-algebra-and-logic-gates"
phase: 0
summary: "The same AND/OR/NOT you already know, turned into an algebra you can compute with — and then etched into hardware as logic gates. This is the bridge from 'true and false' all the way down to how a CPU adds two numbers."
tags: [logic, boolean-algebra, logic-gates, hardware, nand, beginner-friendly]
category: logic
order: 5
difficulty: beginner
synonyms: ["what is boolean algebra", "logic gates explained", "and or not gates", "what is a nand gate", "how does a computer add", "how do logic gates make a cpu", "half adder"]
updated: 2026-06-25
---

# Boolean Algebra & Logic Gates

Here is one of the most beautiful facts in all of computing: the entire machine in front of you — every
calculation, every pixel, every saved file — is built out of the three little words you already know
from [Propositional Logic](/guides/propositional-logic). **AND, OR, and NOT.** That's the whole
alphabet. Everything else is spelling.

This guide walks that bridge in two steps. First, **boolean algebra**: treating true/false as values you
can calculate with, using laws that let you simplify a tangled condition the same way you'd simplify
`2(x + 3)`. Then, **logic gates**: those same operations built as physical components — and how a
handful of them, wired together, learn to *add*. By the end, "the computer is only logic" will stop
being a slogan and become something you can actually trace, gate by gate.

## How to read this
- **Here for the "how does a CPU work" payoff?** [Phase 3](03-from-gates-to-a-computer.md) builds an
  adder from gates.
- **Want the full bridge?** Read in order — the algebra (Phase 1) and the gates (Phase 2) are what make
  Phase 3 click.

## The phases
1. **[Boolean Algebra: The Laws](01-boolean-algebra-the-laws.md)** — true/false as 1/0, the laws (incl.
   De Morgan), and simplifying expressions.
2. **[Logic Gates: Logic Made Physical](02-logic-gates-logic-made-physical.md)** — AND/OR/NOT/NAND/NOR/
   XOR gates, their truth tables, and why NAND alone can build anything.
3. **[From Gates to a Computer](03-from-gates-to-a-computer.md)** — wiring gates into an adder, and the
   leap from "adds two bits" to "is a CPU."

> This builds directly on [Propositional Logic](/guides/propositional-logic). It pairs well with the
> hardware track for what happens once these gates become silicon.

---

[Phase 1: Boolean Algebra: The Laws →](01-boolean-algebra-the-laws.md)
