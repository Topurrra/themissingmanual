---
title: "Openings and Middlegame Plans"
guide: "chess-from-zero"
phase: 5
summary: "Open a game with three principles instead of memorized lines, understand why tempo matters, and then steer the middlegame using open files, pawn structure, and weak squares."
tags: [chess, openings, opening-principles, tempo, middlegame, pawn-structure, open-files, outposts]
difficulty: intermediate
synonyms: ["chess opening principles", "how to start a chess game", "what is tempo in chess", "why not move the queen early in chess", "what is an open file in chess", "what is a passed pawn", "what is an isolated pawn", "what is an outpost in chess", "how to make a plan in chess"]
updated: 2026-10-06
---

# Openings and Middlegame Plans

Beginners are told to memorize openings, and then their opponent plays move 4 and the memory is useless. You do not need lines. You need three ideas that explain why good opening moves are good, plus a way to find a plan once the pieces are out. This phase gives you both.

## The three opening principles

1. **Fight for the center.** The four central squares (d4, e4, d5, e5) are where pieces reach the most squares. Occupy or control them, usually with a pawn like `e4` or `d4` first.
2. **Develop your pieces.** "Develop" means moving pieces from their starting squares to squares where they do something. Knights and bishops first, and usually knights before bishops (a common guideline: it is clearer where a knight belongs early on).
3. **Get your king safe.** Castle early. The king in the center is the main target of every tactic in [phase 4](04-tactics.md), and castling also brings a rook into play.

Here is an opening that follows all three. It is the Italian Game, and each move has a job:

```text
1. e4 e5
2. Nf3 Nc6
3. Bc4 Bc5
4. O-O Nf6
5. d3 O-O
6. Nc3 d6
```

`e4` claims the center. `Nf3` develops a knight and attacks e5. `Bc4` develops a bishop toward f7, the weakest point in Black's position. `O-O` gets the king out of the center. Black mirrors it, and by move 6 both sides have castled and most pieces have a job. Nothing here required memory. You can reach the same position by asking the three questions.

## Tempo: why a wasted move matters

A **tempo** is one move's worth of time. In the opening, every move you spend not developing is a tempo you gave your opponent. Two habits waste the most:

- **Moving the queen out early.** The queen is valuable, so she is a target. Every time you attack her, the attacker develops with a threat and you lose time moving her.
- **Moving the same piece twice** before the rest are out, unless there is a concrete reason (a capture, a threat, a response to a threat).

See what the early queen costs in a real line:

```text
1. e4 e5
2. Qh5 Nc6
3. Bc4 g6
4. Qf3 Nf6
```

Black's `g6` attacked the queen, so White spent a second move on her. After four moves, the white queen has moved twice and sits on f3, while Black has developed both knights. Black is not winning by force, and the queen on f3 still eyes f7, but White has spent two moves on one piece while Black built a position. And if Black had played `3...Nf6??` instead, `4.Qxf7#` is mate, as you saw in [phase 3](03-notation-and-basic-checkmates.md). The early queen does carry threats, so watch for them when your opponent plays it.

## When the center opens and the king is behind

The most useful opening lesson is a game in which a side that falls behind in development is punished. This is the Opera Game, played by Paul Morphy in Paris in 1858 against two amateurs consulting together (the Duke of Brunswick and Count Isouard), in a box at the opera house. Read it for the shape, not the moves:

```text
1. e4 e5          2. Nf3 d6         3. d4 Bg4
4. dxe5 Bxf3      5. Qxf3 dxe5      6. Bc4 Nf6
7. Qb3 Qe7        8. Nc3 c6         9. Bg5 b5
10. Nxb5 cxb5     11. Bxb5+ Nbd7    12. O-O-O Rd8
13. Rxd7 Rxd7    14. Rd1 Qe6       15. Bxd7+ Nxd7
16. Qb8+ Nxb8    17. Rd8#
```

White developed a piece with almost every move, so when the center opened (move 4) every white piece was ready. Black never castled, so when the d-file opened, White's rooks aimed straight at the king. The finish, a queen sacrificed on b8 to pull a knight away and a rook mating on d8, is a tactic from phase 4 made possible by principles. Notice that the game is not about a clever line. It is about having more pieces working near the king when the position opened.

## The middlegame: from principles to a plan

Once the pieces are developed there is no script. Strong players think about four things.

### Open and half-open files

A **file** with no pawns on it is **open**, and a rook on an open file attacks everything along it. A file with only the opponent's pawns is **half-open** for you: your rook looks straight at their pawn. Put rooks on open files, and double them (both rooks on one file) to press an attack.

### Pawn structure

Pawns are the only pieces that cannot go back, so their structure shapes the whole game. Four terms to know, with the example below.

- A **doubled** pawn shares a file with another friendly pawn.
- An **isolated** pawn has no friendly pawns on the files next to it, so no pawn can ever protect it.
- A **passed** pawn has no enemy pawn in front of it on its file or the two files beside it. Nothing can capture it on its way to promotion, so it is a long-term asset.

A **backward** pawn is a pawn behind its neighbors that cannot safely advance and cannot be defended by other pawns.

```text
  a b c d e f g h
8 . r . . . . k .  8
7 . p . . . p p p  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . . P . . . .  4
3 P . . . . . . .  3
2 P . . . . P P P  2
1 . . R . R . K .  1
  a b c d e f g h
```

White's a2 and a3 pawns are doubled, and also isolated, because White has no pawn on the b-file. White's pawn on d4 is isolated, but it is also **passed**: Black has no pawns on the c, d, or e files, so no black pawn can stop it. Black's pawn on b7 is isolated too, and the b-file is half-open for White: White has no b-pawn, so a rook there would aim at b7. Files c and e are completely open, which is why White's rooks stand on them. You can read a position's story from its pawns.

### Outposts and weak squares

When a pawn advances it can never go back, and it stops guarding the squares behind it. A square that none of a side's pawns can guard any more is a **weak square** (or hole) in that side's position. An enemy piece placed on it, protected by one of its own pawns, is on an **outpost**. Knights are the best outpost pieces, because their moves do not depend on open lines.

```text
  a b c d e f g h
8 . . b . . . k .  8
7 p p . . . p p p  7
6 . . . . . . . .  6
5 . . . N . . . .  5
4 . . . . P . . .  4
3 . . . . . . . .  3
2 . . . . . P P P  2
1 R . . . . . K .  1
  a b c d e f g h
```

The white knight on d5 is an outpost. It is protected by the pawn on e4, and Black has no pawns on the c or e files, so no black pawn can attack d5 unless it first captures onto one of those files. From d5 the knight eyes squares such as b6, c7, e7, and f6. In practice, Black's way to remove it is to trade a piece for it.

### A plan in four questions

Beyond principles, a plan is a direction, and this is judgment, not law. These four questions work for most players:

1. **What did my opponent's last move change?** Does it threaten anything, or leave something undefended?
2. **What are the weaknesses?** Isolated or backward pawns, weak squares, an unsafe king, undefended pieces.
3. **Which of my pieces is doing the least?** Improve it: reroute the knight, put the rook on the open file.
4. **Is there a trade that helps me?** When ahead, trade pieces. When behind, avoid trades of your active pieces.

Check yourself before moving on:

```quiz
[
  {"q": "Which of these is a good reason to spend a second move with the same piece in the opening?", "choices": ["It is your favorite piece", "It captures something or answers a threat", "The piece looks lonely", "To save time later by not developing the others"], "answer": 1, "explain": "A second move with the same piece costs a tempo, so it needs a concrete reason such as a capture, a threat, or a response to one."},
  {"q": "White has a knight on d5, protected by a pawn on e4. Black has no pawns on the c-file or the e-file. How would you describe the knight?", "choices": ["It is pinned", "It is on an outpost", "It is skewered", "It is a passed pawn"], "answer": 1, "explain": "No black pawn is in position to attack d5, and a white pawn protects it, so the knight is on an outpost."},
  {"q": "A pawn has no friendly pawns on the files beside it. What is it called?", "choices": ["Doubled", "Passed", "Isolated", "Backward"], "answer": 2, "explain": "An isolated pawn cannot be defended by another pawn. Doubled means two pawns on one file, and passed is about enemy pawns in front of it."}
]
```

## Recap

1. Open by fighting for the center, developing pieces, and castling.
2. Tempo is time: do not waste moves on the early queen or on moving a piece twice without a reason.
3. A game like the Opera Game shows the payoff: developed pieces and an uncastled enemy king make tactics work.
4. In the middlegame, put rooks on open files and read the pawn structure: doubled, isolated, and passed pawns tell you where the weaknesses are.
5. Look for outposts for your knights, and weak squares for the opponent's.

Next up, [Endgame Essentials](06-endgame-essentials.md): when few pieces are left, the king becomes a fighter.
