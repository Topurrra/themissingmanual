---
title: "Java From Zero"
guide: "java-from-zero"
phase: 0
summary: "Learn Java from nothing to genuinely advanced: install the JDK and the basics - types, classes, objects, collections - then the deep half: generics, lambdas and streams, modern records and pattern matching, concurrency, the JVM and its garbage collector, testing, and performance. Mental-model-first, with honest explanations."
tags: [java, jvm, beginner, advanced, getting-started, oop, generics, streams, concurrency, garbage-collection]
category: programming-languages
order: 6
difficulty: beginner
synonyms: ["learn java", "java for beginners", "java from beginner to advanced", "advanced java", "how to start with java", "java programming tutorial", "java from scratch", "is java hard to learn", "java generics streams lambdas", "java concurrency threads", "java jvm garbage collection", "java records pattern matching"]
updated: 2026-06-22
---

# Java From Zero

Java has been quietly running the world for thirty years. It's behind Android apps, the backends of
most large banks and enterprises, Minecraft, and an enormous share of the systems that move money and
data around the planet. That longevity comes from a deliberate bet: write once, run anywhere - your code
compiles to bytecode that runs on the **JVM** (Java Virtual Machine), the same on a laptop, a server, or
a phone. Java values stability, readability, and tooling over cleverness, which is exactly why teams keep
choosing it for software that has to keep working for a decade.

This guide takes you the whole way: from "I've never run `javac`" to understanding what Java and its
runtime are *actually doing* underneath your code. We go mental-model-first the whole way: before any
command, you'll understand what the thing actually *is* and why Java made the choice it did.

> 📝 This guide teaches the **language**. If you've never programmed at all, start with
> [Programming From Zero](/guides/programming-from-zero) first - it covers the universal ideas (what a
> program is, variables, loops) every language shares. Then come back here.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** - enough to write real,
well-organized object-oriented programs. **Phases 10–17 are the deep half** - generics, lambdas and
streams, modern Java (records, sealed types, pattern matching), concurrency, the JVM and garbage
collector, testing, and performance, the stuff that separates "writes Java" from "understands Java."
Each phase carries a difficulty badge so you can see the climb.

## How to read this

- **Brand new to Java?** Read 1–9 in order, top to bottom - each builds on the last. Type the examples
  yourself; doing beats reading. Come back for 10+ when the basics feel comfortable.
- **Already know another language?** Skim phases 1–4 for Java's spelling of ideas you have, then slow
  down at [Phase 5: Classes & Objects](05-classes-and-objects.md) - object-orientation is Java's whole
  worldview, and everything after it assumes you think in objects.
- **Past the basics already?** Jump to the deep half - [Phase 10: Generics, Deep](10-generics-deep.md)
  onward is where Java stops being "a verbose OOP language" and becomes one you can reason about down to
  the garbage collector.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - the JDK, `javac`/`java`, the JVM, a real `Hello`.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 - primitives vs objects, `var`, static typing, strings.
3. **[Collections](03-collections.md)** 🟢 - arrays, `List`/`ArrayList`, `Map`/`HashMap`, `Set`, and generics for collections.
4. **[Control Flow & Methods](04-control-flow-and-methods.md)** 🟢 - `if`/`switch`/loops, methods, and overloading.
5. **[Classes & Objects](05-classes-and-objects.md)** 🟡 - **Java's whole worldview:** classes, fields, constructors, `this`, encapsulation.
6. **[Inheritance & Interfaces](06-inheritance-and-interfaces.md)** 🟡 - `extends`, interfaces, polymorphism, and `abstract`.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 - checked vs unchecked exceptions, `try`/`catch`/`finally`, try-with-resources, files.
8. **[Packages, Build & Tooling](08-packages-and-tooling.md)** 🟡 - packages, the classpath, Maven/Gradle, JARs, the ecosystem.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 - the Java way, and the traps (`null`, `==` vs `equals`, autoboxing) that bite everyone once.

**Part 2 - Beyond the basics (🔴 Advanced)**
10. **[Generics, Deep](10-generics-deep.md)** 🔴 - bounded types, wildcards (`? extends`/`super`), and type erasure.
11. **[Lambdas & Functional Interfaces](11-lambdas-and-functional-interfaces.md)** 🟡 - lambdas, method references, and the functional-interface system.
12. **[The Streams API](12-streams-api.md)** 🟡 - declarative pipelines: `map`/`filter`/`collect`, laziness, and parallel streams.
13. **[Records, Sealed Types & Modern Java](13-records-and-modern-java.md)** 🟡 - records, sealed classes, switch expressions, pattern matching, `Optional`.
14. **[Concurrency & Threads](14-concurrency-and-threads.md)** 🔴 - threads, `synchronized`, the memory model, `ExecutorService`, `CompletableFuture`, virtual threads.
15. **[The JVM: Memory, GC & JIT](15-the-jvm-memory-and-gc.md)** 🔴 - heap vs stack, the garbage collector, JIT compilation, and class loading.
16. **[Testing, Build & Profiling](16-testing-and-profiling.md)** 🟡 - JUnit, table-driven tests, Maven/Gradle deeper, and profiling with JFR.
17. **[Performance & the Ecosystem](17-performance-and-ecosystem.md)** 🔴 - cutting allocation/GC pressure, measuring first, and the Java ecosystem.

**Finale**
18. **[Where to Go Next](18-where-to-go-next.md)** 🟢 - Spring Boot, Android, big data, and what to build.

> Frameworks (Spring Boot, Android, Jakarta EE) are their own world - this guide makes the *language and
> the JVM* make sense, top to bottom.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
