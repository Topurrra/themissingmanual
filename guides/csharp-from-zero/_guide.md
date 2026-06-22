---
title: "C# From Zero"
guide: "csharp-from-zero"
phase: 0
summary: "Learn C# from nothing to genuinely advanced: install .NET and the basics — types, classes, objects, collections — then the deep half: generics, delegates and lambdas, LINQ, modern records and pattern matching, async/await, the .NET runtime and its garbage collector, testing, and performance. Mental-model-first, with honest explanations."
tags: [csharp, dotnet, beginner, advanced, getting-started, oop, generics, linq, async-await, garbage-collection]
category: programming-languages
order: 7
difficulty: beginner
synonyms: ["learn c#", "c# for beginners", "csharp from beginner to advanced", "advanced c#", "how to start with c#", "c# programming tutorial", "c# from scratch", "is c# hard to learn", "c# generics linq", "c# async await tasks", "c# records pattern matching", "dotnet runtime garbage collection"]
updated: 2026-06-22
---

# C# From Zero

C# is Microsoft's flagship language, and over two decades it's grown into one of the most pleasant,
capable languages you can learn. It runs on **.NET**, a cross-platform runtime that's no longer
Windows-only — your C# runs on Linux, macOS, in the cloud, on phones, and in game engines. It powers a
huge share of enterprise backends (ASP.NET Core), desktop and mobile apps (MAUI), and — through Unity —
a large slice of the world's games. The language is famous for absorbing good ideas early: it had
LINQ and `async`/`await` years before most rivals, and it keeps evolving.

This guide takes you the whole way: from "I've never run `dotnet`" to understanding what C# and the .NET
runtime are *actually doing* underneath your code. We go mental-model-first the whole way: before any
command, you'll understand what the thing actually *is* and why C# made the choice it did.

> 📝 This guide teaches the **language**. If you've never programmed at all, start with
> [Programming From Zero](/guides/programming-from-zero) first — it covers the universal ideas (what a
> program is, variables, loops) every language shares. Then come back here.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** — enough to write real,
well-organized object-oriented programs. **Phases 10–17 are the deep half** — generics, delegates and
lambdas, LINQ, modern C# (records, pattern matching, nullable reference types), `async`/`await`, the
.NET runtime and garbage collector, testing, and performance, the stuff that separates "writes C#" from
"understands C#." Each phase carries a difficulty badge so you can see the climb.

## How to read this

- **Brand new to C#?** Read 1–9 in order, top to bottom — each builds on the last. Type the examples
  yourself; doing beats reading. Come back for 10+ when the basics feel comfortable.
- **Already know another language?** Skim phases 1–4 for C#'s spelling of ideas you have, then slow down
  at [Phase 5: Classes & Objects](05-classes-and-objects.md) — object-orientation is the spine of C#,
  and everything after assumes you think in objects.
- **Past the basics already?** Jump to the deep half — [Phase 10: Generics, Deep](10-generics-deep.md)
  onward is where C# stops being "a tidy OOP language" and becomes one you can reason about down to the
  garbage collector.

## The phases

**Part 1 — The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 — the .NET SDK, the `dotnet` CLI, the CLR, a real program.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 — value vs reference types, `var`, static typing, strings, nullability.
3. **[Collections](03-collections.md)** 🟢 — arrays, `List<T>`, `Dictionary<K,V>`, `HashSet<T>`.
4. **[Control Flow & Methods](04-control-flow-and-methods.md)** 🟢 — `if`/`switch` (and switch expressions), loops, methods, overloading.
5. **[Classes & Objects](05-classes-and-objects.md)** 🟡 — **the spine of C#:** classes, properties, constructors, encapsulation.
6. **[Inheritance & Interfaces](06-inheritance-and-interfaces.md)** 🟡 — inheritance, interfaces, polymorphism, and `abstract`.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 — exceptions, `try`/`catch`/`finally`, `using`, and files.
8. **[Projects, NuGet & Tooling](08-projects-and-tooling.md)** 🟡 — projects/solutions, NuGet packages, the .NET ecosystem, the build.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 — the C# way, and the traps (`null`, value vs reference equality, deferred `IEnumerable`) that bite everyone once.

**Part 2 — Beyond the basics (🔴 Advanced)**
10. **[Generics, Deep](10-generics-deep.md)** 🔴 — type parameters, constraints, and covariance/contravariance.
11. **[Delegates, Lambdas & Events](11-delegates-and-lambdas.md)** 🟡 — delegates, `Func`/`Action`, lambdas, and events.
12. **[LINQ](12-linq.md)** 🔴 — query and method syntax, deferred execution, and the LINQ pipeline.
13. **[Records, Pattern Matching & Modern C#](13-records-and-modern-csharp.md)** 🟡 — records, pattern matching, switch expressions, and nullable reference types.
14. **[async/await & Tasks](14-async-await-and-tasks.md)** 🔴 — the `Task` model, `async`/`await` in depth, and what really happens when you `await`.
15. **[The .NET Runtime: Memory, GC & JIT](15-the-dotnet-runtime-and-gc.md)** 🔴 — the managed heap, GC generations, value vs reference memory, JIT and IL.
16. **[Testing, Build & Profiling](16-testing-and-profiling.md)** 🟡 — xUnit, `dotnet test`, and profiling.
17. **[Performance & the Ecosystem](17-performance-and-ecosystem.md)** 🔴 — `Span<T>`, cutting allocations, measuring first, and the .NET ecosystem.

**Finale**
18. **[Where to Go Next](18-where-to-go-next.md)** 🟢 — ASP.NET Core, Blazor, MAUI, game dev with Unity, and what to build.

> Frameworks (ASP.NET Core, Blazor, MAUI, Unity) are their own world — this guide makes the *language and
> the .NET runtime* make sense, top to bottom.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
