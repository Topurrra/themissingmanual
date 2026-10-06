---
title: "The Board, the Pieces, and the Numbers"
guide: "checkers-from-zero"
phase: 1
summary: "The exact rules of American checkers: setup, how men and kings move, how jumping and crowning work, how a game ends, and the 1 to 32 numbering used to write moves down."
tags: [checkers, rules, notation, board-games]
difficulty: beginner
synonyms: ["checkers rules", "how do you move in checkers", "checkers square numbers", "how to write checkers moves", "how does a man become a king", "who moves first in checkers", "how does a checkers game end"]
updated: 2026-10-06
---

# The Board, the Pieces, and the Numbers

Almost everyone knows checkers "roughly," and the rough version is where the arguments start. Can a king jump backward? Do you have to jump? What if you land on the last row in the middle of a multiple jump? This phase pins every rule down, then gives you the numbering that lets you write a game on a napkin and read any checkers book.

## The board and the start

The board is 8x8, but only the 32 dark squares are used. Pieces never stand on a light square. Turn the board so that each player has a dark square in the near left corner.

Each side starts with 12 pieces, called **men**, on the dark squares of the three rows nearest that player. The two middle rows start empty. **Black moves first**, then the players alternate. (The official rulebook calls the first mover's color Red; this guide uses Black and White, like the site's game.)

```text
Black men (b) start at the top, White men (w) at the bottom. Dots are empty dark squares:

    b     b     b     b
 b     b     b     b
    b     b     b     b
 .     .     .     .
    .     .     .     .
 w     w     w     w
    w     w     w     w
 w     w     w     w
```

Black moves down the board; White moves up. "Forward" always means toward the enemy's side.

## How pieces move

- A **man** moves one square diagonally forward onto an empty dark square. Never sideways, never backward.
- A man that reaches the far row, the **king row**, is **crowned** and becomes a **king**. A king moves one square diagonally in any of the four directions. Crowned pieces are traditionally marked by stacking a second piece on top.

Kings in this game take one step at a time. In international draughts and some other variants, a "flying king" can slide any distance along a diagonal. Not here.

## The numbers: reading and writing games

Every dark square has a number from 1 to 32, counted left to right and top to bottom as the board looks with Black at the top:

```text
    1     2     3     4
 5     6     7     8
    9    10    11    12
13    14    15    16
   17    18    19    20
21    22    23    24
   25    26    27    28
29    30    31    32
```

Black's home row is squares 1 to 4 and White's is 29 to 32. A move is written **from-to**: `11-15` means "the piece on 11 moves to 15." Because the board is the same every game, the numbers carry all the information.

Black's seven possible first moves are `9-13`, `9-14`, `10-14`, `10-15`, `11-15`, `11-16`, and `12-16`. Notice there is no single "add 4" rule, because the rows are staggered. A Black man on squares 1-4, 9-12, 17-20, or 25-28 steps to the number 4 or 5 higher; on squares 5-8, 13-16, or 21-24 it steps to the number 3 or 4 higher. A man on the edge of the board has only one of the two steps. For White, subtract instead.

One more piece of vocabulary, because it matters in the endgame. The long diagonal from corner to corner (`29-25-22-18-15-11-8-4`) is called the **main road**. The other two corners of the board each hold a pair of dark squares side by side (`1` and `5`, and `28` and `32`) and are called the **double corners**.

## Jumping

If an enemy piece stands on a diagonally adjacent square and the square directly behind it, on the same diagonal, is empty, your piece may **jump** over it, land on the empty square, and the enemy piece is removed. Men jump forward only. Kings jump in all four directions. A capture is written with an `x`: `14x23`.

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     b     .     .
    .     w     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 14; White men: 18
```

Black to move. The Black man on 14 jumps the White man on 18 and lands on 23: `14x23`.

## Multiple jumps

If, after landing, the same piece can jump again, it **must** keep going until no more jumps are available. You cannot stop partway and you cannot switch to a different piece mid-move. A chain is written with every landing square: `10x17x26`.

```text
    .     .     .     .
 .     .     .     .
    .     b     .     .
 .     w     .     .
    .     .     .     .
 .     w     .     .
    .     .     .     .
 .     .     .     .

Black men: 10; White men: 14, 22
```

Black to move. The man on 10 jumps the man on 14 and lands on 17, then jumps the man on 22 and lands on 26. Both White men are gone in one turn.

## Crowning ends the move

When a man reaches the king row by jumping, it becomes a king, and the move **ends there**. The new king may not continue jumping until its next turn, even if another capture is lined up.

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     b     .     .
    .     w     w     .
 .     .     .     .

Black men: 22; White men: 26, 27
```

Black to move. The man on 22 jumps 26 and lands on 31, the king row, and is crowned. Once a king, it could jump the White man on 27 (landing on 24, which is empty), but the turn is over. White gets a move first and can respond to the threat.

## When is a game over?

- **A win:** your opponent has no legal move on their turn. That happens when all their pieces are captured, or when every remaining piece is blocked. A player also wins when the opponent resigns.
- **A draw:** both players agree. The site's game also lets a player claim a draw when the same position (with the same side to move) has occurred three times, or when 40 moves by each side pass with no capture and no man move. The official rules have similar limits. They exist to stop endless shuffling.

Notice what is missing: there is no "check" and no pass. If you have a legal move you must make one, and if the only legal moves are bad, you still must make one. That fact powers the next phase and Phase 4.

Check yourself before moving on:

```quiz
[
  {"q": "A Black man stands on square 10 with both squares ahead of it empty. Where can it move?", "choices": ["13 or 14", "14 or 15", "6 or 7", "14 only"], "answer": 1, "explain": "Square 10 is in the row 9-12, so a Black man steps to the number 4 or 5 higher: 14 or 15. Squares 6 and 7 are behind it, and men never move backward."},
  {"q": "A man jumps into the king row on its second jump of a chain, and another enemy piece is lined up for a third jump. What happens?", "choices": ["It must take the third jump too", "It is crowned and the move ends", "It stays a man until the chain finishes", "The jump is illegal and must be undone"], "answer": 1, "explain": "A man that reaches the king row by a capture is crowned there and its move ends. The new king cannot jump again until its next turn."},
  {"q": "Which of these is a complete way a game can end by the rules?", "choices": ["A player runs out of legal moves", "A player gets a king first", "A player captures the first piece", "A player reaches the middle of the board"], "answer": 0, "explain": "A player who has no legal move on their turn loses, because all their pieces are gone or blocked. Getting a king or the first capture does not end the game."}
]
```

## Recap

1. The board is 8x8, only the 32 dark squares are used, each side starts with 12 men, and Black moves first.
2. Men move and jump one square diagonally forward; kings move and jump one square in all four directions.
3. Squares are numbered 1 to 32 from Black's side, and a move is written from-to (`11-15`), a capture with an `x` (`14x23`, `10x17x26`).
4. A multiple jump must be completed, and a man that is crowned during a capture stops there.
5. You win when your opponent has no legal move.

Next up, [Forced Captures: The Rule That Makes Checkers Tactical](02-forced-captures.md): the one rule that turns your opponent's moves into your weapon.
