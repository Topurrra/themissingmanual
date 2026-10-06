---
title: "Strategy: Center, King Row, Tempo, and the Move"
guide: "checkers-from-zero"
phase: 4
summary: "What to aim for when no shot is on the board: keep men backed up, hold the center, guard your king row with the bridge, and count tempo so you are not the player forced to move."
tags: [checkers, strategy, center, bridge, tempo, opposition]
difficulty: intermediate
synonyms: ["checkers strategy", "how to win at checkers", "what is the bridge in checkers", "what is the opposition in checkers", "checkers center control", "what is tempo in checkers", "checkers back row defense", "best checkers opening plan"]
updated: 2026-10-06
---

# Strategy: Center, King Row, Tempo, and the Move

Most moves in a checkers game are not shots. You are choosing between quiet moves, and nothing on the board tells you which one is right. This phase gives you the principles strong players use to choose. They are rules of thumb, not theorems: checkers is a draw with perfect play (Phase 5), so no principle wins by itself, but ignoring them hands your opponent the chances.

## Pieces that back each other

One fact from the jumping rule drives most of checkers strategy: **a piece can only be jumped if the square directly behind it is empty.** A man with a friend standing on the far side of it is safe from that direction. So you aim to move in connected groups, where every man has a neighbor on the squares behind it, and you avoid sending a lone man forward where the square behind it is open.

This also explains why shots work: they need an empty square behind a target. When you plan a move, look at the squares behind your pieces first.

## The center and the edges

The four central dark squares are **14, 15, 18, and 19**. A man there has two ways forward, supports pieces on both sides, and eyes many squares. A man on the edge has only one way forward, and a piece on the edge squares (the columns holding 5, 13, 21, 29 and 4, 12, 20, 28, and the top and bottom rows) can **never be jumped**, because there is no square behind it. That makes edge pieces safe, and also passive.

The working advice: put men in the center when you can support them, and use the edges for pieces you want to park. A common beginner mistake is to push everything down the sides because it feels safe, and then run out of useful moves (see tempo below).

## Guard your king row: the bridge

The enemy needs to reach your king row to crown a man. Black's king row is squares 1-4. A White man gets there only by first standing on one of 5, 6, 7, or 8. The classic defense for Black is to keep men on **1 and 3**, called the **bridge**. (For White, the matching squares are **30 and 32**.)

```text
    b     .     b     .
 .     w     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 1, 3; White men: 6
```

Black to move. A White man has stepped onto 6, hoping to slip to 2 and crown. But Black's man on 1 jumps it: `1x10`, because 10 is empty behind it. In the same way, the man on 3 covers 7 (landing on 10) and 8 (landing on 12). A White man on 5 can only step to 1, which is occupied, so it is stuck.

So with the bridge in place, every approach square is covered. The defense only holds while the landing squares 10 and 12 stay empty. If an enemy man or your own man stands on them, the jumps are blocked, and the bridge leaks. This is also why you do not rush your back men out: each one you move weakens the guard, so most players move them last.

## Tempo and the move

A **tempo** is one move of a man. Every man has a limited number of forward steps before it reaches the end of its journey or runs into contact. In a crowded position, the side with more safe waiting moves can sit still and let the opponent run out first. When a player has only bad moves left, being **on the move** (having to move) is a disadvantage. Checkers players talk about "the move" and "the opposition" for this fight over who must give way. Chess players call a position where any move is bad **zugzwang**, a German word meaning "compulsion to move."

Here is the idea in its purest form, a position where whoever must move loses.

```text
    .     .     b     .
 b     .     .     .
    .     .     w     .
 w     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 3, 5; White men: 11, 13
```

Black men on 3 and 5, White men on 11 and 13. Nobody has a capture. Look at what each step does:

- **Black to move.** Every move loses. After `3-7`, White's man on 11 jumps it `11x2` and is crowned. Black's only remaining piece plays `5-9`, and White's man on 13 jumps `13x6`. Black has no pieces left. The other two Black first moves, `3-8` and `5-9`, lose as well.
- **White to move.** The same, mirrored. After `11-7`, Black's man on 3 jumps it `3x10`. White's only piece plays `13-9`, and Black's man on 5 jumps `5x14`. White has nothing left.

Whoever has to move steps into a capture, so each side wants the **other** to be on the move. We checked this by listing every move and following every forced reply to the end, so it is a real result, not a trick of the picture.

Real games are messier, but the principle is the same. In a locked position, count the safe moves each side has left. If you can make a safe move and your opponent cannot, you win the standoff. This is why a player who has already moved most of their men forward is often in trouble: they have used up their waiting moves.

Check yourself before moving on:

```quiz
[
  {"q": "A White man stands on 6 and Black has men on 1 and 3 with 10 empty. What can Black do?", "choices": ["Nothing, White man is safe", "Jump it with 1x10", "Jump it with 3x10", "Move the man on 3 to 7"], "answer": 1, "explain": "The man on 1 jumps over 6 and lands on 10 (empty). That is the bridge at work. Because the capture is mandatory, Black must jump. The man on 3 does not touch square 6."},
  {"q": "Why can a piece on the edge of the board never be jumped?", "choices": ["Edge pieces are protected by a special rule", "A jump needs an empty landing square behind the piece, and past the edge there is none", "Edge pieces are always kings", "Only the center can be attacked"], "answer": 1, "explain": "To jump a piece you land directly behind it on the same diagonal. Behind an edge piece there is no square at all."},
  {"q": "In the position with Black men on 3 and 5 and White men on 11 and 13, who is better off?", "choices": ["Whoever is on the move", "Whoever is not on the move", "Black always", "Neither side loses material either way"], "answer": 1, "explain": "Any move steps into a capture, so the player to move loses material. The player who is not on the move wins that standoff."}
]
```

## Recap

1. A piece can only be jumped if the square behind it is empty, so keep pieces backing each other.
2. Prefer the center (14, 15, 18, 19); edge pieces cannot be jumped but have few moves.
3. The bridge (men on 1 and 3 for Black, 30 and 32 for White) covers every square an enemy man needs to reach before crowning, as long as the landing squares stay empty.
4. Tempo is a count of safe waiting moves; in a locked position the side that runs out first must give way.
5. Having to move can be a burden: a player whose every move steps into a capture is in zugzwang.

Next up, [Endgames and the Solved Game](05-endgames-and-the-solved-game.md): kings against kings, and what happens when a computer plays checkers perfectly.
