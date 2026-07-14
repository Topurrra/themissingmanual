---
title: "Go From Zero"
guide: "go-from-zero"
phase: 0
summary: "Learn Go from nothing to genuinely advanced: install it and the basics, then the deep half - interfaces, generics, real concurrency patterns, error handling, the runtime scheduler and GC, testing and profiling, the standard library, and performance - all mental-model-first, with clear explanations."
tags: [go, golang, beginner, advanced, getting-started, concurrency, interfaces, generics, runtime, profiling, performance]
category: programming-languages
order: 4
difficulty: beginner
synonyms: ["learn go", "golang for beginners", "go from beginner to advanced", "advanced go", "how to start with go", "go programming tutorial", "go language from scratch", "is go hard to learn", "go interfaces generics", "go concurrency patterns", "go runtime scheduler gc", "go profiling pprof"]
updated: 2026-06-22
---

# Go From Zero

You keep hearing that Go is the language behind Docker, Kubernetes, and half the cloud - that it's fast,
simple, and great at doing a thousand things at once. Then you open a Go file and it looks oddly bare:
no classes, no exceptions, a loop that doesn't say `while`, and a compiler that flat-out *refuses* to
build your program over an unused variable. That bareness isn't an accident, and it isn't something to
fight. Go was deliberately kept small so that a whole team can read each other's code without surprises.

This guide takes you the whole way: from "I've never written a line of Go" to understanding what the
language and its runtime are *actually doing* underneath your code. We'll go mental-model-first the whole
way: before any command, you'll understand what the thing actually *is* and why Go made the choice it did.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** - enough to read real Go,
structure a project, and use the concurrency it's famous for. **Phases 10–17 are the deep half** -
interfaces, generics, real concurrency patterns, the runtime scheduler and garbage collector, testing
and profiling, the standard library, and performance, the stuff that separates "writes Go" from
"understands Go." Each phase carries a difficulty badge so you can see the climb.

If you've never programmed at all, you'll want a gentler on-ramp first - start with
[Programming From Zero](/guides/programming-from-zero), then come back here.

## How to read this

- **Brand new to Go? Read 1–9 in order.** Each phase builds on the last. Phases 1–5 give you the language
  and how to organize it; phase 6 is the payoff (concurrency); 7–9 round you out into someone who can
  ship. Come back for 10+ when the basics feel comfortable.
- **Already know another language?** Skim phases 1–5 to catch where Go is *deliberately different* (one
  loop, multiple returns, exported = capitalized, no exceptions), then **slow down at phase 6** -
  goroutines and channels are where Go stops looking familiar and starts being Go.
- **Past the basics already?** Jump to the deep half - [Phase 10: Interfaces in Depth](10-interfaces-in-depth.md)
  onward is where Go stops being "a small, readable language" and starts being one you can reason about
  down to the scheduler.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - the Go toolchain, `hello.go`, and the refusal to compile unused code.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 - `var` vs `:=`, static typing, the basic types, and zero values.
3. **[Collections](03-collections.md)** 🟢 - arrays vs slices, `append`, maps, and looping with `range`.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** 🟢 - the single `for`, `if`, `switch`, and multiple return values.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** 🟢 - `go mod init`, packages, exported = capitalized, a sane layout.
6. **[Goroutines & Channels](06-goroutines-and-channels.md)** 🟡 - the reason Go exists: many things at once, safely, with `go` and channels.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 - "errors are values" (no exceptions), and reading/writing files and streams.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** 🟡 - `go test`, `go fmt`, `go vet`, modules, the batteries-included toolchain.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 - how Go programmers actually write Go, and the traps that bite everyone once.

**Part 2 - Beyond the basics (🔴 Advanced)**
10. **[Interfaces in Depth](10-interfaces-in-depth.md)** 🔴 - interface values as (type, value) pairs, type assertions and switches, the nil-interface trap.
11. **[Generics & Advanced Types](11-generics-and-advanced-types.md)** 🔴 - type parameters, constraints, method sets, and when generics beat interfaces.
12. **[Concurrency Patterns](12-concurrency-patterns.md)** 🔴 - `select`, `context`, worker pools, fan-in/out, the `sync` toolbox, the race detector.
13. **[Error Handling, Deep](13-error-handling-deep.md)** 🟡 - wrapping with `%w`, `errors.Is`/`As`, sentinel and custom errors, `panic`/`recover`.
14. **[The Runtime: Scheduler, Memory & GC](14-runtime-scheduler-and-memory.md)** 🔴 - the GMP scheduler, stack vs heap, escape analysis, the garbage collector.
15. **[Testing, Benchmarks & Profiling](15-testing-benchmarks-profiling.md)** 🟡 - table-driven tests, benchmarks, `pprof`, coverage, fuzzing.
16. **[The Standard Library as Design](16-standard-library.md)** 🟡 - `io.Reader`/`Writer`, `context`, `encoding/json`, `net/http` as a masterclass.
17. **[Performance & Optimization](17-performance-and-optimization.md)** 🔴 - cutting allocations, `sync.Pool`, and profile-driven optimization.

**Finale**
18. **[Where to Go Next](18-where-to-go-next.md)** 🟢 - web, CLIs, cloud & infra, and what to actually build.

> Frameworks and big projects (gRPC, Kubernetes internals, cgo) are their own world - this guide makes
> the *language and its runtime* make sense, top to bottom.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
