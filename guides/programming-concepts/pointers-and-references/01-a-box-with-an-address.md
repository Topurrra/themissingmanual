---
title: "A box with an address instead of a value"
guide: pointers-and-references
phase: 1
summary: "A pointer or reference is a variable holding a memory address instead of a value — the idea underneath sharing, mutation, and half the bugs that make you say 'but I didn't touch that variable.'"
tags: [programming-concepts, pointers, references, memory, variables]
difficulty: intermediate
synonyms:
  - what is a pointer
  - what is a reference in programming
  - difference between pointer and reference
  - pass by reference vs pass by value
  - why did changing one variable change another
  - null pointer dereference
updated: 2026-07-04
---

# A box with an address instead of a value

Picture a variable the way most people learn it first: a labeled box holding a value. `age` holds `30`. `name` holds `"Maria"`. You read the label, you get the value inside. That picture is correct for a lot of code, and it will actively mislead you for the rest.

Some variables don't hold a value. They hold an **address** — directions to a box somewhere else that holds the value. That's the entire idea behind a pointer or a reference: a variable whose job isn't to store data, but to say *where* the data is.

## Two boxes, not one

Say you have a chunk of data — an object, a list, a big struct — sitting somewhere in memory. Now say two different variables both need to work with it. There are two ways to set that up:

```text
Option A — copy the data
box "a" contains: [1, 2, 3]
box "b" contains: [1, 2, 3]   <- a separate, independent copy

Option B — share the data
box "data" contains: [1, 2, 3]     <- the actual list lives here, once
box "a" contains: address-of "data"
box "b" contains: address-of "data"
```

*What just happened:* in Option A, `a` and `b` are two boxes that each hold a full value. Change one, the other is untouched — they've never heard of each other. In Option B, `a` and `b` are two small boxes that each hold the same address. There is only ever *one* list. `a` and `b` are two different ways of finding it, not two different lists.

> A pointer or reference isn't a copy of the data and isn't the data itself. It's a note that says "the real thing is over there."

## Following the address is called dereferencing

Having an address isn't the same as having the value. To actually get the value, something has to go to that address and read what's there. That step — go to the address, read what's stored — is called **dereferencing**. It usually happens automatically enough that you don't notice it as a separate step:

```text
a = address-of "data"

read(a)              # dereference: go to the address, get [1, 2, 3]
a.append(4)          # dereference, then mutate what's found there
```

*What just happened:* `a` itself is small — just an address, the same size no matter how big the list is. Every operation that actually touches the list's contents has to dereference first: hop from the address to the real data, then act on it. You rarely write the word "dereference" in most languages, but the hop still happens every time.

## Why bother with this indirection at all

It looks like extra machinery for no reason, until you hit the case it solves. Copying is fine for a small number like `30`. It stops being fine when the data is a ten-thousand-row table, or when two parts of a program genuinely need to see the *same* mutable thing — a shared cache, a shared connection, a linked list node that three other nodes point to.

Pointers and references exist because copying is not always the right default:

```text
Pass a number by value  -> cheap either way, doesn't matter
Pass a 10,000-row table  -> copying it every function call would be wasteful
Two objects that must see each other's changes -> they need to share one box, not two
```

*What just happened:* an address is small and cheap to copy no matter how large the underlying data is, and sharing one address means everyone sees the same updates. That's the whole trade a pointer or reference is making — smaller, shared, but indirect instead of direct.

## The one picture to keep

Every variable is either **a box that holds a value** or **a box that holds an address pointing at another box**. Nothing else is going on. Phase 2 shows how different languages make that second kind of box explicit, invisible, or nonexistent depending on the type — but the picture underneath never changes: a value lives somewhere, and something else is pointing at where.

```quiz
[
  {
    "q": "What does a pointer or reference variable actually store?",
    "choices": [
      "A full copy of the value it refers to",
      "The address of where the real value lives",
      "A compressed version of the value",
      "Nothing until the program runs"
    ],
    "answer": 1,
    "explain": "A pointer/reference holds an address — directions to the real data, not the data itself."
  },
  {
    "q": "What does \"dereferencing\" mean?",
    "choices": [
      "Deleting a pointer",
      "Copying a pointer to a new variable",
      "Following the address to read or use the actual value stored there",
      "Converting a reference into a value type"
    ],
    "answer": 2,
    "explain": "Dereferencing is the step of going to the address and reading (or mutating) what's actually stored there."
  },
  {
    "q": "Two variables hold the same address, pointing at one shared list. If you mutate the list through one variable, what happens when you read it through the other?",
    "choices": [
      "The other variable is unaffected — it has its own copy",
      "The other variable sees the change, because there's only one underlying list",
      "The program throws an error",
      "It depends on which variable was declared first"
    ],
    "answer": 1,
    "explain": "Both variables are just two addresses pointing at the same one box. There's only one list, so both see every change."
  }
]
```

Watch it animated: [pointers and references](/explainers/Pointers.dc.html)

[← Overview](_guide.md) | [Phase 2: Pointers vs. references across languages →](02-pointers-vs-references-across-languages.md)
