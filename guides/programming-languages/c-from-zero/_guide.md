---
title: "C From Zero"
guide: "c-from-zero"
phase: 0
summary: "Learn C from nothing to genuinely understanding it: install a compiler and write real programs, then the deep half - pointers, manual memory, the stack vs the heap, and undefined behavior - the things that separate writing C from understanding it."
tags: [c, beginner, advanced, getting-started, pointers, memory, malloc, stack, heap, undefined-behavior, makefiles, gdb]
category: programming-languages
order: 8
difficulty: beginner
synonyms: ["learn c", "c for beginners", "c programming tutorial", "c from scratch", "is c hard to learn", "c pointers explained", "malloc and free explained", "stack vs heap in c", "undefined behavior c", "c programming language basics", "how to learn c programming", "c memory management"]
updated: 2026-07-14
---

# C From Zero

Almost every piece of software you've ever used has C somewhere underneath it. Your operating
system's kernel is written in C. So is the Python interpreter that runs your Python scripts, the
database engine behind your app, and a good chunk of the tools you run every day without thinking
about them. C isn't old news - it's the floor that everything else stands on.

C also has a reputation, and it's earned: it doesn't stop you from doing dangerous things. There's
no garbage collector cleaning up after you, no runtime checking your array accesses, no compiler
error when you read memory you shouldn't. In most modern languages, safety is the default and you
opt into danger. In C, it's the other way around - you are trusted with the sharp tools from line
one. That's not a design flaw, it's the whole point: C gives you direct, no-hand-waving control over memory
and hardware, and that control is exactly why an operating system can be written in it.

This guide takes you the whole way: from "I've never compiled a program" to actually understanding
what your code is doing to the computer's memory - not just enough syntax to make something run, but
the mental models that let you predict *why* it runs, or why it doesn't. We go mental-model-first the
whole way: before any command or keyword, you'll understand what the thing actually *is* and why C
works that way.

It's one zero-to-hero journey in two halves. **Phases 1-9 are the readable basics** - enough to
compile real programs, use pointers correctly, and structure a multi-file project. **Phases 10-14 are
the deep half** - dynamic memory, the stack vs the heap, pointer arithmetic and function pointers, the
standard library, and undefined behavior, the stuff that separates "writes C" from "understands C."
Phase 15 closes it out with where to go from here. Each phase carries a difficulty badge so you can
see the climb.

If you've never programmed at all, start with a gentler on-ramp first -
[Programming From Zero](/guides/programming-from-zero) - then come back here. C is unforgiving of
half-understood concepts, so it makes a rough *first* language. As a *second* language, once you
already know what a variable and a loop are, it's one of the most clarifying things you can learn -
it shows you what your other languages have been doing for you all along.

## How to read this

- **Brand new to C? Read 1-9 in order.** Each phase builds on the last. Phases 1-4 get you compiling
  and writing normal-looking programs. Phase 5 - pointers - is where C stops looking like "a language
  with weird syntax" and starts being C. Don't rush it; read it twice if you need to.
- **Already know another language?** Skim phases 1-4 to catch where C is *deliberately bare* (manual
  compilation, no built-in strings, no bounds checking), then **really slow down at phase 5.** Pointers
  are the idea everything after them depends on.
- **Past the basics already?** Jump to the deep half - [Phase 10: Dynamic Memory: malloc &
  free](10-dynamic-memory-malloc-and-free.md) onward is where pointers grow up into real memory
  management, and where you learn to see the footguns before they fire.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install, Compiling & Your First Program](01-install-compiling-and-your-first-program.md)** 🟢 - a compiler, `gcc`/`clang`, and what compiling actually does.
2. **[Syntax, Variables & Types](02-syntax-variables-and-types.md)** 🟢 - C's small, fixed set of types, and why they have exact sizes.
3. **[Control Flow](03-control-flow.md)** 🟢 - `if`, loops, `switch`, and how they compile to something close to the metal.
4. **[Functions & Program Structure](04-functions-and-program-structure.md)** 🟢 - declarations vs definitions, `main`, and multi-file programs.
5. **[Pointers I: The Mental Model](05-pointers-i-the-mental-model.md)** 🟡 - **the whole point of C:** what an address is, `*` and `&`, and why pointers aren't magic.
6. **[Arrays & Strings](06-arrays-and-strings.md)** 🟢 - arrays as contiguous memory, and C strings as "just bytes with a `\0` at the end."
7. **[Structs & Typedef](07-structs-and-typedef.md)** 🟢 - grouping data, `typedef`, and how structs actually sit in memory.
8. **[Header Files & the Preprocessor](08-header-files-and-the-preprocessor.md)** 🟢 - `#include`, `#define`, include guards, and what the preprocessor really does before compiling starts.
9. **[Build Tooling: Makefiles & Debugging](09-build-tooling-makefiles-and-debugging.md)** 🟡 - `make`, compiler flags, and finding bugs with `gdb` instead of guessing.

**Part 2 - Beyond the basics (🟡 Intermediate → 🔴 Advanced)**
10. **[Dynamic Memory: malloc & free](10-dynamic-memory-malloc-and-free.md)** 🔴 - asking for memory at runtime, and the discipline of giving it back.
11. **[The Stack vs the Heap](11-the-stack-vs-the-heap.md)** 🔴 - two totally different regions of memory, and why mixing them up crashes programs.
12. **[Pointers II: Arithmetic, Double & Function Pointers](12-pointers-ii-arithmetic-double-and-function-point.md)** 🔴 - pointer math, pointers to pointers, and pointers to code.
13. **[The Standard Library Essentials](13-the-standard-library-essentials.md)** 🟡 - `stdio.h`, `string.h`, `stdlib.h`, and the functions you'll reach for constantly.
14. **[Undefined Behavior & Common Footguns](14-undefined-behavior-and-common-footguns.md)** 🔴 - what "undefined" really means, and the mistakes that cause it.

**Finale**
15. **[Where to Go Next](15-where-to-go-next.md)** 🟢 - systems programming, embedded, contributing to C projects, and what to actually build.

> C's ecosystem (build systems beyond `make`, embedded toolchains, kernel development) is its own
> world - this guide makes the *language* make sense, top to bottom.

---

[Phase 1: Install, Compiling & Your First Program →](01-install-compiling-and-your-first-program.md)
