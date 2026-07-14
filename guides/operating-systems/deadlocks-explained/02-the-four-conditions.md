---
title: "The four conditions that must all be true"
guide: deadlocks-explained
phase: 2
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

# The four conditions that must all be true

Computer scientists Edward Coffman and colleagues identified, back in 1971, that a deadlock can only occur when four specific conditions are true **at the same time**. This is useful, not academic trivia: it means you don't need to prevent deadlocks in general, an intimidating and vague goal. You only need to make sure at least one of these four conditions can never hold in your system. Break any single one, and the whole cycle becomes impossible.

## 1. Mutual exclusion

A resource can be held by only one thread at a time - two threads can't both hold the same lock simultaneously. This is the entire *point* of a lock. In the transfer example, only one thread can hold `account1`'s lock at once.

```text
lock(account1)   # if another thread already holds it, this one waits
```

*What just happened:* mutual exclusion is why Thread B can't barge in and use `account1` while Thread A holds it - it has to wait. That waiting is necessary for correctness, but it's also the raw material a deadlock is built from.

## 2. Hold and wait

A thread holds at least one resource while simultaneously waiting to acquire another. Thread A holds `account1`'s lock while it waits for `account2`'s lock - it doesn't release what it already has, even though it's stuck waiting for something more.

```text
lock(account1)      # holding this...
lock(account2)      # ...while waiting for this
```

*What just happened:* this is the condition that turns "waiting" into "waiting *while blocking someone else*." If Thread A gave up `account1` the instant it had to wait for `account2`, Thread B could proceed and the deadlock would never form.

## 3. No preemption

A resource can't be forcibly taken away from the thread holding it - it can only be released voluntarily, by the thread that holds it, when that thread is good and ready. The operating system (or your locking library) won't reach in and yank a lock out of Thread A's hands to hand it to Thread B, even though Thread B is waiting.

```text
# no mechanism does this automatically:
force_unlock(account1, take_from=ThreadA, give_to=ThreadB)
```

*What just happened:* this line doesn't exist in real locking systems for good reason - forcibly revoking a lock mid-use would corrupt whatever the holding thread was in the middle of doing. But its absence is exactly why a stuck thread stays stuck: nothing can rescue it by force.

## 4. Circular wait

There exists a cycle of threads where each one is waiting for a resource held by the next thread in the cycle. Thread A waits on Thread B; Thread B waits on Thread A. With more threads involved, the cycle can be longer - A waits on B, B waits on C, C waits on A - but it's still a closed loop.

```text
A -> waiting for resource held by B
B -> waiting for resource held by A
```

*What just happened:* this is the condition that completes the trap. The first three conditions describe *how* locks generally behave - sensibly, even necessarily. It's only when those normal behaviors form a closed loop of waiting that you get a deadlock.

## Why "all four" is the useful part

```text
Mutual exclusion  -> needed for correctness (can't safely remove this one)
Hold and wait     -> can be prevented (acquire everything up front, or release before waiting)
No preemption     -> can be worked around (use try-lock with a timeout instead)
Circular wait     -> can be prevented (always acquire locks in the same global order)
```

*What just happened:* mutual exclusion is almost never the one you attack - you generally need locks to exclude, or your program has a correctness bug instead of a deadlock. That leaves three practical angles of attack, and the most common one in real code is the last: preventing circular wait by imposing a **consistent lock ordering**. If every thread in your system always acquires `account1` before `account2` - never the reverse, no matter which direction the transfer runs - a cycle becomes structurally impossible. Thread B can't wait for `account1` while holding `account2`, because it would have had to acquire `account1` first under the ordering rule.

> You don't have to eliminate all four conditions. You have to eliminate exactly one. That reframes "prevent deadlocks" from an abstract goal into a specific, checkable engineering decision.

Phase 3 turns this into code: what lock ordering looks like in practice, how timeouts and try-lock sidestep "no preemption," and what tools exist to catch a deadlock that already happened.

[← Phase 1: What a deadlock actually is](01-what-a-deadlock-is.md) | [Phase 3: Preventing and detecting them in real code →](03-preventing-and-detecting.md)
