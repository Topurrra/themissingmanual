---
title: "Ko, and Why It Exists"
guide: "go-the-board-game"
phase: 2
summary: "Ko is the shape where two players could capture the same stone back and forth forever; the ko rule stops that, and ko threats turn it into a fight."
tags: [go, ko, rules, ko-threats, beginner-friendly]
difficulty: beginner
synonyms: ["what is ko in go", "ko rule in go", "what is a ko threat", "why can't i recapture in go", "go infinite loop rule", "superko explained"]
updated: 2026-10-06
---

# Ko, and Why It Exists

Sooner or later you capture a stone, look at the board, and find your opponent can capture your capturing stone right back. Then you could capture again. And again. That loop has a name, ko, and one rule keeps it from running forever. The rule is short, but the fights it creates are some of the sharpest in Go.

## The loop that would never end

Ko is the Japanese word for this situation, and it is the standard Go term everywhere now. It happens in a very specific shape. White's single stone is in atari, and the point where Black can capture it is surrounded by White stones:

```text
  . . . . . .
  . . X O . .
  . X O a O .
  . . X O . .
  . . . . . .
```

Black plays `a` and captures the White stone in the middle:

```text
  . . . . . .
  . . X O . .
  . X . X O .
  . . X O . .
  . . . . . .
```

Look at Black's new stone. It has exactly one liberty, the point that was emptied, so it is now in atari. If White plays there, White captures the Black stone and the board is exactly the first diagram again. Black could then capture again, then White, and so on without end.

*What just happened:* a position can come back to itself. Without a rule, the game would have no way to finish.

## The ko rule

The rule in the Japanese Rules of Go is direct: after you capture a stone in a ko, your opponent may not recapture on the very next move. In the position below, White may not play at `b`, the point where the stone was captured.

```text
  . . . . . .
  . . X O . .
  . X b X O .
  . . X O . .
  . . . . . .
```

White must play somewhere else first. After that, if Black has not protected the ko, White may recapture. That "somewhere else" move is the key idea.

> 📝 **Terminology.** The move that gives you permission to recapture is played elsewhere on the board and forces a reply. It is called a **ko threat**. Capturing the ko stone back is called **retaking the ko**.

## Ko threats: how a ko is decided

The rule says only "not immediately." Here is how a real ko plays out:

1. Black captures the ko.
2. White cannot retake yet, so White plays a ko threat: a move elsewhere that threatens something, such as capturing a Black stone or breaking into a Black area.
3. Black must decide. If Black ignores the threat and connects the ko (fills in the point so it cannot be retaken), Black wins the ko but lets White carry out the threat. If Black answers the threat, White is now allowed to retake the ko.
4. White retakes. Now Black may not retake immediately, so Black plays a threat of its own.

The ko continues until one side runs out of useful threats or decides the ko is not worth any more. The player who has more threats of enough size wins it.

The question to ask at step 3 is a trade: is what the threat takes bigger than what I lose by letting the opponent win the ko? If the ko decides a large group's life, you ignore small threats. If the ko is small, you answer almost any threat and move on. This is why experienced players say a ko is also about the rest of the board: it connects two parts of the game that have nothing to do with each other.

> 💡 **Key point.** A ko fight is a trade of threats. You are not only fighting over one stone, you are spending your spare pressure on the board against your opponent's.

## Not every capture is a ko

Ko needs both conditions: the capturing stone is left with exactly one liberty, and capturing it back would return the board to where it was. A capture where the recapture would not repeat the position is a normal exchange. A later phase shows the snapback, a sacrifice that looks a little like ko but is not (the sacrificed stones are recaptured immediately and the position never repeats).

## Beyond the basic ko

The basic ko rule only stops an immediate recapture in one ko. Rare shapes can repeat over longer cycles, for example three kos at once (triple ko) or two kos where each player's capture keeps resetting the position. The Japanese rules handle these by allowing the game to be declared **no result** when the whole-board position repeats without progress, and the players replay it. Chinese-style rules and the American Go Association (AGA) rules instead ban any move that recreates an earlier whole-board position (a **superko** rule), so a repeating cycle cannot occur. Phase 4 compares the two approaches in the section on area scoring.

For now, remember the part that matters: basic ko, "no immediate recapture," is the only ko rule you need to play on a 9x9 board.

## Check yourself

```quiz
[
  {
    "q": "After Black captures a stone in a ko, what is White not allowed to do?",
    "choices": ["Play anywhere on the board", "Recapture the ko on the very next move", "Pass"],
    "answer": 1,
    "explain": "The ko rule forbids an immediate recapture. White must play elsewhere first."
  },
  {
    "q": "What is a ko threat?",
    "choices": ["A move that forces the opponent to answer elsewhere, so you may retake the ko", "A move that captures two stones", "A move that ends the ko by passing"],
    "answer": 0,
    "explain": "A ko threat is played away from the ko and threatens something. If the opponent answers it, you may retake the ko."
  },
  {
    "q": "Why does the ko rule exist?",
    "choices": ["To make the game last longer", "Because without it the same position could repeat forever and the game could never end", "To give White an advantage"],
    "answer": 1,
    "explain": "Two players could capture the same stone back and forth without end. The rule breaks the loop."
  }
]
```

## Recap

1. Ko is a shape where a capture can be answered by a recapture, repeating the position.
2. The ko rule: you may not recapture a ko on the very next move.
3. To retake, first play a ko threat elsewhere that your opponent must answer.
4. A ko is decided by who has more and bigger threats, and by how much the ko is worth.
5. Longer repeats are handled by "no result" in Japanese rules or by superko in Chinese-style rules.

Next up, [Life and Death](03-life-and-death.md): how a group can be safe even when the opponent surrounds it completely.
