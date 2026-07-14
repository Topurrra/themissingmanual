---
title: "From C to C++: What Changed"
guide: "cpp-from-zero"
phase: 2
summary: "What actually changed when C++ grew out of C - stronger types, references, overloading, new/delete, namespaces, and why C++ is a different language to think in, not just C with extra keywords."
tags: [cpp, c++, c-vs-cpp, references, namespaces, overloading, new-delete, type-safety]
difficulty: beginner
synonyms: ["difference between c and c++", "is c++ just c with classes", "c++ vs c", "what does c++ add to c", "c++ for c programmers", "new vs malloc c++", "why use c++ over c", "c++ references vs pointers"]
updated: 2026-07-14
---
# From C to C++: What Changed

Here's a claim that sounds harmless and is actually wrong: "C++ is C with some extra features bolted on." That framing will slow you down for months. C++ *can* compile most C code, and it *does* keep C's low-level control, but the two languages solve the same problem - talk directly to the machine - with different philosophies. C trusts you completely and gives you a small, sharp set of tools. C++ trusts you too, but it also gives you a type system that argues with you before your program runs, and a set of abstractions designed to cost nothing at runtime once compiled. If you know C - maybe from [C From Zero](/guides/c-from-zero) - this phase is your bridge: the same close-to-the-machine world, but with the compiler doing more work on your behalf.

None of what's in this phase is the "big idea" of C++. That's still three phases away, in [classes and objects](06-classes-and-objects.md) and then [RAII](07-constructors-destructors-and-raii.md). This phase is the smaller, more immediate stuff: the changes you'll bump into in the very first C++ programs you write, before you've touched a single class.

## The mental model: a stricter, richer type system

**What actually changed.** C's compiler is permissive. It'll let a `char*` sneak into an `int` parameter with a warning at worst. C++'s compiler is a stricter reader: it checks more, infers more, and refuses more. Every change in this phase is really one change wearing different outfits: **C++ pushes decisions from "figure it out at runtime, or crash" to "the compiler catches it before your program exists."**

That's the same spirit you'll later see taken to its extreme with ownership rules in Rust or borrow checking elsewhere - C++ is an earlier, more permissive point on that same spectrum: more safety than C, less than languages built decades later with hindsight.

## Comments, `bool`, and small syntax gifts

Trivial but worth naming: C++ added `//` single-line comments (later adopted back into C99) and a real `bool` type with `true`/`false`, instead of C's convention of using `int` and treating zero as false.

```cpp
bool is_ready = true;   // a real type, not an int pretending to be one
// this whole line is a comment
```

In C, you'd write `int is_ready = 1;` and hope everyone remembers what `1` means. Small, but it sets the tone: C++ prefers a type that says what it is.

## References: a name that IS the variable

C only gives you pointers for indirect access. C++ adds **references** - full depth is [Phase 5: References vs Pointers](05-references-vs-pointers.md), but the shape of the idea belongs here, because it changes how you write ordinary functions starting today.

```cpp
void increment(int& n) {   // n is another name for the caller's variable
    n = n + 1;
}

int main() {
    int x = 10;
    increment(x);   // no & needed at the call site - not a pointer
    // x is now 11
}
```

**Why this exists.** In C, to let a function modify the caller's variable, you pass a pointer and dereference it everywhere (`*n = *n + 1`), and the caller must remember to pass `&x`. A reference is a name that's bound to a variable at creation and can never be reseated to point elsewhere and can never be null (barring deliberate abuse) - so the compiler can let you use it exactly like the original variable, no `*` needed. It's the same indirection under the hood, with a safer, simpler surface on top.

## Function overloading and default arguments

C requires one name per function; C++ lets several functions share a name if their parameter types differ, and lets a parameter have a fallback value. Both get a full phase ([Phase 4](04-functions-overloading-and-default-arguments.md)); here's the shape:

```cpp
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }   // same name, different types

void greet(std::string name = "friend") {          // default argument
    std::cout << "Hello, " << name << "!\n";
}
```

In C you'd be forced into distinct names like `add_int` and `add_double`. C++'s compiler picks the right `add` by matching argument types at compile time - this is **static binding** (the target is fixed when the program is built, not chosen at runtime like a virtual call), and it costs nothing at runtime.

## `new`/`delete` instead of `malloc`/`free`

C's dynamic memory is untyped: `malloc` hands back a `void*` of raw bytes, and you're responsible for the size math and the cast.

```c
/* C */
int* arr = malloc(5 * sizeof(int));
free(arr);
```

```cpp
// C++
int* arr = new int[5];
delete[] arr;
```

**Why this exists.** `new` knows the type you asked for, so it computes the size itself and returns a correctly-typed pointer - no `sizeof`, no cast. More importantly, `new` calls the type's *constructor* if it has one, and `delete` calls its *destructor* - `malloc`/`free` know nothing about construction, they just reserve and release bytes. That hook is the seed of [RAII](07-constructors-destructors-and-raii.md), the idea that will end up being the crux of this whole guide. For now, just remember the rule: anything you `new`, you `delete`; anything you `new[]`, you `delete[]`. Mismatching them is undefined behavior.

In practice, modern C++ code barely calls `new`/`delete` directly at all - [Phase 13](13-smart-pointers-and-modern-memory-management.md) shows the tools that manage it for you. Seeing raw `new`/`delete` now just gives you the vocabulary for what those tools are automating.

## Namespaces instead of one giant global bucket

C has exactly one bucket for every function and global name in a program - which is why C libraries prefix everything (`sqlite3_open`, `gtk_widget_show`) to avoid collisions. C++ adds **namespaces**, a way to group names so two libraries can each have a `parse()` without conflict.

```cpp
namespace shapes {
    double area(double r) { return 3.14159 * r * r; }
}

int main() {
    double a = shapes::area(2.0);   // :: reaches into the namespace
}
```

The standard library lives in namespace `std`, which is why you'll see `std::cout`, `std::string`, `std::vector` everywhere instead of bare names - that prefix is telling you "this comes from the standard library's namespace," not a special keyword.

## `iostream` instead of `stdio.h`

C's `printf("%d\n", x)` relies on a format string that the language doesn't require the compiler to check against your arguments - get the `%d` vs `%s` wrong and it's undefined behavior, not a guaranteed error (mainstream compilers do warn under `-Wformat`, but nothing forces them to). C++'s `<iostream>` uses overloaded operators instead of format strings:

```cpp
#include <iostream>
int x = 42;
std::cout << "x is " << x << "\n";
```

Every `<<` is resolved by the compiler based on the actual type of what's on its right, so there's no format string to get wrong. You'll still see `printf` in real C++ code - it's still valid and sometimes convenient - but `iostream` is the type-safe default.

## Casts you have to mean

C has one cast, `(int)x`, that will silently do almost anything you ask, safe or not. C++ splits this into named casts - `static_cast<int>(x)` for ordinary conversions, `const_cast`, `reinterpret_cast`, and `dynamic_cast` (once you have inheritance, in [Phase 14](14-inheritance-and-polymorphism.md)) - each one saying exactly what kind of danger you're opting into. It's more typing on purpose: a `reinterpret_cast` in a code review is a flag; a C-style `(int)` hides in plain sight.

## What still works exactly like C

Loops, `if`/`else`, arithmetic, arrays, `struct` layout, pointer arithmetic, the preprocessor - all of it carries over unchanged, because C++ was built to compile the vast majority of valid C. [Phase 3](03-types-variables-and-control-flow.md) covers the type and control-flow layer directly. The difference isn't that C stopped working - it's that C++ hands you sharper tools alongside the old ones, and idiomatic C++ reaches for them by default.

## Quick reference

| C | C++ | Why it changed |
|---|-----|-----------------|
| `int flag` (0/1) | `bool` | a type that says what it means |
| pointer + `*p` | reference `T&` | safer alias, no null, no reseating |
| one name per function | overloads by parameter type | lets related operations share a name |
| `malloc`/`free` | `new`/`delete` | typed, calls constructor/destructor |
| prefixed globals (`sqlite3_open`) | `namespace` + `::` | groups names, avoids collisions |
| `printf`/`scanf` | `<iostream>`, `std::cout`/`std::cin` | type-checked at compile time |
| `(int)x` | `static_cast<int>(x)` | names the kind of conversion you mean |

## Recap

1. C++ is not "C with extras" - it's the same low-level control with a stricter, richer type system layered on top, and every change here is a version of that one idea.
2. References (`T&`) give you pointer-like indirection with a name that can't be null or reseated - full depth in Phase 5.
3. Function overloading and default arguments let related functions share a name, resolved at compile time (Phase 4).
4. `new`/`delete` are typed and construction-aware, unlike `malloc`/`free` - the first hint of RAII, which shows up properly in Phase 7.
5. Namespaces (`std::`), `<iostream>`, and named casts (`static_cast`) all trade a little more typing for the compiler catching more mistakes before runtime.
6. Ordinary C - loops, arrays, structs, pointer arithmetic - still works in C++ unchanged; you're gaining tools, not losing the ones you know.

## Quick check

Test yourself on the idea that ties this whole phase together - the compiler doing more work before your program ever runs:

```quiz
[
  {
    "q": "A colleague says a C++ reference is \"just a pointer with nicer syntax - same thing under the hood, so treat them the same.\" What's the real distinction that matters?",
    "choices": [
      "A reference is bound to one variable for its whole life - it can't be reseated and can't be null, so the compiler can let you use it exactly like the original variable",
      "A reference is stored in a completely different part of memory than a pointer, which is why it's safer",
      "There's no real distinction - the claim is correct and references are only a stylistic choice",
      "A reference can be reseated to point at a different variable, unlike a pointer"
    ],
    "answer": 0,
    "explain": "The implementation may be similar, but the guarantee is what matters: a reference can't be null or rebound after creation, so it behaves like another name for the same variable rather than a separate indirect value."
  },
  {
    "q": "Why does the phase call `new`/`delete` a bigger change than just \"typed `malloc`/`free`\"?",
    "choices": [
      "Because `new` and `delete` also call the type's constructor and destructor, something `malloc`/`free` know nothing about",
      "Because `new` and `delete` are faster at runtime than `malloc`/`free`",
      "Because `new` and `delete` automatically free memory for you, so you never call `delete`",
      "Because `malloc`/`free` no longer work at all once you use C++"
    ],
    "answer": 0,
    "explain": "The size and cast bookkeeping `new` removes is a convenience, but the construction/destruction hook is the important part - it's the seed of RAII, which malloc/free have no concept of."
  },
  {
    "q": "When the compiler sees `add(3, 4)` and there are two overloads, `add(int, int)` and `add(double, double)`, when does it decide which one to call?",
    "choices": [
      "At compile time, by matching the argument types - this is static binding and costs nothing when the program runs",
      "At runtime, by checking the actual values passed in",
      "It can't decide, so it's a compile error unless you rename one of the functions",
      "Whichever overload appears first in the file is always called"
    ],
    "answer": 0,
    "explain": "Overload resolution happens at compile time based on argument types, so the correct `add` is baked into the binary before the program ever runs - there's no runtime lookup involved."
  }
]
```

---

[← Phase 1: Compiling & Your First Program](01-compiling-and-your-first-program.md) · [Phase 3: Types, Variables & Control Flow →](03-types-variables-and-control-flow.md)
