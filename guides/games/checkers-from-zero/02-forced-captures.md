---
title: "Forced Captures: The Rule That Makes Checkers Tactical"
guide: "checkers-from-zero"
phase: 2
summary: "Captures are mandatory, so a sacrifice can force your opponent's reply; learn the exact rule, why you may choose any capture, and how to give one piece to take two."
tags: [checkers, forced-capture, tactics, sacrifice, shots]
difficulty: beginner
synonyms: ["do you have to jump in checkers", "mandatory capture in checkers", "what is a shot in checkers", "how to trap an opponent in checkers", "can you choose which jump to make in checkers", "sacrifice a piece in checkers", "give one take two checkers"]
updated: 2026-10-06
---

# Forced Captures: The Rule That Makes Checkers Tactical

In most board games you choose your move. In checkers, sometimes the board chooses it for you. If you can capture, you must, and a player who understands that can offer a piece on purpose, watch the opponent have no choice but to take it, and collect two pieces in return. This phase is the whole secret behind most of the games you lost as a kid.

## The rule, exactly

If the player to move has at least one capture available, they **must make a capture**. A quiet move is not allowed. This holds even when the capture is terrible for you, and even when the capture only exists because your opponent moved a piece into contact. (The rulebook's phrase is that captures are compulsory "whether offered actively or passively.")

Two details matter for everything that follows:

- **You choose which capture.** If several captures are available, with different pieces or different routes, you may play any of them. American checkers has **no majority rule**: you are not required to take the route that removes the most pieces. International draughts does require that, so a book written for it will teach you something that is not true here.
- **You must finish what you start.** A chain of jumps has to be carried through to its end (Phase 1). You cannot take one piece and decline the second.

```text
    .     .     .     .
 b     b     .     .
    w     .     .     .
 .     .     .     .
    w     .     .     .
 w     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 5, 6; White men: 9, 17, 21
```

Black to move. Black has exactly two legal moves, and both are captures: `5x14` takes one man, and `6x13x22` takes two. Neither is forced over the other. Which is better depends on what the position looks like afterward, not on the count alone.

## Why this rule makes a weapon

Here is the mental model. When captures exist, the list of your opponent's legal moves collapses to only those captures, and often to exactly one. If you can arrange that, you have made their next move for them.

So a mandatory capture is a lever. A **sacrifice** is giving a piece up on purpose. A **shot** is a sacrifice that forces a capture and then wins more than it cost. The simplest shot is "give one, take two."

## A shot, move by move

```text
    b     .     .     .
 b     .     .     .
    .     .     .     .
 w     .     w     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 1, 5; White men: 13, 15
```

Black to move. Material is even, two men against two. Black plays `5-9`.

White now has exactly one legal move, because the man on 13 can jump the man on 9, and a capture is mandatory:

```text
    b     .     .     .
 .     .     .     .
    b     .     .     .
 w     .     w     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 1, 9; White men: 13, 15
```

`13x6`: White's man jumped from 13 over 9 and landed on 6. White had no choice. Look at what that capture did. The White man landed on 6, directly in front of Black's man on 1, with 10 empty behind it, so Black can jump it. And from 10, the White man on 15 is next in line, with 19 empty behind it. Now Black captures:

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     b     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 19
```

`1x10x19`: the man on 1 jumps the man on 6 to land on 10, then jumps the man on 15 to land on 19. Black gave up one man, took two, and White has no pieces left, so Black wins.

The pattern has three beats, and you can use it to find your own shots:

1. **Offer.** Move a piece where it can be captured.
2. **Force.** Check that the capture is mandatory and, ideally, the only legal move for your opponent.
3. **Reload.** The capturing piece has landed somewhere it can be jumped, or its departure has opened a path for one of your pieces, so you recapture and come out ahead.

## Two questions before every move

Because the forced reply is the entire engine of the game, build the habit of asking, on every single move:

1. **"After my move, what must my opponent capture, and what does that capture open up for me?"** This is how you find shots.
2. **"After my move, can my opponent offer me a piece, and what will I be forced to do?"** This is how you stop being the victim. If you are about to move a man next to an enemy man and there is a capture waiting behind it, run the sequence in your head: their reply, your forced capture, their next capture.

The habit costs two seconds a move, and it is worth more than any opening you will memorize.

## Passive forced captures

You do not have to be the one who moved into contact. Say your opponent plays a quiet move that happens to put one of their men beside one of yours with an empty square behind it. On your turn you now **must** jump. That is how most shots start: the sacrificed piece is the one you are forced to take.

Check yourself before moving on:

```quiz
[
  {"q": "You have one legal capture and several quiet moves you like better. What must you do?", "choices": ["Play any move you like", "Capture, because a capture is mandatory", "Play the quiet move, then capture next turn", "Capture only if it wins material"], "answer": 1, "explain": "If any capture is available, the player to move must capture. Quiet moves are not legal while a capture exists."},
  {"q": "You can capture one piece with one man or two pieces with a different man. Under American checkers rules, what is true?", "choices": ["You must take the two", "You must take the one", "You may choose either capture", "You must take whichever is closer to your king row"], "answer": 2, "explain": "American checkers has no majority rule, so you may play any available capture. International draughts is different: it forces the capture that removes the most pieces."},
  {"q": "In the shot from this phase, Black plays 5-9 with White men on 13 and 15 and a Black man on 1. Why does White have to play 13x6?", "choices": ["Because 13x6 wins a piece for White", "Because it is the only legal move and captures are mandatory", "Because White men must always move toward Black's home row", "Because Black's man on 9 would otherwise be crowned"], "answer": 1, "explain": "The man on 13 can jump the man on 9, so White must capture. That jump is White's only capture, so it is White's only legal move. The forced capture then opens 1x10x19."}
]
```

## Recap

1. If you can capture you must, even when it hurts, and a capture offered to you counts.
2. You may choose any capture and any route; there is no majority rule in American checkers.
3. A multiple jump must be completed once started.
4. A shot is a sacrifice that forces a capture and then wins more: offer, force, reload.
5. Before every move, ask what your opponent must capture and what that capture opens up.

Next up, [Tactics: Exchanges, Shots, and Breakthroughs](03-tactics.md): trading pieces on purpose, a sacrifice that earns a king, and a short checklist for finding these patterns.
