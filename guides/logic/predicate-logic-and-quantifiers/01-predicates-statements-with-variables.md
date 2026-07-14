---
title: "Predicates: Statements With Variables"
guide: "predicate-logic-and-quantifiers"
phase: 1
summary: "A predicate is a statement with a blank - 'x is even' - that becomes true or false only once you fill the blank. Plus the 'domain': the set of things the blank is allowed to be."
tags: [logic, predicate-logic, predicates, domain]
difficulty: beginner
synonyms: ["what is a predicate in logic", "statement with a variable", "domain of discourse", "predicate vs proposition", "what is P(x)"]
updated: 2026-06-25
---

# Predicates: Statements With Variables

## Where we left off

In [propositional logic](/guides/propositional-logic), every statement was a single sealed box.
"It is raining" was one atom, either true or false, and you never looked inside it. You combined
those boxes with `and`, `or`, `not`, and `→`, but the box stayed opaque. That worked until you
wanted to say something that wasn't about *one* fixed thing.

Try saying "every number greater than one has a prime factor" with only sealed boxes. You can't.
There's no single true-or-false statement there - there's a *pattern* that's supposed to hold for
many things at once. To talk about that, you have to open the box and look at the variable inside.

That's what predicate logic does. It looks *inside* a statement.

## A predicate is a statement with a blank

Here's the core idea. A **predicate** is a statement with one or more variables in it. On its own
it has no truth value - not true, not false - because it isn't finished. It's a statement with a
blank, waiting for you to fill it.

```text
"___ is even"
```

Until you say what goes in the blank, asking "is that true?" makes no sense. True for *what*?

We write predicates like functions, with the blank named as a variable:

```text
P(x) = "x is even"
```

The `x` is the blank. `P` is the name we gave this predicate, the way you'd name a function. Now
fill the blank by handing it a value:

```text
P(4)  →  "4 is even"   →  true
P(7)  →  "7 is even"   →  false
```

Notice what happened. `P(x)` had no truth value. `P(4)` does - a real, finished statement that
happens to be true. Filling the blank turned a *predicate* into a proposition, the kind of sealed
box from the last guide.

💡 A clean way to hold this: a predicate is a *machine that produces propositions*. Feed it a value,
it hands you back something true or false. It is not, itself, true or false.

## Predicates can have more than one blank

A predicate isn't limited to one variable. Some statements relate two things, or three:

```text
Older(a, b) = "a is older than b"
```

This one has two blanks, so you fill both before you get a truth value:

```text
Older(Maya, Sam)   →  "Maya is older than Sam"   →  true or false (depends on the people)
Older(Sam, Maya)   →  "Sam is older than Maya"   →  the opposite
```

Order matters, the same way it does in subtraction. `Older(a, b)` and `Older(b, a)` are different
statements. Filling one blank but not the other still gets you no truth value -
`Older(Maya, x)` is *still* a predicate, only a smaller one. It now means "Maya is older than ___",
true or false only once you say who `x` is.

📝 The number of blanks is the predicate's **arity**: one blank is *unary*, two is *binary*. You
don't need the vocabulary, but you'll see it.

## The domain: what the blank is allowed to be

There's a quiet question behind every predicate: *what kinds of things are allowed in the blank?*

For `P(x) = "x is even"`, plugging in `4` is fine. But what would `P("banana")` mean? "Banana is
even" isn't false - it's nonsense. Evenness is about numbers, not fruit. So we always have in mind a
set of things the variable is allowed to range over. That set is the **domain of discourse** (or the
*domain*, or *universe*).

If you've met [sets, relations, and functions](/guides/sets-relations-and-functions), this is
exactly a set: the collection of legal values for the variable. Stating the domain is part of
stating the predicate. "`P(x) = "x is even"` over the domain of integers" is a complete thought;
"`P(x) = "x is even"`" with no domain is vague about what you're allowed to ask.

Here's why this matters and isn't mere bookkeeping: **the same predicate behaves differently over
different domains.**

```text
P(x) = "x is even"

Domain = whole numbers {0, 1, 2, 3, ...}
   →  some are even (0, 2, 4), some are not (1, 3, 5)

Domain = even numbers {0, 2, 4, 6, ...}
   →  every single x in the domain makes P(x) true

Domain = odd numbers {1, 3, 5, 7, ...}
   →  P(x) is false for every x in the domain
```

Same words, "x is even." Three different domains. Whether the predicate is *ever* true, *always*
true, or *never* true depends entirely on what you let `x` be. That dependence is the whole game in
the next phase, so let it sink in now: the domain isn't a detail, it's half the statement.

## For builders

If you write code, you use predicates constantly - under a different name.

A predicate is a **function that returns a boolean**:

```text
is_even(x):
    return x % 2 == 0
```

`is_even` on its own isn't true or false - it's a function. `is_even(4)` returns `true`;
`is_even(7)` returns `false`. That's `P(4)` and `P(7)`, exactly. The mathematician's `P(x)` and the
programmer's `is_even(x)` are the same object in different clothes.

And the domain? That's roughly the *type* of the argument. `is_even` expects an integer; handing it a
string is a type error - the programming version of "banana is even" being nonsense rather than
false.

You'll also notice that lots of standard library tools *take a predicate as an argument*. `filter()`
is the clearest case:

```text
filter(is_even, [1, 2, 3, 4, 5, 6])   →  [2, 4, 6]
```

`filter` walks the list and keeps each element for which the predicate returns true. That list is, in
effect, the domain. So `filter` asks, for each `x` in the domain, "is `P(x)` true?" - and that
question is the seed of the quantifiers you'll meet next.

## ⚠️ A predicate alone is not true or false

This is the one trap to remember, because it's tempting to treat `P(x)` like a fact.

```text
P(x) = "x is even"
```

If someone asks "is `P(x)` true?", the real answer is *the question is incomplete*. There's a free
variable `x` with no value, so there's nothing to evaluate. It's like asking "is the door locked?"
when there are a hundred doors and you haven't said which one.

There are exactly two ways to give `P(x)` a truth value:

1. **Fill the blank** with a specific value - `P(4)` - turning it into a proposition.
2. **Quantify** it - say something about *all* x, or *some* x, in the domain.

That second option is the whole next phase. Statements like "*for all* x in the domain, P(x) is
true" and "*there exists* an x in the domain where P(x) is true" take a predicate plus a domain and
produce something true or false - without pinning `x` to a single value. That's the bridge from
"statement with a blank" back to "statement you can actually judge."

## Recap

- A **predicate** is a statement with one or more variables (blanks) in it. We write it `P(x)`.
- A predicate **has no truth value by itself**. It's a machine for producing propositions, not a
  proposition.
- **Fill the blank** with a value and you get something true or false: `P(4)` is true, `P(7)` is
  false.
- Predicates can have several blanks: `Older(a, b)` needs both filled, and order matters.
- The **domain of discourse** is the set of things the variable is allowed to be. The same predicate
  can be sometimes-true, always-true, or never-true depending on its domain.
- **For builders:** a predicate is a boolean-returning function like `is_even(x)`, and `filter()` is
  a function that takes a predicate.
- Next up: how *for all* and *there exists* turn a predicate plus a domain into a real truth value.

## Open-ended exercise

Consider this code:

```text
const admins = users.filter(u => u.role === 'admin');
```

The `filter` method takes a predicate - here, `u.role === 'admin'`. Now write, in
plain English, what the *domain* is for this predicate, and what the predicate claims
about each element. Then: is `filter` checking a `∀` claim or an `∃` claim? Why?

Quick check before you move on:

```quiz
[
  {
    "q": "Which of these best describes a predicate?",
    "choices": [
      "A statement with one or more variables that has no truth value until the variables are filled in",
      "A statement that is always true",
      "A logical connective like 'and' or 'or'",
      "A number that can be even or odd"
    ],
    "answer": 0,
    "explain": "A predicate, like P(x) = 'x is even', is a statement with a blank. It only becomes true or false once the blank is filled (or quantified)."
  },
  {
    "q": "Given P(x) = \"x is even\", what is the truth value of P(x) on its own, with no value chosen for x?",
    "choices": [
      "Always true",
      "Always false",
      "It has no truth value yet - the question is incomplete until x is fixed",
      "It depends on whether x is a letter or a number"
    ],
    "answer": 2,
    "explain": "With a free variable and no value, there's nothing to evaluate. P(4) is true and P(7) is false, but P(x) by itself is neither."
  },
  {
    "q": "What does the 'domain of discourse' of a predicate refer to?",
    "choices": [
      "The truth value the predicate returns",
      "The set of things the variable is allowed to range over",
      "The name given to the predicate, like P or Older",
      "The number of variables (blanks) the predicate has"
    ],
    "answer": 1,
    "explain": "The domain is the set of legal values for the variable. The same predicate can behave very differently over different domains - for example, 'x is even' is always true over the even numbers but never true over the odd numbers."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Quantifiers: For All and There Exists →](02-quantifiers-for-all-there-exists.md)
