---
title: "Relations & Functions"
guide: "sets-relations-and-functions"
phase: 2
summary: "A relation is a set of ordered pairs - a way of connecting things. A function is a special relation where every input maps to exactly one output. Domain, codomain, and range, made concrete."
tags: [mathematics, functions, relations, domain, range]
difficulty: beginner
synonyms: ["what is a relation in math", "what is a function in math", "domain codomain range", "ordered pairs", "is it a function vertical line test"]
updated: 2026-06-25
---

# Relations & Functions

In Phase 1 you met sets: collections of distinct things, where order doesn't matter and
duplicates don't count. That was the noun. Now comes the verb - how things *connect* to each
other. The quiet surprise: the connection is itself a set. Everything you learned still applies.
We're not starting over; we're stacking one idea on another.

## First, the ordered pair

A set treats `{1, 2}` and `{2, 1}` as the same thing. Order is irrelevant; membership is all
that matters.

Sometimes that's not what you want. A chess move that goes "from square a to square b" becomes a
different move if you swap a and b. The order carries meaning. For that, we use an **ordered
pair**, written with round brackets:

`(a, b)`

The rule that defines it: `(a, b)` equals `(c, d)` only when `a = c` **and** `b = d`. So:

`(1, 2)` is **not** `(2, 1)`

That single change - order now matters - is the whole reason ordered pairs exist. The first slot
and the second slot mean different things, and you can't shuffle them.

## A relation is a set of ordered pairs

Here's the connecting idea. A **relation** is a set whose elements are ordered pairs. That's the
entire definition. Each pair `(a, b)` says "a is connected to b" in whatever way you care about.

An everyday example. Suppose three people own pets:

```
{ (Ana, cat), (Ben, dog), (Ana, parrot) }
```

That set of pairs *is* a relation - the "owns" relation. Notice Ana shows up twice, connected to
two different pets. That's allowed. A relation doesn't restrict how many partners a thing has.

Another classic: "is older than." If Ana is older than Ben, and Ben is older than Cara, the
relation is the set of pairs that hold true:

```
{ (Ana, Ben), (Ana, Cara), (Ben, Cara) }
```

The order in each pair matters here - `(Ana, Ben)` means "Ana is older than Ben," and you can't
flip it. This is why we needed ordered pairs first: relations are built out of them.

And because a relation is a set, every Phase 1 idea carries over. You can ask whether a pair is a
member of it. You can take its union with another relation. It's sets all the way down.

## A function: the one definition that matters

A **function** is a special kind of relation. The special rule:

> **Every input maps to exactly one output.**

Read that again, because it's the load-bearing sentence of this entire guide. Not "at most one,"
not "roughly one" - **exactly one**. Give the function an input, and there is one and only one
output waiting for it. No ambiguity, no choices.

Look back at the pets relation:

```
{ (Ana, cat), (Ben, dog), (Ana, parrot) }
```

Is this a function? No. Ana (an input) maps to *two* outputs: cat and parrot. The rule says
exactly one. One input, two outputs - that breaks it. So "owns a pet" is a relation but **not** a
function.

Now fix it. Suppose each person has exactly one *favorite* food:

```
{ (Ana, sushi), (Ben, tacos), (Cara, sushi) }
```

This **is** a function. Every input (person) maps to exactly one output (their favorite food).
Two inputs can share an output - both Ana and Cara map to sushi - and that's fine. The rule
constrains inputs, not outputs. What's forbidden is one input pointing at two different things.

Say it one more time so it sticks: a function is a relation where **every input maps to exactly
one output**.

## Domain, codomain, and range

Three words that sound interchangeable but aren't. Let's pin them down with one concrete function.

Take the "favorite food" function above, and suppose the menu it's drawn from is
`{sushi, tacos, pizza, salad}`.

- **Domain** - the set of inputs. Here: `{Ana, Ben, Cara}`. These are the things the function
  accepts.
- **Codomain** - the declared set the outputs are *allowed* to come from. Here: the whole menu,
  `{sushi, tacos, pizza, salad}`. It's the promised territory.
- **Range** (also called the **image**) - the outputs that *actually get produced*. Here:
  `{sushi, tacos}`. Nobody picked pizza or salad, so those sit in the codomain but never appear in
  the range.

The relationship to hold onto: the range is always inside the codomain, and it can be smaller. The
codomain is what you *promised* was possible; the range is what *happened*.

## Quick recap of `f(x)` notation

You've seen `f(x)` before - back in [why math isn't your enemy](/guides/why-math-isnt-your-enemy)
it was a machine: feed in `x`, get back `f(x)`. Now you can read it precisely. `f` is the function
(a set of pairs). `x` is an input from the domain. `f(x)` is *the* output - singular, because the
definition guarantees exactly one. When you write `f(3) = 6`, you're naming the pair `(3, 6)` that
lives inside the function.

## See it run

Here are two ways to write the same idea in code: a function defined with `def`, and a finite
function stored as a dictionary.

```python runnable
def double(x):
    return x * 2
print(double(5))

# a dict is a finite function: each key maps to exactly one value
square = {1: 1, 2: 4, 3: 9}
print(square[3])
```

*What just happened:* `double(5)` returned `10` - one input, one output, exactly as the definition
demands. Then the dict `square` mapped the key `3` to the value `9`. A Python dict can't hold the
same key twice with two different values, which is precisely the "every input maps to exactly one
output" rule, enforced by the language. The dict *is* a function, written as a lookup table.

## For builders

You already use functions every day; you don't call them that.

- A **pure function** in code - one that always returns the same output for the same input, with no
  side effects - *is* a mathematical function. Same input, same output, every time. That's the
  definition, restated in a language you compile.
- A **dict / map / hash table** is a **finite function**: a literal list of input-output pairs, one
  value per key. When you write `users[id]`, you're evaluating a function at the point `id`.

Same idea, two notations. Math wrote it as a set of ordered pairs centuries ago; your standard
library wrote it as `{key: value}`. Once you see they're the same thing, the math stops feeling
foreign.

> ⚠️ **Not every relation is a function.** The trap is forgetting the "exactly one" rule. The
> moment a single input maps to two different outputs, you have a relation but *not* a function.
> If you ever graph it, this is what the **vertical line test** checks: draw any vertical line - if
> it crosses the graph more than once, one input is hitting multiple outputs, so it's not a
> function.

## Recap

- An **ordered pair** `(a, b)` cares about order: `(1, 2)` is not `(2, 1)`.
- A **relation** is a set of ordered pairs - a way of connecting things. Because it's a set,
  everything from Phase 1 still applies.
- A **function** is a relation where **every input maps to exactly one output**. One input → two
  outputs breaks it.
- **Domain** = inputs, **codomain** = the declared set of possible outputs, **range** = the outputs
  actually produced (always inside the codomain).
- In code, a pure function and a dict are both functions - same idea, different notation.

A quick check before you move on:

```quiz
[
  {
    "q": "What makes a relation a function?",
    "choices": [
      "Every input maps to exactly one output",
      "Every output comes from exactly one input",
      "It contains no duplicate ordered pairs",
      "The domain and codomain are the same set"
    ],
    "answer": 0,
    "explain": "A function is a relation where each input has exactly one output. Two inputs may share an output, but one input may never map to two different outputs."
  },
  {
    "q": "For the function {(Ana, sushi), (Ben, tacos), (Cara, sushi)} with codomain {sushi, tacos, pizza, salad}, what is the difference between the domain and the range?",
    "choices": [
      "The domain is {Ana, Ben, Cara} (the inputs); the range is {sushi, tacos} (the outputs actually produced)",
      "The domain is {sushi, tacos}; the range is {Ana, Ben, Cara}",
      "The domain and range are both {sushi, tacos, pizza, salad}",
      "The domain is the codomain; the range is empty"
    ],
    "answer": 0,
    "explain": "Domain = the set of inputs. Range = the outputs actually produced, which here is {sushi, tacos} - a subset of the codomain (pizza and salad never appear)."
  },
  {
    "q": "Which statement about the ordered pair (1, 2) is true?",
    "choices": [
      "(1, 2) is a different pair from (2, 1) because order matters",
      "(1, 2) equals (2, 1) because they contain the same numbers",
      "(1, 2) is the same as the set {1, 2}",
      "(1, 2) is only valid if 1 is less than 2"
    ],
    "answer": 0,
    "explain": "In an ordered pair the order is meaningful: (a, b) = (c, d) only when a = c and b = d. So (1, 2) and (2, 1) are different - unlike the set {1, 2}, where order is ignored."
  }
]
```

[← Phase 1: Sets: Collections of Distinct Things](01-sets.md) · [Guide overview](_guide.md) · [Phase 3: Why This Is the Vocabulary of Everything →](03-the-vocabulary-of-everything.md)