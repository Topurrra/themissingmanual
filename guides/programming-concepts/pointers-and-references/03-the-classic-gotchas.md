---
title: "The classic gotchas"
guide: pointers-and-references
phase: 3
summary: "A pointer or reference is a variable holding a memory address instead of a value - the idea underneath sharing, mutation, and half the bugs that make you say 'but I didn't touch that variable.'"
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

# The classic gotchas

Every bug in this guide has the same root cause: someone treated a reference like a value, or forgot that following an address only works if there's something valid at the other end. Three shapes of this cover almost every bug report that starts with "but I didn't touch that variable."

## Gotcha 1: null / nil dereference

An address variable can be empty - it points nowhere. Most languages have a specific value for this: `null`, `nil`, `None`, `nullptr`. The variable exists, but there's no address in it to follow.

```text
customer = find_customer(id)   # returns None/null if no match was found
read(customer.name)            # dereferencing None -> crash
```

*What just happened:* `find_customer` didn't find anyone, so it returned "no address" instead of an address. The next line assumes there's a customer to follow the reference to, and tries to dereference nothing. The program has no data to read, so it fails - usually with an error like `NullPointerException`, `AttributeError: 'NoneType' object has no attribute`, or a segmentation fault, depending on the language.

> A null/nil reference is a box that's plainly empty. The bug isn't the emptiness - it's dereferencing without checking first.

The fix is always the same shape: check before you follow.

```text
customer = find_customer(id)
if customer is not None:
    read(customer.name)
else:
    handle_not_found()
```

## Gotcha 2: dangling pointers and use-after-free

This one is sharper in languages with manual memory management (C, C++, and Rust if you reach for `unsafe`). An address can point at memory that used to hold valid data - and has since been freed and handed back to something else.

```text
p = allocate(SomeStruct)
free(p)              // the memory is released; p still holds the old address
read(p)               // use-after-free: reading memory that's no longer yours
```

*What just happened:* `free(p)` tells the system "I'm done with this memory, it's available again" - but it does not erase `p`. `p` still holds the same address it always did. That address is now a **dangling pointer**: it points at memory that might be reused by something completely unrelated a moment later, or might still contain the old bytes for now. Reading through it is undefined - sometimes it looks like it works, sometimes it silently corrupts unrelated data, sometimes it crashes. That inconsistency is what makes this bug miserable to track down.

```text
Null dereference    -> the address is plainly empty; fails immediately and loudly
Dangling pointer     -> the address looks valid but points at freed/reused memory; fails unpredictably
```

*What just happened:* both are "following an address that shouldn't be followed," but null dereference tends to fail fast and dangling pointers tend to fail *later*, somewhere else, in a way that looks unrelated to the actual mistake. Garbage-collected languages (Python, Java, JavaScript, Go, C#) sidestep this specific gotcha almost entirely - the runtime won't free memory that a live reference still points at. Rust prevents it at compile time in safe code through its ownership rules. It's mainly manual-memory languages where this is a live daily concern.

## Gotcha 3: the shared-reference surprise

This is the one that doesn't require any manual memory management at all - it shows up in Python, Java, JavaScript, anywhere Bucket 2 from Phase 2 applies - and it's the most common of the three in everyday application code.

```text
original = {"count": 1}
copy = original          # this looks like a copy. it is NOT.
copy["count"] = 99
read(original["count"])  # -> 99, not 1
```

*What just happened:* `copy = original` assigns the reference, not the data. `copy` and `original` are two names pointing at the exact same dictionary. Mutating through `copy` mutates the one shared object, and `original` sees it too - because there was never a second object to begin with. This is Phase 1's picture, showing up as a bug: two boxes holding the same address, and someone expected two independent boxes holding the same starting value.

The fix is to make the copy explicit when you actually want one:

```text
original = {"count": 1}
copy = clone(original)     # now an independent object with the same starting contents
copy["count"] = 99
read(original["count"])    # -> 1, untouched
```

*What just happened:* `clone` (spelled `dict(original)`, `.copy()`, `{...original}`, `Object.assign`, or similar depending on the language) allocates a genuinely new box and copies the contents into it. Now there are two addresses pointing at two different pieces of data, which is what "make a copy" actually requires.

## The one question that catches all three

Before you assign, pass, or return something that isn't a plain number or boolean, ask: *is this a reference to shared data, and does that matter here?* If it's a reference and might be empty, check before dereferencing. If it's a reference into memory you manage yourself, make sure it's still valid before you follow it. If it's a reference and you wanted an independent copy, clone it explicitly. All three gotchas are the same one instinct, applied at the point where it counts: don't assume you're holding a value when you might be holding an address.

[← Phase 2: Pointers vs. references across languages](02-pointers-vs-references-across-languages.md) | [Overview](_guide.md)
