---
title: "What a deadlock actually is"
guide: deadlocks-explained
phase: 1
summary: "What a deadlock actually is, the four conditions that must all be true for one to happen, and how to prevent and detect them in real code."
tags: [operating-systems, concurrency, deadlock, threads, locks, multithreading]
difficulty: intermediate
synonyms:
  - what is a deadlock
  - why is my program hanging forever
  - two threads waiting on each other
  - how to prevent a deadlock
  - how to detect a deadlock
  - lock ordering deadlock
updated: 2026-07-11
---

# What a deadlock actually is

A **deadlock** is two or more threads (or processes) each waiting forever for a resource that another one of them is holding — and none of them will ever release what they're holding, because they're all stuck waiting too. Nobody makes progress. Nobody crashes. The threads are technically alive, scheduled, and doing nothing, forever, unless something outside the situation intervenes.

That last part is what makes deadlocks so unpleasant to debug: there's no exception, no stack trace pointing at a line of broken logic, no log message screaming that something went wrong. The program stops responding, silently. CPU usage often drops to near zero for the stuck threads, because they aren't spinning — they're parked, asleep, waiting on something that will never arrive.

## A concrete two-lock example

Picture a banking application transferring money between two accounts. To keep the transfer safe from other threads touching the same accounts mid-transfer, you lock both accounts involved before moving money.

```text
Thread A: transfer(account1 -> account2)
  lock(account1)
  ... do some work ...
  lock(account2)     # waits here
  move money
  unlock(account2)
  unlock(account1)

Thread B: transfer(account2 -> account1)
  lock(account2)
  ... do some work ...
  lock(account1)     # waits here
  move money
  unlock(account1)
  unlock(account2)
```

*What just happened:* imagine both threads start at nearly the same moment. Thread A grabs `account1`'s lock. Thread B grabs `account2`'s lock. Now Thread A tries to lock `account2` — but Thread B already holds it, so Thread A waits. Meanwhile Thread B tries to lock `account1` — but Thread A already holds *that* one, so Thread B waits too.

```text
Thread A holds account1, wants account2 (held by B)
Thread B holds account2, wants account1 (held by A)
```

*What just happened:* each thread is waiting on the other to finish and release its lock. Neither will, because neither can move forward without the lock the other refuses to give up. This is the deadlock, captured completely in two lines: a cycle of waiting with no way out.

> Notice what's missing from this picture: no bug in the arithmetic, no race condition corrupting a balance, nothing wrong with either function in isolation. Run `transfer(account1, account2)` alone all day and it works perfectly. The bug only exists in the *combination* — two correct-looking functions, called concurrently, in the wrong relative order.

## Why it's forever, not merely slow

A slow lock wait resolves eventually — the other thread finishes and releases it. A deadlock never resolves on its own, because the "other thread" that would release the lock is itself waiting on you. It's not a long queue; it's a queue that loops back on itself. There's no front of the line to reach.

This is also why deadlocks are timing-dependent and hard to reproduce on demand: the scenario only occurs if both threads reach their first lock at close to the same moment, then reach for the second lock in opposite order. Code that deadlocks under production load might run thousands of times in testing without ever triggering it, purely by scheduling luck.

## The mental model to keep

Picture it as a graph: each thread points an arrow at the resource it's waiting for, and each held resource points back at the thread holding it. A deadlock exists exactly when that graph contains a **cycle** — a loop you can trace that comes back to where it started. Two threads is the simplest possible cycle; production deadlocks sometimes involve three, four, or more threads all waiting in a longer loop, but the shape is identical.

That cycle is the entire disease. Phase 2 breaks down the four specific conditions that have to hold at once for such a cycle to form.

```quiz
[
  {
    "q": "In the two-account transfer example, what causes the deadlock?",
    "choices": [
      "A bug in the money-transfer arithmetic",
      "Thread A locks account1 then wants account2, while Thread B locks account2 then wants account1",
      "One of the threads crashes mid-transfer",
      "The accounts have insufficient balance"
    ],
    "answer": 1,
    "explain": "Each thread holds one lock and waits for the other's lock — a cycle of waiting with no way to break out."
  },
  {
    "q": "Why is a deadlock different from a thread that's merely waiting a long time?",
    "choices": [
      "A deadlock uses more CPU than a normal wait",
      "A deadlock always involves exactly two threads",
      "A normal wait eventually ends when the holder finishes; a deadlock's \"holder\" is itself stuck waiting, so it never ends",
      "A deadlock only happens with database locks, never in-process locks"
    ],
    "answer": 2,
    "explain": "A deadlock forms a cycle — there's no thread outside the wait that will ever finish and release what's needed."
  },
  {
    "q": "Why are deadlocks often hard to reproduce in testing?",
    "choices": [
      "They only happen on multi-core CPUs",
      "They require a specific, timing-dependent interleaving of both threads reaching their locks in opposite order",
      "Test frameworks automatically prevent deadlocks",
      "They only occur with more than 100 threads"
    ],
    "answer": 1,
    "explain": "The deadlock depends on both threads acquiring their first lock before either reaches for the second — a narrow timing window that low-load testing may never hit."
  }
]
```

Watch it animated: [deadlocks](/explainers/Deadlocks.dc.html)

[← Overview](_guide.md) | [Phase 2: The four conditions that must all be true →](02-the-four-conditions.md)
