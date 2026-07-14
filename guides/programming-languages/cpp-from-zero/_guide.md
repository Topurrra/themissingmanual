---
title: "C++ From Zero"
guide: "cpp-from-zero"
phase: 0
summary: "Learn C++ as its own language, not 'C with extras': the object model, RAII, value semantics, templates, the STL, and modern C++ - mental-model-first, from your first compile to why the Rule of Five exists."
tags: [cpp, beginner, advanced, getting-started, raii, classes, templates, stl, smart-pointers, move-semantics, modern-cpp]
category: programming-languages
order: 9
difficulty: beginner
synonyms: ["learn c++", "c++ for beginners", "c++ from scratch", "is c++ hard to learn", "what is raii", "rule of five explained", "c++ vs c", "c++ smart pointers", "c++ stl tutorial", "c++ templates explained", "modern c++ tutorial", "c++ move semantics", "c++ copy constructor explained"]
updated: 2026-07-14
---

# C++ From Zero

C++ gets introduced two ways, and both do it a disservice. Some call it "C with classes," which
undersells it - C++ has an entire object model, a memory-safety discipline, and a standard library
that C simply doesn't have. Others call it a kitchen sink of every feature ever proposed, which makes
it sound scarier than it is. The real story is calmer: C++ is built around one central idea - **tie a
resource's lifetime to an object's lifetime, and let the compiler manage the "letting go" for you.**
That idea is called RAII, and once you see it, the rest of the language reads as consequences of it.

This guide teaches C++ as its own language. We won't spend chapters translating from C - a little
prior programming helps, and if you already know C you'll recognize the syntax fast, but you don't
need it. What C++ adds on top - objects, constructors and destructors, references, templates, the
STL, exceptions, smart pointers - is the actual subject here, taught mental-model-first: before any
keyword or syntax, you'll understand what the thing *is* and why C++ works that way.

It's one zero-to-hero journey in two halves. **Phases 1-9 are the basics** - compiling, syntax, and
the object model, ending at the idea that makes C++ what it is: RAII, and the Rule of Five that falls
out of it. **Phases 10-17 are the deep half** - templates, the STL, smart pointers, inheritance,
exceptions, and modern C++, the stuff that separates "writes C++" from "understands C++." Each phase
carries a difficulty badge so you can see the climb.

If you've never programmed at all, start with a gentler on-ramp first -
[Programming From Zero](/guides/programming-from-zero) - then come back here. And if you already know
C, welcome: phase 2 is written for you, mapping exactly what changes and why, and
[C From Zero](/guides/c-from-zero) is there if you ever want the bare-metal half of this story, but
it's optional - this guide stands on its own.

## How to read this

- **Brand new to C++? Read 1-9 in order.** Phases 1-5 get you comfortable with the syntax and how
  C++ organizes a program. Then phases 6-8 are the heart of the language: classes, RAII, and the Rule
  of Five. Slow down there - it's worth it.
- **Already know C?** Read phase 2 closely - it's a direct map of what's different - then move
  normally through 3-5, which will feel familiar with new vocabulary. **Really slow down at phase 7.**
  RAII is the idea C doesn't have, and it changes how you think about every resource: memory, files,
  locks, sockets, all of it.
- **Coming from a garbage-collected language (Python, Java, JS)?** Phases 6-8 are where C++ diverges
  hardest from what you know. There's no garbage collector; instead, destructors and the Rule of Five
  do that job deterministically. Read those three phases as a unit.
- **Past the basics already?** Jump to the deep half - [Phase 10: Templates & Generic
  Programming](10-templates-and-generic-programming.md) onward is where RAII and value semantics grow
  up into generic code, the STL, smart pointers, and the parts of modern C++ that make it a genuinely
  different language from the one people warn you about.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Compiling & Your First Program](01-compiling-and-your-first-program.md)** 🟢 - a compiler, `g++`/`clang++`, and what compiling a C++ program looks like.
2. **[From C to C++: What Changed](02-from-c-to-cpp-what-changed.md)** 🟢 - `iostream` over `printf`, `bool`, references, `new`/`delete`, and namespaces - the surface differences, named.
3. **[Types, Variables & Control Flow](03-types-variables-and-control-flow.md)** 🟢 - C++'s type system, `auto`, and control flow with C++'s small extra conveniences.
4. **[Functions, Overloading & Default Arguments](04-functions-overloading-and-default-arguments.md)** 🟢 - multiple functions sharing a name, default parameter values, and how overload resolution picks one.
5. **[References vs Pointers](05-references-vs-pointers.md)** 🟡 - what a reference actually is, when to reach for one over a pointer, and why C++ has both.
6. **[Classes & Objects](06-classes-and-objects.md)** 🟡 - bundling data with the functions that operate on it, `public`/`private`, and what "object" means in C++.
7. **[Constructors, Destructors & RAII](07-constructors-destructors-and-raii.md)** 🟡 - **the whole point of C++:** tying a resource's lifetime to an object's scope, with no garbage collector.
8. **[Copy, Move & the Rule of Five](08-copy-move-and-the-rule-of-five.md)** 🟡 - **the crux, part two:** what happens when an object owns a resource and gets copied, moved, or destroyed.
9. **[Operator Overloading](09-operator-overloading.md)** 🟡 - making your own types work with `+`, `==`, `<<`, and the rest, without it turning into magic.

**Part 2 - Beyond the basics (🔴 Advanced)**
10. **[Templates & Generic Programming](10-templates-and-generic-programming.md)** 🔴 - writing one function or class that works for any type, and what the compiler does with it.
11. **[The STL: Containers](11-the-stl-containers.md)** 🟡 - `vector`, `map`, `set`, `string`, and picking the right container instead of reinventing one.
12. **[The STL: Iterators & Algorithms](12-the-stl-iterators-and-algorithms.md)** 🟡 - the glue between containers and algorithms, and why `std::sort` beats a hand-written loop.
13. **[Smart Pointers & Modern Memory Management](13-smart-pointers-and-modern-memory-management.md)** 🔴 - `unique_ptr`, `shared_ptr`, and RAII applied to `new`/`delete` so you (almost) never call them.
14. **[Inheritance & Polymorphism](14-inheritance-and-polymorphism.md)** 🟡 - `virtual`, base and derived classes, and when inheritance is actually the right tool.
15. **[Error Handling: Exceptions and Alternatives](15-error-handling-exceptions-and-alternatives.md)** 🟡 - `try`/`catch`/`throw`, exception safety, and why some modern C++ avoids exceptions entirely.
16. **[Modern C++: auto, Lambdas, Ranges & What Changed Since C++11](16-modern-cpp-auto-lambdas-ranges-and-what-changed-since-cpp11.md)** 🟡 - the features that make current C++ read nothing like the C++ of 15 years ago.
17. **[Undefined Behavior, Gotchas & Where to Go Next](17-undefined-behavior-gotchas-and-where-to-go-next.md)** 🔴 - the mistakes that compile fine and misbehave anyway, and what to build next.

> C++'s wider ecosystem (build systems, package managers, specific frameworks like Qt or game
> engines) is its own world - this guide makes the *language* make sense, top to bottom.

---

[Phase 1: Compiling & Your First Program →](01-compiling-and-your-first-program.md)
