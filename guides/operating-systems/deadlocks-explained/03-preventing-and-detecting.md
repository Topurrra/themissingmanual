---
title: "Preventing and detecting them in real code"
guide: deadlocks-explained
phase: 3
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
updated: 2026-07-04
---

# Preventing and detecting them in real code

Knowing the four conditions is half the battle; the other half is what you actually type into a real codebase. This phase covers the two prevention techniques you'll use constantly, one detection technique for when prevention wasn't enough, and — because production doesn't wait for you to have the right architecture — what to actually do when a process is hung right now.

## Technique 1: consistent lock ordering

This is the fix for the transfer example from Phase 1, and it's the single most common deadlock fix in real systems: pick a global, deterministic order for acquiring locks, and never violate it, regardless of which "direction" the operation conceptually runs.

```text
# before: order depends on transfer direction — deadlock possible
transfer(account1, account2): lock(account1); lock(account2)
transfer(account2, account1): lock(account2); lock(account1)

# after: always lock in a fixed order, e.g. by account ID
transfer(a, b):
  first, second = sorted_by_id(a, b)
  lock(first)
  lock(second)
  ... move money between a and b ...
  unlock(second)
  unlock(first)
```

*What just happened:* no matter which account initiates the transfer, both threads now agree on which lock to acquire first — say, whichever account has the lower ID. Thread A transferring 1-to-2 and Thread B transferring 2-to-1 will both try to lock account 1 first. One of them ends up waiting for a normal, resolving lock — not a circular one, because the second thread never holds a lock the first one needs before it can proceed. Circular wait, Phase 2's fourth condition, becomes structurally impossible.

This generalizes beyond two locks: if your system ever needs three or more locks at once, sort them by some fixed key — an ID, a memory address, a hash — and always acquire in that order everywhere in the codebase. The rule is only as strong as its consistency; one code path that acquires locks in the wrong order breaks the guarantee for the entire system.

## Technique 2: timeouts and try-lock

Sometimes a fixed global ordering isn't practical — maybe the locks come from a library you don't control, or the resource graph is too dynamic to sort cleanly. The fallback is to refuse to wait forever: use a **try-lock** that either succeeds immediately or fails after a timeout, instead of a plain `lock()` that blocks indefinitely.

```text
if try_lock(account1, timeout=2s):
    if try_lock(account2, timeout=2s):
        ... move money ...
        unlock(account2)
    unlock(account1)
else:
    # couldn't get the lock in time — back off and retry later
    retry_after_backoff()
```

*What just happened:* this attacks Phase 2's third condition, "no preemption," from the other side. You can't forcibly take a lock away from another thread, but you *can* refuse to sit there holding your own lock while waiting on someone else's forever. If the second lock doesn't show up in time, release what you're holding and try the whole operation again later. A deadlock that would have lasted forever instead resolves in a couple of seconds, at the cost of occasionally having to retry.

The tradeoff: this trades a hang for a retry loop, and if retries aren't spaced out with backoff, two threads can end up fighting for the same locks repeatedly — a livelock, where both sides are actively working but neither makes progress. A small random delay before each retry usually breaks that pattern.

## Detecting deadlocks after the fact

Some systems don't try to prevent deadlocks structurally — they let one happen, notice it, and recover. Databases are the classic example: most relational databases run a background **deadlock detector** that periodically checks the wait-for graph (the same cycle picture from Phase 1) among active transactions. When it finds a cycle, it doesn't wait for a human — it picks one transaction as the "victim," aborts it, and lets the others proceed. Your application code then sees a specific deadlock error and is expected to retry that transaction.

```text
Transaction A: waiting on lock held by Transaction B
Transaction B: waiting on lock held by Transaction A
  -> DB detector finds the cycle
  -> aborts one transaction (say, A) with a deadlock error
  -> B proceeds, A's caller retries
```

*What just happened:* this is prevention's opposite: instead of making the cycle impossible, the system tolerates that cycles will occasionally form and has a plan for breaking them automatically. It works well specifically because the cost of retrying one aborted transaction is small and well understood — the same approach is much riskier for arbitrary application-level threads doing non-transactional work, where "abort and retry" might not be safe or even meaningful.

## What to actually do when you see a hang in production

A process that's frozen with no errors, no crash, and low CPU usage is the classic deadlock signature. The practical first move on most platforms is to get a **thread dump** — a snapshot of every thread's current stack trace and, critically, what lock (if any) it's currently blocked waiting on.

```text
# examples of getting a thread dump, by platform:
#   Java:    jstack <pid>
#   Linux (general): gdb -p <pid> then `thread apply all bt`
#   .NET:    dotnet-dump collect, then dotnet-dump analyze
```

*What just happened:* a thread dump turns an invisible hang into readable text — you can see thread A is blocked on lock X, and cross-reference which other thread currently holds lock X. Do that for every blocked thread and you can usually reconstruct the exact wait-for cycle by hand, which tells you precisely which two (or more) code paths need a consistent lock order or a timeout. Some platforms make this even more direct: the JVM's thread dump explicitly flags detected deadlocks by name, no manual cycle-hunting required.

> The fix for a live production deadlock is never "wait longer" — a true deadlock never resolves on its own. The fix is restart the stuck process to unblock users immediately, then use the thread dump you captured *before* restarting to find and fix the actual lock-ordering bug.

Once you've found the offending pair of locks, the fix is almost always one of the two techniques from earlier in this phase: reorder the acquisition to match the rest of the codebase, or wrap the second acquisition in a timeout. Deadlocks are unusual among production bugs in that the fix is rarely complicated — the hard part is entirely in locating which two lock acquisitions actually formed the cycle.

[← Phase 2: The four conditions that must all be true](02-the-four-conditions.md) | [Overview](_guide.md)
