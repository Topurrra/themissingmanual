---
title: "The Board and the Pieces"
guide: "chess-from-zero"
phase: 1
summary: "Set up the board correctly, name every square, and learn exactly how the king, queen, rook, bishop, knight, and pawn move and capture."
tags: [chess, board, pieces, moves, rules, beginner-friendly]
difficulty: beginner
synonyms: ["how do chess pieces move", "how to set up a chess board", "chess board setup", "how does a knight move in chess", "what are the chess piece values", "how do pawns capture in chess"]
updated: 2026-10-06
---

# The Board and the Pieces

Chess has six kinds of pieces and one board, and every rule in the game grows from how those pieces move. Get this phase exact and the rest is built on rock. Get it fuzzy and you will keep losing pieces to moves you did not know existed.

## The board and how to set it up

The board is an 8 by 8 grid of 64 squares, alternating light and dark. Two checks keep you from setting it up backwards:

- **A light square sits at each player's right-hand corner.** Rotate the board until that is true for you.
- **Each queen starts on her own color.** The white queen starts on a light square (d1), the black queen on a dark one (d8).

Columns are called **files** and are lettered a to h from White's left. Rows are called **ranks** and are numbered 1 to 8 from White's side. Every square has a name made of its file and rank: the bottom-left corner is a1, the top-right corner is h8. This is how you will read moves in [phase 3](03-notation-and-basic-checkmates.md).

```text
  a b c d e f g h
8 r n b q k b n r  8
7 p p p p p p p p  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 P P P P P P P P  2
1 R N B Q K B N R  1
  a b c d e f g h
```

Capital letters are White's pieces, lowercase are Black's, and a dot is an empty square. K is king, Q queen, R rook, B bishop, N knight (K was taken), P pawn. We use this style for every diagram in the guide. White always moves first, and the players alternate one move at a time.

The goal is to **checkmate** the opponent's king: attack it so that it cannot escape. You never capture the king; the game ends one move earlier. Phase 2 makes that exact.

## How each piece moves

Pieces move onto an empty square or capture an enemy piece by landing on its square. You can never land on a square holding your own piece. All pieces except the knight are blocked by anything in their path.

In each diagram below, the piece is alone on d4 of an empty board, and `*` marks every square it can reach.

**The rook** moves any number of squares along a rank or file. 14 squares from anywhere on an empty board.

```text
  a b c d e f g h
8 . . . * . . . .  8
7 . . . * . . . .  7
6 . . . * . . . .  6
5 . . . * . . . .  5
4 * * * R * * * *  4
3 . . . * . . . .  3
2 . . . * . . . .  2
1 . . . * . . . .  1
  a b c d e f g h
```

**The bishop** moves any number of squares along a diagonal. Because it moves diagonally, **a bishop stays on its starting square color for the whole game**. You have a light-squared bishop and a dark-squared one, and each can only ever touch half the board.

```text
  a b c d e f g h
8 . . . . . . . *  8
7 * . . . . . * .  7
6 . * . . . * . .  6
5 . . * . * . . .  5
4 . . . B . . . .  4
3 . . * . * . . .  3
2 . * . . . * . .  2
1 * . . . . . * .  1
  a b c d e f g h
```

**The queen** moves like a rook and a bishop combined. She is the strongest piece, with 27 reachable squares from d4 on an empty board.

```text
  a b c d e f g h
8 . . . * . . . *  8
7 * . . * . . * .  7
6 . * . * . * . .  6
5 . . * * * . . .  5
4 * * * Q * * * *  4
3 . . * * * . . .  3
2 . * . * . * . .  2
1 * . . * . . * .  1
  a b c d e f g h
```

**The knight** moves in an "L": two squares in one direction and one square at right angles. It is the only piece that **jumps over other pieces**, so it is never blocked. It always lands on a square of the opposite color from where it started.

```text
  a b c d e f g h
8 . . . . . . . .  8
7 . . . . . . . .  7
6 . . * . * . . .  6
5 . * . . . * . .  5
4 . . . N . . . .  4
3 . * . . . * . .  3
2 . . * . * . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

At the start of the game, the knight on g1 can go to f3 or h3. It cannot go to e2, because its own pawn is there. (It jumps over pieces, but it still cannot land on a friendly one.)

**The king** moves one square in any direction. A king may never move onto a square attacked by an enemy piece, and two kings may never stand next to each other.

```text
  a b c d e f g h
8 . . . . . . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . * * * . . .  5
4 . . * K * . . .  4
3 . . * * * . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

## The pawn is the odd one

Pawns are the only pieces whose capture is different from their move, and the only ones that never move backward.

- A pawn moves **one square straight forward**, onto an empty square.
- From its starting square it may instead move **two squares forward**, if both squares are empty.
- A pawn **captures one square diagonally forward**, and only if an enemy piece is there. It can never capture straight ahead, so two pawns facing each other on a file block each other.

A pawn that reaches the far rank is **promoted**, and a pawn can also capture in one more special way. Both are covered in phase 2.

At the starting position, White has 16 pieces and a total of exactly **20 legal first moves**: 16 pawn moves (each of eight pawns moves one or two squares) and 4 knight moves (each knight to one of two squares).

## What the pieces are worth

Players use point values to judge trades. These are a convention, a rough guide and not a law:

| Piece | Points |
|---|---|
| Pawn | 1 |
| Knight | 3 |
| Bishop | 3 |
| Rook | 5 |
| Queen | 9 |

The king has no value because it can never be traded. Use the numbers to answer "am I winning this trade?" Giving up a rook (5) to capture a bishop and a knight (6) is a good deal. A bishop (3) for a pawn (1) is not, unless something else is happening. Later phases will show you when position beats points, but start by counting.

Check yourself before moving on:

```quiz
[
  {"q": "Which statement about the bishop is true?", "choices": ["It can switch between light and dark squares by moving to the edge", "It stays on the same color of square for the whole game", "It can jump over pieces like the knight", "It captures straight ahead like a pawn"], "answer": 1, "explain": "A bishop moves only diagonally, and a diagonal step always lands on the same square color. Each player's two bishops cover opposite colors."},
  {"q": "A white pawn on e4 has an enemy pawn directly in front of it on e5 and an enemy knight on d5. What can the e4 pawn do?", "choices": ["Capture the e5 pawn", "Capture the d5 knight", "Move to e6", "Nothing at all"], "answer": 1, "explain": "Pawns capture diagonally forward, so the pawn on e4 can capture on d5 (or f5). It cannot capture or move through the pawn straight ahead."},
  {"q": "How many legal moves does White have from the starting position?", "choices": ["16", "18", "20", "24"], "answer": 2, "explain": "Eight pawns each have two moves (one square or two) for 16, plus two knights with two moves each for 4. Total 20."}
]
```

## Recap

1. The board is 8 by 8; a light square is at each player's right-hand corner, and each queen starts on her own color.
2. Squares are named by file (a to h) and rank (1 to 8); capitals are White and lowercase is Black in our diagrams.
3. Rooks move on ranks and files, bishops on diagonals (staying on one color), queens do both, kings take one step, and knights jump in an L.
4. Pawns move forward one square (two from the start) and capture one square diagonally forward.
5. Point values (1, 3, 3, 5, 9) are a handy guide for trades, not a law.

Next up, [Special Moves, Check, and How Games End](02-special-moves-and-how-games-end.md): castling, en passant, promotion, and the many ways a game stops.
