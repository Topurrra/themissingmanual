---
title: "Rust From Zero"
guide: "rust-from-zero"
phase: 0
summary: "Learn Rust from nothing to genuinely advanced: install it and the basics, then ownership - and then the deep half: lifetimes, traits and generics, smart pointers, error handling, fearless concurrency, iterators, macros, and performance and unsafe. Mental-model-first, with clear explanations."
tags: [rust, beginner, advanced, getting-started, ownership, cargo, lifetimes, traits, generics, concurrency, macros, unsafe]
category: programming-languages
order: 5
difficulty: beginner
synonyms: ["learn rust", "rust for beginners", "rust from beginner to advanced", "advanced rust", "how to start with rust", "rust programming tutorial", "rust from scratch", "is rust hard to learn", "rust ownership explained", "rust lifetimes traits generics", "rust smart pointers", "rust fearless concurrency", "rust macros unsafe"]
updated: 2026-06-22
---

# Rust From Zero

Rust has a reputation that sounds like a contradiction: it's as fast as C, but it won't let you corrupt
memory or crash on a stray pointer - and it proves that *at compile time*, before your program ever runs.
For years languages made you pick: fast and dangerous, or safe and slow. Rust's whole reason for existing
is to refuse that trade.

There's a second part to Rust's reputation, and it's also true: the learning curve is steep. The compiler
will reject programs that *look* perfectly fine, with errors about "borrows" and "moves" and "lifetimes"
that mean nothing to you yet. That's not you being bad at this. It's a genuinely new idea - **ownership** -
that no mainstream language before Rust made you think about directly. Everyone hits this wall. The good
news: it's one idea, it's learnable, and once it clicks, the compiler stops feeling like an enemy and
starts feeling like a coworker who catches your bugs before they ship.

This guide takes you the whole way: from "I've never written a line of Rust" to understanding what the
language is *actually doing* - ownership, yes, but also lifetimes, traits, smart pointers, concurrency,
and the parts of Rust that make it fast. We go mental-model-first the whole way: before any command,
you'll understand what the thing actually *is* and why Rust made the choice it did.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** - enough to read real Rust,
structure a project, and reason about ownership instead of guessing. **Phases 10–17 are the deep half** -
lifetimes, traits and generics, smart pointers, error handling, fearless concurrency, iterators, macros,
and performance and unsafe, the stuff that separates "writes Rust" from "understands Rust." Each phase
carries a difficulty badge so you can see the climb.

If you've never programmed at all, start with a gentler on-ramp first -
[Programming From Zero](/guides/programming-from-zero) - then come back here. Rust is a hard *first*
language; it's a great *second* one.

## How to read this

- **Brand new to Rust? Read 1–9 in order.** Each phase builds on the last. Phases 1–5 give you the
  language and how to organize it. Then phase 6 - ownership - is the whole game. Come back for 10+ when
  the basics feel comfortable.
- **Already know another language?** Skim phases 1–5 to catch where Rust is *deliberately different*
  (immutable by default, no `null`, exhaustive `match`, expressions everywhere), then **really slow down
  at phase 6.** Ownership is where Rust stops looking like a normal language and starts being Rust.
- **Past the basics already?** Jump to the deep half - [Phase 10: Lifetimes & the Borrow
  Checker](10-lifetimes-and-borrowing.md) onward is where ownership grows up into lifetimes, traits, and
  the zero-cost abstractions that make Rust fast.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - `rustup`, and `cargo run` (not raw `rustc`).
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 - immutable by default, static types with inference, shadowing.
3. **[Collections](03-collections.md)** 🟢 - `Vec<T>`, arrays, the `String` vs `&str` confusion, `HashMap`.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** 🟢 - `if`/`match` as expressions, the loops, exhaustive matching.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** 🟢 - `Cargo.toml`, `main.rs`/`lib.rs`, `mod`/`pub`/`use`, crates.
6. **[Ownership & Borrowing](06-ownership-and-borrowing.md)** 🟡 - **the whole point of Rust:** owning, moving, borrowing, and the borrow checker.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 - `Result`/`Option` instead of exceptions and `null`, the `?` operator, files.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** 🟡 - `cargo test`, `cargo fmt`, `clippy`, crates, the toolchain you get free.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 - how Rust programmers actually write Rust, and the traps that bite everyone once.

**Part 2 - Beyond the basics (🔴 Advanced)**
10. **[Lifetimes & the Borrow Checker, Deep](10-lifetimes-and-borrowing.md)** 🔴 - what lifetime annotations mean, elision, and references in structs.
11. **[Traits & Generics, Deep](11-traits-and-generics.md)** 🔴 - trait bounds, associated types, `impl` vs `dyn`, static vs dynamic dispatch.
12. **[Smart Pointers & Interior Mutability](12-smart-pointers.md)** 🔴 - `Box`, `Rc`/`Arc`, `RefCell`/`Cell`, `Deref` and `Drop`.
13. **[Error Handling, Deep](13-error-handling-deep.md)** 🟡 - `?` in depth, custom error types, `thiserror`/`anyhow`, `Option` combinators.
14. **[Fearless Concurrency](14-fearless-concurrency.md)** 🔴 - threads, `Send`/`Sync`, `Arc<Mutex<T>>`, channels, and a taste of `async`.
15. **[Closures, Iterators & Zero-Cost Abstractions](15-closures-and-iterators.md)** 🟡 - `Fn`/`FnMut`/`FnOnce`, iterator adapters, free speed.
16. **[Macros & Metaprogramming](16-macros.md)** 🟡 - `macro_rules!`, `derive`, and what procedural macros are for.
17. **[Performance, Unsafe & the Ecosystem](17-performance-and-unsafe.md)** 🔴 - zero-cost abstractions, when `unsafe` is justified, profiling, key crates.

**Finale**
18. **[Where to Go Next](18-where-to-go-next.md)** 🟢 - CLIs, web, systems, WebAssembly, and what to actually build.

> Frameworks and big domains (`async` runtimes, embedded, WebAssembly toolchains) are their own world -
> this guide makes the *language* make sense, top to bottom.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
