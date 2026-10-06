---
title: "Opening, Shape, and Tesuji"
guide: "go-the-board-game"
phase: 5
summary: "Why corners come first, then sides, then the center, and four tactics (double atari, ladder, ladder breaker, snapback) worked out move by move on small boards."
tags: [go, opening, tesuji, ladder, snapback, double-atari, strategy]
difficulty: intermediate
synonyms: ["go opening strategy", "why play corners first in go", "what is a ladder in go", "what is a snapback in go", "what is a tesuji", "go tactics for beginners", "what is double atari", "ladder breaker go"]
updated: 2026-10-06
---

# Opening, Shape, and Tesuji

An empty board is paralyzing: 81 points on 9x9, 361 on 19x19, and every one of them is legal. Two ideas make the first moves less random: where stones are efficient, and a handful of tactics that win fights outright. This phase gives you the reasoning behind both, and every tactic here was played out move by move so you can trust the diagrams.

## Corners, then sides, then the center

Territory is claimed by walls of stones. The edges of the board act as free walls, so the fewer open sides you need to wall off, the fewer stones you need. Take the same area of nine points (a 3x3 block) and count how many stones it takes to seal it off:

| Where | Stones needed to seal 9 points |
|---|---|
| Corner | 6 |
| Side (along an edge) | 9 |
| Center | 12 |

Here is the corner version. Six stones close off the 3x3 area, because the two edges do the rest:

```text
  +-----------
  | . . . X . .
  | . . . X . .
  | . . . X . .
  | X X X . . .
  | . . . . . .
```

That is the reason the standard advice is **corners first, then sides, then the center**: the same territory costs half as many stones in the corner as in the middle. Early in the game each stone you save is a tempo you spend elsewhere. This is a guideline, not a law: a stone in the center can influence the whole board, and strong players use it deliberately. As a beginner, take the corners and the area along the sides first, and keep your stones connected so they cannot be cut apart.

On 9x9 the board is small enough that every stone is near an edge, so the priority becomes simpler: make one living, connected group, then use it to claim space. Do not scatter stones across the board; each separate stone has to be defended on its own.

## Tesuji: the clever move

A **tesuji** (Japanese for "skillful play") is a tactical move that works in a local fight, the way a chess fork does. You find it by reading, which Phase 6 teaches. Four to know now.

### Double atari

Atari on two groups at once. The opponent can only save one.

```text
  . . . . . . .
  . X X X X X .
  . X O a O X .
  . . . . . . .
  . . . . . . .
```

Each White stone has two liberties, and one of them is the shared point `a`. Black plays `a`:

```text
  . . . . . . .
  . X X X X X .
  . X O X O X .
  . . . . . . .
  . . . . . . .
```

Both White stones are now in atari. White saves the left one, and Black captures the right one:

```text
  . . . . . . .
  . X X X X X .
  . X O X . X .
  . . O . X . .
  . . . . . . .
```

*What just happened:* one move created two threats. The opponent has one move to answer, so one threat always succeeds.

### The ladder

A **ladder** is a chase. A group in atari extends, which gives it two liberties, and the attacker puts it in atari again. This repeats along a diagonal staircase. White to play in this position:

```text
    1 2 3 4 5 6 7 8 9
  1 . . . . . . . . .
  2 . . . . . . . . .
  3 . . . O O . . . .
  4 . . O X . . . . .
  5 . . . . . . . . .
  6 . . . . . . . . .
  7 . . . . . . . . .
  8 . . . . . . . . .
  9 . . . . . . . . .
```

White ataris from below, Black extends, White ataris again, and so on. If every White move is atari, the chase runs diagonally to the edge. Here is the board after White has chased to the bottom right:

```text
    1 2 3 4 5 6 7 8 9
  1 . . . . . . . . .
  2 . . . . . . . . .
  3 . . . O O . . . .
  4 . . O X X O . . .
  5 . . . O X X O . .
  6 . . . . O X X O .
  7 . . . . . O X X O
  8 . . . . . . O X X
  9 . . . . . . . O .
```

The Black chain has one liberty, at row 9, column 9, and cannot take it: playing there would leave the chain with no liberties. White captures the whole chain next move.

Reading a ladder is mechanical, and that is its danger: **check where it ends before you start it**. A ladder works for the chaser only if nothing helps the runner on the diagonal.

### The ladder breaker

A **ladder breaker** is a stone already on the path. Add one Black stone at row 7, column 7 and run the same chase:

```text
    1 2 3 4 5 6 7 8 9
  1 . . . . . . . . .
  2 . . . . . . . . .
  3 . . . O O . . . .
  4 . . O X X O . . .
  5 . . . O X X O . .
  6 . . . . O X X . .
  7 . . . . . O X . .
  8 . . . . . . . . .
  9 . . . . . . . . .
```

The runner joins the breaker. The group now has seven stones and three liberties, so White's chase is over. White should not start this ladder. Every ladder question comes down to: "is there a stone of the runner's color near the diagonal path?"

### The snapback

A **snapback** is a sacrifice. You let the opponent capture one stone, and in doing so they leave a bigger group with a single liberty, which you then capture. Study this corner. White's two stones have two liberties, at the corner and directly below it:

```text
  +---------
  | . O X .
  | . O X .
  | X X . .
  | . . . .
```

Black throws a stone into the corner:

```text
  +---------
  | X O X .
  | . O X .
  | X X . .
  | . . . .
```

The Black stone has one liberty, the point below it, and White can capture it there:

```text
  +---------
  | . O X .
  | O O X .
  | X X . .
  | . . . .
```

But look at what White's capturing stone did: all three White stones now have a single liberty, the corner. Black plays the corner again, which captures all three:

```text
  +---------
  | X . X .
  | . . X .
  | X X . .
  | . . . .
```

*What just happened:* Black gave up one stone and took three. If White declines to capture the thrown-in stone, Black captures the two White stones by playing below it instead. Either way White loses.

> 💡 **Key point.** A snapback needs the capturing stone to end up in atari itself. If a sacrifice is not followed by an immediate recapture, it is a plain loss.

Snapback and ko look alike (a capture followed by a recapture) but differ: in a snapback the recapture takes more stones, and the position does not repeat, so no ko rule applies.

## Your turn: shape and checking

Check yourself before moving on:

```quiz
[
  {
    "q": "Why are corners usually played before the center in the opening?",
    "choices": ["The rules require it", "The edges act as free walls, so the same area takes fewer stones to claim", "Corner stones can never be captured"],
    "answer": 1,
    "explain": "Sealing a 3x3 area takes 6 stones in a corner, 9 on a side and 12 in the center, because the edges do part of the work."
  },
  {
    "q": "What makes a double atari work?",
    "choices": ["The opponent cannot answer both threats with one move", "It captures two stones immediately", "It is the same as ko"],
    "answer": 0,
    "explain": "One move puts two groups in atari. The opponent saves one and you capture the other."
  },
  {
    "q": "You are about to chase a ladder. What must you check first?",
    "choices": ["Whether any stone of the runner's color already sits on the diagonal path", "Whether it is move 10 yet", "How many prisoners you have"],
    "answer": 0,
    "explain": "A ladder breaker lets the runner connect and escape, which turns the chase into a loss for the chaser."
  }
]
```

## Recap

1. The same area needs 6 stones in a corner, 9 on a side and 12 in the center, so corners come first, then sides.
2. A tesuji is a tactical move found by reading, not by pattern alone.
3. Double atari threatens two groups at once; the opponent can save only one.
4. A ladder is a diagonal chase of ataris; it works only if no stone of the runner's color is on the path (a ladder breaker).
5. A snapback sacrifices one stone so the capturer ends up in atari and you recapture a larger group.

Next up, [Reading Ahead, and How AlphaGo Changed Go](06-reading-ahead-and-alphago.md): how to think several moves deep, and how a program learned to do it better than any human.
