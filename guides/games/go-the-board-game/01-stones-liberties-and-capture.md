---
title: "Stones, Liberties, and Capture"
guide: "go-the-board-game"
phase: 1
summary: "The whole mechanical core of Go: where stones go, what a liberty is, how groups are captured, what atari means, and the one move that is illegal."
tags: [go, rules, liberties, capture, atari, beginner-friendly]
difficulty: beginner
synonyms: ["how to play go", "what is a liberty in go", "what is atari in go", "how do you capture stones in go", "is suicide allowed in go", "go board 9x9 rules"]
updated: 2026-10-06
---

# Stones, Liberties, and Capture

If you can tell whether a stone is about to be captured, you can play Go. That is the whole skill of this phase: count one number, the liberties, and know what happens when it reaches zero. Everything else in the game, from eyes to territory, is built on top of that count.

## The board and the loop

Go is played on the **intersections** of a grid, not inside the squares. The full board is 19x19, but 13x13 and 9x9 boards exist for learning. Start on 9x9: games are short and the ideas are identical.

```text
    1 2 3 4 5 6 7 8 9
  1 . . . . . . . . .
  2 . . . . . . . . .
  3 . . + . . . + . .
  4 . . . . . . . . .
  5 . . . . + . . . .
  6 . . . . . . . . .
  7 . . + . . . + . .
  8 . . . . . . . . .
  9 . . . . . . . . .
```

The `+` marks are only landmarks printed on the board (called star points). Nothing about them is special in the rules.

The loop of the game:

1. **Black plays first.** Players alternate, placing one stone of their color on an empty intersection.
2. **A stone never moves** after it is placed. It stays until it is captured.
3. **You may pass** instead of placing a stone. Two passes in a row end the game (Phase 4 covers the ending and counting).

The goal is to surround more of the board than your opponent. Placing a stone does not capture anything by itself; capturing comes from the next idea.

## Liberties: a stone's breathing room

A **liberty** is an empty point directly next to a stone, up, down, left, or right. Diagonals do not count. A stone with liberties is safe for now. A stone with none is captured.

```text
    1 2 3 4 5 6 7 8 9
  1 X . . . X . . . .
  2 . . . . . . . . .
  3 . . . . . . . . .
  4 . . . . . . . . .
  5 . . . . X . . . .
  6 . . . . . . . . .
  7 . . . . . . . . .
  8 . . . . . . . . .
  9 . . . . . . . . .
```

Count them. The stone in the middle of the board, at the center, has **4** liberties. The stone on the top edge (row 1, column 5) has **3**, because the edge is a wall, not an empty point. The stone in the corner (row 1, column 1) has **2**. That is the first lesson of position: edges and corners take liberties away, so stones there are easier to capture and need less to defend.

## Groups share liberties

Stones of the same color that touch along a line (not diagonally) form a **group**. A group lives and dies as one unit and shares all its liberties.

```text
  . . . . . . . . .
  . X X . . . X . .
  . . . . . . . X .
  . . . . . . . . .
```

The two stones on the left form one group with **6** liberties together. The two stones on the right touch only at a corner, so they are not connected: each is its own group with 4 liberties, and the two groups share two of them.

That diagonal gap is called a **cutting point**. A group that is connected cannot be split. Two stones that are only diagonal can be separated if the opponent plays in the gap, which is why strong players think about connections constantly.

## Capture and atari

When the last liberty of a group is filled by the opponent, the whole group is removed from the board. Removed stones are called **prisoners** (they matter in Phase 4).

A group with exactly **one** liberty is in **atari**. Atari is a Japanese word, from the verb for "to hit": the group will be captured next move unless its owner does something. Here White's stone has one liberty, marked `a`:

```text
  . . . . .
  . . X . .
  . X O a .
  . . X . .
  . . . . .
```

Black plays at `a` and the White stone is captured:

```text
  . . . . .
  . . X . .
  . X . X .
  . . X . .
  . . . . .
```

*What just happened:* Black filled White's last liberty, so the White stone was lifted off the board and kept as a prisoner. The point it occupied is empty again.

Groups are captured whole. Here the two White stones share a single liberty at `a` along the top edge:

```text
  +-----------
  | . X X . .
  | X O O a .
  | . X X . .
  | . . . . .
```

After Black plays `a`, both stones go at once:

```text
  +-----------
  | . X X . .
  | X . . X .
  | . X X . .
  | . . . . .
```

## The one illegal move: suicide

You may not place a stone that leaves its own group with no liberties, unless that move captures something. Black cannot play at `a` here, because the stone would have no liberties and captures nothing (every White stone around it still has outside liberties):

```text
  . . . . .
  . . O . .
  . O a O .
  . . O . .
  . . . . .
```

But the same kind of move is legal when it captures. In this corner Black plays `a`, which has no liberty of its own, yet it takes the last liberty of both White stones and removes them:

```text
  +-------
  | a O X .
  | O X . .
  | X . . .
```

After the capture the Black stone has two liberties:

```text
  +-------
  | X . X .
  | . X . .
  | X . . .
```

The order matters: captures are resolved first, and only then is the new stone checked for liberties. That is why this move is legal. This rule ("suicide is not allowed") is the same in Japanese and most other rule sets, but be aware a few rule sets do allow it. We use the Japanese rule.

## Your turn: read the position

Check yourself before moving on:

```quiz
[
  {
    "q": "A single stone sits in the exact corner of the board with nothing around it. How many liberties does it have?",
    "choices": ["1", "2", "3", "4"],
    "answer": 1,
    "explain": "A corner stone has only two neighbors on the board, so it has two liberties. The edges take the others away."
  },
  {
    "q": "What does atari mean?",
    "choices": ["A group has exactly one liberty and will be captured next move if nothing changes", "A group was captured", "A move that is not allowed", "The end of the game"],
    "answer": 0,
    "explain": "Atari is a warning: one liberty left. It is not a capture yet."
  },
  {
    "q": "You place a stone where it has no liberties, but doing so removes an opposing group that had its last liberty there. Is the move legal?",
    "choices": ["No, suicide is never allowed", "Yes, because the capture happens first and gives the new stone liberties", "Only on the first move of the game"],
    "answer": 1,
    "explain": "Captures are resolved before the new stone is checked. The empty points left by the captured stones become the new stone's liberties."
  }
]
```

## Recap

1. Stones go on intersections, Black first, alternating; stones never move once placed, and you may pass.
2. A liberty is an empty point directly adjacent (not diagonal); edges and corners reduce liberties.
3. Connected stones form a group that shares liberties and is captured as a unit.
4. One liberty left means atari; filling the last liberty removes the group as prisoners.
5. A move that leaves your own group with no liberties is illegal, unless it captures something first.

Next up, [Ko, and Why It Exists](02-ko-and-why-it-exists.md): what happens when two players can capture each other's stone forever.
