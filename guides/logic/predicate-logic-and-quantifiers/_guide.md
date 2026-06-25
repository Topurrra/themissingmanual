---
title: "Predicate Logic & Quantifiers"
guide: "predicate-logic-and-quantifiers"
phase: 0
summary: "Propositional logic treats whole statements as atoms. Predicate logic looks inside them — at properties of things and the words 'for all' and 'there exists' — which is how you say precise things about whole collections at once."
tags: [logic, predicate-logic, quantifiers, for-all, there-exists, beginner-friendly]
category: logic
order: 4
difficulty: beginner
synonyms: ["what is predicate logic", "for all there exists", "universal and existential quantifier", "what does the upside down A mean", "negating a quantifier", "first order logic basics"]
updated: 2026-06-25
---

# Predicate Logic & Quantifiers

[Propositional Logic](/guides/propositional-logic) gave you AND, OR, and NOT — but it treats every
statement as a single sealed atom. "All users have a password" is only `P` to it; it can't see the
*all*, can't see the *users*, can't reason about them one by one. That's a ceiling you hit fast, because
almost everything worth saying is a statement *about a collection*: every request, some account, no
file.

Predicate logic raises that ceiling. It cracks statements open to talk about **properties of things**
(predicates) and adds two small words that do enormous work: **for all** (∀) and **there exists** (∃).
With them you can say exactly what's true of an entire set, spot when someone overclaims ("*all*?
really?"), and negate a sweeping statement correctly. If you've ever written `.all()`, `.any()`,
`.every()`, or `.some()`, you've already used this — here's the logic underneath.

## How to read this
- **Want the two power words?** [Phase 2](02-quantifiers-for-all-there-exists.md) is ∀ and ∃ — the heart
  of the guide.
- **Want it solid?** Read in order — Phase 1 explains predicates, which the quantifiers act on.

## The phases
1. **[Predicates: Statements With Variables](01-predicates-statements-with-variables.md)** — a statement
   with a blank in it, and the "domain" it ranges over.
2. **[Quantifiers: For All and There Exists](02-quantifiers-for-all-there-exists.md)** — ∀ and ∃, what
   makes each true, and the counterexample that kills a "for all."
3. **[Negating & Nesting Quantifiers](03-negating-and-nesting-quantifiers.md)** — how to negate "for
   all" / "there exists" correctly, and why the *order* of nested quantifiers changes the meaning.

> This builds on [Propositional Logic](/guides/propositional-logic) and uses the idea of a set from
> [Sets, Relations & Functions](/guides/sets-relations-and-functions). The Logic track continues into
> proof and spotting fallacies.

---

[Phase 1: Predicates: Statements With Variables →](01-predicates-statements-with-variables.md)
