---
title: "Notation and the Basic Checkmates"
guide: "chess-from-zero"
phase: 3
summary: "Read and write moves in algebraic notation, then learn to checkmate with king and queen or king and rook while avoiding the stalemate trap."
tags: [chess, notation, algebraic-notation, checkmate, king-and-queen, king-and-rook, stalemate]
difficulty: beginner
synonyms: ["how to read chess notation", "what does Nf3 mean in chess", "how to checkmate with king and queen", "how to checkmate with king and rook", "algebraic notation explained", "what does O-O mean in chess", "how to avoid stalemate in chess", "what do plus and hash mean in chess notation"]
updated: 2026-10-06
---

# Notation and the Basic Checkmates

Nearly every chess book, video, and engine uses one standard written language for moves, called algebraic notation. It looks like code the first time you see it, and it takes about ten minutes to learn. Then you spend the rest of the phase on the second thing that decides games between beginners: knowing how to turn a big advantage into an actual checkmate.

## Algebraic notation

A move is written as the piece letter plus the square it lands on. Pawns have no letter.

| Written | Meaning |
|---|---|
| `Nf3` | A knight moves to f3 |
| `e4` | A pawn moves to e4 |
| `Bxc6` | A bishop captures on c6 (`x` means capture) |
| `exd5` | The pawn from the e-file captures on d5 |
| `Qh5+` | The queen moves to h5, giving check |
| `Qxf7#` | The queen captures on f7, and it is checkmate |
| `O-O` | Castling kingside |
| `O-O-O` | Castling queenside |
| `e8=Q` | A pawn reaches e8 and becomes a queen |

Letters: K king, Q queen, R rook, B bishop, N knight. A pawn capture is written with the **file the pawn came from**, then `x`, then the target square, which is why it is `exd5` and not `ed5`.

If two pieces of the same kind could move to the same square, add the **file** of the one that moves, or the **rank** if the files match. After 1.d4 Nf6 2.Nf3 d5, both White knights can reach d2, so the move is written `Nbd2` (the b1 knight) or `Nfd2` (the f3 knight). If two rooks on a1 and a5 could both go to a3, the moves are `R1a3` and `R5a3`.

A game is written as numbered pairs, White's move then Black's. Here is the best-known beginner trap, Scholar's mate:

```text
1. e4 e5
2. Qh5 Nc6
3. Bc4 Nf6
4. Qxf7#
```

White's queen and bishop both aim at f7, the square only the black king protects. On move 3, Black played `Nf6??` (two question marks mean "a terrible move"), which ignored the threat. After `Qxf7#`, the queen is protected by the bishop, so the king cannot take it, and every escape square is covered.

## The first habit: before you move, ask what it allows

Scholar's mate works on players who do not check what the opponent is threatening. Before every move, ask two questions: what does my opponent threaten right now, and what does my move leave undefended? [Phase 4](04-tactics.md) turns this into a routine.

## Checkmating with king and queen

If you are ahead by a queen, the game is not over until you mate, and many won games are thrown away here. The technique has one rule: **use the queen to shrink the space the king can use, bring your own king to help, and avoid aimless checks, which let the king run.**

Take this position:

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . . . K . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 Q . . . . . . .  1
  a b c d e f g h
```

White plays `Qa7`. The queen controls the whole 7th rank, so the black king cannot leave the 8th rank.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 Q . . . . . . .  7
6 . . . . . . . .  6
5 . . . . K . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

Black has two moves: Kd8 or Kf8. The main line against each (Black's other replies lose at the same speed):

- **1...Kf8 2.Kf6 Kg8 3.Qg7#.** The white king on f6 covers e7, f7, and g7 and takes away the king's squares.
- **1...Kd8 2.Kd6 Ke8 3.Qe7#.** The same idea on the other side.

Either way, it is mate in three moves, checked by program against every possible reply (counting Qa7 as move 1). The recipe: cut the king off along a rank with the queen, walk your king over, and deliver mate on the edge with the queen protected by the king.

## Checkmating with king and rook

The rook is slower because it cannot cut off as much. The idea is the same, with one key tool: **the opposition**, where the two kings face each other with one square between them. Whoever must move a king in that position has to give ground, and the rook gives White a spare move, so it is Black who runs out of safe squares.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 R . . . . . . .  7
6 . . . . . . . .  6
5 . . . . K . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . . . . .  1
  a b c d e f g h
```

White to move. The rook on a7 keeps the black king on the 8th rank. The best line is 1.Kd6 Kf8 2.Ke6 Kg8 3.Kf6 Kh8 4.Kg6 Kg8 5.Ra8#, which is the fastest mate against best defense (checked by program). The white king marches forward and the black king is pushed sideways along the edge until the kings face each other and the rook can check on the back rank.

The final pattern to recognize is this:

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . K . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 R . . . . . . .  1
  a b c d e f g h
```

`Ra8#`. The white king on e6 covers d7, e7, and f7, so the rook only needs to check on the 8th rank. The black king has no square. The same pattern appears at the end of the line above, shifted to the g-file. The opposition is what gets you here: with the kings facing each other, the black king cannot step up, and the rook check on the back rank cannot be answered.

## The stalemate trap

The most common mistake is a mate attempt that leaves the opponent with no legal move and no check. Start here, with White to move:

```text
  a b c d e f g h
8 k . . . . . . .  8
7 . . . . . . . .  7
6 . K . . . . . .  6
5 . . . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . Q . . . . .  1
  a b c d e f g h
```

`Qc8#` is checkmate. `Qc7` looks equally forceful, but it is stalemate: the black king on a8 has no square and is not in check, so the game is drawn. The difference is a single square.

**Before any move that takes away the opponent's last square, check: is the king in check afterward?** If not, and nothing else can move, you have thrown the win away. Make it a habit: with a lone king, the last move should be a check.

Check yourself before moving on:

```quiz
[
  {"q": "Two white knights, on b1 and f3, can both go to d2. How is the move by the b1 knight written?", "choices": ["Nd2", "N1d2", "Nbd2", "Nxd2"], "answer": 2, "explain": "When two same pieces can reach the square, you add the file of the moving piece (here b). The rank is used only if the files are the same."},
  {"q": "What does Qxf7# mean?", "choices": ["The queen moves to f7 and the game is drawn", "The queen captures on f7, giving check", "The queen captures on f7, and it is checkmate", "The queen moves to f7 without capturing"], "answer": 2, "explain": "x means capture and # means checkmate. A single + would mean check only."},
  {"q": "You have king and queen against a lone king in the corner on a8, with your king on b6 and your queen on c1. Which move is a mistake?", "choices": ["Qc8", "Qa1", "Qc7", "Qc5"], "answer": 2, "explain": "Qc7 takes away the last square without giving check, so it is stalemate and a draw. Qc8 is checkmate. Qa1 gives check and the king escapes to b8. Qc5 gives no check but leaves the king the square b8."}
]
```

## Recap

1. Moves are written as a piece letter plus the destination square; `x` is capture, `+` check, `#` mate, `O-O` and `O-O-O` are castling.
2. Add the file (or the rank) of the moving piece when two same pieces could reach the square.
3. King and queen against king: restrict the king with the queen, bring your king over, and mate with the queen protected.
4. King and rook against king: cut off a rank, then use the opposition to force the king back for a rook check on the edge.
5. Before taking away the last square, make sure your move is a check. Otherwise it is stalemate.

Next up, [Tactics: Seeing What the Board Is Hiding](04-tactics.md): the short tricks that win material in nearly every game.
