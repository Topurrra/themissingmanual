---
title: "Tactics: Exchanges, Shots, and Breakthroughs"
guide: "checkers-from-zero"
phase: 3
summary: "The three tactical patterns that decide most checkers games: the exchange, the shot that wins material, and the sacrifice that breaks through to a king, plus how kings change the picture."
tags: [checkers, tactics, exchange, shots, breakthrough, kings]
difficulty: intermediate
synonyms: ["checkers tactics", "how to trade pieces in checkers", "what is an exchange in checkers", "how to get a king in checkers", "checkers shots and combinations", "can a king capture backwards in checkers", "checkers breakthrough sacrifice"]
updated: 2026-10-06
---

# Tactics: Exchanges, Shots, and Breakthroughs

Phase 2 gave you one lever: a mandatory capture decides your opponent's move. This phase shows the three ways strong players pull it. Each one is a short forced sequence, so you can check it by counting moves, with no intuition required.

## The exchange: one for one, on purpose

An **exchange** (or trade) is a forced capture followed by a forced or likely recapture, so each side loses one piece. Here is the most common one in real games, straight from the starting position:

```text
1. 11-15   (Black steps toward the middle)
   22-18   (White offers a man next to it)
2. 15x22   (Black must jump)
   25x18   (White jumps back; 26x17 is also legal)
```

*What just happened:* White's `22-18` put a man next to Black's `15` with 22 empty behind it, so Black had to capture. The Black man landed on 22, where White could jump it, and the counts are 11 men against 11.

Why would anyone trade? The usual reasons are rules of thumb, not laws:

- **When you are ahead in material, trade.** Every trade makes your extra piece a bigger share of what is left, and it removes the pieces your opponent would use for tricks.
- **When you are behind, avoid trades.** You need pieces on the board for shots to exist at all.
- **Trade to break a cramp.** If your men are jammed together with no safe moves, a trade opens space.

You cannot refuse a capture, so the only way to avoid a trade is to not step into contact in the first place.

## The shot: give one, take more

You met this in Phase 2. The shot is the most valuable tactic in checkers because it wins material outright. Finding one is a short routine:

1. List your **sacrifices**: moves that put a man where it can be jumped.
2. For each, ask: **is the capture forced, and is it the opponent's only legal move?** If they have a choice of captures, they will pick the one that hurts least.
3. Play the forced reply on the board in your head. **Where did their capturing piece end up, and what square did it leave?**
4. See if you now have a **multiple jump**.

Shots are rarer in the opening and become more common in the middle of the game when pieces are in contact. They are also the main way beginners lose: the sacrifice you did not notice.

## The breakthrough: a sacrifice that earns a king

Sometimes the prize is not material but a **king**. A man standing guard on your king row blocks the enemy's jump into it. If you can pull that guard away, the way is open.

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 b     .     b     .
    w     .     .     .
 .     w     .     .

Black men: 21, 23; White men: 25, 30
```

Black to move. Black's man on 21 would like to jump White's man on 25, but White's man on 30 stands on the landing square. So Black plays `23-26!`. The man on 30 can jump it, and nothing else is legal for White, so `30x23` is forced:

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 b     .     w     .
    w     .     .     .
 .     .     .     .

Black men: 21; White men: 23, 25
```

The guard has left its post. Now `21x30` is open, and Black's man jumps 25, lands on the king row at 30, and is crowned. Men are even, one each, but Black has a king.

A fair warning: a king is a big advantage in a real game with many pieces on the board, because it moves in all four directions and attacks men from behind. But a king alone is not an automatic win. In this tiny position, an exhaustive computer search of the remaining play says the result is a draw. The breakthrough is a means, not an end.

## Kings change the arithmetic

Men capture only forward. Kings capture in all four directions. That has a consequence people forget: **a man that has walked past an enemy king can be captured from behind.**

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     W     .     .
    .     b     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .

Black men: 18; White kings: 14
```

White to move. The White king on 14 sits behind the Black man on 18, which has already walked past it. The king jumps backward: `14x23`. A man could not do that.

Two practical rules follow. Before you advance a man past an enemy king, check the square behind the man. And when you have a king, look for men that think they are safe.

## A short checklist

Run through this when a position feels tense, in this order:

1. What captures does my opponent have right now? (They must take one.)
2. For each candidate move of mine, what will they be forced to do?
3. Can I play a sacrifice that forces them and opens a multiple jump or a path to a king?
4. Does my move leave a guard square empty that a breakthrough could use?

Check yourself before moving on:

```quiz
[
  {"q": "In the opening exchange 11-15, 22-18, 15x22, why must Black play 15x22?", "choices": ["Because Black's man on 15 is attacked", "Because a capture is available and captures are mandatory", "Because jumping always wins material", "Because White's man on 18 would capture it otherwise"], "answer": 1, "explain": "After 22-18, Black's man on 15 can jump the man on 18 into the empty square 22. A capture is available, so Black must make one."},
  {"q": "In the breakthrough with Black men on 21 and 23 and White men on 25 and 30, what does Black's 23-26 accomplish?", "choices": ["It wins a man for nothing", "It forces 30x23, which pulls the guard off 30 and lets 21x30 crown", "It blocks White from moving", "It crowns the man on 23 immediately"], "answer": 1, "explain": "White's only legal move is 30x23. That empties square 30, so Black's man on 21 can jump 25 and land on 30, the king row."},
  {"q": "Which statement about backward captures is true in American checkers?", "choices": ["Men and kings both capture backward", "Only kings capture backward", "Neither captures backward", "Only men capture backward"], "answer": 1, "explain": "Men capture and move forward only. Kings move and capture in all four diagonal directions."}
]
```

## Recap

1. An exchange is a forced capture plus a recapture; trade when ahead, avoid trades when behind.
2. A shot wins material: list the sacrifices, check the forced reply, and look for the multiple jump.
3. A breakthrough sacrifices a man to pull a guard off the king row so another man can crown.
4. Kings capture backward and men do not, so check behind any man that has passed an enemy king.
5. A king is valuable but does not by itself guarantee a win.

Next up, [Strategy: Center, King Row, Tempo, and the Move](04-strategy.md): what to aim for when no shot is on the board.
