---
title: "The Moves: How to Actually Get an Idea"
guide: "how-to-think-like-a-mathematician"
phase: 2
summary: "Problem-solving as a learnable craft: Polya's four steps, trying small cases, finding invariants, and getting unstuck when you are stuck."
tags: [mathematics, problem-solving, polya, heuristics, debugging]
difficulty: beginner
synonyms: ["math heuristics", "try the smallest case", "find a pattern math", "work backwards", "find an invariant", "solve a simpler version", "how to get an idea for a proof"]
updated: 2026-06-30
---

# The Moves: How to Actually Get an Idea

Phase 1 gave you the loop. But the loop has a hole in it the size of a house: step 2
says "devise a plan," and you reasonably want to scream, *with what?* Where does a
plan come from when you're staring at a blank page?

It comes from a short menu of moves. These are the windows a mathematician walks
around the building trying. None of them is guaranteed to work. All of them are worth
a try, and on most problems at least one of them cracks the door. Learn the menu and
"I have no idea" turns into "let me try the first three."

## Move 1: Try the smallest case

When a problem is stated for some big or general number, shrink it. Do the case for 1.
Then 2. Then 3. Small cases are cheap, and they show you the machinery.

```text
Problem: What is 1 + 2 + 3 + ... + 100?

Shrink it:
  n = 1:  1                 = 1
  n = 2:  1 + 2             = 3
  n = 3:  1 + 2 + 3         = 6
  n = 4:  1 + 2 + 3 + 4     = 10
```

*What just happened:* you stopped trying to leap at 100 and did the parts you can do
in your head. Now you have data - 1, 3, 6, 10 - and data is something to look at,
which a blank page never was.

## Move 2: Find a pattern

Once you have small cases, stare at the numbers and ask what they're doing. Patterns
are the bridge from "examples" to "rule."

```text
Sums:    1,  3,  6,  10
n:       1,  2,  3,  4

Try multiplying n by the next number:
  1×2 = 2,  2×3 = 6,  3×4 = 12,  4×5 = 20
That's exactly double each sum. So sum = n(n+1)/2.

Check at n = 100:  100 × 101 / 2 = 5050.
```

*What just happened:* the pattern n(n+1)/2 didn't fall from the sky - you found it by
poking the small cases until the numbers confessed. You also *checked* it on a fresh
case before trusting it, which is the look-back habit from phase 1 doing its job.

## Move 3: Work backwards

Some problems are a maze. Walking forward from the start, every turn looks equally
plausible. So start at the exit and walk back - the goal often has only one thing
that could lead to it.

```text
Goal: end holding exactly 4 liters, with a 5-liter jug and a 3-liter jug.

Work backwards: to have 4 in the 5-jug, I'd pour 1 out of a full 5.
  To pour exactly 1 out, the 3-jug must already hold 2 (it has room for 1).
  To have 2 in the 3-jug... fill 5, pour into 3 (leaves 2 in the 5),
  empty the 3, pour those 2 in. Now the 3-jug holds 2.
Read it forwards and you have the solution.
```

*What just happened:* forwards, the jug puzzle has a dozen pointless moves you could
make. Backwards, each step had almost no choice - "to get here, I must have come from
there" pruned the maze down to a path.

## Move 4: Solve a simpler version

If the real problem has three hard things tangled together, untangle one. Drop a
constraint, lower a dimension, assume the nice case. Solve *that*, then add the
hardness back.

```text
Real: shortest route visiting 12 cities.
Simpler: shortest route visiting 3 cities - trivial, only a few orders.
         Then 4. You start to see why it explodes, and which ideas
         (nearest-neighbor, swapping two stops) even make sense to try.
```

*What just happened:* the simpler version didn't solve the 12-city problem, but it
taught you the shape of it and which approaches are worth scaling up - far better than
guessing at the full thing cold.

## Move 5: Look for an invariant or symmetry

This is the deepest move, so it gets its own home in phase 3 - but meet it now. An
**invariant** is something that *doesn't change* no matter what moves you make. If you
can find one, it often settles the whole problem in a line.

```text
Tile a chessboard with dominoes, each covering one black + one white square.
Now remove two opposite corners - both the same color, say both white.

Invariant: every domino covers exactly one white and one black, always.
So any tiling covers equal whites and blacks.
But the mutilated board has 32 black and 30 white. Unequal → impossible.
```

*What just happened:* you didn't try a single tiling. The invariant ("one white, one
black, every time") made *all* tilings answer the question at once. That's the power -
one unchanging fact replacing infinite case-checking.

## For builders

These map straight onto how you cut down a bug. "Smallest case" is the minimal
reproduction. "Solve a simpler version" is commenting out half the system to localize
the fault. "Work backwards" is reading a stack trace from the crash up to the cause.
"Find an invariant" is the assertion that should always hold - and the moment it
doesn't, you've found your bug.

```quiz
[
  {
    "q": "You face '1 + 2 + ... + 1000 = ?' with no formula in mind. What's the natural first move?",
    "choices": ["Add all 1000 numbers carefully", "Try the smallest cases (n=1,2,3) and look for a pattern", "Give up and look it up", "Guess a round number"],
    "answer": 1,
    "explain": "Small cases turn a blank page into data (1, 3, 6, 10...), and the pattern n(n+1)/2 then jumps out."
  },
  {
    "q": "What makes 'work backwards' powerful on a maze-like puzzle?",
    "choices": ["It's faster to write", "The goal usually has only one thing that could lead to it, pruning choices", "It avoids arithmetic", "It always finds the shortest path"],
    "answer": 1,
    "explain": "Forwards every move looks plausible; backwards each step asks 'what must I have come from?', which often has a near-unique answer."
  },
  {
    "q": "Why does the invariant settle the mutilated-chessboard problem without trying any tiling?",
    "choices": ["Because the board is small", "Because every domino always covers one black and one white, so all tilings need equal counts - which the board lacks", "Because corners don't matter", "Because dominoes are symmetric"],
    "answer": 1,
    "explain": "One unchanging fact about every domino applies to every possible tiling at once, replacing infinite case-checking with a single contradiction."
  }
]
```

[← Phase 1: The loop](01-the-loop.md) | [Overview](_guide.md) | [Phase 3: Stuck is the job →](03-stuck-is-the-job.md)
