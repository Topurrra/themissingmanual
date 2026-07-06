---
title: "A Real Concurrency Bug, Caught Before Code"
guide: "model-checking-in-practice"
phase: 3
summary: "A worked lost-update race in a connection pool's reference count, the interleaving a model checker finds that human review misses, and the honest limits of model checking."
tags: [logic, model-checking, concurrency-bugs, race-condition, formal-methods, limits]
difficulty: advanced
synonyms: ["lost update race example", "connection pool race condition", "concurrency bug model checker finds", "when is model checking not worth it", "limits of formal verification"]
updated: 2026-07-06
---

# A Real Concurrency Bug, Caught Before Code

Phase 2 explained the mechanism. This phase runs it on a genuine bug pattern - one that has shipped
in real connection pools, semaphore implementations, and reference-counted resource managers - and
then gets honest about where model checking stops helping.

## The system: a bounded resource pool

A pool holds `N` interchangeable resources (database connections, worker threads). Processes check
one out, use it, and check it back in. The pool tracks how many are currently in use with a shared
counter, and refuses a checkout once the counter hits the limit.

```text
VARIABLES
  inUse           \* shared counter: how many resources are checked out
  loc[P1], loc[P2]

LIMIT == 1        \* pool size 1, to isolate the bug with the fewest moving parts

Locations:
  idle, reading, writing, holding, done

T1_read_count:   loc[P] = idle
                 -> loc[P] = reading   (read current value of inUse into a local)

T2_check_and_inc: loc[P] = reading  AND  localCount < LIMIT
                 -> loc[P] = writing  (decided there's room; about to write it back +1)

T3_write_inc:    loc[P] = writing
                 -> inUse' = localCount + 1,  loc[P] = holding

T4_release:      loc[P] = holding
                 -> inUse' = inUse - 1,  loc[P] = done
```

*What just happened:* this is "read, check, then write" split into three separate steps -
`localCount` is a per-process local variable holding what `inUse` looked like at read time. That
split is the bug. Real code does this whenever a check and an update aren't a single atomic
instruction: read a counter, decide there's capacity, then write the incremented value back.

## The invariant nobody would think to violate

```text
PoolInvariant ==
  inUse <= LIMIT

  "The pool never reports more resources checked out than it has."
```

Trivially true if only one process ever runs `T1` through `T3` at a time. The whole reason to
write a spec is to stop assuming that and check every interleaving instead.

With `LIMIT == 1` and two processes, the raw state space here is small - a handful of location
pairs times a few values of `inUse` - well within what phase 2 called checkable in seconds. That's
the point: you don't need a large model to expose this bug, you need the *right* one. A bigger pool
size or a third process would multiply the state count without teaching the checker anything new
about this particular flaw.

## The interleaving

```text
Step 0  INIT        inUse=0   loc[P1]=idle      loc[P2]=idle
Step 1  P1: T1       inUse=0   loc[P1]=reading   (P1's localCount = 0)
Step 2  P2: T1       inUse=0   loc[P2]=reading   (P2's localCount = 0)   <- both read BEFORE either writes
Step 3  P1: T2       localCount(0) < LIMIT(1) -> OK, P1 moves to writing
Step 4  P2: T2       localCount(0) < LIMIT(1) -> OK, P2 moves to writing
Step 5  P1: T3       inUse' = 0 + 1 = 1        loc[P1]=holding
Step 6  P2: T3       inUse' = 0 + 1 = 1        loc[P2]=holding   <- OVERWRITES P1's update

INVARIANT VIOLATED:  PoolInvariant (inUse <= LIMIT)
  Actual state:  inUse = 1,  loc[P1] = holding,  loc[P2] = holding
  Both P1 and P2 believe they hold the pool's ONE resource. inUse says "1,"
  but two processes are using it - the counter is now permanently wrong,
  and a THIRD process reading inUse=1 will correctly assume 0 are free
  when actually 0 truly are free but for the wrong reason: two live
  holders, one accounted for.
```

*What just happened:* this is a lost update, same family as the money-transfer race in the
prerequisite guide, but a different shape - there the damage was a wrong sum; here it's a resource
pool that thinks it has more capacity than it does, or (as shown) under-counts concurrent holders
so cleanly that `inUse` looks plausible while being wrong. Step 2 is the step nobody writes a test
for. You test "one process checks out a resource." You test "the pool refuses when full." You do
not, unprompted, write a test titled "two processes both read the counter in the narrow window
before either writes it back" - because you'd have to already suspect the bug to think of the
scenario. The checker doesn't suspect anything. It tried `T1` for `P2` immediately after `T1` for
`P1` because that ordering was available, and every available ordering gets tried.

## Why a human reviewer walks past this

Code review reads top to bottom, one process at a time. `checkout()` looks correct in isolation -
read the counter, compare to the limit, increment, proceed. The bug only exists in the gap *between*
two lines, across two threads, and that gap is invisible unless you're deliberately holding both
call stacks in your head and asking "what if the scheduler pauses P1 right here?" Reviewers do this
for the one function they're told is suspicious. They don't do it for every pair of lines in every
function, because that doesn't scale to a real codebase - which is precisely the gap exhaustive
search fills.

## Where model checking still can't save you

Be precise about the boundary, because overselling this is how teams get burned later.

**The spec isn't the code.** The model above assumes `T3_write_inc` is one atomic step. If the real
implementation is `inUse = localCount + 1` compiled into multiple machine instructions with no lock
around them, the actual bug surface is *wider* than the model captures - the checker verified a
design that assumed atomicity the code might not have. You still need to verify that your
implementation's atomic operations are actually atomic (a mutex, a compare-and-swap, a language
guarantee) - that's a code-level correctness question, not a spec-level one.

**Implementation bugs live outside the model entirely.** An off-by-one in the real `LIMIT` check, a
typo that decrements the wrong variable, a memory leak that never calls `T4_release` - none of these
are design flaws the spec would ever see, because the spec doesn't contain the code. Tests and
reviews still own that territory.

**The effort has to be worth it.** Writing this pool spec, defining the invariant, and running the
checker took real, non-zero time - worthwhile for a resource pool shared across a distributed
service where a stuck or over-allocated pool means an outage. Not worthwhile for a single-threaded
CLI script, or a pool that's rebuilt fresh on every request with no shared state to race on. Model
check the component where a concurrency bug would cost you an incident; skip it where there's no
concurrency to get wrong in the first place. That judgment call - not the tooling - is the actual
skill this whole guide has been building toward.

```quiz
[
  {
    "q": "In the pool race, why does step 2 (P2 reading inUse before P1 writes back) matter?",
    "choices": [
      "It doesn't matter - the order of reads never affects the outcome",
      "Both processes read the counter's OLD value before either writes the new one, so both think there's room and both proceed",
      "It causes a crash immediately",
      "It only matters if LIMIT is greater than 1"
    ],
    "answer": 1,
    "explain": "Because both reads happen before either write, both processes base their 'is there room?' decision on the same stale value - the classic setup for a lost update."
  },
  {
    "q": "Why would a human code reviewer likely miss this bug reading checkout() top to bottom?",
    "choices": [
      "Because the code has a syntax error",
      "Because the bug lives in the gap between two lines across two concurrent threads, which reviewers don't hold in their head for every line pair in a codebase",
      "Because reviewers never check counters",
      "Because the bug only happens with more than two processes"
    ],
    "answer": 1,
    "explain": "checkout() reads correctly in isolation - the flaw only exists in an interleaving between two call stacks, which is exactly the kind of case exhaustive search catches and manual review structurally tends to skip."
  },
  {
    "q": "Which of these is a genuine limit of model checking, per this phase?",
    "choices": [
      "It can verify a design assumes an operation is atomic, but can't guarantee your actual compiled code executes that operation atomically",
      "It can only find bugs that also show up in tests",
      "It works only for resource pools, not other kinds of systems",
      "It cannot express safety properties, only liveness"
    ],
    "answer": 0,
    "explain": "The checker verifies the model's assumptions (e.g. that a step is atomic). If the real implementation doesn't honor that assumption, the gap between spec and code is a separate problem tests and reviews still have to catch."
  }
]
```

[← Phase 2: Exhaustive State-Space Exploration](02-exhaustive-state-space-exploration.md) · [Guide overview](_guide.md)
