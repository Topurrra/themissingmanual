---
title: "Tasks & Spawning"
guide: "tokio-the-async-runtime"
phase: 3
summary: "Spawn independent work with tokio::spawn, await its JoinHandle, see why tasks are cheap green threads, learn the 'static/Send rules, and use join!/try_join! for concurrency without spawning."
tags: [tokio, rust, tasks, spawn, joinhandle, concurrency]
difficulty: intermediate
synonyms: ["tokio spawn", "tokio task", "tokio joinhandle", "rust async tasks vs threads", "tokio concurrency", "tokio join macro"]
updated: 2026-07-10
---

# Tasks & Spawning

**A task is a future that the runtime schedules independently.** In [the last phase](02-async-await-futures.md) you saw that a future is an inert plan - it does nothing until something polls it, and `.await` drives one future to completion *from where you are*. A task is the next step up. When you hand a future to `tokio::spawn`, you're telling the runtime: "take this, run it on your own, alongside everything else." You get back a handle, and the work starts running concurrently right away - you don't have to be sitting there awaiting it.

That distinction is the whole phase. A bare future is potential energy. A spawned task is potential energy that the runtime has already plugged in and switched on.

## `tokio::spawn` and the `JoinHandle`

`tokio::spawn(async { ... })` takes a future, registers it as a task with the runtime's scheduler, and immediately returns a **`JoinHandle<T>`**. The task is now alive and being driven concurrently with your current code. The handle is your receipt: hold onto it, and later you can `.await` it to collect whatever the task produced.

```rust
async fn expensive_io() -> u64 {
    // pretend this talks to a database or a network service
    42
}

#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        expensive_io().await
    });

    // ... do other work here while the task runs ...

    let result: u64 = handle.await.unwrap();
    println!("task produced: {result}");
}
```

*What just happened:* `tokio::spawn` kicked off the `async` block as its own task - `expensive_io()` started running without us awaiting it inline. `handle` is a `JoinHandle<u64>`. When we eventually `handle.await`, we block *this* code until the task finishes and we get its output.

One detail that trips people up: awaiting a `JoinHandle` gives you a **`Result<T, JoinError>`**, not a bare `T`. That's why we wrote `.unwrap()`.

```rust
let handle = tokio::spawn(async {
    expensive_io().await
});

let outcome: Result<u64, tokio::task::JoinError> = handle.await;
match outcome {
    Ok(value)  => println!("got {value}"),
    Err(join_err) => println!("the task failed: {join_err}"),
}
```

*What just happened:* the `Result` wrapper exists because a task can fail independently of its return value - most commonly, it **panicked**. A panic inside a spawned task doesn't unwind your `main`; the runtime catches it and surfaces it through the `JoinHandle` as a `JoinError`. So `.await` on a handle is asking two questions at once: "did the task finish?" and "did it finish *cleanly*?"

> 📝 The `T` in `JoinHandle<T>` is whatever the spawned future returns. If the future returns `()`, you get a `JoinHandle<()>` - useful when you only care that the work ran, not what it produced.

## Tasks vs OS threads: why you can have thousands

If you've used `std::thread::spawn`, this all looks familiar - spawn work, get a handle, join it. So why not just use threads?

Because tasks are **green threads**: lightweight, runtime-managed units of work that are *radically* cheaper than OS threads. An OS thread carries its own stack (often a megabyte or more) and is scheduled by the kernel; spawning tens of thousands of them will exhaust memory and bury the scheduler. A Tokio task is, roughly, a heap-allocated future plus a little bookkeeping - small enough that spawning *hundreds of thousands* is routine.

The trick is **M:N scheduling**: Tokio multiplexes many (M) tasks onto a few (N) OS worker threads - typically one worker per CPU core. When a task hits an `.await` that isn't ready, it yields its worker thread back to the runtime, which immediately picks up another ready task on that same thread. The threads never sit idle waiting; they hop between tasks. (Exactly *how* the scheduler does this - work-stealing across workers - is [the next phase](04-runtime-and-scheduler.md).)

> 💡 This is the entire reason async shines for servers. A web server spawns **one task per incoming connection**. Ten thousand connected clients means ten thousand tasks - but they ride on maybe 8 OS threads, because at any instant most of those connections are *waiting* (for the next request byte, for a database reply) and parked at an `.await`, costing nothing. Try that with one OS thread per connection and you fall over at a fraction of the load.

## ⚠️ The `'static` and `Send` rules

Here's where the borrow checker enters and surprises people. A spawned task may be picked up by any worker thread, and it may outlive the function that spawned it. The runtime can't make guarantees about either, so it imposes two requirements on the future you hand to `tokio::spawn`: it must be **`'static`** (it can't borrow anything with a shorter lifetime) and **`Send`** (it can be safely moved between threads).

In practice that means **you cannot borrow local stack data into a spawn.** This will not compile:

```rust
async fn broken() {
    let name = String::from("ada");

    // ❌ does not compile: the task might outlive `name`
    let handle = tokio::spawn(async {
        println!("hello, {name}");
    });

    handle.await.unwrap();
}
```

*What just happened:* the `async` block tries to *borrow* `name`, which lives on `broken`'s stack. The compiler refuses, because once spawned, the task is independent - it could run after `broken` returns and `name` is gone. The lifetime can't be proven `'static`, so it's rejected.

The fix is to give the task **ownership** of what it needs. `move` the data in:

```rust
async fn works() {
    let name = String::from("ada");

    let handle = tokio::spawn(async move {
        // the task now OWNS `name`
        println!("hello, {name}");
    });

    handle.await.unwrap();
}
```

*What just happened:* `async move` moves `name` into the task, so the task owns it outright - no borrow, no lifetime worry, `'static` satisfied. The task can now safely run whenever and wherever the scheduler likes.

When several tasks need to *share* the same data (and you can't hand each one its own copy), reach for an **`Arc`** - an atomically reference-counted pointer. Clone the `Arc` and `move` a clone into each task:

```rust
use std::sync::Arc;

async fn shared() {
    let config = Arc::new(String::from("shared config"));

    let mut handles = Vec::new();
    for i in 0..3 {
        let config = Arc::clone(&config); // cheap: bumps a refcount
        handles.push(tokio::spawn(async move {
            println!("task {i} sees: {config}");
        }));
    }

    for h in handles {
        h.await.unwrap();
    }
}
```

*What just happened:* each task got its own `Arc` clone (a cheap pointer + refcount bump, not a deep copy of the string) and `move`d it in. Every task owns a handle to the *same* underlying data, satisfying both `'static` and `Send`. The original `config` and all clones keep the data alive until the last one drops. (If tasks need to *mutate* shared state, you'll wrap it further - `Arc<Mutex<T>>` - which is the [channels & synchronization](05-channels-and-sync.md) phase.)

## Concurrency without spawning: `join!` and `try_join!`

Spawning is the right tool when you want **independent** tasks - fire-and-forget background work, one task per connection, things that should run on their own schedule. But sometimes you just want to run a handful of futures **together, right here**, and wait for all of them. For that, spawning is overkill. Reach for `tokio::join!`.

```rust
async fn fetch_user() -> String { String::from("ada") }
async fn fetch_orders() -> u32 { 7 }

async fn dashboard() {
    // both futures make progress concurrently, on THIS task
    let (user, orders) = tokio::join!(fetch_user(), fetch_orders());
    println!("{user} has {orders} orders");
}
```

*What just happened:* `join!` polls both futures concurrently on the *current* task and returns a tuple of their results once both finish. There's no `tokio::spawn`, no `JoinHandle`, no new task. While `fetch_user()` is parked at an `.await`, `fetch_orders()` gets a turn - they interleave on one thread. Because nothing crosses a thread boundary, the futures **don't need to be `Send` or `'static`** - you can freely borrow local data into them.

When the futures can fail and you want to bail out the moment any one of them does, use `tokio::try_join!`:

```rust
async fn load_a() -> Result<u32, String> { Ok(1) }
async fn load_b() -> Result<u32, String> { Err("boom".into()) }

async fn load_all() -> Result<(), String> {
    let (a, b) = tokio::try_join!(load_a(), load_b())?;
    println!("{a} {b}");
    Ok(())
}
```

*What just happened:* `try_join!` runs both concurrently but **short-circuits** on the first `Err` - as soon as `load_b()` fails, `try_join!` returns that error and we never reach the `println!`. It's `join!` with early exit baked in, perfect for "do these together, but if any fails the whole batch fails."

So the rule of thumb:

- **`tokio::spawn`** - for *independent* work that should run on its own, possibly on another thread, possibly outliving the current scope. Requires `Send + 'static`.
- **`join!` / `try_join!`** - for "do these few things together, here, and wait for them." No spawn, no `Send` requirement, can borrow locals.

## Recap

- A **task** is a future the runtime schedules **independently**; `tokio::spawn(future)` launches one and returns a **`JoinHandle<T>`**, with the work starting concurrently right away.
- `.await`-ing a `JoinHandle` yields a **`Result<T, JoinError>`** - the `Err` arm fires if the task panicked, since panics are caught and surfaced through the handle rather than crashing your code.
- Tasks are **green threads**: cheap enough to spawn by the thousands, multiplexed M:N onto a few OS worker threads - which is exactly how a server runs one task per connection on a small thread pool.
- Spawned futures must be **`'static` + `Send`**, so you can't borrow local stack data into them - `move` owned data in, or share it via an `Arc`.
- For running a few futures **together on the same task**, use `tokio::join!` (or `try_join!` to short-circuit on the first error) - no spawn and no `Send`/`'static` requirement.

## Quick check

```quiz
[
  {
    "q": "What does tokio::spawn return, and what happens to the future you pass it?",
    "choices": [
      "It returns the future's output directly after running it to completion",
      "It returns a JoinHandle<T>, and the task starts running concurrently right away",
      "It returns a JoinHandle<T>, but the task won't run until you .await the handle",
      "It returns nothing; the future is dropped unless you store it"
    ],
    "answer": 1,
    "explain": "tokio::spawn schedules the future as an independent task that begins running immediately, and hands you a JoinHandle<T> to collect its result later."
  },
  {
    "q": "Why won't this compile: a spawned async block that borrows a local String from the enclosing function?",
    "choices": [
      "Spawned futures must be 'static + Send, so they can't borrow shorter-lived local stack data",
      "tokio::spawn only accepts functions, not async blocks",
      "String isn't allowed inside async blocks",
      "You must always return a value from a spawned task"
    ],
    "answer": 0,
    "explain": "A task may move between threads and outlive the spawning function, so it must be 'static and Send. Borrowing a local fails that; move the data in (async move) or share it via Arc."
  },
  {
    "q": "You want to run two futures concurrently and wait for both, while borrowing local data - no separate task needed. What fits best?",
    "choices": [
      "Two separate tokio::spawn calls, then await both handles",
      "tokio::join!(a, b)",
      "Wrap both in Arc and spawn them",
      "Call .await on each one in sequence"
    ],
    "answer": 1,
    "explain": "tokio::join! drives both futures concurrently on the current task - no spawn, no JoinHandle, and because nothing crosses a thread boundary, no Send/'static requirement, so borrowing locals is fine."
  }
]
```

---

[← Phase 2: Async, Await & Futures](02-async-await-futures.md) · [Guide overview](_guide.md) · [Phase 4: The Runtime & Scheduler →](04-runtime-and-scheduler.md)