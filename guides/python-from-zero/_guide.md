---
title: "Python From Zero"
guide: "python-from-zero"
phase: 0
summary: "Learn Python from nothing: install it, understand what its values and types actually are, master the collections and control flow you'll use every day, and lay out a real project — all with small, runnable examples and honest explanations."
tags: [python, beginner-friendly, programming-language, learn-python]
category: programming-languages
order: 9
difficulty: beginner
synonyms: ["learn python", "python for beginners", "how to start with python", "python tutorial from scratch", "understand python", "python basics explained"]
updated: 2026-06-19
---

# Python From Zero

Python is the language people reach for when they want to *get something done* without fighting the
language first — data work, scripts, web backends, automation, glue between systems. It reads almost
like English, which makes it inviting, and that same readability hides a few sharp edges nobody warns
you about. This guide takes you from "I've never run Python" to writing real, well-organized programs —
explaining what each piece *actually is* rather than handing you spells to memorize.

By the end you'll be able to install Python, reason about its types and collections, write functions
and control flow, organize code into modules and a sane project, model things with classes, handle
errors and files, and know your way around the tooling everyone uses. We go in small, runnable steps —
every example here is meant to be typed and run.

If programming itself is brand new — not just Python — start with
[Programming From Zero](/guides/programming-from-zero) first; it builds the "what is a program" mental
model this guide assumes.

## How to read this

- **Brand new to Python?** Read in order, top to bottom. Each phase builds on the one before — types
  before collections, collections before control flow, and so on. Type the examples as you go; doing
  beats reading.
- **Already know another language?** Skim phases 1–5 to pick up Python's spelling of ideas you already
  have (indentation as structure, dynamic typing, its collection types). Then slow down at
  [Phase 6: Objects & Classes](06-objects-and-classes.md) onward, where Python's model and idioms
  start to differ from what you're used to.

## The phases

1. **[Install & Your First Program](01-install-and-first-program.md)** — get Python 3 on your machine,
   meet the REPL, and run a real `hello.py`.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** — indentation as structure, variables,
   the core types (`int`, `float`, `str`, `bool`, `None`), and f-strings.
3. **[Collections](03-collections.md)** — lists, tuples, dicts, and sets: what each is *for*, how to
   index and slice, and the aliasing trap.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** — `if`/`elif`/`else`, loops,
   `def` with parameters and return values, truthiness, and the mutable-default-argument trap.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** — `import`, the standard library,
   writing your own modules, `if __name__ == "__main__"`, and a clean small project layout.
6. **[Objects & Classes](06-objects-and-classes.md)** — what an object really is, defining classes,
   `self`, and when (and when not) to reach for them.
7. **[Errors & I/O](07-errors-and-io.md)** — reading tracebacks calmly, `try`/`except`, and reading
   and writing files without corrupting them.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** — `pip`, virtual environments, the package
   index, and the formatters and linters everyone runs.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** — the Pythonic way to write common things, and the
   sharp edges that bite even experienced developers.
10. **[Where to Go Next](10-where-to-go-next.md)** — paths into web, data, and automation, and what to
    learn after the basics.

> Deep dives — async, typing in depth, performance, packaging your own library — are deliberately left
> for follow-up guides. This one's job is to make Python *make sense* and get you writing real code.
