---
title: "Undefined Behavior, Gotchas & Where to Go Next"
guide: "cpp-from-zero"
phase: 17
summary: "Why does C++ code that compiles fine sometimes just misbehave, with no error and no crash you can point to - and once you can see that pattern, where do you go to keep getting better at C++?"
tags: [cpp, undefined-behavior, gotchas, sanitizers, debugging, ub, next-steps]
difficulty: advanced
synonyms: ["what is undefined behavior in c++", "c++ ub explained", "why does my c++ code work sometimes", "c++ common mistakes", "address sanitizer c++", "c++ gotchas for beginners", "what to learn after c++ basics", "c++ next steps", "signed integer overflow c++", "dangling pointer c++ example"]
updated: 2026-07-14
---
# Undefined Behavior, Gotchas & Where to Go Next

Here's a sentence that sounds impossible until you've lived it: a C++ program can compile without a single warning, run correctly a thousand times, and then one day - on a different machine, or with a different compiler flag, or just because the moon was in a different phase - produce garbage, or crash, or format your hard drive. Nothing in the language stopped this from happening. That's not a bug in your compiler. It's a specific, named concept in the C++ standard, and understanding it is the last piece of the mental model this whole guide has been building toward.

## The mental model: UB isn't an error, it's a promise you broke

**What it actually is.** Most languages define what happens for every program you can write. C++ doesn't. The standard defines a set of rules, and for a specific list of things - reading an uninitialized variable, indexing past the end of an array, dereferencing a null or dangling pointer, signed integer overflow, and dozens more - it says: *if your program does this, the standard makes no promise about what happens next.* That's **undefined behavior (UB)**. Not "an error is thrown." Not "the program crashes." Literally anything is a conforming outcome, including "it appears to work."

**Why this exists.** It sounds like a design flaw, but it's a deliberate trade for speed. If the compiler had to check every array access, every pointer dereference, every arithmetic operation for safety, C++ would need runtime checks everywhere - the exact overhead C++ exists to avoid (recall [Phase 2](02-from-c-to-cpp-what-changed.md)'s "you don't pay for what you don't use"). Instead, the standard says: *you* guarantee these things won't happen, and in exchange, the compiler is free to generate the fastest possible code assuming you kept that promise. This is called the **as-if rule and UB exploitation**: the optimizer is allowed to assume UB never occurs, and it will restructure, reorder, or delete code based on that assumption. That's why UB isn't just "wrong output" - the compiler might notice a code path implies UB and delete it entirely, including code you thought was unrelated.

**Why people get this wrong.** "It compiled and ran fine, so it must be OK" is the single most dangerous sentence in C++. A program with UB *appearing* to work is not evidence of correctness - it's evidence that this particular compiler, on this particular day, with these particular optimization flags, happened to generate code that didn't visibly break. Change any of those, and the same source can behave differently. UB is a property of the code, not of any one run.

## The gotchas you'll actually hit

You've already met some of these in earlier phases - here they are named as a group, because recognizing the pattern matters more than memorizing the list. Most are UB; the last one (slicing) is the odd one out - it's well-defined, just quietly wrong.

```cpp
// 1. Dangling reference/pointer - the resource is gone, the pointer isn't
int* dangling() {
    int local = 42;
    return &local;          // local's storage ends when the function returns
}                            // caller now holds a pointer to freed stack space

// 2. Out-of-bounds access - no bounds check, ever, on raw indexing
std::vector<int> v = {1, 2, 3};
int x = v[10];               // reads whatever memory happens to be there

// 3. Uninitialized read
int y;                       // no default value for a built-in type
std::cout << y;              // reads garbage - could be anything

// 4. Signed integer overflow (unsigned overflow is well-defined; signed is not)
int max = INT_MAX;
int overflowed = max + 1;    // UB, not a wraparound guarantee

// 5. Use-after-free
int* p = new int(5);
delete p;
std::cout << *p;             // p's memory has been returned to the allocator

// 6. Object slicing - assigning a derived object into a base by value
Circle c;
Shape s = c;                 // NOT UB - this is well-defined, just wrong: only the Shape
                             // part is copied, Circle-ness is silently sliced off
```

Notice the theme: `v[10]` compiles. `int y;` compiles. `*p` after `delete` compiles. None of these are syntax errors - they're semantic promises you broke, and the compiler has no obligation to catch them. This is exactly why [Phase 5's](05-references-vs-pointers.md) advice to prefer references over raw pointers, [Phase 8's](08-copy-move-and-the-rule-of-five.md) RAII discipline, and [Phase 13's](13-smart-pointers-and-modern-memory-management.md) smart pointers all exist: modern C++ style isn't a set of arbitrary preferences, it's a systematic campaign to make entire categories of UB unreachable by construction. `std::vector` with `.at()` bounds-checks. `unique_ptr` can't be use-after-freed if you don't hold onto raw pointers to its contents. A reference can't be null. Writing modern C++ well *is* writing less UB-prone code.

## Finding UB before your users do

You can't spot most UB by reading code - it's invisible at the source level. What you can do is turn on tools that catch it at build and run time:

```bash
# Compile-time: turn on the warnings that catch a lot of this class of bug
g++ -Wall -Wextra -Wpedantic -std=c++20 main.cpp

# Runtime: AddressSanitizer catches out-of-bounds, use-after-free, leaks
g++ -fsanitize=address -g main.cpp -o main && ./main

# Runtime: UndefinedBehaviorSanitizer catches overflow, null derefs, and more
g++ -fsanitize=undefined -g main.cpp -o main && ./main
```

`-Wall -Wextra` costs nothing and catches real mistakes at compile time - there's no reason to ship without them. The sanitizers cost some runtime speed, which is exactly why you run them in debug and test builds, not in the release binary you ship. Treat "does it pass with sanitizers on" as part of your definition of "the tests pass," the same way you'd treat a compiler warning: something to fix, not something to suppress.

## Where to go next

You now have the full shape of the language: the object model, RAII and the Rule of Five, templates and the STL, and modern C++ idioms. From here, C++ branches into specialized worlds, and which one you pick depends on what you want to build:

- **Systems and performance work** - profiling with `perf` or VTune, cache-friendly data layout, and eventually the parts of C that C++ builds on top of; [C From Zero](/guides/c-from-zero) is there if you want that bare-metal half of the story.
- **Concurrency** - `std::thread`, `std::mutex`, and `std::atomic` extend the RAII and ownership ideas from this guide into multi-threaded code, where the same "who owns this, and for how long" questions matter even more.
- **Build systems and packages** - real projects use CMake and a package manager (vcpkg or Conan) instead of a single `g++` command; that tooling is worth learning as soon as a project has more than one file.
- **A domain** - game engines, embedded firmware, high-frequency trading, browser engines, and audio software are all still mostly C++, and each has its own idioms layered on top of everything you just learned.

Wherever you go next, the core habit stays the same: think about ownership and lifetime before you think about syntax, let RAII do the cleanup, and treat any UB warning - from a sanitizer, from `-Wall`, or from your own gut - as a bug report on code that merely looked fine.

## Quick check

Test yourself on the idea this whole phase turns on - that UB is a broken promise, not an error type:

```quiz
[
  {
    "q": "What does it mean when the C++ standard says a construct causes undefined behavior?",
    "choices": [
      "The program is guaranteed to crash immediately",
      "The standard makes no guarantee about what happens next - anything, including code that appears to run correctly, is a conforming outcome",
      "The compiler will refuse to compile the code",
      "The operating system decides what the code does"
    ],
    "answer": 1,
    "explain": "UB isn't a special kind of error, it's the absence of any promise at all - a crash, garbage output, and apparently-correct output are all equally valid outcomes."
  },
  {
    "q": "A coworker says a function is fine because they ran it a thousand times without a crash. What's the flaw in that reasoning?",
    "choices": [
      "Nothing - running it many times without a crash proves the code is UB-free",
      "A program with UB can appear to work for many runs and then break under a different compiler, flag, or machine, because 'it worked' was never a guarantee to begin with",
      "UB only ever affects programs that use raw pointers",
      "Sanitizers can't detect UB once a program has already run successfully"
    ],
    "answer": 1,
    "explain": "UB is a property of the code, not of any one run - a passing run is evidence about that run, not proof the promise was kept."
  },
  {
    "q": "What happens when you add 1 to `INT_MAX` in C++?",
    "choices": [
      "It wraps around to `INT_MIN`, the same way unsigned integers wrap",
      "It's undefined behavior - unlike unsigned overflow, signed overflow has no defined wraparound guarantee",
      "The compiler raises a compile-time error",
      "It saturates and stays at `INT_MAX`"
    ],
    "answer": 1,
    "explain": "Unsigned overflow is well-defined wraparound; signed overflow is UB, so a compiler is free to assume it never happens and optimize accordingly."
  }
]
```

---

[← Phase 16: Modern C++](16-modern-cpp-auto-lambdas-ranges-and-what-changed-since-cpp11.md) · [Back to the guide overview →](_guide.md)
