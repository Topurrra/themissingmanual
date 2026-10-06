---
title: "Endgame Essentials"
guide: "chess-from-zero"
phase: 6
summary: "Learn why the king becomes an attacking piece in the endgame, how opposition and key squares decide king and pawn endings, the square of the pawn, and why a rook pawn can draw."
tags: [chess, endgame, king-and-pawn, opposition, key-squares, square-of-the-pawn, rook-pawn]
difficulty: intermediate
synonyms: ["chess endgame basics", "what is opposition in chess", "what is the square of the pawn", "king and pawn endgame", "why is the king strong in the endgame", "rook pawn draw chess", "how to win a pawn endgame", "chess endgame tips"]
updated: 2026-10-06
---

# Endgame Essentials

When most pieces come off the board, the game becomes a race, and the winner is often decided by a single tempo. A pawn that would win in one position draws in another that looks identical, with the difference being whose turn it is. Players who have not studied the endgame lose half points here that were theirs to keep. The ideas below are small, and they apply to every ending.

All positions in this phase were solved by program: for each king and pawn position the result (win or draw) is exact, for either side to move.

## Activate the king

In the opening and middlegame the king hides, because checkmate threats are everywhere. With few pieces left there is almost nothing to checkmate it with, and the king becomes strong: it attacks pawns, guards squares, and escorts a passed pawn. **In most endgames, bring your king to the center and toward the action.** A king that stays at home gets beaten by one that does not.

## Opposition

The **opposition** is a position where the two kings face each other on the same file (or rank) with one square between them. The player who has to move must step aside and lets the other king advance. Having the opposition means it is your opponent's turn when the kings face each other.

Why does this matter? A king in front of a pawn needs to reach certain squares to promote it. If the defending king can hold the opposition, it stops the attacker getting there.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . . . K . . .  5
4 . . . . P . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

White's king is on e5 and the pawn on e4, with Black's king on e8. Whose move it is decides the result:

- **White to move wins.** Any of `Kd6`, `Ke6`, or `Kf6` takes the key squares and wins. (Every other king move only draws.)
- **Black to move draws.** Black plays `Ke7`, the only drawing move: it takes the opposition, with the kings on e5 and e7 facing each other and White to move. White cannot make progress.

Two identical positions, opposite result, and the only difference is a single move. That is what "gaining a tempo" means in the endgame.

## Key squares

Every pawn has **key squares**: if the attacking king reaches one of them, ahead of the pawn, the pawn promotes whoever moves, unless the defending king can capture the pawn first (rook pawns are an exception, see below). For a white pawn on e4, the key squares are d6, e6, and f6. A program confirmed it: with the white king on any of those three and the pawn on e4, White wins from every position of the black king except those where the black king is next to the pawn and can take it on its move. This is why `Kd6`, `Ke6`, and `Kf6` win in the example above.

A related pattern is the king on the sixth rank in front of a pawn on the fifth. With White's king on e6, pawn on e5, and Black's king on e8, White wins whoever is to move.

## The square of the pawn

Suppose a passed pawn runs for the promotion square and the enemy king is far away. Can the king catch it? There is a simple test. Draw a square with the pawn's path as one side, as many steps long as the pawn needs moves to promote. **If the defending king can step into the square on its own move, it catches the pawn.**

```text
  a b c d e f g h
8 . . . . . . . .  8
7 . . . . . . . .  7
6 . . . . . . k .  6
5 . . . . . . . .  5
4 . . P . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 K . . . . . . .  1
  a b c d e f g h
```

White's pawn on c4 needs 4 moves to promote on c8, so the square is 5 by 5 squares, from c4 to g8 (files c to g, ranks 4 to 8). Black's king is on g6, inside the square, and Black to move. Black draws: the king runs back in time and captures or blocks the pawn. Now move the king one square out:

```text
  a b c d e f g h
8 . . . . . . . .  8
7 . . . . . . . .  7
6 . . . . . . . k  6
5 . . . . . . . .  5
4 . . P . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 K . . . . . . .  1
  a b c d e f g h
```

With the king on h6, outside the square, the same position is lost: the pawn promotes before the king arrives. (In both positions the white king is far away on a1.)

Two cautions. First, the square counts the pawn's moves when it is the defender's turn. If it is the pawn's side to move, the square is smaller. Second, the rule assumes the attacking king is far away. A nearby king can escort the pawn and change the result.

## The rook pawn exception

A pawn on the a- or h-file is special, because the attacking king can approach it from only one side. A defender that reaches the corner in front of the pawn can hold a draw by blocking or stalemate there. For example, White king on f6, pawn on h5, and Black king on h8:

```text
  a b c d e f g h
8 . . . . . . . k  8
7 . . . . . . . .  7
6 . . . . . K . .  6
5 . . . . . . . P  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

This is a draw whoever moves, even though White is ahead a pawn. The black king shuttles between h8 and g8 and cannot be driven out of the corner. As the defender, head for that corner.

## What is left for later

Rook endings are the most common endings in real games, and two famous positions, the **Lucena** (a winning method with a rook and pawn against a rook) and the **Philidor** (a drawing defense), belong to the next level of study. We do not include them here, because they need to be taught exactly, with every move, and that is a guide of its own.

Check yourself before moving on:

```quiz
[
  {"q": "In the endgame, where should you generally bring your king?", "choices": ["Keep it in the corner, because it can still be checkmated", "Toward the center and the pawns, because few pieces remain to attack it", "Behind your own passed pawn at all times", "Next to the enemy queen"], "answer": 1, "explain": "With few pieces on the board, a king is hard to attack and very strong, so it should join the fight."},
  {"q": "White: king e5, pawn e4. Black: king e8. Black is to move. What result is correct play?", "choices": ["White wins whatever Black does", "Black plays Ke7 and draws", "Black loses because the pawn cannot be stopped", "It is a draw, but only because of a stalemate trick"], "answer": 1, "explain": "Ke7 takes the opposition with White to move, and the pawn cannot make progress. With White to move in the same position, White wins."},
  {"q": "A white pawn on c4 runs to c8 and Black to move has a king on h6 and White's king is far away. Is the black king in the square?", "choices": ["Yes, because it is on the sixth rank", "No, because the square only runs from c to g", "Yes, because the king is on a rank between 4 and 8", "It depends on whether White moves first"], "answer": 1, "explain": "The pawn needs 4 moves to promote, so the square is 5 by 5 squares and covers files c to g. The h-file is outside it."}
]
```

## Recap

1. In the endgame the king is a fighter: bring it to the center.
2. The opposition (kings facing with one square between) is decided by whose turn it is, and one move can flip a win into a draw.
3. A king that reaches a key square in front of its pawn wins.
4. The square of the pawn tells you if the defending king can catch a running pawn: the king must be inside the square when it is its move.
5. A rook pawn often draws, because the defender can shelter in the corner.

Next up, [Learning From an Engine](07-learning-from-an-engine.md): how to use Stockfish as a coach.
