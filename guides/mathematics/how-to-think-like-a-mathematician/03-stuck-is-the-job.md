---
title: "Stuck Is the Job: Getting Unstuck"
guide: "how-to-think-like-a-mathematician"
phase: 3
summary: "Problem-solving as a learnable craft: Polya's four steps, trying small cases, finding invariants, and getting unstuck when you are stuck."
tags: [mathematics, problem-solving, polya, heuristics, debugging]
difficulty: beginner
synonyms: ["how to get unstuck", "productive struggle", "stuck on a math problem", "is math talent real", "rubber duck math", "what to do when stuck", "invariant problem solving"]
updated: 2026-06-30
---

# Stuck Is the Job: Getting Unstuck

Here's the secret no one tells you in school: being stuck is not the failure state of
problem-solving. It *is* problem-solving. The mathematician at the chalkboard and the
beginner at the kitchen table are in the exact same place most of the time - stuck -
and the only difference is what they do about it.

School trains you to feel that stuck = stupid, because in school the problems were
designed to be solvable in two minutes and the clock was running. Real problems
aren't like that. The skill that actually separates people isn't speed of insight.
It's the ability to sit in not-knowing without panicking, and to keep poking.

## Stuck is data, not a verdict

When you're stuck, you've learned something: the obvious approach doesn't work. That
narrows the search. Treat the stuck moment as a fork with a list of moves, not a wall.

```text
Stuck checklist - run these out loud:
  1. Did I actually understand the question? (Re-state it. Phase 1.)
  2. Have I tried the smallest case? The next one?
  3. What happens if I work backwards from the goal?
  4. Is there a simpler version I can fully solve?
  5. Is something staying the same no matter what I do? (Invariant.)
  6. Have I used every fact in the problem? Which one haven't I touched?
```

*What just happened:* "I'm stuck" became six concrete things to try. Item 6 alone
rescues a shocking number of problems - an unused fact in the problem statement is
almost always the key you walked past.

## Re-explain it to a rubber duck

The single most reliable unsticker costs nothing: explain the problem, out loud, to
something that can't help you. A friend, a pet, a literal rubber duck. The act of
forming sentences forces the gaps in your own thinking to the surface.

```text
You, explaining aloud: "Okay so I need the two corners gone to still be
tileable... wait. I keep saying 'two corners' but I never said what color
they are. Opposite corners are the SAME color. ...Oh. That's the whole thing.
The colors don't balance."
```

*What just happened:* nobody answered you - the duck is rubber. Saying it forced you
to be specific about "two corners," and the specificity *was* the insight. Vagueness
hides in your head and dies the moment you have to speak it.

## Invariants: the deep move, up close

Phase 2 introduced invariants; they earn the spotlight here because finding one is the
closest thing to a superpower in this whole craft. The question that unlocks them:
**"As I make the allowed moves, what quantity never changes - or only changes in a
fixed way?"**

```text
Puzzle: numbers 1 to 10 on a board. A move: erase two numbers a, b and
write a + b - 1 in their place. Repeat until one number remains.
What's the final number - and does the order of moves matter?

Ask the invariant question: each move replaces a, b with a + b - 1.
The total on the board goes from (... + a + b) to (... + (a+b-1)):
it drops by exactly 1, every move. Always.

Start total: 1+2+...+10 = 55. Moves until one number left: 9.
Final = 55 - 9 = 46. The order never mattered.
```

*What just happened:* the messy "try every order of moves" problem collapsed because
one quantity - the total - changed by a fixed amount every move regardless of choice.
You didn't simulate anything. You found the thing the chaos couldn't touch.

## Talent is mostly a story about persistence

The people who look talented are, overwhelmingly, the people who didn't stop when it
got uncomfortable. Productive struggle - wrestling a problem at the edge of your
ability, getting it wrong, trying another move - is not the cost of getting good. It
*is* the mechanism. The discomfort is the muscle working.

So when you feel the locked-door panic from the very first page of this guide,
reframe it: that feeling is not evidence you can't. It's evidence you've reached the
part where learning actually happens. Run the checklist. Talk to the duck. Find what
doesn't change. Loop back to step 2.

## For builders

The hardest bugs are won the same way - not by a flash of genius but by a calm
checklist run while everyone else panics. Rubber-duck debugging is named for exactly
this trick. And the invariant you hunt in a proof is the same assertion you'd add to
catch a regression: "this should always be true." When it isn't, you've found the
problem. To turn a found pattern into a result no one can argue with, head to
[/guides/what-a-proof-is](/guides/what-a-proof-is).

```quiz
[
  {
    "q": "What's the most useful reframe of being stuck?",
    "choices": ["A sign you lack talent", "Data: the obvious approach failed, which narrows the search", "A reason to take a long break", "Proof the problem is unsolvable"],
    "answer": 1,
    "explain": "Stuck means you've ruled out the obvious path. That's information, and it points you to the checklist of other moves."
  },
  {
    "q": "Why does explaining a problem aloud to a rubber duck help so often?",
    "choices": ["The duck gives hints", "Forming sentences forces hidden vagueness in your thinking to the surface", "It passes the time", "It lowers stress, nothing more"],
    "answer": 1,
    "explain": "Vagueness survives in your head but dies when you must say it precisely - and the precision is frequently the missing insight itself."
  },
  {
    "q": "In the 'a + b - 1' board puzzle, why doesn't the order of moves matter?",
    "choices": ["Because all the numbers are small", "Because each move lowers the total by exactly 1 regardless of which numbers you pick", "Because addition is commutative", "Because there are only 9 moves"],
    "answer": 1,
    "explain": "The total is an invariant that drops by a fixed 1 per move no matter your choices, so the final value (55 - 9 = 46) is forced."
  }
]
```

[← Phase 2: The moves](02-the-moves.md) | [Overview](_guide.md)
