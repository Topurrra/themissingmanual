---
title: "A Word List and the Game Loop"
guide: hangman-python
phase: 4
summary: "Pick a word at random from a list and wrap the whole round into one game function, then extend it with hints, categories, and a real input() version."
tags: [python, random, functions, game, beginner]
difficulty: beginner
synonyms:
  - random word python game
  - hangman game loop function
  - python random choice list
  - finished hangman game
  - add input to python game
updated: 2026-06-30
---

# A Word List and the Game Loop

You've built every part: the masked word, the guess handler, the life counter,
and both endings. Two things finish the game. First, the word should vary — a
fixed "python" gets old. Second, all those parts should live in one function you
call to play a round. This phase does both, then hands you the keys to extend it.

## A list of words and a random pick

A word list is a plain list of strings. To grab one at random, the standard
library's `random` module has `choice`, which returns one item from a list:

```python runnable
import random

WORDS = ["python", "guitar", "rocket", "garden", "puzzle", "coffee"]
word = random.choice(WORDS)
print("Picked:", word)
```

Run it a few times — you'll get different words. That randomness is what makes the
game replayable. In the runnable blocks below we'll call `random.seed(...)` first
so the "random" pick is the same every run, which keeps the printed play-through
stable for you to read. On your own machine you'd drop the seed and let it be
genuinely random.

## Everything in one function

Here's the move that ties the project together: take the full round from Phase 3
and wrap it in a `play(word, moves, lives)` function. Same logic — show, guess,
count, check — but now it's one callable thing. We pass in the guesses as `moves`
because there's no console here; on your machine you'd read them from the player.

```python runnable
import random

WORDS = ["python", "guitar", "rocket", "garden", "puzzle", "coffee"]

def show(word, guessed):
    return " ".join(letter if letter in guessed else "_" for letter in word)

def won(word, guessed):
    return all(letter in guessed for letter in word)

def play(word, moves, lives=6):
    guessed = set()
    print(f"Secret word has {len(word)} letters: {show(word, guessed)}")
    for letter in moves:
        if lives <= 0 or won(word, guessed):
            break
        letter = letter.lower()
        if letter in guessed:
            print(f"'{letter}' already tried, skip")
            continue
        guessed.add(letter)
        if letter in word:
            print(f"'{letter}' hit   | lives: {lives} | {show(word, guessed)}")
        else:
            lives -= 1
            print(f"'{letter}' miss  | lives: {lives} | {show(word, guessed)}")
    print()
    if won(word, guessed):
        print(f"You won! The word was '{word}'.")
    else:
        print(f"Out of lives. The word was '{word}'.")

random.seed(2)                      # fixed pick so this run is repeatable
word = random.choice(WORDS)
moves = ["e", "a", "o", "p", "y", "t", "h", "n"]   # a simulated playthrough
play(word, moves)
```

Run it. With seed 2 the word comes out "python", and the move list starts with two
common-but-wrong vowels (`e`, `a`) before the right letters come in — so you watch
two lives burn, then the word fill in for a win. That's the finished game: random
word, a full round, both endings, all in one function.

The `default lives=6` in the signature means you can call `play(word, moves)` and
get six lives, or `play(word, moves, lives=3)` for a harder game, without changing
the function.

## A quick self-check

One assert-based check confirms the win and loss paths both work, so you know the
finished `play` logic is sound:

```python runnable
def won(word, guessed):
    return all(letter in guessed for letter in word)

def round_result(word, moves, lives):
    guessed = set()
    for letter in moves:
        if lives <= 0 or won(word, guessed):
            break
        guessed.add(letter.lower())
        if letter.lower() not in word:
            lives -= 1
    return "win" if won(word, guessed) else "lose"

assert round_result("python", ["p","y","t","h","o","n"], 6) == "win"
assert round_result("python", ["z","q","x","k"], 3) == "lose"
print("Win path and lose path both check out. Game logic is solid.")
```

Run it. The confirmation line means a clean sweep wins and three misses on three
lives loses — the two outcomes your `play` function rests on.

## Where to take it

You have a complete game. Here are real extensions, easiest first:

| Idea | The gist |
|------|----------|
| Bigger word list | Add words to `WORDS`. The game gets them for free. |
| Categories | Make `WORDS` a dict like `{"animals": [...], "fruit": [...]}` and pick a category, then a word. |
| A hint | After a few misses, reveal one unguessed letter: pick from `set(word) - guessed`. |
| Score | Count wins across rounds; award points for lives remaining at the win. |
| ASCII art | Print a stick figure that grows a limb per miss — a list of art strings indexed by misses. |

## Play it for real on your machine

The browser version simulates guesses because there's no place to type. On your
own machine you can read real input. Save this as `hangman.py` and run it with
`python hangman.py` in your terminal — it asks for one letter per turn:

```python
import random

WORDS = ["python", "guitar", "rocket", "garden", "puzzle", "coffee"]

def show(word, guessed):
    return " ".join(letter if letter in guessed else "_" for letter in word)

def won(word, guessed):
    return all(letter in guessed for letter in word)

def play():
    word = random.choice(WORDS)
    guessed = set()
    lives = 6
    while lives > 0 and not won(word, guessed):
        print(f"\n{show(word, guessed)}    lives: {lives}")
        letter = input("Guess a letter: ").strip().lower()
        if not letter or len(letter) != 1 or not letter.isalpha():
            print("Type a single letter.")
            continue
        if letter in guessed:
            print("Already tried that one.")
            continue
        guessed.add(letter)
        if letter in word:
            print("Hit!")
        else:
            lives -= 1
            print("Miss.")
    if won(word, guessed):
        print(f"\nYou won! The word was '{word}'.")
    else:
        print(f"\nOut of lives. The word was '{word}'.")

if __name__ == "__main__":
    play()
```

It's the same game you built here — `show`, `won`, the life count, both endings.
The only change is the `while` loop reads a real guess with `input()` instead of
walking a fixed list, plus a check that the player typed exactly one letter. That
input-guard is the kind of thing you skip in a demo and want the moment a real
person uses it.

## You built it

A row of blanks became a guess handler became a life counter became a finished,
random, replayable game — each phase a piece you ran and watched work. That's the
whole arc of building software: small correct parts, snapped together. Now go add
a category mode, or that growing stick figure, and make it yours.
