---
title: "Connectives: AND, OR, NOT"
guide: "propositional-logic"
phase: 1
summary: "AND is true only when both parts are; OR is true when at least one is (the inclusive or that trips people up); NOT flips. The three operators that build every compound statement."
tags: [logic, propositional-logic, and, or, not, connectives]
difficulty: beginner
synonyms: ["what does AND mean in logic", "what does OR mean in logic", "inclusive vs exclusive or", "logical not", "logical connectives"]
updated: 2026-06-25
---

# Connectives: AND, OR, NOT

You already use these. Every `if (loggedIn && isAdmin)`, every `if (cached || fresh)`, every `if (!expired)` is propositional logic. You may never have called it that. You learned the rules by writing code that broke, then fixing it.

This phase names what you already half-know and tightens it. Once the three connectives are precise in your head, you stop second-guessing conditions. You'll read a tangled `if` and know exactly when it fires — no running it three times to be sure.

One at a time: AND, then OR, then NOT. Three operators. Every compound condition you'll ever write is built from these.

## 📝 Quick recap: propositions and connectives

A **proposition** is a statement that is either true or false — nothing in between. "It is raining." "The user is logged in." "7 is even" (false, but still a proposition). If you can ask "is that true?" and expect a yes/no answer, it's a proposition.

A **connective** combines propositions into a bigger one. "It is raining AND I have an umbrella" is one statement built from two. The whole thing is true or false, and *its* truth depends on the truth of its parts plus which connective you used.

That's the entire game this phase: given the truth of the parts, what's the truth of the whole? (New to all this? Start at [/guides/what-logic-actually-is](/guides/what-logic-actually-is).)

## AND (conjunction, ∧)

AND is the demanding one. "P AND Q" is true **only when both P and Q are true**. The moment either part is false, the whole thing is false.

Think of a contract with two required conditions. "You get in if you have a ticket AND you're on the list." Miss either one and you're out.

```text
true  AND true   →  true
true  AND false  →  false
false AND true   →  false
false AND false  →  false
```

Three of the four rows are false. AND is hard to satisfy — it says yes only when everything lines up. The symbol is **∧** (a pointy "and"); in code it's `&&`.

## OR (disjunction, ∨)

OR is the generous one. "P OR Q" is true when **at least one** of them is true. One part true is enough. Both true is also fine.

```text
true  OR true   →  true
true  OR false  →  true
false OR true   →  true
false OR false  →  false
```

Only one row is false — the row where *everything* is false. OR is easy to satisfy: it says no only when both parts fail. The symbol is **∨** (a pointy "or"); in code it's `||`.

That top row catches people. `true OR true` is **true**, not false. That's the whole gotcha, so let's sit with it.

### ⚠️ The inclusive-or trap

Read this: "You can have soup or salad."

In a restaurant, that means *one or the other, not both*. Ask for both and the server raises an eyebrow. Everyday English "or" is often **exclusive** — it quietly means "but not both."

Logical OR is **inclusive**. "P OR Q" is true even when both are true. No eyebrow. `true || true` is `true`, full stop.

This isn't a quirk to memorize and resent — it's the more useful default. "Notify the user if they have unread messages OR pending invites" should fire when they have *both*. You almost never want it to go quiet because two things are true at once.

The "exactly one, not both" meaning does exist in logic. It's a separate connective called **XOR** (exclusive or), with its own symbol (⊕) and its own rules. We'll meet it later. For now, burn in:

> 💡 Logical OR is inclusive. "At least one is true" — including the case where both are.

## NOT (negation, ¬)

NOT is the odd one out, usefully so: it takes **one** input, not two. It's **unary**. AND and OR each chew on two propositions; NOT works on a single one and flips it.

"NOT P" is true exactly when P is false. It's the toggle.

```text
NOT true   →  false
NOT false  →  true
```

That's the whole table. Apply NOT twice and you're back where you started: `NOT (NOT P)` has the same truth as `P`. The symbol is **¬**; in code it's `!`.

NOT is small but bugs love to hide there, because people misread *what* they're negating. `!loggedIn || isAdmin` negates only `loggedIn`, not the whole expression. Where the NOT reaches — its **scope** — matters as much as the NOT itself. Grouping and precedence is a rabbit hole of its own; for now, notice that NOT attaches to one thing, and be deliberate about which thing.

## The three, side by side

Symbol, plain name, and code form together, so the translation becomes automatic:

```text
∧   AND (conjunction)   &&    true only when both are true
∨   OR  (disjunction)   ||    true when at least one is true
¬   NOT (negation)      !     flips true ↔ false (one input)
```

A logic paper shows ∧ ∨ ¬. A codebase shows `&&` `||` `!`. Same three ideas, different clothes. Being fluent both directions is most of what "knowing propositional logic" means at this stage.

## 🪖 For builders

In your editor, the mapping is exact:

- `&&` is AND — both sides must be truthy.
- `||` is OR — at least one side truthy. (Inclusive. `true || true` is `true`.)
- `!` is NOT — flips a boolean.

One extra thing your code does that pure logic doesn't: **short-circuit evaluation**. With `a && b`, if `a` is false, your program never evaluates `b` — the answer is already false. With `a || b`, if `a` is true, it skips `b` for the same reason. The *result* matches the truth tables above; the difference is that the second operand might not run. That's why `user && user.name` is safe — if `user` is null, `user.name` is never touched.

We're studying truth values here, not evaluation order. But the short-circuit is worth knowing, because it's the bridge between "AND is true only when both are true" and the defensive `if` checks you write every day.

## Recap

- A **proposition** is true or false. A **connective** combines propositions into a bigger true-or-false statement.
- **AND (∧, `&&`)** — true *only* when both parts are true. Hard to satisfy.
- **OR (∨, `||`)** — true when *at least one* part is true, including when both are. **Inclusive.** Easy to satisfy.
- **NOT (¬, `!`)** — unary; flips true and false.
- Everyday "or" is often exclusive ("soup or salad"); logical OR is not. The exclusive version is **XOR**, a separate connective.

You now have the three building blocks. Next, we lay them out properly — not as inline lists, but as full **truth tables**, the tool that lets you analyze *any* compound statement no matter how tangled.

## Open-ended exercise

Take this real condition from a codebase:

```text
if (!(user.isGuest || user.isBanned)) { allowAccess(); }
```

Rewrite it — without changing its meaning — into a condition that uses `&&` instead of
`||`, by applying De Morgan's law. Then write, in one sentence, what the rewritten
condition checks for. The goal is to make the guard so clear that a teammate can read
it and immediately understand the rule.

Here's a quick check before you move on.

```quiz
[
  {
    "q": "P is true and Q is false. What is \"P AND Q\"?",
    "choices": ["true", "false", "It depends on the order", "Undefined"],
    "answer": 1,
    "explain": "AND is true only when both parts are true. Q is false, so the whole conjunction is false."
  },
  {
    "q": "Logical OR is inclusive. So when both P and Q are true, \"P OR Q\" is:",
    "choices": ["false, because that's the exclusive case", "true, because at least one is true", "true only if you use XOR", "false unless exactly one is true"],
    "answer": 1,
    "explain": "Inclusive OR is true whenever at least one part is true — and that includes the case where both are true. The 'exactly one, not both' meaning is XOR, a different connective."
  },
  {
    "q": "P is false. What is \"NOT P\"?",
    "choices": ["false", "true", "still false", "It needs a second input"],
    "answer": 1,
    "explain": "NOT flips the value. P is false, so NOT P is true. NOT is unary — it takes a single input, no second operand needed."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Truth Tables →](02-truth-tables.md)