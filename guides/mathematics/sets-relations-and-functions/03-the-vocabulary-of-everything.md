---
title: "Why This Is the Vocabulary of Everything"
guide: "sets-relations-and-functions"
phase: 3
summary: "Sets and functions aren't abstract trivia - they're the hidden vocabulary under types, database tables, and data structures. See the same three ideas show up everywhere you build."
tags: [mathematics, sets, functions, foundations, applications]
difficulty: beginner
synonyms: ["where are sets used in programming", "relations and database tables", "functions in programming vs math", "why learn set theory", "math behind data structures"]
updated: 2026-06-25
---

# Why This Is the Vocabulary of Everything

You made it to the part where it pays off.

For two phases you've been collecting three ideas. They probably felt like math
for math's sake - clean little definitions with no obvious home. This phase is
where they walk out of the textbook and into the things you already use every
day. Once you see it, you can't unsee it: the same three shapes hide under
types, database tables, and data structures. You already know the vocabulary -
you were calling it by different names.

## The three ideas, in one breath

Before we spread out, let's pin down what you're carrying.

- A **set** is a collection of distinct things, with no order and no repeats.
  `{1, 2, 3}` is the same set as `{3, 1, 2}`.
- A **relation** connects things from one set to things from another - a list of
  pairs that "go together." (We built these up in
  [Phase 2](02-relations-and-functions.md).)
- A **function** is a special relation with one rule: every input gets *exactly
  one* output. No input is left out, and none points at two answers.

That's it. Three sentences. Now watch them show up everywhere.

## Types are sets

Here's the one that reframes everything for builders.

A **type** in a programming language is a *set of values*. That's the whole
idea. When you say a variable is a `bool`, you're saying it lives in the set
`{true, false}` - two elements, nothing else allowed. Define an enum like
`Color = {Red, Green, Blue}` and you've literally written a set of named values.
An `int` is (conceptually) the set of whole numbers a machine will hold. A
`string` is the set of all possible text values.

So what is type-checking? The compiler asking a membership question: *is this
value an element of that set?* Assigning `7` to a `bool` fails because `7` isn't
in `{true, false}`. The error you've seen a hundred times - "expected `bool`,
found `int`" - is the machine telling you the value isn't a member of the set
you promised.

> **For builders:** "Make invalid states unrepresentable" is advice you've
> probably heard. Now you can hear it precisely: *shrink the set* so the bad
> values aren't elements of the type at all. A type that's exactly the right set
> of values can't hold a wrong one.

This is why a tight type feels safer than a loose one. A type that's "any
string" is a huge set; a type that's "one of these five statuses" is a tiny set.
The smaller the set, the fewer wrong values can sneak in.

## Relations are tables

This one hides in plain sight, and the giveaway is right in the name.

A database table is a **set of rows**. Each row is a tuple - a fixed bundle of
fields, like `(id, name, email)`. The table is the collection of all those
tuples. And a set of tuples is exactly what a *relation* is in the math sense.
That's no coincidence or cute analogy. It's where the term **relational
database** comes from. The math came first; the product was named after it.

We built relations up step by step in [Phase 2](02-relations-and-functions.md):
pairs (and tuples) of things that belong together. A row like
`(42, "Ada", "ada@example.com")` is one of those tuples. The table is the
relation - the whole set of them.

A few things you've done with tables now have crisp names:

- A table with no duplicate rows is a true set (sets don't repeat). That's why a
  primary key exists - it guarantees each row is distinct.
- A `JOIN` combines two relations into a new one based on matching values.
- A `WHERE` filter carves out a *subset* of the rows.

You weren't doing arbitrary data wrangling. You were operating on sets of
tuples, which is the math under the whole field.

## Functions are everywhere

Once you know what a function is - every input mapped to exactly one output -
you start spotting them in code constantly.

- A **hash map** / **dictionary** is a function. Each key maps to exactly one
  value. Look up the same key twice, get the same value. That "one value per
  key" rule *is* the function rule.
- A **pure function** in code (same input, same output, no surprises) is the
  mathematical function almost exactly.
- **`map()`** over a list applies a function to every element and gives you a new
  list - input set in, output set out.
- A **lookup table** or a **routing table** (this URL goes to that handler) is a
  function: each route points at one destination.

> **For builders:** when something *isn't* a function, that's a signal too. If a
> key could map to two values, you don't want a dictionary - you want a list of
> values per key, or a different structure. Noticing "is this one-to-one or
> one-to-many?" is the same question as "is this a function?"

Here's the dictionary-as-function idea made literal. A dict and a function that
does a lookup are two faces of the same thing:

```python runnable
# A dictionary: each key maps to exactly one value. That's a function.
status_name = {200: "OK", 404: "Not Found", 500: "Server Error"}

# Reading the dict is applying the function.
print(status_name[404])

# The exact same mapping, written as a function instead of a table:
def status_name_fn(code):
    return status_name[code]

print(status_name_fn(200))
```

Same mapping, two skins: one stored as data, one written as code. The math
doesn't care which skin you pick - both are functions.

## Composition: do one thing, then the next

There's a fourth move worth naming, because you already do it by instinct.

**Composition** is applying one function and then feeding its result into
another. Do `f`, then do `g` on the answer. In math you'd write `g(f(x))`. In
code, this is the urge behind piping and chaining: take a value, transform it,
transform the result, transform that. A Unix pipeline (`cat file | sort |
uniq`), a chain of method calls, a series of `map`s - all of it is function
composition. You take small, well-understood steps and glue them end to end into
one bigger step.

This feels natural because it *is* natural: a function turns inputs into outputs,
so its output is a perfectly good input for the next function. The shapes fit
together. That's why building software out of small functions you chain together
holds up - each piece is a clean mapping, and composition lets you stack them
without the whole thing turning to mush.

## A peek ahead: how big is a set?

We've talked about *what's in* a set. There's an equally natural question we
haven't touched: *how many* things are in it. The size of a set has a name -
**cardinality** - and it's the quiet bridge from sets to counting. `{true,
false}` has cardinality 2. An enum of five statuses has cardinality 5. Once you
start asking "how big is this set?", you've stepped out of pure structure and
into the territory of numbers and counting. We'll follow that thread later; for
now, notice that "what's in it" and "how many" are different questions, and
both matter.

## You now speak the language

Step back and look at what happened.

You learned three small ideas - set, relation, function - and watched them turn
into the type system, the database, and the data structures you build with. That
wasn't a trick of framing. Those tools were *named after* this math, or grew
straight out of it. When you reach for a dictionary, define an enum, or write a
`JOIN`, you're already thinking in sets and functions. Now you know the words for
it, which means you can reason about it on purpose instead of by feel.

This is also why these ideas are worth the effort: they're the vocabulary the
rest of math is written in. Numbers and number systems are built on sets.
Counting is built on cardinality - the "how big is it" question we teased earlier.
Probability is, underneath, the art of measuring subsets of a set of
possibilities. You'll meet all of those next, already fluent in the grammar. If
sets and functions still feel a little abstract, that's fine - you don't need to
love them, you need to recognize them, and now you will.

If you came into this guide worried that math wasn't for you, it might help to
revisit [why math isn't your enemy](/guides/why-math-isnt-your-enemy) - and if
the "exactly one output" rule reminded you of clean either/or thinking, that's
no accident either; it's close cousins with [what logic actually
is](/guides/what-logic-actually-is).

Quick check before you go - three claims this phase made:

```quiz
[
  {
    "q": "In what sense is a type (like `bool` or an enum) a set?",
    "choices": [
      "A type is the set of values that something of that type can hold",
      "A type is a single value that never changes",
      "A type is a function that returns true or false",
      "A type is unrelated to sets - the resemblance is a coincidence"
    ],
    "answer": 0,
    "explain": "A type is exactly the set of allowed values: `bool` is `{true, false}`. Type-checking asks whether a value is a member of that set."
  },
  {
    "q": "Why is a table in a relational database a good example of a relation?",
    "choices": [
      "Because the rows are sorted, and relations require order",
      "Because a table is a set of rows (tuples), and a relation is a set of tuples",
      "Because every table must have exactly one column",
      "Because tables store numbers, and relations only work on numbers"
    ],
    "answer": 1,
    "explain": "A table is a set of rows, each row a tuple of fields. A relation is a set of tuples - same thing. That's where the name 'relational' comes from."
  },
  {
    "q": "Why does a dictionary (hash map) count as a function in the math sense?",
    "choices": [
      "Because it can store any number of keys",
      "Because looking up a key is fast",
      "Because each key maps to exactly one value",
      "Because keys and values are always the same type"
    ],
    "answer": 2,
    "explain": "A function gives every input exactly one output. A dictionary gives every key exactly one value - that one-value-per-key rule is the function rule."
  }
]
```

[← Phase 2: Relations & Functions](02-relations-and-functions.md) · [Guide overview](_guide.md)