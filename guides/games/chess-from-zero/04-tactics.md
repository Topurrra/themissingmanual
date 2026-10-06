---
title: "Tactics: Seeing What the Board Is Hiding"
guide: "chess-from-zero"
phase: 4
summary: "Learn the six tactical patterns that win material (fork, pin, skewer, discovered attack, double check, removing the defender) and the checks-captures-threats habit that finds them."
tags: [chess, tactics, fork, pin, skewer, discovered-attack, double-check, removing-the-defender]
difficulty: beginner
synonyms: ["chess tactics for beginners", "what is a fork in chess", "what is a pin in chess", "what is a skewer in chess", "what is a discovered attack", "what is double check", "how to find tactics in chess", "checks captures threats"]
updated: 2026-10-06
---

# Tactics: Seeing What the Board Is Hiding

A tactic is a short forcing sequence that wins something: a piece, a pawn, or the game. Most beginner and club games are decided by tactics more than by deep strategy, because one player misses a pattern that the other one has seen a hundred times. The patterns are few. Learn the six below and you will start to see them on the board, and also stop walking into them.

Each position here was checked by program: every move is legal, and the claimed result holds against every reply.

## The habit: checks, captures, threats

Before every move, scan in this order:

1. **Checks.** Every check you can give, and every check your opponent can give after your move. Checks are forcing: the opponent must answer them.
2. **Captures.** Every capture available to either side. Is anything undefended, or defended fewer times than attacked?
3. **Threats.** Any move that attacks something, or sets up a capture or a mate next move.

Do this for your options and then for your opponent's. It takes ten seconds, and it is the single most reliable way to stop hanging pieces and start finding wins. The patterns below tell you what you are looking for.

## The fork

A **fork** is one piece attacking two or more enemy pieces at once, so the opponent can save only one. Knights are the classic forkers, because their move is hard to see, but any piece can fork.

```text
  a b c d e f g h
8 r . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . N . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . K . . .  1
  a b c d e f g h
```

White plays `Nc7+`. The knight attacks the king on e8 and the rook on a8 at the same time. Black must answer the check, and then White plays `Nxa8`. The knight (3 points) wins a rook (5 points) for free.

## The pin

A **pin** is an attack on a piece that cannot move without exposing a more valuable piece behind it.

- In an **absolute pin**, the piece behind is the king, so the pinned piece cannot legally move at all.
- In a **relative pin**, the piece behind is something valuable like a queen. The pinned piece can move, but doing so loses the piece behind it.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . n . . . .  7
6 . . . . . . . .  6
5 . B . . . . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . R K . . .  1
  a b c d e f g h
```

The black knight on d7 is pinned to its king by the bishop on b5, so it cannot move. White plays `Rxd7`. Black cannot recapture with the king, because the bishop guards d7. White has won a knight.

A very common relative pin arises in the Queen's Gambit: 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5.

```text
  a b c d e f g h
8 r n b q k b . r  8
7 p p p . . p p p  7
6 . . . . p n . .  6
5 . . . p . . B .  5
4 . . P P . . . .  4
3 . . N . . . . .  3
2 P P . . P P P P  2
1 R . . Q K B N R  1
  a b c d e f g h
```

The bishop on g5 attacks the knight on f6, with the black queen behind it on d8. If the knight moves, `Bxd8` wins the queen (unless the move makes a bigger threat of its own). That is why you rarely see the knight leave.

## The skewer

A **skewer** is a pin in reverse: you attack a valuable piece, it must move, and you capture the piece behind it.

```text
  a b c d e f g h
8 . . . . b . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . . . k . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 R . . . . K . .  1
  a b c d e f g h
```

White plays `Re1+`. The rook checks the king on e5 and also lines up the bishop on e8 behind it. The king must leave the e-file (it has six squares to choose from), and after each of them `Rxe8` wins the bishop.

## The discovered attack

A **discovered attack** is when you move one piece and uncover an attack by another piece behind it. The moving piece can do something else at the same time, so you often make two threats with one move.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . q .  6
5 . . . . N . . .  5
4 . . . . . . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . R . K .  1
  a b c d e f g h
```

The white knight on e5 stands in front of the rook on e1. `Nxg6+` captures the queen and also uncovers the rook's check on the black king on e8. Black has to answer the check, and cannot recapture the knight on g6, so White keeps the queen.

## Double check

A **double check** is a check from two pieces at once, usually from a discovered check where the piece that moves also gives check. You cannot block or capture two attackers with one move, so **the king must move**.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . . . . . .  7
6 . . . . . . . .  6
5 . . . . . . . .  5
4 . . . . N . . .  4
3 . . . . . . . .  3
2 . . . . . . . .  2
1 . . . . R . K .  1
  a b c d e f g h
```

White plays `Nd6++`. The knight moving from e4 uncovers the rook on e1 and also checks the king on e8 itself. Black's only legal replies are `Kd7`, `Kd8`, and `Kf8`. (The double plus is a common way to write double check; the standard notation from phase 3 would write a single `+`.) Here the king can run, so it is not mate, but in many positions the escape squares are all covered and a double check is mate. Look for it whenever the enemy king is exposed.

## Removing the defender

If an enemy piece is protected by one defender, take away or deflect the defender. The protected piece then falls.

```text
  a b c d e f g h
8 . . . . k . . .  8
7 . . . p . . . .  7
6 . . n . . . . .  6
5 . B . . p . . .  5
4 . . . . . . . .  4
3 . . . . . N . .  3
2 . . . . . . . .  2
1 . . . . K . . .  1
  a b c d e f g h
```

Black's pawn on e5 is defended only by the knight on c6, and White's knight on f3 attacks it. White plays `Bxc6`. If `dxc6`, then `Nxe5` wins a pawn. If Black declines to recapture, White is a knight up. A search confirmed that Bxc6 is White's best move here.

Be careful, because this does not always work. The same idea fails in a real opening: after 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 5.Nxe5, Black plays 5...Qd4 and regains the pawn with 6.Nf3 Qxe4+, because the queen attacks both the knight and the e4 pawn. Counting defenders and attackers on the actual board is the only way to be sure.

## Your turn: sorting the patterns

Which pattern is at work depends on one question: what is attacked, and what is behind or beside it?

| What you see | Pattern |
|---|---|
| One piece attacks two things at once | Fork |
| A piece cannot move because something behind it is worth more | Pin |
| The valuable piece in front must move, exposing the one behind | Skewer |
| Moving one piece uncovers an attack by another | Discovered attack |
| Two pieces give check at once | Double check |
| A defender is captured or driven away | Removing the defender |

Check yourself before moving on:

```quiz
[
  {"q": "A white knight lands on a square from which it attacks the black king and the black rook. Black must answer the check. What is this pattern called?", "choices": ["A pin", "A fork", "A skewer", "A discovered attack"], "answer": 1, "explain": "One piece attacking two targets at once is a fork. The check forces Black to deal with the king, so the rook is lost."},
  {"q": "You give a double check. Which reply can never save the enemy king?", "choices": ["Moving the king to a safe square", "Capturing an unprotected checking piece with the king", "Blocking one of the checks with another piece", "All three can work"], "answer": 2, "explain": "A double check is two attacks at once, so blocking or capturing one attacker still leaves the other. Only a king move (including a king capture of an unprotected checker) can answer both."},
  {"q": "In the checks-captures-threats habit, in what order do you scan a position?", "choices": ["Threats, then captures, then checks", "Captures, then threats, then checks", "Checks, then captures, then threats", "Whichever piece is closest to the opponent's king"], "answer": 2, "explain": "Checks are the most forcing, so look at them first. Then captures, then quieter threats."}
]
```

## Recap

1. Before each move, scan checks, then captures, then threats, for both sides.
2. A fork attacks two things at once; a pin freezes a piece against something behind it; a skewer is a pin in reverse.
3. A discovered attack uncovers a second piece's attack, and a double check forces the king to move.
4. Removing the defender wins a protected piece, but always count attackers and defenders on the real board.

Next up, [Openings and Middlegame Plans](05-openings-and-middlegame-plans.md): how to start a game that gives you tactics, not troubles.
