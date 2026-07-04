---
title: "Pointers vs. references across languages"
guide: pointers-and-references
phase: 2
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

# Pointers vs. references across languages

Phase 1 built one idea: a variable can hold a value, or it can hold an address pointing at a value. Every language uses that idea — but they differ enormously in how much of it they show you, and how much they hide. Three buckets cover almost everything you'll run into: explicit pointers, implicit references, and true value types that opt out of the whole game.

## Bucket 1: explicit pointers

Some languages make the address visible in the syntax itself. C and Go are the clearest examples — you can see the moment a variable becomes an address, and the moment it gets dereferenced back into a value.

```text
x = 10
p = address-of x        // p now holds x's address, written &x in C/Go
read(p)                 // dereferencing p, written *p in C, done automatically in Go
```

*What just happened:* `&x` means "give me the address of `x`," and `*p` means "go to the address `p` holds and read what's there." Nothing here is hidden — the language gives you a symbol for "take the address" and a symbol for "follow the address." You choose, line by line, whether you're working with the value or the pointer to it.

This explicitness is also why these languages let you point at the wrong thing, or forget to check whether an address is valid before following it — more on that in Phase 3.

## Bucket 2: implicit references

Most modern languages — Python, Java, JavaScript, Ruby, C# for its object types — take the same underlying idea and remove the symbols. When you create an object and assign it to a variable, that variable is quietly holding a reference, not the object itself. There's no `&` to write and no `*` to dereference; the language does both automatically.

```text
a = new_list([1, 2, 3])   # a holds a reference to the list, though nothing says so
b = a                     # b is assigned the SAME reference, not a copy of the list
b.append(4)
read(a)                   # -> [1, 2, 3, 4] — a sees it too, same underlying list
```

*What just happened:* `b = a` looks exactly like an assignment that should make an independent copy — that's the intuition most people bring from the "box holds a value" picture. But for objects in these languages, assignment copies the *reference*, not the object. `a` and `b` are two names for one list. This is precisely the Bucket 1 idea from Phase 1, just spelled without any visible pointer syntax at all.

The practical difference from Bucket 1 isn't the underlying mechanism — it's that these languages never let you see or forge a raw address, and they generally won't let a reference point at freed memory. You get the sharing behavior without the address arithmetic.

## Bucket 3: true value types

Not everything is a reference. Plain numbers, booleans, and — in many languages — small fixed structures are **value types**: assigning or passing one really does copy the value, full stop. This is the original "box holds a value" picture from Phase 1, and it's still exactly right for these types.

```text
x = 10
y = x          # y gets its own independent copy of 10
y = y + 1
read(x)        # -> 10, completely untouched
read(y)        # -> 11
```

*What just happened:* no address, no sharing, no surprise. `x` and `y` are two separate boxes holding two separate 10s the moment the assignment happens. Languages with an explicit struct-by-value concept (C's `struct`, Go's `struct`, Rust's non-`Box` types, C#'s `struct`) extend this to bigger pieces of data too — copying the whole structure on assignment, not a reference to it.

## The table that actually matters

Forget any one language's keywords for a moment and look at the shape:

```text
Numbers, booleans, small structs-by-value  -> true copies (Bucket 3)
Objects/lists/dicts in Python, Java, JS    -> references, hidden syntax (Bucket 2)
Explicit &/* in C, Go                      -> references, visible syntax (Bucket 1)
```

*What just happened:* the mechanism underneath Bucket 1 and Bucket 2 is identical — a variable holding an address to shared data. The only real difference is whether the language shows you the address or hides it behind ordinary-looking assignment. Bucket 3 is the one genuinely different case, where the "box holds a value" picture from Phase 1 was the whole story all along.

The question worth asking about any variable in any language isn't "what syntax does this use" — it's "if I assign this to a second variable and mutate through the second one, does the first one change too?" If yes, you're holding a reference. If no, you're holding a value. Phase 3 covers what goes wrong once you're holding a reference and stop tracking that.

[← Phase 1: A box with an address instead of a value](01-a-box-with-an-address.md) | [Overview](_guide.md) | [Phase 3: The classic gotchas →](03-the-classic-gotchas.md)
