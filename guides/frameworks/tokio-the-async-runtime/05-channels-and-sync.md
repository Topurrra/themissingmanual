---
title: "Channels & Synchronization"
guide: "tokio-the-async-runtime"
phase: 5
summary: "How Tokio tasks coordinate: message passing with mpsc, oneshot, broadcast, and watch channels, plus async-aware Mutex versus std Mutex and the don't-hold-a-guard-across-await rule."
tags: [tokio, rust, channels, mpsc, oneshot, mutex]
difficulty: advanced
synonyms: ["tokio mpsc", "tokio oneshot", "tokio broadcast watch", "tokio async mutex vs std mutex", "tokio sync primitives", "rust share state by communicating"]
updated: 2026-06-23
---

# Channels & Synchronization

You've got tasks now - independent units of work the scheduler runs concurrently ([Tasks & Spawning](03-tasks-and-spawning.md)). But a pile of isolated tasks isn't a program. The moment two tasks need to agree on something - "here's the next job," "I'm done, here's the result," "the config just changed" - they have to **coordinate**. This phase is about how.

Here's the mental model worth carrying through everything below. There are exactly **two ways** for tasks to coordinate:

- **Pass messages** - one task hands data to another through a **channel**. The data *moves*; only one task owns it at a time.
- **Share state** - multiple tasks touch the same value behind a **lock** (a `Mutex`, `RwLock`, etc.). The data *stays put*; tasks take turns reaching in.

📝 Both are legitimate, but they pull in different directions. Channels keep ownership clean - at any instant exactly one task holds the data, so whole classes of "two tasks stomped on each other" bugs cannot happen. Locks are sometimes the natural fit (a shared counter, a cache), but they invite contention and deadlocks if you're careless. The Rust community's rule of thumb, borrowed from Go: **"share state by communicating, rather than communicate by sharing state."** When in doubt, reach for a channel first.

Let's build up the toolbox.

## mpsc: many senders, one receiver

`mpsc` stands for **multi-producer, single-consumer**. Many tasks can send into it; exactly one task pulls values out. This is the workhorse - a job queue, a request funnel, an event pipeline. It's the channel you'll reach for most.

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<i32>(32);

    tokio::spawn(async move {
        for i in 0..5 {
            tx.send(i).await.unwrap();
        }
        // tx is dropped here when the task ends
    });

    while let Some(n) = rx.recv().await {
        println!("got {n}");
    }
    println!("channel closed");
}
```

*What just happened:* `mpsc::channel::<i32>(32)` created a **bounded** channel that holds up to 32 queued values, and handed back a sender `tx` and a receiver `rx` (note `mut rx` - receiving mutates it). We `move`d `tx` into a spawned task that sends `0..5`, each `send(i).await` parking briefly if the buffer were full. The main task loops with `while let Some(n) = rx.recv().await`, printing each value. When the spawned task ends, `tx` drops; with no senders left, `recv()` returns `None`, the loop ends, and we print "channel closed". Output: `got 0` through `got 4`, then `channel closed`.

Two details that trip people up:

**Bounded vs unbounded.** `channel(32)` is bounded - and that bound is a feature. When the buffer fills, `send().await` *suspends the sender* until the consumer drains some. That's **backpressure**: a slow consumer naturally slows fast producers instead of letting an unbounded queue eat all your memory. There's also `mpsc::unbounded_channel()`, whose `send()` never waits and returns immediately - convenient, but it gives you no backpressure, so a producer outrunning a consumer grows the queue without limit. ⚠️ Prefer bounded channels unless you have a specific reason not to; an unbounded channel is an out-of-memory crash waiting for a bad day.

**Multiple producers.** To get the "multi" in multi-producer, **clone the sender**. Each clone feeds the same receiver:

```rust
let (tx, mut rx) = mpsc::channel::<String>(16);

for id in 0..3 {
    let tx = tx.clone();
    tokio::spawn(async move {
        tx.send(format!("hello from worker {id}")).await.unwrap();
    });
}
drop(tx); // drop the original so recv() can eventually see None

while let Some(msg) = rx.recv().await {
    println!("{msg}");
}
```

*What just happened:* We cloned `tx` once per worker task; all three clones point at the same single receiver. Each worker sends one message. The crucial line is `drop(tx)` - `recv()` only returns `None` when **every** sender is gone, so if we kept the original `tx` alive in `main`, the loop would hang forever waiting for a message that never comes. Dropping it explicitly lets the loop end once all workers finish. The three messages print in whatever order the scheduler runs the workers.

💡 That "the loop hangs because a sender is still alive" gotcha is the single most common mpsc mistake. If your `recv()` loop never exits, count your senders.

## oneshot: a single value, once

Sometimes a task doesn't need a stream - it needs to hand back **one** result. "Go do this work and tell me the answer." That's `oneshot`: a channel that carries exactly one value, then closes.

```rust
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel::<u64>();

    tokio::spawn(async move {
        let answer = expensive_computation().await;
        let _ = tx.send(answer); // send takes self - usable once
    });

    match rx.await {
        Ok(value) => println!("the answer is {value}"),
        Err(_) => println!("the worker dropped the sender without sending"),
    }
}

async fn expensive_computation() -> u64 { 42 }
```

*What just happened:* `oneshot::channel()` gave us a sender and receiver for a single `u64`. The spawned task computes a result and calls `tx.send(answer)` - note `oneshot`'s `send` takes `self` and isn't `async`, because it can only ever fire once. The main task does `rx.await` (the receiver itself is a future) and gets `Ok(value)` with the result, or `Err` if the sender was dropped before sending. This is the canonical "task returns a value to its caller" pattern, and it's what request/response plumbing inside servers is built on: send a request *plus a oneshot sender* down an mpsc, and the handler replies on the oneshot.

Two more channel shapes round out the set, each for a different fan-out shape:

- **`broadcast`** - multi-producer, **multi-consumer**, where *every* receiver gets *every* message. Think a chat room fanning one message out to all connected clients, or a shutdown signal every task needs to hear. (Slow receivers can lag and miss messages - `recv()` tells you when that happens.)
- **`watch`** - receivers only care about the **latest** value, not the history. Perfect for config reloads or a shared status: a writer updates the value, and each reader sees the current one whenever it checks. Old values are overwritten.

## Locks: when you do share state

Channels cover most coordination, but sometimes shared mutable state is genuinely the cleaner model - a request counter, an in-memory cache, a connection pool. For that you reach for a lock. And here Tokio gives you a choice that confuses nearly everyone the first time: there are **two** `Mutex` types, and picking the wrong one either won't compile or quietly invites a deadlock.

⚠️ **The rule:** never hold a `std::sync::Mutex` guard across an `.await`.

Here's why. `std::sync::Mutex` is a normal, blocking mutex - fast, and the right default for most code. But its guard (the thing `lock()` returns) is **not `Send`**, and `tokio::spawn` requires futures to be `Send`. So if a guard is still alive at an `.await` point, the borrow checker refuses to compile your spawned task. Even setting `Send` aside, holding a *blocking* lock across an await is dangerous: the task can be suspended while still holding the lock, and another task on the same thread that wants the lock blocks the whole OS thread - a recipe for deadlock.

So the two cases:

```rust
use std::sync::Mutex; // the fast, blocking one

#[tokio::main]
async fn main() {
    let counter = Mutex::new(0u64);

    {
        let mut guard = counter.lock().unwrap();
        *guard += 1;
    } // guard dropped HERE, before any await - perfect

    some_async_thing().await;
    println!("count = {}", *counter.lock().unwrap());
}

async fn some_async_thing() {}
```

*What just happened:* We used `std::sync::Mutex` for a tiny, synchronous critical section: lock, bump the counter, unlock. The guard lives inside its own `{ }` block and is dropped at the closing brace - *before* the `.await` on the next line. No await happens while the lock is held, so `Send` is never an issue and there's no deadlock risk. This is the common case, and `std::sync::Mutex` is faster than the async one, so this is what you should use the vast majority of the time.

The other type, `tokio::sync::Mutex`, is **async-aware**: its `lock()` is itself `.await`-able, and its guard *is* allowed to live across `.await` points. Use it only when you genuinely must hold the lock while awaiting something:

```rust
use tokio::sync::Mutex; // the async-aware one
use std::sync::Arc;

async fn run(shared: Arc<Mutex<Vec<String>>>) {
    let mut guard = shared.lock().await;      // .await to acquire
    guard.push(fetch_line().await);           // holding the lock across an await - allowed
    println!("now {} lines", guard.len());
}

async fn fetch_line() -> String { "data".to_string() }
```

*What just happened:* `shared.lock().await` asynchronously waits its turn for the lock - if another task holds it, this task yields instead of blocking the thread. Because it's `tokio::sync::Mutex`, we can keep `guard` alive across the `await` on `fetch_line()` and the compiler is happy. The cost: it's slower than `std::sync::Mutex`, which is exactly why you reserve it for the case where the standard one literally won't work.

💡 Decision in one line: **`std::sync::Mutex` by default; `tokio::sync::Mutex` only when the lock must survive an `.await`.**

Tokio's `sync` module has a few more tools worth knowing by name:

- **`RwLock`** - many concurrent readers *or* one writer. Use it when reads vastly outnumber writes (a rarely-changing config read on every request).
- **`Semaphore`** - hands out a fixed number of permits to cap concurrency. Want at most 10 simultaneous outbound requests? Acquire a permit before each, with only 10 to go around.
- **`Notify`** - a lightweight "wake me when something happens" primitive, for hand-rolled coordination without passing a value.

## Bringing it back to the mental model

Step back and the whole phase collapses to one choice. Two tasks need to coordinate - do you **move the data between them** (a channel) or **let them share it** (a lock)?

Reach for channels first. They keep ownership unambiguous, they make backpressure explicit, and they sidestep deadlocks by construction. mpsc for streams of work, oneshot for a single reply, broadcast to tell everyone, watch for the latest value. When shared state really is the cleaner design, lock it - and remember the one rule that keeps you out of trouble: `std::sync::Mutex` for quick non-await sections, `tokio::sync::Mutex` only when the guard must cross an `.await`.

Next we'll let a task wait on *several* of these at once and give up after a deadline.

## Recap

- Tasks coordinate two ways: **message passing** (channels) or **shared state** (locks). Prefer channels - "share state by communicating."
- **`mpsc`** is multi-producer, single-consumer: clone `tx` for many senders, `rx.recv().await` yields `Option<T>` and returns `None` once all senders drop. **Bounded** channels apply backpressure; unbounded ones risk unbounded memory.
- **`oneshot`** carries a single value once - the natural way for a task to return a result. **`broadcast`** fans every message out to every receiver; **`watch`** exposes only the latest value.
- ⚠️ Never hold a **`std::sync::Mutex`** guard across an `.await` - its guard isn't `Send` (won't compile in a spawned task) and risks deadlock. Use **`tokio::sync::Mutex`** only when you must lock across an await.
- 💡 `std::sync::Mutex` is the faster default for short, non-await critical sections. `RwLock` caps reads vs writes, `Semaphore` caps concurrency, `Notify` wakes tasks.

## Quick check

```quiz
[
  {
    "q": "Your mpsc `while let Some(n) = rx.recv().await` loop never exits, even after all worker tasks finish. What's the most likely cause?",
    "choices": ["The channel buffer is too small", "A clone of the sender (often the original tx) is still alive, so recv() never sees None", "You used a bounded channel instead of unbounded", "oneshot should have been used instead"],
    "answer": 1,
    "explain": "recv() returns None only when EVERY sender is dropped. A lingering tx clone keeps the loop waiting forever; drop the extra sender."
  },
  {
    "q": "When is it safe to hold a `std::sync::Mutex` guard?",
    "choices": ["Any time, std Mutex is always fine in async code", "Only across an .await point", "For short, synchronous critical sections that do NOT span an .await", "Only inside tokio::spawn"],
    "answer": 2,
    "explain": "std::sync::Mutex is the fast default, but its guard isn't Send and blocks the thread - keep the locked section synchronous and drop the guard before any .await."
  },
  {
    "q": "You need to push config updates so each reader always sees the current settings, never the history. Which channel fits best?",
    "choices": ["mpsc", "oneshot", "broadcast", "watch"],
    "answer": 3,
    "explain": "watch keeps only the latest value; new writes overwrite old ones and each receiver reads the current value when it checks - exactly the config/state-update pattern."
  }
]
```

[← Phase 4: The Runtime & Scheduler](04-runtime-and-scheduler.md) · [Guide overview](_guide.md) · [Phase 6: select! & Timeouts →](06-select-and-timeouts.md)
