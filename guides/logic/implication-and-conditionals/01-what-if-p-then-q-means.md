---
title: "What \"If P Then Q\" Really Means"
guide: "implication-and-conditionals"
phase: 1
summary: "A conditional 'if P then Q' is false in exactly one situation: P true and Q false. Everywhere else it's true — including the surprising 'vacuously true' cases where P is false."
tags: [logic, implication, conditional, vacuous-truth]
difficulty: beginner
synonyms: ["what does if then mean in logic", "truth table of implication", "when is a conditional true", "vacuous truth", "material implication"]
updated: 2026-06-25
---

# What "If P Then Q" Really Means

## A conditional is a promise

Take a simple claim: **"If it rains, the street is wet."**

That's a conditional. It links two smaller statements in an *if… then…* shape. The most useful
way to feel what it means is to treat it as a **promise**.

A promise has exactly one way to be broken. Everything else leaves it intact. So instead of asking
"when is this conditional true?", flip it to a question your gut already gets:

> **When is the promise broken?**

Hold onto that. It's the whole guide in one question, and the answer surprises almost everyone the
first time.

## 📝 Terms

A few names so we can talk precisely.

- **Implication** — the *if… then…* connection itself. We write it `P → Q` and read it
  out loud as **"if P then Q"** (or "P implies Q"). The arrow is the operator.
- **Antecedent** — the part after *if*. It's the **hypothesis**, the condition being
  supposed. In `P → Q`, that's `P`. ("If **it rains**…")
- **Consequent** — the part after *then*. It's what's claimed to follow. In `P → Q`,
  that's `Q`. ("…**the street is wet**.")

So `P → Q` means: *supposing P, then Q.* Antecedent first, consequent second.

Each of `P` and `Q` is either true or false. That gives four combinations to check — which is
exactly what a truth table does.

## The truth table

Here's every case for `P → Q`. Read each row as: given these truth values for the parts, is the
*whole* promise true or false?

```text
  P       Q       P → Q
-------------------------
  true    true    true
  true    false   FALSE   ← the only broken promise
  false   true    true
  false   false   true
```

Look at the second column from the right. `P → Q` is **true in every case except one**: when
`P` is true and `Q` is false.

That single false row is the broken promise. Back to "if it rains, the street is wet." The only way
to catch that claim lying is to find a moment when **it is raining** (P true) and yet **the street
is dry** (Q false). Rain, but no wet street — promise broken. That's row two.

Every other row keeps the promise:

- **Rain and wet street** (true → true): exactly what was promised. True.
- The two rows where it *isn't* raining: we'll get to those next, because they're the
  surprising ones.

## The surprising part — vacuous truth

The bottom two rows are where intuition pushes back. Both have a **false antecedent**, and in both,
`P → Q` comes out **true** — no matter what `Q` is.

This is **vacuous truth**: when the *if* part is false, the whole conditional is true by default,
because the promise was never tested.

Try it with a promise you'd actually make:

> **"If you score 100 on the test, I'll buy you ice cream."**

Suppose you scored 92. You did **not** score 100, so the antecedent is false. Did I break my
promise?

- I buy you ice cream anyway → I clearly didn't break it.
- I don't buy you ice cream → I *still* didn't break it. I promised ice cream *on the condition of
  100*, and that condition never happened.

Either way, you can't accuse me of breaking the promise. The only scenario that catches me lying is
**you score 100 and I withhold the ice cream** — true antecedent, false consequent. That's the one
false row again.

So when the condition doesn't fire, the promise can't be broken — and "not broken" is exactly what
**true** means. The conditional holds vacuously.

## A quick honesty note: this is about truth, not causes

One thing worth being upfront about. Logical implication — sometimes called **material
implication** — is purely a rule about **truth values**. `P → Q` does *not* claim that P
**causes** Q, or that they're related at all.

"If 2 + 2 = 5, then the moon is cheese" is a true implication, purely because its antecedent is
false (vacuous truth again). There's no causal story, and the logic doesn't pretend there is.
Implication answers one narrow question — *is the promise broken?* — and nothing more. Everyday
"if… then…" smuggles in cause and timing; the logical operator doesn't. Keep them separate and the
truth table stops feeling weird.

## For builders

You already use this shape, probably daily.

A **guard** or **precondition** is a conditional claim: *"if this flag is set, then this value must
be valid."* You're asserting `flagSet → valid`. It's broken only in one case: the flag is set *and*
the value is invalid. That's the bug you're guarding against.

Vacuous truth shows up too. Consider:

```text
if (P) {
    doSomething();
}
```

When `P` is false, the block doesn't run. Nothing fires, nothing is violated. If someone asserted
"whenever P, we doSomething," that claim still **holds** on every run where P was false — there was
no chance to violate it. Same logic as the ice cream: condition didn't trigger, so no promise was
broken.

This is also why a `filter` or validation over an **empty list** passes every "for all" check:
there's no element to break the rule, so the rule holds vacuously.

## ⚠️ Gotcha: vacuous truth feels wrong, but it's consistent

The first time you accept that "if pigs fly, I'm a millionaire" is **true**, your brain will
protest. That's normal. The protest comes from everyday speech, where "if… then…" implies a real
connection.

But the rule is dead consistent: **a false antecedent makes the whole conditional true.** No
exceptions, no edge cases. The payoff is that there's only *one* false row to ever worry about,
which makes proofs and logic enormously cleaner. (We lean on this all the time once we get to
[propositional logic](/guides/propositional-logic).) Trust the table over the gut here.

## Recap

- `P → Q` reads **"if P then Q."** `P` is the **antecedent** (hypothesis), `Q` is the
  **consequent**.
- A conditional is a **promise**, and there's exactly **one** way to break it:
  **P true, Q false.** That's the only false row.
- Every other case is true — including the two **vacuously true** cases where `P` is false.
  No condition fired, so no promise was broken.
- Material implication is about **truth values, not causation**. `P → Q` doesn't say P
  causes Q.
- For builders: it's the logic of guards and `if` blocks that don't fire — the claim still
  holds.

If the truth table still feels strange, you understood it correctly — the strangeness is the point,
and it's worth getting comfortable with. For why this kind of careful reasoning is less intimidating
than it looks, see [why math isn't your enemy](/guides/why-math-isnt-your-enemy)
and [what logic actually is](/guides/what-logic-actually-is).

## Open-ended exercise

A teammate writes this API guard:

```text
if (user.isAdmin) { allowDelete(); }
```

They argue: "If the user is an admin, they can delete. That's the rule." But a security
review points out that non-admins can also delete in some edge cases. Is the original
conditional `user.isAdmin → allowDelete()` *false* in those edge cases? Why or why not?
Think carefully about what the conditional actually promises — and what it doesn't.

Quick check before moving on:

```quiz
[
  {
    "q": "In which single case is the conditional P → Q false?",
    "choices": [
      "P is true and Q is false",
      "P is false and Q is true",
      "P is false and Q is false",
      "P is true and Q is true"
    ],
    "answer": 0,
    "explain": "A conditional is broken only when the antecedent holds but the consequent fails: P true, Q false. Every other combination leaves P → Q true."
  },
  {
    "q": "It is NOT raining. Is 'If it rains, the street is wet' true or false right now?",
    "choices": [
      "False, because the street might be dry",
      "It depends on whether the street is wet",
      "True — with a false antecedent, the conditional is vacuously true",
      "Undefined, since the condition didn't happen"
    ],
    "answer": 2,
    "explain": "A false antecedent makes the whole conditional true (vacuous truth). The promise can only be broken when it actually rains and the street stays dry."
  },
  {
    "q": "In 'P → Q', what are P and Q called?",
    "choices": [
      "P is the consequent; Q is the antecedent",
      "P is the antecedent (hypothesis); Q is the consequent",
      "Both are antecedents",
      "P is the operator; Q is the implication"
    ],
    "answer": 1,
    "explain": "The part after 'if' is the antecedent (the hypothesis), and the part after 'then' is the consequent. Order matters: antecedent → consequent."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Converse, Inverse, Contrapositive →](02-converse-inverse-contrapositive.md)