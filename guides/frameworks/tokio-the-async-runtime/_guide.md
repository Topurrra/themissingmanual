---
title: "Tokio: The Async Runtime"
guide: "tokio-the-async-runtime"
phase: 0
summary: "Learn the runtime every async Rust web framework sits on: why Rust async needs a runtime at all, futures and how await works, spawning tasks, the multi-threaded work-stealing scheduler and blocking, channels and synchronization, and select with timeouts. The engine under axum, actix, and Rocket — made visible."
tags: [tokio, rust, async, runtime, futures, concurrency, scheduler]
category: frameworks
order: 25
group: "Rust"
difficulty: intermediate
synonyms: ["learn tokio", "tokio tutorial", "rust async runtime", "rust futures await", "tokio spawn tasks", "tokio scheduler", "tokio channels mpsc", "tokio select timeout", "what runs async rust"]
updated: 2026-06-23
---

# Tokio: The Async Runtime

Here's something that surprises people coming to async Rust: the language gives you `async`/`await` and the
`Future` trait, but it does **not** ship anything to actually *run* those futures. A `Future` in Rust is
inert — it does nothing until something polls it to completion. That something is a **runtime**, and in
practice that runtime is **Tokio**. Every async web framework you'll meet — [axum](/guides/axum-from-zero),
[actix-web](/guides/actix-web-from-zero), [Rocket](/guides/rocket-from-zero) — runs on it. This is the
**roots** guide: learn Tokio and the `#[tokio::main]` at the top of every Rust server stops being a magic
incantation.

The mental model is a producer and an engine. Your `async fn`s produce **futures** — lazy descriptions of
work that yields at each `.await`. Tokio is the **engine** that drives them: it has a **scheduler** that
runs many futures concurrently across a small pool of OS threads, **spawns** independent work as tasks,
and wakes a future when the thing it was waiting on (a socket, a timer, a channel) is ready. Hold "futures
are inert plans; the runtime is what executes them," and async Rust clicks.

> 📝 This is a **roots** guide — it assumes you know **Rust**, including the basics of `async`/`await` and
> the `Future` trait ([Rust From Zero](/guides/rust-from-zero)). It pairs with
> [hyper & tower](/guides/hyper-and-tower) (the HTTP layer above Tokio) and underpins every Rust framework
> guide. Examples run as plain Rust programs (`cargo run`), shown with their output.

## How to read this

Short and foundational — read in order. It builds from "why a runtime exists" up to spawning, scheduling,
channels, and `select!`. Phases carry difficulty badges.

## The phases

1. **[What Tokio Is & Why Futures Need a Runtime](01-what-tokio-is.md)** 🟢 — inert futures, the runtime that drives them, and `#[tokio::main]`.
2. **[Async, Await & Futures](02-async-await-futures.md)** 🟡 — the `Future` trait, what `.await` does, and cooperative yielding.
3. **[Tasks & Spawning](03-tasks-and-spawning.md)** 🟡 — `tokio::spawn`, tasks vs threads, and `JoinHandle`.
4. **[The Runtime & Scheduler](04-runtime-and-scheduler.md)** 🔴 — the multi-threaded work-stealing scheduler, blocking the executor, and `spawn_blocking`.
5. **[Channels & Synchronization](05-channels-and-sync.md)** 🔴 — `mpsc`/`oneshot`/`broadcast`, and async-aware `Mutex` vs `std`.
6. **[select! & Timeouts](06-select-and-timeouts.md)** 🔴 — racing futures with `tokio::select!`, timeouts, and cancellation.
7. **[Where to Go Next](07-where-to-go-next.md)** 🟢 — how axum/actix use Tokio, and the async ecosystem.

> The throughline: **`async fn`s make inert futures; Tokio is the engine that polls, schedules, and wakes
> them.** Every Rust web server is a pile of futures running on this runtime.

---

[Phase 1: What Tokio Is & Why Futures Need a Runtime →](01-what-tokio-is.md)
