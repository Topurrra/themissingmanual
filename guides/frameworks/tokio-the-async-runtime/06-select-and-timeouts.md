---
title: "select! & Timeouts"
guide: "tokio-the-async-runtime"
phase: 6
summary: "Race several futures with tokio::select! — first to finish wins, the rest get cancelled. Master cancellation safety, timeout for bounding ops, interval for ticks, and graceful shutdown."
tags: [tokio, rust, select, timeout, cancellation]
difficulty: advanced
synonyms: ["tokio select", "tokio timeout", "tokio race futures", "tokio cancellation", "cancellation safety", "tokio graceful shutdown select"]
updated: 2026-06-23
---

# select! & Timeouts

Here's the mental model to hold for this whole phase, because everything else hangs off it:

> 💡 **`tokio::select!` races several futures at once. The *first* one to finish wins — its branch runs.
> The moment it wins, every other future is **dropped right where it stood**. Dropped means cancelled.**

That single fact is the source of both the power and the pain in this phase. The power: you can say "do
this work, but give up if it takes longer than 5 seconds" or "serve requests until someone hits Ctrl-C"
in a few lines. The pain: a future you cancelled might have been *halfway through something* when you
yanked it out from under itself. We'll build up the happy cases first, then spend real time on the part
that bites people — cancellation safety.

## Racing two futures with `select!`

The classic shape is "real work versus a timer." Whichever finishes first decides what happens:

```rust
use tokio::time::{sleep, Duration};

async fn do_work() -> u32 {
    sleep(Duration::from_secs(2)).await; // pretend this is a network call
    42
}

#[tokio::main]
async fn main() {
    tokio::select! {
        res = do_work() => println!("work finished: {res:?}"),
        _ = sleep(Duration::from_secs(5)) => println!("timed out waiting"),
    }
}
```

*What just happened:* `select!` started polling **both** branches concurrently. `do_work()` finishes
after 2 seconds, the 5-second `sleep` is still pending — so the first branch wins, prints
`work finished: 42`, and the sleep future is **dropped without ever completing**. Flip the numbers
(work takes 6 seconds, timer is 5) and the other branch wins instead, printing `timed out waiting` while
`do_work()` gets cancelled mid-flight. Each branch is `pattern = future => body`; the winner's body runs
with its result bound to the pattern, and `select!` evaluates to that body's value.

📝 `select!` polls branches in (effectively) random order when several are ready at once, so you can't
rely on a fixed priority. If you need deterministic priority, add a `biased;` line as the first thing
inside the macro and it'll poll top-to-bottom.

## The careful part: cancellation safety

This is the bit that separates "I used `select!`" from "I understand `select!`." When a losing branch is
dropped, any *partial work that future was holding* goes away with it. If that future had read half a
message off a socket, that half-message is gone — it was living in the future's stack, and the future no
longer exists.

⚠️ **Not every future is safe to cancel mid-poll.** A future is **cancellation-safe** if dropping it
before completion loses *no* committed progress — you can re-create it next loop iteration and nothing
was silently swallowed. Many Tokio ops document this explicitly. Safe examples: `tokio::time::sleep`,
`mpsc::Receiver::recv`, `TcpListener::accept`. Unsafe examples: things that consume input incrementally,
like `AsyncReadExt::read` into a buffer where a partial read can't be un-read.

The danger almost always shows up in a **loop** that re-evaluates the same `select!` over and over:

```rust
use tokio::sync::mpsc;

async fn run(mut rx: mpsc::Receiver<String>, mut shutdown: mpsc::Receiver<()>) {
    loop {
        tokio::select! {
            Some(msg) = rx.recv() => {
                println!("got: {msg}");
            }
            _ = shutdown.recv() => {
                println!("shutting down");
                break;
            }
        }
    }
}
```

*What just happened:* this loop is safe **because both branches are cancellation-safe**. On each
iteration `select!` creates fresh `recv()` futures. Say a message arrives and the first branch wins — the
`shutdown.recv()` future is dropped. That's fine: `recv()` holds no partial state, so dropping it loses
nothing, and next iteration we just call `recv()` again. The whole pattern only works because cancelling
the loser is harmless.

Now picture the unsafe version: a branch that does `socket.read(&mut buf).await` inside this same loop.
If the *other* branch fires while `read` has pulled 300 of an expected 500 bytes into `buf`, that read
future is dropped and those 300 bytes are stranded — buffered in the future's own state, not yet returned
to you. Next iteration starts a brand-new `read` and your protocol is now corrupt. Two standard fixes:

- **Use a cancellation-safe API** instead (e.g. read full framed messages with `tokio_util`'s
  `FramedRead`, whose `next()` *is* cancellation-safe).
- **Move the fragile work out of `select!`** — do the multi-step read in its own task or its own future
  that runs to completion, and only `select!` on a channel/handle that delivers the *finished* result.

The rule of thumb: **before you put a future in a `select!` loop, ask "is it safe to drop this halfway?"**
If you're not sure, check its docs for the words "cancel safety" — Tokio is good about labeling this.

## `timeout`: the common case, done cleanly

Racing your work against a `sleep` works, but for the everyday "bound this one operation" need there's a
purpose-built helper that reads better and can't get the branches wrong:

```rust
use tokio::time::{timeout, sleep, Duration};

async fn fetch() -> String {
    sleep(Duration::from_secs(3)).await;
    "data".to_string()
}

#[tokio::main]
async fn main() {
    match timeout(Duration::from_secs(2), fetch()).await {
        Ok(value) => println!("got {value} in time"),
        Err(_elapsed) => println!("gave up — fetch was too slow"),
    }
}
```

*What just happened:* `timeout(duration, future)` returns a `Result<T, Elapsed>`. Here `fetch()` needs 3
seconds but we allowed 2, so the timer expires first, `fetch()` is **cancelled**, and we get
`Err(Elapsed)`. If `fetch()` had finished in under 2 seconds we'd get `Ok("data")`. Note the cancellation
caveat from above still applies — `timeout` drops the inner future when time runs out, so the same
"is this safe to cancel?" question holds for whatever you wrap.

## `interval`: periodic ticks

For "do something every N seconds," reach for `interval` rather than sleeping in a loop (sleeping drifts;
`interval` accounts for how long the work took and keeps a steady cadence):

```rust
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut tick = interval(Duration::from_secs(1));
    let mut count = 0;
    loop {
        tick.tick().await; // fires immediately the first time, then every 1s
        count += 1;
        println!("tick {count}");
        if count == 3 { break; }
    }
}
```

*What just happened:* `tick.tick().await` resolves on schedule — note the **first** tick completes
immediately, then subsequent ones land one second apart. This is what you `select!` against when you want
"do periodic work *and* react to other events in the same loop."

## Graceful shutdown: the payoff pattern

Now combine everything. A long-running worker shouldn't loop forever — it should run until told to stop,
then exit *cleanly* (finish the current item, flush, close connections). The shape: `select!` between
"the actual work" and "a shutdown signal." A common signal is Ctrl-C via `tokio::signal::ctrl_c()`:

```rust
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut work = interval(Duration::from_secs(1));

    loop {
        tokio::select! {
            _ = work.tick() => {
                println!("doing a unit of work");
            }
            _ = tokio::signal::ctrl_c() => {
                println!("\nshutdown signal received — cleaning up");
                break;
            }
        }
    }

    println!("worker stopped cleanly");
}
```

*What just happened:* the loop races a periodic tick against the Ctrl-C future. While no signal arrives,
the tick branch keeps winning and the work runs. The instant you press Ctrl-C, that branch wins, we
`break` out of the loop, and control flows to the cleanup line *after* the loop — instead of the process
being killed mid-task. Both `tick()` and `ctrl_c()` are cancellation-safe, so the loop is sound.

For fanning shutdown out to **many** tasks, a single signal isn't enough — you want one notification that
every worker can listen to. Two good tools:

- A [`watch` channel](05-channels-and-sync.md): the supervisor sets a "should I stop?" value, every
  worker `select!`s on `shutdown.changed()`, and they all wake at once.
- `tokio_util`'s **`CancellationToken`**, which formalizes exactly this: hand each task a clone of the
  token, they `select!` on `token.cancelled()`, and calling `token.cancel()` once trips them all. It also
  supports child tokens for hierarchical shutdown. Reach for it when "stop everything gracefully" is a
  recurring need rather than a one-off.

## Recap

- **`tokio::select!` races futures; the first to finish wins and the rest are dropped (cancelled).** That
  cancellation is the whole point — and the whole hazard.
- **Cancellation safety** is the thing to watch in `select!` loops: a dropped loser can lose partial work.
  Prefer cancellation-safe ops (`recv`, `sleep`, `accept`, `FramedRead::next`) or move fragile multi-step
  work out of the `select!` so it runs to completion.
- **`tokio::time::timeout(dur, fut).await`** returns `Result<T, Elapsed>` — the clean way to bound a single
  operation, no manual sleep-racing required.
- **`tokio::time::interval`** gives you steady periodic ticks via `tick().await` (first tick is immediate);
  ideal to `select!` against alongside other events.
- **Graceful shutdown** is `select!`-ing work against a shutdown signal (`ctrl_c`, a `watch` channel, or
  `tokio_util`'s `CancellationToken`) so the worker exits cleanly instead of being killed mid-task.

## Quick check

```quiz
[
  {
    "q": "In tokio::select!, what happens to the futures in the branches that did NOT finish first?",
    "choices": ["They keep running in the background", "They are dropped (cancelled) where they stood", "They are paused and resumed on the next select!", "They each get their own spawned task"],
    "answer": 1,
    "explain": "select! runs the first branch to complete and drops every other future at that point — dropping a future cancels it."
  },
  {
    "q": "Why can a select! loop containing socket.read(&mut buf).await be unsafe?",
    "choices": ["read() can never be used with select!", "If another branch wins, the read future is dropped and any partially-read bytes are lost", "read() blocks the whole runtime", "select! refuses to compile with read()"],
    "answer": 1,
    "explain": "A partial read holds bytes in the future's own state. If the read loses the race it's dropped, stranding those bytes — that's a cancellation-safety bug."
  },
  {
    "q": "What does tokio::time::timeout(Duration::from_secs(2), some_future()).await return?",
    "choices": ["The future's value, or panics on timeout", "A Result<T, Elapsed> — Err(Elapsed) if it didn't finish in time", "An Option<T> that is None on timeout", "A bool indicating success"],
    "answer": 1,
    "explain": "timeout yields Result<T, Elapsed>: Ok(value) if the future finished in time, Err(Elapsed) if the timer expired first (the inner future is then cancelled)."
  }
]
```

[← Phase 5: Channels & Synchronization](05-channels-and-sync.md) · [Guide overview](_guide.md) · [Phase 7: Where to Go Next →](07-where-to-go-next.md)
