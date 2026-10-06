---
title: "Special Moves, Check, and How Games End"
guide: "chess-from-zero"
phase: 2
summary: "Castling, en passant, and promotion with their exact conditions, then check, checkmate, stalemate, and every way a game can be drawn under the FIDE Laws."
tags: [chess, castling, en-passant, promotion, check, checkmate, stalemate, draw-rules]
difficulty: beginner
synonyms: ["when can you castle in chess", "what is en passant", "chess promotion rules", "stalemate vs checkmate", "threefold repetition", "fifty move rule chess", "how can a chess game end in a draw", "what is check in chess"]
updated: 2026-10-06
---

# Special Moves, Check, and How Games End

Almost every beginner argument over a chessboard is about one of three moves (castling, en passant, promotion) or one of the endings (stalemate, draws). They look like odd exceptions, and they are, but each has a precise rule. Learn the rules once and no one can bluff you.

## Check and checkmate

A king is **in check** when an enemy piece attacks its square. You are never allowed to leave your own king in check, so when you are checked you must respond. There are exactly three ways:

1. **Move the king** to a square that is not attacked.
2. **Capture** the piece giving check.
3. **Block** the line between the checking piece and your king. (You cannot block a knight, which jumps, and you cannot block a pawn's or king's check since they are adjacent.)

```text
  a b c d e f g h
8 . . . . r . k .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . B . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . K . . .  1
  a b c d e f g h
```

White is in check from the rook on e8. White has six legal moves, one of each kind of answer: the capture `Bxe8`, the block `Be2`, and the king moves `Kd1`, `Kd2`, `Kf1`, and `Kf2`. (We read these in phase 3.)

**Checkmate** is check with none of those three answers. The game ends and the side that delivered the mate wins. The simplest example is the back-rank mate, where a king trapped behind its own pawns is checked along the first rank:

```text
  a b c d e f g h
8 . . . . . . k .  8
7 . . . . . p p p  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 R . . . K . . .  1
  a b c d e f g h
```

White plays Ra8. The rook checks along the 8th rank. The black king cannot step to f7, g7, or h7 because its own pawns are there, nothing can block between a8 and g8, and nothing can capture the rook. That is checkmate.

## Castling

Castling is the only move where you move two pieces at once, and the only way to get the king to safety and a rook into the game in one move. The king moves **two squares toward a rook**, and that rook jumps over the king to the square next to it. Castling toward the h-file rook is "kingside" and toward the a-file rook is "queenside".

All of these must be true (FIDE Laws, Article 3.8):

- **The king and that rook have not moved** at any point earlier in the game. If either has moved, even if it came back, that side of castling is gone for good.
- **Every square between them is empty.**
- **The king is not in check**, does not pass over an attacked square, and does not land on an attacked square.

Two surprises: the rook is allowed to be attacked, and on the queenside the square next to the rook (b1 for White) may be attacked, because the king never touches it.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . b . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 R . . . K . . R  1
  a b c d e f g h
```

Here White cannot castle kingside: the bishop on c4 attacks f1, a square the king would cross. White can castle queenside. The king goes to c1, the rook to d1, and neither square is attacked.

## En passant

"En passant" is French for "in passing". It fixes one loophole: the two-square pawn move would let a pawn dodge past an enemy pawn that could have captured it on the one-square step. The rule: if a pawn moves two squares from its starting rank and lands **directly beside an enemy pawn** (on the same rank, adjacent file), that enemy pawn may capture it as if it had moved only one square. **You must do it immediately, on the very next move, or the right is gone.**

```text
  a b c d e f g h
8 r n b q k b n r  8
7 . p p . p p p p  7
6 p . . . . . . .  6
5 . . . p P . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 P P P P . P P P  2
1 R N B Q K B N R  1
  a b c d e f g h
```

This arose from 1.e4 a6 2.e5 d5. Black's d-pawn jumped two squares and landed beside White's pawn on e5. White can capture it with `exd6`: the e5 pawn moves to d6, the black pawn on d5 is removed even though the capturing pawn did not land on it. If White plays any other move first, `exd6` is no longer allowed.

## Promotion

When a pawn reaches the far rank, it must be exchanged for a queen, rook, bishop, or knight of its own color. You choose, whatever is already on the board, so you can have two or more queens. Almost always you choose a queen.

Sometimes a knight is better. In this position, White to move can promote with `e8=N+`:

```text
  a b c d e f g h
8 . . . . . . . .  8
7 . . q . P . k .  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 K . . . . . . .  1
  a b c d e f g h
```

The new knight on e8 attacks both the king on g7 and the queen on c7. Black must answer the check with a king move, and then the knight takes the queen. (Each of Black's seven legal replies was checked: the knight takes on c7 every time.) This is called **underpromotion**.

## Stalemate and the draws

A game does not have to end in a win. **Stalemate**: the player to move is not in check but has no legal move at all. The game is a draw, and the player with the extra material did not win.

```text
  a b c d e f g h
8 k . . . . . . .  8
7 . . Q . . . . .  7
6 . K . . . . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

Black to move. The king on a8 is not attacked, but a7, b7, and b8 are all covered, and Black has no other piece. No legal move, no check: stalemate, a draw. White was a whole queen ahead and still did not win. You will see in [phase 3](03-notation-and-basic-checkmates.md) how to avoid this.

The FIDE Laws list these ways to draw:

- **Stalemate** (Article 5.2.1).
- **Agreement:** the players agree to a draw during the game (5.2.3).
- **Dead position:** a position arises where neither side can ever checkmate by any legal sequence of moves (5.2.2). Examples: king against king, king and bishop against king, king and knight against king, and king and bishop against king and bishop with both bishops on the same color. (King and two knights against a bare king is not a dead position, because mate is possible if the defender helps, though it can never be forced.)
- **Threefold repetition:** the same position arises at least three times (not necessarily in a row), with the same side to move and the same rights to castle and to capture en passant. A player who has the move can **claim** the draw (9.2).
- **Fifty-move rule:** if the last 50 moves by each player were made with no pawn move and no capture, the player to move can claim the draw (9.3).
- **Fivefold repetition and the 75-move rule:** at five repetitions, or if 75 moves by each side pass with no pawn move and no capture, the game is drawn automatically, no claim needed (9.6). The exception: if the last move delivers checkmate, the checkmate stands.

The difference between "claim" and "automatic" matters in real games: three times and 50 moves are options a player must ask for. Five times and 75 moves are enforced by the arbiter.

Check yourself before moving on:

```quiz
[
  {"q": "White's king and kingside rook have never moved, f1 and g1 are empty, but a black bishop attacks f1. Can White castle kingside?", "choices": ["Yes, because the king itself is not in check", "Yes, but only if the rook then captures the bishop", "No, because the king would pass over an attacked square", "No, because the rook has to be unattacked"], "answer": 2, "explain": "The king may not cross a square an enemy piece attacks. Being attacked on the way is enough to forbid castling, even if the king is not in check now."},
  {"q": "Black has moved a pawn two squares and landed beside White's pawn. White plays a different move first, then wants to capture en passant. Allowed?", "choices": ["Yes, at any time while the pawn stays there", "Yes, within the next two moves", "No, it is only allowed immediately on the next move", "No, en passant exists only for the d and e files"], "answer": 2, "explain": "En passant is available for exactly one move: the one right after the two-square advance."},
  {"q": "A player has a queen and a rook against a bare king. It is the bare king's turn, the king is not in check, and it has no legal move. What is the result?", "choices": ["The player with the queen wins", "It is a draw by stalemate", "The bare king loses on time", "The game continues with the same player to move"], "answer": 1, "explain": "No check plus no legal move is stalemate, which is always a draw regardless of how much material is on the board."}
]
```

## Recap

1. In check you have exactly three answers: move the king, capture the checker, or block. If none exists, it is checkmate.
2. Castling needs an unmoved king and rook, an empty path, and a king that is not in check and does not cross or land on an attacked square.
3. En passant must be played immediately or not at all.
4. A pawn reaching the far rank becomes a queen, rook, bishop, or knight of your choice, and a knight sometimes wins when a queen would not.
5. Stalemate (no check, no legal move) is a draw. Draws also come by agreement, dead position, threefold or fivefold repetition, and the 50- and 75-move rules.

Next up, [Notation and the Basic Checkmates](03-notation-and-basic-checkmates.md): the language of chess moves, and how to finish a won game without stalemating.
