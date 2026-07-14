---
title: "Python From Zero"
guide: "python-from-zero"
phase: 0
summary: "Learn Python from nothing to genuinely advanced: install and the basics, then objects and tooling, then the deep half - the data model, generators, decorators, typing, concurrency and the GIL, performance, and packaging - all in small, runnable steps with clear explanations."
tags: [python, beginner-friendly, advanced, programming-language, learn-python, decorators, generators, typing, concurrency, gil]
category: programming-languages
order: 1
difficulty: beginner
synonyms: ["learn python", "python for beginners", "python from beginner to advanced", "advanced python", "python decorators generators", "python type hints mypy", "python gil concurrency", "python dataclasses", "how to start with python", "understand python"]
updated: 2026-06-19
---

# Python From Zero

Python is the language people reach for when they want to *get something done* without fighting the
language first - data work, scripts, web backends, automation, glue between systems. It reads almost
like English, which makes it inviting, and that same readability hides a few sharp edges nobody warns
you about. This guide takes you the whole way: from "I've never run Python" to understanding what the
language is *actually doing* underneath your code - explaining each piece rather than handing you spells
to memorize.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** - enough to write real,
well-organized programs. **Phases 10–18 are the deep half** - the data model, generators, decorators,
typing, concurrency, performance, and packaging, the stuff that separates "writes Python" from
"understands Python." Each phase carries a difficulty badge so you can see the climb.

If programming itself is brand new - not just Python - start with
[Programming From Zero](/guides/programming-from-zero) first; it builds the "what is a program" mental
model this guide assumes.

## How to read this
- **Brand new to Python?** Read 1–9 in order, top to bottom - each builds on the last. Type the examples
  as you go (most are runnable right here); doing beats reading. Come back for 10+ when the basics feel
  comfortable.
- **Already know another language?** Skim 1–5 for Python's spelling of ideas you have, then start properly
  at [Phase 6: Objects & Classes](06-objects-and-classes.md).
- **Past the basics already?** Jump straight to the deep half - [Phase 10: The Data Model](10-the-data-model.md)
  onward is where Python stops being "a readable scripting language" and starts being a language you can
  reason about to the metal.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - Python 3, the REPL, a real `hello.py`.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 - indentation as structure, the core types, f-strings.
3. **[Collections](03-collections.md)** 🟢 - lists, tuples, dicts, sets, and the aliasing trap.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** 🟢 - `if`/loops/`def`, truthiness, the mutable-default trap.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** 🟢 - `import`, the stdlib, `__main__`, a clean layout.
6. **[Objects & Classes](06-objects-and-classes.md)** 🟡 - what an object really is, `self`, when to reach for a class.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 - reading tracebacks, `try`/`except`, files without corruption.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** 🟡 - `pip`, virtual environments, formatters, linters.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 - the Pythonic way, and the sharp edges that bite everyone once.

**Part 2 - Beyond the basics (🔴 Advanced)**
10. **[The Data Model & Dunder Methods](10-the-data-model.md)** 🔴 - make your objects behave like built-ins.
11. **[Iterators & Generators](11-iterators-and-generators.md)** 🟡 - `yield`, laziness, processing huge data without the RAM.
12. **[Decorators](12-decorators.md)** 🔴 - the `@` magic in every framework, demystified.
13. **[Context Managers](13-context-managers.md)** 🟡 - `with`, and never leaking a file/lock/connection again.
14. **[Type Hints & mypy](14-type-hints.md)** 🟡 - gradual typing; catch the bug before runtime.
15. **[Dataclasses & Modern Modeling](15-dataclasses.md)** 🟡 - kill the boilerplate.
16. **[Concurrency & the GIL](16-concurrency-and-the-gil.md)** 🔴 - threads vs processes vs async, and what the GIL actually blocks.
17. **[Performance & Memory](17-performance-and-memory.md)** 🔴 - how CPython runs, the GC, and the real speedups.
18. **[Packaging & Environments](18-packaging-and-environments.md)** 🟡 - ship a package, not a folder of scripts.

**Finale**
19. **[Where to Go Next](19-where-to-go-next.md)** 🟢 - web, data, automation, and what to build.

> Frameworks (FastAPI, Django) are their own guides - they're different tools, not "more Python." This
> guide makes the *language* make sense, top to bottom.
