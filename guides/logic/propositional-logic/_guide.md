---
title: "Propositional Logic"
guide: "propositional-logic"
phase: 0
summary: "The algebra of true and false: how AND, OR, and NOT combine statements, how truth tables prove what a compound claim really does, and the equivalences (like De Morgan's laws) that let you rewrite and negate conditions with confidence."
tags: [logic, propositional-logic, boolean, truth-tables, de-morgan, beginner-friendly]
category: logic
order: 2
difficulty: beginner
synonyms: ["what is propositional logic", "and or not logic", "how to make a truth table", "de morgan's laws explained", "boolean logic explained", "logical equivalence"]
updated: 2026-06-25
---

# Propositional Logic

You write `if (user.isActive && !user.isBanned)` without blinking. That `&&` and that `!` are
*propositional logic* - the oldest, most useful corner of logic, and the one that maps most directly
onto the code you write every day. It's the algebra of statements that are either true or false, and
the rules for combining them.

Most people pick this up by osmosis and end up with blind spots: an `or` that didn't mean what they
thought, a negated condition that quietly inverted the wrong thing, an `if` that's impossible to
satisfy. This guide closes those gaps. By the end you'll be able to take any tangle of `and`s, `or`s,
and `not`s and say *exactly* what it's true for - and rewrite it into something simpler without changing
its meaning.

It builds directly on [What Logic Actually Is](/guides/what-logic-actually-is): there you learned what a
statement is and what it means for reasoning to be valid. Here we make statements *combine*.

## How to read this
- **Want the core fast?** [Phase 1](01-connectives-and-or-not.md) covers the three connectives that do
  most of the work.
- **Want real fluency?** Read all three - Phase 2 gives you the tool (truth tables) that turns "I think
  this is right" into "I can prove this is right."

## The phases
1. **[Connectives: AND, OR, NOT](01-connectives-and-or-not.md)** - the three building blocks, what each
   one *precisely* means, and the inclusive-or trap.
2. **[Truth Tables](02-truth-tables.md)** - the machine for evaluating any compound statement, plus
   tautologies and contradictions.
3. **[Equivalences & De Morgan's Laws](03-equivalences-and-de-morgan.md)** - rewriting expressions
   without changing their meaning, and how to negate a condition correctly every time.

> The next guide, [Implication & Conditionals](/guides/implication-and-conditionals), tackles the
> trickiest connective of all - "if P then Q" - which deserves its own guide.

---

[Phase 1: Connectives: AND, OR, NOT →](01-connectives-and-or-not.md)
