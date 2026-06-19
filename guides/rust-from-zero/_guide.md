---
title: "Rust From Zero"
guide: "rust-from-zero"
phase: 0
summary: "Learn Rust from nothing: install it, write your first program, understand its types and collections, master match and functions, organize a project — and then meet ownership, the one idea that makes Rust safe and fast at the same time."
tags: [rust, beginner, getting-started, ownership, cargo]
category: programming-languages
order: 4
difficulty: beginner
synonyms: ["learn rust", "rust for beginners", "how to start with rust", "rust programming tutorial", "rust from scratch", "is rust hard to learn", "rust ownership explained"]
updated: 2026-06-19
---

# Rust From Zero

Rust has a reputation that sounds like a contradiction: it's as fast as C, but it won't let you corrupt
memory or crash on a stray pointer — and it proves that *at compile time*, before your program ever runs.
For years languages made you pick: fast and dangerous, or safe and slow. Rust's whole reason for existing
is to refuse that trade.

There's a second part to Rust's reputation, and it's also true: the learning curve is steep. The compiler
will reject programs that *look* perfectly fine, with errors about "borrows" and "moves" and "lifetimes"
that mean nothing to you yet. That's not you being bad at this. It's a genuinely new idea — **ownership** —
that no mainstream language before Rust made you think about directly. Everyone hits this wall. The good
news: it's one idea, it's learnable, and once it clicks, the compiler stops feeling like an enemy and
starts feeling like a coworker who catches your bugs before they ship.

This guide takes you from "I've never written a line of Rust" to "I can read real Rust, structure a
project, and reason about ownership instead of guessing." We go mental-model-first the whole way: before
any command, you'll understand what the thing actually *is* and why Rust made the choice it did.

If you've never programmed at all, start with a gentler on-ramp first —
[Programming From Zero](/guides/programming-from-zero) — then come back here. Rust is a hard *first*
language; it's a great *second* one.

## How to read this

- **Brand new to Rust? Read in order.** Each phase builds on the last. Phases 1–5 give you the language
  and how to organize it. Then phase 6 — ownership — is the whole game, and everything before it exists
  to get you ready for it.
- **Already know another language?** Skim phases 1–5 to catch where Rust is *deliberately different*
  (immutable by default, no `null`, exhaustive `match`, expressions everywhere), then **really slow down
  at phase 6.** Ownership is where Rust stops looking like a normal language and starts being Rust. Don't
  skip it because it looks like more of the same — it isn't.

## The phases

1. **[Install & Your First Program](01-install-and-first-program.md)** — get the Rust toolchain with
   `rustup`, and run your first program with `cargo run` (not raw `rustc`).
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** — `let` is immutable by default, static
   types with inference, the basic types, and shadowing.
3. **[Collections](03-collections.md)** — `Vec<T>`, arrays, the classic `String` vs `&str` confusion, and
   `HashMap`.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** — `if` and `match` as *expressions*,
   the loops, exhaustive matching (the star of the show), and how functions return without `return`.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** — what `Cargo.toml`, `main.rs`, and
   `lib.rs` are for, plus `mod`, `pub`, `use`, and crates.
6. **[Ownership & Borrowing](06-ownership-and-borrowing.md)** — **the whole point of Rust.** Who owns a
   value, what moving and borrowing mean, and why the compiler's "borrow checker" rejects code others let
   you crash on.
7. **[Errors & I/O](07-errors-and-io.md)** — `Result` and `Option` instead of exceptions and `null`, the
   `?` operator, and reading and writing files.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** — `cargo test`, `cargo fmt`, `clippy`, crates,
   and the batteries-included toolchain you get for free.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** — how Rust programmers actually write Rust, and the
   traps that bite everyone once.
10. **[Where to Go Next](10-where-to-go-next.md)** — the standard library, real projects, and the
    resources worth your time.

> This guide gets you comfortable with everyday Rust. Deeper topics — lifetimes in anger, traits and
> generics in depth, `async`, and unsafe Rust — are deliberately left for follow-up reading so this stays
> a guide you can finish, not a reference you bounce off.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
