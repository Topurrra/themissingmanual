---
title: "Modern C++: auto, Lambdas, Ranges & What Changed Since C++11"
guide: "cpp-from-zero"
phase: 16
summary: "What actually changed when C++11 landed, and how do auto, lambdas, and C++20 ranges let you write C++ that reads nothing like the C++ from before?"
tags: [cpp, modern-cpp, auto, lambdas, ranges, cpp11, cpp20, type-inference]
difficulty: intermediate
synonyms: ["c++ auto keyword explained", "c++ lambda functions tutorial", "what is a lambda capture", "c++ ranges explained", "c++11 vs modern c++", "what changed in c++11", "c++20 ranges tutorial", "structured bindings c++", "c++ lambda closure", "auto vs explicit type c++", "c++ range based for loop", "modern c++ features"]
updated: 2026-07-14
---
# Modern C++: auto, Lambdas, Ranges & What Changed Since C++11

Everything up to this phase - classes, RAII, the Rule of Five, templates, the STL, smart pointers, inheritance - is C++ that would compile in 1998. It's real C++, and you needed all of it. But if you read code written today, it looks different: fewer explicit types, functions defined inline as arguments, loops that read like sentences. That's not a different language. It's the same C++, with roughly a decade of accumulated conveniences layered on top, starting with C++11 in 2011 and continuing through C++14, 17, and 20.

## The mental model: C++11 was a new language wearing old syntax

Before C++11, writing a function that took "some callable thing" meant function pointers or hand-rolled functor classes, and writing a type meant spelling it out in full every time, no matter how long the template instantiation made it. C++11 and its successors didn't change what C++ *can* express - they changed how much of it you have to *type*, and they gave you a few tools (closures, deduced types, pipelines over ranges) that used to require real ceremony to fake.

The three features in this phase's title are the ones that change how ordinary code reads the most: `auto` (stop repeating the type), lambdas (functions as values, written where you use them), and ranges (loops as pipelines). Then we'll tour the smaller changes that add up to "modern C++" as a feel, not just a feature list.

## `auto`: let the compiler write the type

`auto` tells the compiler to deduce a variable's type from its initializer, at compile time - there is no runtime cost and no dynamic typing involved, it's exactly as static as spelling the type out yourself.

```cpp
std::vector<std::string> names = {"Ada", "Grace", "Margaret"};

// Before: you spell out the iterator type in full
for (std::vector<std::string>::iterator it = names.begin(); it != names.end(); ++it) {
    std::cout << *it << "\n";
}

// With auto: the compiler already knows the type - why type it twice?
for (auto it = names.begin(); it != names.end(); ++it) {
    std::cout << *it << "\n";
}
```

`auto` earns its keep most when the real type is long, generic, or simply not something you care to name - an iterator type, a lambda's type, the return type of a template function. It is *not* about avoiding thought: `auto x = 5;` is still exactly `int x = 5;`, just with the compiler reading the right side of `=` to fill in the left. Where `auto` genuinely helps is avoiding a mismatch bug: writing `auto` instead of guessing `int` for something that's actually a `size_t` sidesteps a whole class of narrowing and signedness mistakes, because the type it picks is *always* correct by construction.

Use `auto` when the type is obvious from context (`auto v = std::vector<int>{1, 2, 3};`) or too unwieldy to write. Skip it when naming the type is the useful part of reading the line - `auto result = compute();` tells a reader nothing about what `result` *is*, while `double result = compute();` does.

## Lambdas: functions you can write where you use them

A **lambda** is an anonymous function you define inline, right where you need it, that can capture variables from the surrounding scope. It exists because passing behavior around - "sort by this comparison," "call this when done" - used to mean writing a whole separate named function or functor class just to bundle a few lines of logic.

```cpp
#include <algorithm>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> nums = {5, 2, 8, 1, 9};

    // A lambda passed straight into std::sort as the comparison
    std::sort(nums.begin(), nums.end(), [](int a, int b) {
        return a > b;   // descending
    });

    for (int n : nums) std::cout << n << " ";
    std::cout << "\n";   // 9 8 5 2 1
}
```

`[](int a, int b) { return a > b; }` is the whole lambda: `[]` is the **capture list** (empty here - it uses nothing from outside), `(int a, int b)` is the parameter list, and the body is ordinary code. `std::sort` calls it like any other comparison function; you never had to name it, declare it above `main`, or write a functor class with an `operator()`.

**What a lambda actually is.** Don't treat it as magic: the compiler generates a small class with an `operator()` and, for each captured variable, a member to hold it. `[x](){ return x; }` becomes, roughly, a class holding a copy of `x` with a call operator that returns it. This is why lambdas fit so naturally alongside templates and the STL (phases 10-12) - they're just objects, the same "pay for what you use" value semantics as everything else in this language.

**Captures are the part worth being careful with.** `[]` captures nothing, `[x]` captures `x` by value (a copy, frozen at creation), `[&x]` captures `x` by reference (sees later changes, but dangles if `x` dies first), and `[&]` / `[=]` capture *everything* used in the body by reference or by value respectively. The reference-capture footgun is real: a lambda that outlives the local variable it captured by reference is a dangling reference, same as any other reference outliving its target (phase 5).

```cpp
auto make_adder(int n) {
    return [n](int x) { return x + n; };   // n captured by value - safe to return
}

int main() {
    auto add5 = make_adder(5);
    std::cout << add5(10) << "\n";   // 15
}
```

`make_adder` returns a lambda that outlives the function call, so it captures `n` **by value** on purpose - a copy that travels with the lambda. Capturing `n` by reference here would compile and then misbehave: `n` is a parameter of `make_adder`, gone the moment it returns, leaving the lambda holding a dangling reference. If a lambda's lifetime might outlast the scope it was written in, prefer value captures.

## Ranges: loops as pipelines (C++20)

The **range-based `for`** (`for (int n : nums)`, used above and since C++11) was the first step: no more manually managing an iterator pair just to walk a container. C++20's `<ranges>` library takes the same idea further - instead of nesting algorithm calls or writing a loop with an `if` inside it, you describe a *pipeline* of transformations, read left to right.

```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    auto evens_squared = nums
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    for (int n : evens_squared) std::cout << n << " ";
    std::cout << "\n";   // 4 16 36 64 100
}
```

Read `|` as "then": *take `nums`, then keep only the evens, then square each one.* Compare that to the pre-ranges version - a hand-written loop with an `if` and a `push_back`, or a `std::copy_if` into a temporary vector followed by a separate `std::transform`. The pipeline says what you want, not the bookkeeping to get there, and each `std::views::` step is **lazy**: nothing runs until you actually iterate the result, so no intermediate vectors get allocated just to hold a partial answer.

## The rest of "what changed since C++11," briefly

A few more pieces complete the picture, each solving one specific piece of ceremony:

- **Structured bindings** (`auto [key, value] = *map_it;`) unpack a pair, tuple, or struct into named variables in one line, instead of `.first` / `.second`.
- **Uniform initialization** (`Point p{1, 2};`) works consistently across built-in types, aggregates, and classes with constructors, and refuses narrowing conversions that plain `=` would silently allow.
- **`nullptr`** replaced `NULL` and `0` as the null pointer literal, with an actual pointer type - no more overload resolution picking the `int` version of a function by accident.
- **`if` with an initializer** (`if (auto it = m.find(k); it != m.end())`) scopes a lookup variable to just the `if`/`else`, instead of leaking it into the enclosing block.
- **`constexpr`** lets a function run at compile time when its inputs are known then, computing results before the program even starts.

None of these are large ideas on their own. Together with `auto`, lambdas, and ranges, they're why code written today has a different *texture* from the C++ this guide's phase 2 described as "C with extras" - less ceremony per line, more of each line doing exactly what it says.

## Recap

`auto` deduces a variable's type from its initializer at compile time, with zero runtime cost - reach for it when the type is obvious or unwieldy, skip it when naming the type helps the reader. A lambda is an inline, anonymous function that the compiler turns into a small class with a call operator; capture by value when the lambda might outlive the scope it was written in, by reference only when you're certain it won't. C++20 ranges turn nested loops and chained algorithm calls into lazy, readable pipelines with `|`. Structured bindings, uniform initialization, `nullptr`, initializing `if`, and `constexpr` round out the rest - each one removing a specific piece of ceremony C++98 made you write by hand. None of it replaces the fundamentals from earlier phases; it's the same value semantics and the same RAII, just with less typing to get there.

## Quick check

Test yourself on the ideas that change how modern C++ reads: what `auto` actually does, and what a capture really captures.

```quiz
[
  {
    "q": "What does `auto x = compute();` actually do?",
    "choices": [
      "Deduces `x`'s static type from `compute()`'s return type at compile time - no runtime cost, no dynamic typing",
      "Makes `x` a dynamically-typed variable, like in Python or JavaScript",
      "Delays picking `x`'s type until the program runs, then checks it against `compute()`'s result",
      "Makes `x` accept any type at any point in the program, not just at initialization"
    ],
    "answer": 0,
    "explain": "auto is a compile-time convenience for the compiler to read the initializer's type and fill it in - x ends up exactly as statically typed as if you'd spelled the type out yourself."
  },
  {
    "q": "A lambda captures a local variable `n` by reference (`[&n]`) and is then returned from the function and called later. What happens?",
    "choices": [
      "Undefined behavior - `n` was a local that no longer exists, so the lambda holds a dangling reference",
      "It works fine - the compiler automatically extends `n`'s lifetime to match the lambda's",
      "It's a compile error - C++ never allows returning a lambda that captures by reference",
      "`n` keeps its last value frozen at the moment the function returned"
    ],
    "answer": 0,
    "explain": "A reference capture just stores a reference to the original variable, the same as any other reference - it doesn't keep the variable alive. If the lambda outlives the scope n was declared in, that's a dangling reference, so a lambda that needs to outlive its scope should capture by value instead."
  },
  {
    "q": "Why does the ranges pipeline `nums | std::views::filter(...) | std::views::transform(...)` not allocate an intermediate vector for the filtered results before transforming them?",
    "choices": [
      "Each views:: step is lazy - it describes the transformation but doesn't run it until the result is actually iterated",
      "The compiler automatically merges the filter and transform into a single hand-optimized loop",
      "views::filter secretly reuses the original vector's memory instead of creating a new one",
      "It does allocate one, but the allocation happens on the stack instead of the heap"
    ],
    "answer": 0,
    "explain": "std::views:: adaptors build a lazy pipeline description - nothing runs until the final for loop iterates it, so there's no intermediate container holding a partial answer at any point."
  }
]
```

---

[Phase 15: Error Handling: Exceptions and Alternatives](15-error-handling-exceptions-and-alternatives.md) · [Phase 17: Undefined Behavior, Gotchas & Where to Go Next →](17-undefined-behavior-gotchas-and-where-to-go-next.md)
