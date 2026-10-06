---
title: "Life and Death"
guide: "go-the-board-game"
phase: 3
summary: "Why a group with two separate eyes can never be captured, which eye shapes live or die, what a false eye is, and how seki lets both sides survive."
tags: [go, life-and-death, eyes, seki, false-eye, beginner-friendly]
difficulty: beginner
synonyms: ["what is an eye in go", "two eyes live in go", "go life and death", "what is a false eye in go", "what is seki in go", "how do you make eyes in go", "vital point go"]
updated: 2026-10-06
---

# Life and Death

Surrounding a group does not capture it. A group can sit completely hemmed in on the board and still be impossible to remove. The reason is eyes, and understanding them is the biggest single step from "I know the rules" to "I can read a position." This phase explains why two eyes make a group permanent, which shapes make them, and the two traps (false eyes and seki) that fool every beginner.

## What an eye is, and why you need two

An **eye** is an empty point (or a small pocket of empty points) enclosed by one player's stones, such that the opponent cannot safely play inside. To capture a group, the opponent must fill every one of its liberties. If a group has one eye, the opponent eventually fills all the outside liberties and then plays inside the eye, which takes the last liberty and captures. Here Black has one eye at the top, and every outside liberty is gone:

```text
  +-------
  | X . X O
  | X X X O
  | O O O .
```

White plays the empty point inside the group. The stone has no liberty of its own, but it takes Black's last liberty, so it captures all five Black stones (this is the capturing exception to suicide from Phase 1).

Now give the group a second eye:

```text
  +-------------
  | . X . X O
  | X X X X O
  | O O O O O
```

Black has two eyes, at the corner point and the point between the two top stones. Each is a single point surrounded by Black. If White plays in either one, the White stone has no liberties and captures nothing (Black still has the other eye as a liberty), so the move is illegal. White can never fill both. The group can never be captured as long as Black does not fill in its own eyes.

> 💡 **Key point.** **Two separate eyes make a group alive.** The opponent can only capture by filling all liberties, and filling either eye is suicide. A group with one eye is living on borrowed time.

Terms you will see everywhere: a group with two eyes is **alive**. A group that cannot make two eyes is **dead**, even if it is still on the board, because the opponent can capture it whenever they choose. Strong players regularly stop playing around a dead group and use the saved moves elsewhere.

## The shape of the eye space

You rarely start with two finished eyes. You start with some empty room inside your group, the **eye space**, and the question is whether it can be made into two eyes. The answer depends on its shape. These results come from playing out every possible sequence, with the group completely surrounded and no outside liberties:

- **One or two points in a row: dead.** There is no room for two separate eyes.
- **Three in a row: it depends on who moves first.** The middle point is the vital point (see below).
- **Four in a row: alive,** whoever moves first.
- **A 2x2 square of four points: dead.** It looks roomy but can only ever make one eye.

Take three in a row:

```text
  +-------------
  | . . . X O
  | X X X X O
  | O O O O O
```

If Black plays the middle point of the three, two eyes appear on either side of it:

```text
  +-------------
  | . X . X O
  | X X X X O
  | O O O O O
```

But if White plays that middle point first, Black can no longer make two separate eyes. White's stone sits between the two empty points, and Black cannot make both safe:

```text
  +-------------
  | . O . X O
  | X X X X O
  | O O O O O
```

This is why the middle point is called the **vital point**: whoever plays it first decides whether the group lives. Finding it is a skill, but the idea is plain. Ask: "what single move leaves two separate eyes (or stops them)?"

Here are the two four-point shapes. A straight line of four is alive; a square of four is not:

```text
  +---------------
  | . . . . X O
  | X X X X X O
  | O O O O O O
```

```text
  +---------
  | . . X O
  | . . X O
  | X X X O
  | O O O O
```

In the square, White plays inside and the group can only ever end up with one eye. Try it on a board: it is the quickest way to feel why shape matters more than size.

## False eyes

A **false eye** looks like an eye but is not, because the opponent can still reach it. The fastest test is to look at the diagonal points of an empty point. On the edge, an eye needs both of its diagonal points to be yours, and in the corner it needs its one diagonal. (In the open center the rule of thumb is that at most one of the four diagonals may belong to the opponent.) In this position the empty point on the top edge looks like Black's eye, but one of its diagonal points, in the second row, is White's:

```text
  +-----------
  | X . X X O
  | O X X O O
  | O O O O O
```

The corner Black stone has no liberty except that empty point, and the other four Black stones also have only that point. White plays it and captures everything, so Black has no eye here and this group is dead. The diagonal rule is a shortcut for the real test: can the opponent play there and survive?

> ⚠️ **Gotcha.** Counting an eye that is not real is how beginners lose games they thought they had won. Before you relax, check the diagonals.

## Seki: mutual life

One more outcome exists. Two groups can be stuck next to each other with neither able to capture the other. This is **seki** (Japanese for "mutual life"). Both groups share liberties, and whoever plays into those shared points first loses, so both players leave them alone:

```text
  +---------------
  | O O O O X O
  | O . . X X O
  | X X X X O O
  | O O O O O O
```

The two empty points are shared liberties of the White group at the top left and the Black group around it. If Black plays one, that Black move reduces the Black group to a single liberty and White captures it. If White plays one, the same happens to White. So both leave them alone, and both groups live.

In scoring, the points inside a seki count for nobody (Phase 4 covers counting). Seki is rare on a 9x9 board, but you should recognize it so you do not play a move that destroys your own group.

## Check yourself

```quiz
[
  {
    "q": "Why is a group with two separate eyes safe?",
    "choices": ["Because eyes make it bigger", "Because the opponent would have to fill both eyes, and playing in either one is suicide", "Because the opponent has to pass"],
    "answer": 1,
    "explain": "To capture, the opponent must fill every liberty. Each eye is a liberty, and filling one leaves the other, so the move is illegal."
  },
  {
    "q": "Three eye points in a straight row inside a group. Who benefits from playing the middle point first?",
    "choices": ["Only the group's owner", "Only the attacker", "Whoever plays it first: the owner makes two eyes, the attacker kills the group"],
    "answer": 2,
    "explain": "The middle point is the vital point. The owner playing there leaves two separate eyes; the attacker playing there leaves the group with only one eye."
  },
  {
    "q": "What is a false eye?",
    "choices": ["An empty point that looks like an eye but can be played by the opponent because a diagonal point is theirs", "An eye in the center of the board", "An eye with two points"],
    "answer": 0,
    "explain": "On the edge both diagonal points must be yours for a real eye. If one belongs to the opponent, the point is not safe."
  }
]
```

## Recap

1. An eye is an enclosed empty point the opponent cannot safely play into.
2. Two separate eyes make a group alive, because filling either one is suicide.
3. Eye-space shape decides life: one or two points are dead, a 2x2 square is dead, a straight line of four is alive, and three in a row depends on the vital middle point.
4. A false eye has a diagonal point owned by the opponent; check diagonals before counting an eye.
5. In seki, two groups share liberties and neither can play there without losing, so both live and the shared points count for nobody.

Next up, [Counting: Territory, Prisoners, and Komi](04-counting-territory-prisoners-and-komi.md): how a game ends and who wins.
