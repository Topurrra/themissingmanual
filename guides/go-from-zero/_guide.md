---
title: "Go From Zero"
guide: "go-from-zero"
phase: 0
summary: "Learn Go from nothing: install it, write your first program, understand its types and collections, master its one loop and multiple-return functions, organize code into modules, and meet goroutines — the reason Go exists."
tags: [go, golang, beginner, getting-started, concurrency]
category: programming-languages
order: 11
difficulty: beginner
synonyms: ["learn go", "golang for beginners", "how to start with go", "go programming tutorial", "go language from scratch", "is go hard to learn"]
updated: 2026-06-19
---

# Go From Zero

You keep hearing that Go is the language behind Docker, Kubernetes, and half the cloud — that it's fast,
simple, and great at doing a thousand things at once. Then you open a Go file and it looks oddly bare:
no classes, no exceptions, a loop that doesn't say `while`, and a compiler that flat-out *refuses* to
build your program over an unused variable. That bareness isn't an accident, and it isn't something to
fight. Go was deliberately kept small so that a whole team can read each other's code without surprises.

This guide takes you from "I've never written a line of Go" to "I can read real Go code, structure a
project, and use the concurrency it's famous for." We'll go mental-model-first the whole way: before any
command, you'll understand what the thing actually *is* and why Go made the choice it did.

If you've never programmed at all, you'll want a gentler on-ramp first — start with
[Programming From Zero](/guides/programming-from-zero), then come back here.

## How to read this

- **Brand new to Go? Read in order.** Each phase builds on the last. Phases 1–5 give you the language and
  how to organize it; phase 6 is the payoff (concurrency); 7–10 round you out into someone who can ship.
- **Already know another language?** Skim phases 1–5 to catch where Go is *deliberately different* (one
  loop, multiple returns, exported = capitalized, no exceptions), then **slow down at phase 6** —
  goroutines and channels are where Go stops looking familiar and starts being Go.

## The phases

1. **[Install & Your First Program](01-install-and-first-program.md)** — get the Go toolchain, run
   `hello.go`, and meet Go's famous refusal to compile unused code.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** — `var` vs `:=`, static typing, the basic
   types, and zero values (so you never get a surprise `nil`).
3. **[Collections](03-collections.md)** — arrays vs slices (the one you'll actually use), `append`, maps,
   and looping with `range`.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** — Go's single `for` loop, `if`,
   `switch`, and the multiple-return-value signature that defines how Go code reads.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** — `go mod init`, packages, why a
   capital letter makes something public, and a sane layout for a real project.
6. **[Goroutines & Channels](06-goroutines-and-channels.md)** — the reason Go exists: doing many things
   at once, safely, with `go` and channels.
7. **[Errors & I/O](07-errors-and-io.md)** — Go's "errors are values" approach (no exceptions), and
   reading and writing files and streams.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** — `go test`, `go fmt`, `go vet`, modules, and
   the batteries-included toolchain you get for free.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** — how Go programmers actually write Go, and the
   traps that bite everyone once.
10. **[Where to Go Next](10-where-to-go-next.md)** — the standard library, real projects, and the
    resources worth your time.

> This guide gets you fluent in everyday Go. Deeper topics — generics in anger, the runtime scheduler's
> internals, reflection, cgo — are deliberately left for follow-up reading so this stays a guide you can
> finish, not a reference you bounce off.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
