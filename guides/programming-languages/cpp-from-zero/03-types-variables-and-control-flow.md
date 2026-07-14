---
title: "Types, Variables & Control Flow"
guide: "cpp-from-zero"
phase: 3
summary: "What does C++ actually add to C's types and control flow - and how do bool, auto, references-in-loops, and enum class change the way you write everyday code?"
tags: [cpp, types, variables, control-flow, auto, bool, enum-class, range-based-for]
difficulty: beginner
synonyms: ["cpp bool type", "cpp auto keyword", "range based for loop c++", "enum class vs enum", "c++ variable declaration", "cpp control flow", "cpp for each loop", "when to use auto in c++", "cpp switch statement", "c++ types tutorial"]
updated: 2026-07-14
---
# Types, Variables & Control Flow

Phase 2 showed you the shape of the shift from C to C++: same compiled, statically-typed foundation, but with an object model and stricter rules layered on top. This phase is where that shows up in the most ordinary code you'll write - declaring a variable, looping over a collection, branching on a condition. None of it is exotic. All of it is a little nicer than C, and a few pieces work in ways that will trip you if you assume C++ is "C with better syntax."

The mental model for this whole phase is simple: **C++ keeps C's control flow almost unchanged, but tightens and extends the type system around it.** You're not learning new control structures. You're learning where C++ refused to inherit C's looseness.

## `bool` is a real type now

In C, "true" and "false" started life as just nonzero and zero integers. C99 added a real boolean type, `_Bool` (available with no header), and `<stdbool.h>` gives it the readable names `bool`/`true`/`false`; C23 promotes those to built-in keywords. Even so, C's boolean still converts freely to and from `int`. In C++, `bool` is a built-in type from the start, with exactly two values: `true` and `false`. It's not an alias for `int`, and the compiler treats it differently for overload resolution (phase 4) and template deduction (phase 10) - a `bool` argument won't silently match an `int` overload the way it might in C.

```cpp
bool isReady = true;
bool hasError = false;

if (isReady && !hasError) {
    // ...
}
```

Comparisons (`==`, `<`, `&&`, and so on) now produce a genuine `bool`, not an `int` that happens to be 0 or 1. In practice you'll barely notice the difference day to day - `if (isReady)` reads the same either way - but it matters the moment you overload a function on `bool` vs `int`, which C simply can't express.

## Declaring variables: same rules, one new trick

Variable declarations look identical to C: `type name = value;`. What's new is **`auto`**, which tells the compiler "figure out the type from the initializer" instead of you spelling it out.

```cpp
int count = 5;          // ordinary, explicit
auto count2 = 5;        // also an int - deduced from 5
auto name = std::string("Ada");   // deduced as std::string
auto ratio = 3.14;      // deduced as double
```

**What `auto` actually is.** It's a compile-time placeholder, resolved once, at the declaration - there's no runtime cost and no dynamic typing involved. The compiler looks at the right-hand side, decides the type, and from then on `count2` is exactly as strongly typed as if you'd written `int` yourself. Nothing about the variable is flexible after that line.

**When to reach for it, and when not to.** `auto` earns its keep when the type is verbose or obvious from context - you'll see this constantly once you meet iterators (phase 12) and templates (phase 10), where the "real" type name can be an unreadable mouthful. It earns nothing, and actively costs readability, when spelling the type out is what makes the line clear:

```cpp
auto x = getValue();      // what is x? you can't tell without checking getValue()
int score = getValue();   // now the reader knows immediately
```

A reasonable habit for this early in your C++ life: write the type out explicitly by default, and use `auto` only where the type is either painfully long or already obvious from the right-hand side (like `auto name = std::string("Ada")`, where the type is right there in the constructor call).

## Control flow: C's structures, unchanged

`if`/`else`, `while`, `do...while`, the classic three-part `for`, and `switch` all work exactly like they do in C - same syntax, same semantics. If you've read [C From Zero](/guides/c-from-zero), phase 3 there covers this ground and nothing about it changed coming into C++.

```cpp
for (int i = 0; i < 5; ++i) {
    std::cout << i << " ";
}
```

C++ does add one new loop shape worth learning immediately, because you'll use it constantly once you meet the STL in phases 11-12: the **range-based `for`**.

```cpp
std::vector<int> nums = {10, 20, 30, 40};

for (int n : nums) {
    std::cout << n << " ";
}
```

**What it actually is.** `for (int n : nums)` walks every element of `nums` in order, binding `n` to a copy of each one in turn - no index variable, no bounds to get wrong, no off-by-one errors. It works on arrays, `std::vector`, `std::string`, and anything else that exposes `begin()`/`end()` (the STL containers in phase 11 all do this).

**Why the copy matters.** `for (int n : nums)` copies each element into `n`. For small types like `int` that's free, but for something expensive like a `std::string`, copying every element on every iteration is wasteful - and if you *modify* `n`, you're only modifying the copy, not the original. Fix both problems the same way you will everywhere else in C++: borrow instead of copy.

```cpp
for (const std::string& word : words) {   // read-only, no copies
    std::cout << word << "\n";
}

for (int& n : nums) {                     // reference: modifies the real element
    n *= 2;
}
```

References (`&`) get their full treatment in phase 5, but the pattern to recognize now is: `T` copies, `const T&` reads without copying, `T&` reads *and* writes the original. Reach for `const T&` as your default in a range-based `for` unless the type is tiny (`int`, `double`, `char`) or you genuinely need to mutate the elements.

## `switch`, mostly unchanged - with one sharper edge

`switch` in C++ behaves like C's: it jumps to the matching `case`, and execution *falls through* into the next case unless you `break`. That fall-through is exactly as much of a footgun in C++ as it is in C - the compiler still won't stop you from forgetting a `break`. C++ just adds one refinement worth knowing: you can declare a variable scoped to a single `case` by wrapping it in braces, since without them a variable declared in one `case` is technically visible (but not necessarily initialized) in the ones below it.

```cpp
switch (grade) {
    case 'A': {
        int bonus = 10;
        std::cout << "Excellent, bonus: " << bonus << "\n";
        break;
    }
    case 'B':
        std::cout << "Good\n";
        break;
    default:
        std::cout << "Keep going\n";
}
```

## `enum class`: the fix for C's leaky enums

C's `enum` has a real problem: its values leak into the surrounding scope as plain integers, and two different enums can silently collide or compare equal.

```c
enum Color { RED, GREEN, BLUE };
enum Fruit { APPLE, BANANA };
// RED is 0, APPLE is also 0 -- and both are really just `int`
if (RED == APPLE) { /* this compiles and is true, which makes no sense */ }
```

C++ fixes this with **`enum class`** (a "scoped enum"): its values live inside the enum's own namespace, and it does not implicitly convert to `int` or compare against unrelated enums.

```cpp
enum class Color { Red, Green, Blue };
enum class Fruit { Apple, Banana };

Color c = Color::Red;       // must qualify with Color::
// if (c == Fruit::Apple)   // compile error: not comparable, and it shouldn't be

if (c == Color::Red) {
    std::cout << "red\n";
}
```

**Why this exists.** The whole point of `enum class` is to catch exactly the bug the C example above lets through: comparing values that only *happen* to share a numeric representation but mean nothing to each other. You pay one small cost - `Color::Red` instead of bare `Red` - for a guarantee that the compiler, not a code reviewer, catches the mix-up. Old-style `enum` (without `class`) still exists in C++ for backward compatibility with C, but prefer `enum class` in new code; there's rarely a good reason to reach for the leaky version.

## Putting it together

None of this phase reinvents control flow - an `if` is still an `if`. What changed is precision: `bool` stops booleans from being a convention and makes them a type; `auto` removes repetition without removing static typing; range-based `for` removes an entire category of indexing bugs; `enum class` closes the door C left open on accidental enum comparisons. Small tightenings, each one removing a way to shoot yourself in the foot, which is the theme you'll see again and again as this guide goes deeper into C++'s object model starting next phase.

### Check yourself

```quiz
[
  {
    "q": "What does `enum class` actually change compared to a plain C-style `enum`?",
    "choices": [
      "It scopes the values inside the enum's own name and removes implicit conversion to int, so unrelated enums can no longer accidentally compare equal",
      "It makes the enum's values start counting from 1 instead of 0",
      "It lets the enum hold values of any type, not just integers",
      "It's just a stylistic alias for `enum`, with identical behavior at compile time"
    ],
    "answer": 0,
    "explain": "Plain enum values leak into the surrounding scope as bare ints, so two unrelated enums can compare equal by accident; enum class keeps values namespaced and non-convertible, so that comparison becomes a compile error instead."
  },
  {
    "q": "In `for (int n : nums) { n *= 2; }`, why does `nums` end up unchanged after the loop?",
    "choices": [
      "n is bound to a copy of each element, so modifying n doesn't touch the original in nums",
      "int is deduced as const here, so the multiplication silently does nothing",
      "range-based for always iterates over a copy of the whole container, not just each element",
      "*= isn't allowed on a range-based for's loop variable, so this wouldn't compile"
    ],
    "answer": 0,
    "explain": "Declaring the loop variable as plain `int` (or any non-reference type) copies each element in; to mutate the real elements you need `int&` instead."
  },
  {
    "q": "After `auto count2 = 5;`, which statement is true?",
    "choices": [
      "count2 is a plain int, exactly as strongly typed as if you'd written `int count2 = 5;`",
      "count2 can later be reassigned to hold a string or double, since auto is dynamically typed",
      "count2's type is only checked at runtime, not at compile time",
      "count2's type stays undecided until the compiler sees how it's used later in the function"
    ],
    "answer": 0,
    "explain": "auto is resolved once, at the declaration, by looking at the initializer - after that the variable is a fixed, ordinary type with no runtime flexibility."
  }
]
```

---

[Phase 4: Functions, Overloading & Default Arguments →](04-functions-overloading-and-default-arguments.md)
