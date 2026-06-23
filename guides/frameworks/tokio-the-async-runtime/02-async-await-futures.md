---
title: "Async, Await & Futures"
guide: "tokio-the-async-runtime"
phase: 2
summary: "How an async fn becomes a state machine implementing Future, what .await actually does at runtime, and why cooperative yielding means CPU-bound code starves Tokio."
tags: [tokio, rust, async, await, futures, poll]
difficulty: intermediate
synonyms: ["rust future trait", "rust poll", "what does await do", "rust async fn", "cooperative scheduling rust", "rust futures state machine"]
updated: 2026-06-23
---

# Async, Await & Futures

Here's the one sentence to carry through this whole phase: **an `async fn` is a state machine that implements the `Future` trait, and `.await` is the spot where that machine is allowed to pause and hand control back to the runtime.** Phase 1 told you futures are inert plans and Tokio is the engine. Now we open the plan up and look at how it's built — because once you see the state machine, `.await` stops being magic and starts being a place where your function can fall asleep and get woken up later.

You'll rarely touch the machinery directly. The compiler writes it for you. But knowing it's there is the difference between "my async code mysteriously froze the whole server" and "ah, I blocked at a point that has no `.await`, so nothing else could run." That second person is the one you want to be.

## The `Future` trait, briefly

Every async value in Rust is a `Future`. The trait is small:

```rust
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context) -> Poll<Self::Output>;
}
```

The runtime drives a future by calling `poll`. That call returns one of two things:

- `Poll::Pending` — "not done yet, don't bother me until I tell you I'm ready."
- `Poll::Ready(value)` — "finished, here's the `Output`."

*What just happened:* A future isn't a thread you start and forget. It's a thing the runtime **pokes** by calling `poll`. Each poke either makes progress and finishes (`Ready`) or stalls and says "later" (`Pending`). The runtime's whole job is deciding which future to poke next.

You almost never write `poll` by hand. The `async`/`await` syntax generates the entire `poll` implementation for you — the `Pin`, the `Context`, the state tracking, all of it. Seeing the trait once is enough; you can forget the signature and remember the two outcomes.

## What `.await` actually does

When you write `something.await`, the compiler turns it into roughly this loop, baked into the generated state machine: poll the inner future; if it's `Ready`, take the value and keep going; if it's `Pending`, **return `Pending` from the whole task** so the runtime can go run something else. Later, when the inner thing is ready, the runtime polls your task again, and execution resumes right after the `.await`.

That resume-where-you-left-off is exactly what a state machine gives you. Each `.await` is a numbered state. When the function pauses, the runtime remembers which state it's in and what local variables are still live, so it can pick up later without redoing earlier work.

```rust
async fn fetch_user(id: u64) -> String {
    format!("user-{id}")
}

async fn fetch_orders(user: &str) -> Vec<String> {
    vec![format!("{user}-order-1"), format!("{user}-order-2")]
}

async fn report(id: u64) -> usize {
    let user = fetch_user(id).await;     // state 0: pause here if not ready
    let orders = fetch_orders(&user).await; // state 1: pause here if not ready
    orders.len()
}
```

*What just happened:* `report` is one future, built by composing two smaller ones. At each `.await` it can yield: if `fetch_user` returns `Pending`, the whole `report` task yields and Tokio runs other tasks; when `fetch_user` is ready, `report` resumes and moves to the next `.await`. These two run **in sequence** — `fetch_orders` only starts after `fetch_user` finishes, because the second line needs `user`.

Notice that calling `fetch_user(id)` does **nothing** on its own — it just builds a future. The work happens at `.await`. This is the inertness from Phase 1, up close.

> 💡 Sequential awaits are not concurrency. The example above waits for one thing, then the next. If you wanted both to make progress at the same time, you'd combine them — with something like `tokio::join!` (run several futures concurrently in one task) or `tokio::spawn` (give each its own task). Those are [Phase 3: Tasks & Spawning](03-tasks-and-spawning.md). For now, hold the distinction: `.await` in a straight line is *waiting*, not *parallelism*.

## Composing futures

Because an `async fn` is just a future, futures nest naturally. `report` above is a single future assembled from `fetch_user` and `fetch_orders`. You can also build an anonymous future inline with an `async` block:

```rust
async fn greet(name: String) -> String {
    let fut = async move {
        let upper = name.to_uppercase();
        format!("HELLO, {upper}")
    };
    fut.await
}
```

*What just happened:* `async move { ... }` creates an unnamed future that captures `name` by value (`move`), the same way a closure does. It doesn't run when constructed — only when `.await`ed. This is the building block Tokio's `spawn` and `select!` lean on: chunks of async work you hand to the runtime as values.

## ⚠️ Cooperative scheduling: yield, or starve everyone

This is the part that bites people, so read it twice. Tokio's scheduling is **cooperative**: a task only ever yields control **at an `.await`**. There is no preemption, no timer that interrupts a task mid-computation. Between two `.await` points, your code runs straight through and nothing else on that thread gets a turn.

That's fine for I/O-bound work, where you're constantly awaiting sockets, timers, and channels. But it has a sharp edge:

```rust
async fn handler() {
    // ⚠️ No .await anywhere in this loop.
    let mut total: u64 = 0;
    for i in 0..5_000_000_000u64 {
        total = total.wrapping_add(i);
    }
    println!("{total}");
}
```

*What just happened:* This is a CPU-bound loop with zero `.await` points. Once a worker thread starts running it, that thread is **pinned** until the loop finishes — it never reaches a yield point, so it can't go run other tasks. Every other task waiting on that thread is frozen. You've starved the runtime. The same thing happens if you call a **blocking** API (a synchronous file read, `std::thread::sleep`, a blocking DB driver) inside an async fn: it parks the thread with no way to yield.

The fix is to keep heavy or blocking work off the async worker threads — Tokio gives you `spawn_blocking` for exactly this, which we cover in [Phase 4: The Runtime & Scheduler](04-runtime-and-scheduler.md). The mental model to lock in now: **async Rust is for I/O concurrency — overlapping lots of waiting — not for CPU parallelism.** If a task computes hard without awaiting, it's the wrong tool, and it'll take the whole runtime down with it.

> ⚠️ "It compiled and ran fine in a tiny example" is a trap here. A blocking call only reveals itself under load, when many tasks are competing for the same handful of worker threads and one of them refuses to yield.

## 📝 The Waker: how a future gets polled again

One loose end. When a future returns `Pending`, how does the runtime know *when* to poll it again? It doesn't poll in a busy loop — that would burn a CPU for nothing.

> 📝 Remember the `cx: &mut Context` argument on `poll`? It carries a **Waker**. Before a future returns `Pending`, it stashes that waker with whatever it's waiting on — a socket registered with the OS, a timer, a channel. When that thing becomes ready (the socket has data, the timer fires), it calls `.wake()`, which tells the runtime "this task is worth polling now." The runtime reschedules it, and `poll` runs again, this time likely returning `Ready`.

You don't write waker code when you use `async`/`await` — the leaf futures in Tokio (its socket types, timers, channels) handle registration for you. The intuition is all you need: **`Pending` isn't "try again immediately"; it's "park me, and I'll be woken when there's a reason to look again."** That's what makes a runtime able to juggle thousands of idle connections on a few threads without spinning.

## Recap

- An `async fn` compiles to a **state machine implementing `Future`**; you write `async`/`await`, the compiler writes the `poll`.
- `poll` returns `Poll::Pending` (not ready, wake me later) or `Poll::Ready(value)` (done). The runtime drives futures by polling them.
- `.await` is a **yield point**: on `Pending` the whole task hands control back to the runtime; on `Ready` it resumes right after the `.await`. Sequential awaits are waiting, not concurrency.
- Scheduling is **cooperative** — tasks only yield at `.await`. CPU-bound loops or blocking calls with no `.await` **starve the runtime** (use `spawn_blocking`, Phase 4). Async is for I/O concurrency, not CPU parallelism.
- A **Waker** (carried in `poll`'s `Context`) lets a parked future get rescheduled exactly when the thing it waited on becomes ready — no busy-polling.

## Quick check

```quiz
[
  {
    "q": "What does an async fn compile down to in Rust?",
    "choices": ["A new OS thread", "A state machine that implements the Future trait", "A closure that runs immediately", "A blocking function call"],
    "answer": 1,
    "explain": "The compiler turns an async fn into a state machine implementing Future — it generates the poll method, with each .await as a state where execution can pause and resume."
  },
  {
    "q": "When a future being .awaited returns Poll::Pending, what happens?",
    "choices": ["The thread sleeps for a fixed interval then retries", "The task yields control back to the runtime so other tasks can run", "The program panics", "The runtime polls it again in a tight busy loop"],
    "answer": 1,
    "explain": "Pending means the task yields to the runtime. It registers a Waker so it can be re-polled later when its dependency is ready — not busy-polled and not on a fixed timer."
  },
  {
    "q": "Why can a long CPU-bound loop with no .await inside an async fn break a Tokio app?",
    "choices": ["Tokio preempts it after a timeout, corrupting state", "Scheduling is cooperative, so with no .await the task never yields and starves other tasks on that thread", "async fns can't contain loops", "It uses too much memory for the state machine"],
    "answer": 1,
    "explain": "Tokio scheduling is cooperative: tasks only yield at .await points. A loop with no .await pins its worker thread and starves every other task on it. Offload such work with spawn_blocking (Phase 4)."
  }
]
```

[← Phase 1: What Tokio Is & Why Futures Need a Runtime](01-what-tokio-is.md) · [Guide overview](_guide.md) · [Phase 3: Tasks & Spawning →](03-tasks-and-spawning.md)
