---
title: "The Secret Word and the Blanks"
guide: hangman-python
phase: 1
summary: "Show a hidden word as a row of underscores and reveal only the letters that have been guessed."
tags: [python, strings, loops, beginner, game]
difficulty: beginner
synonyms:
  - mask a word with underscores
  - hangman blanks display
  - show guessed letters python
  - reveal letters in a word
  - python string masking
updated: 2026-07-16
---

# The Secret Word and the Blanks

The heart of Hangman is a single visual: a word you can't see yet, shown as a row
of blanks, with the letters you've correctly guessed filled in. Get that one
thing working and the rest of the game is steps you hang off it.

So that's where we start. A secret word, a set of letters that have been guessed,
and a way to print the word with the right letters showing and the rest hidden.

## The pieces we need

Two things:

- The **word** - a plain string, like `"python"`.
- The **guessed letters** - the letters the player has tried and got right (or
  tried at all; we'll firm that up next phase). For now, think of it as a small
  collection of single letters.

The display rule is one sentence: for each letter in the word, show the letter if
it's been guessed, otherwise show an underscore.

## Walking the word one letter at a time

In Python you can loop straight over a string and you get one character at a
time:

Before you run this, guess how many lines it'll print. Then check.

```python runnable
word = "python"
for letter in word:
    print(letter)
```

Run that. Six lines, one letter each. That `for letter in word` loop is the
engine of the whole display - we'll decide, per letter, whether to show it or
hide it.

## Show it or hide it

For each letter we want a small either/or: the real letter if it's been guessed,
an underscore if it hasn't. You already have the tools for that - an `if` check
and the `in` operator, which asks "is this letter inside the guessed collection?"
and hands back `True` or `False`. Put those together, loop over the word, and
you can build the whole display.

## Putting it together

Write a function `show(word, guessed)` that returns the word as a single display
string: each letter of `word`, in order, separated by spaces - the letter itself
if it's in `guessed`, an underscore if it isn't. `p _ t _ _ n` reads better than
`p_t__n`, which is why the spaces matter.

**Your turn.** This function is the point of the phase, so have a go before you
read on. Fill it in and hit Run: the checks underneath tell you whether it
works. My version is in the next block whenever you want it.

```python runnable
def show(word, guessed):
    # Return `word` as a display string: each letter, in order, separated
    # by single spaces. Show the letter if it's in `guessed`, otherwise
    # show "_".
    pass


# --- checks: fix your function until this prints "All good." ---
assert show("python", {"p", "t", "n"}) == "p _ t _ _ n", f"got: {show('python', {'p','t','n'})!r}"
assert show("python", set()) == "_ _ _ _ _ _", f"got: {show('python', set())!r}"
assert show("python", set("python")) == "p y t h o n", f"got: {show('python', set('python'))!r}"
print("All good.")
```

Stuck on the per-letter decision? You need one of two values for each letter -
think about how to say "this if a condition holds, otherwise that" in a single
line, then join the results with a space.

### One way to write it

Here's a first pass, glueing the per-letter results into one line by hand. Build
a list of the shown characters and join them with spaces:

```python runnable
word = "python"
guessed = {"p", "t", "n"}

shown = []
for letter in word:
    if letter in guessed:
        shown.append(letter)
    else:
        shown.append("_")

display = " ".join(shown)
print("Word:", display)
```

Run it. You should see `Word: p _ t _ _ n`. The `p`, `t`, and `n` show because
they're in `guessed`; the `y`, `h`, and `o` are still underscores. Change
`guessed` to `{"y", "o"}` and run again - different letters reveal. This is the
game's whole face.

That curly-brace `{"p", "t", "n"}` is a **set** - a collection with no duplicates
and fast membership checks. It's exactly the right tool for "which letters have
been guessed," and we'll lean on it hard next phase. For now, know that
`letter in guessed` against a set is quick and reads like English.

We'll need this display in every phase, so let's wrap it in a function that
takes the word and the guessed letters and hands back the line to print. Python
also has a compact way to write "this value if a condition is true, otherwise
that value," which flattens the loop above into one line:

```python
shown = letter if letter in guessed else "_"
```

Read it left to right: `letter` (use this) `if letter in guessed` (when it's
been guessed) `else "_"` (otherwise an underscore).

```python runnable
def show(word, guessed):
    return " ".join(letter if letter in guessed else "_" for letter in word)

# A few different guess states, so you can see the masking change:
word = "python"
print("Guessed p, t, n ->", show(word, {"p", "t", "n"}))
print("Guessed y, o    ->", show(word, {"y", "o"}))
print("Guessed nothing ->", show(word, set()))
print("Guessed it all  ->", show(word, set("python")))
```

Run it and read the four lines. The first two mask different letters. The third
passes an empty set (`set()`) - every letter is hidden, all underscores, exactly
what a fresh game looks like. The fourth passes `set("python")`, which turns the
string into a set of its letters `{'p','y','t','h','o','n'}` - every letter is
guessed, so the full word shows. That last line is what winning looks like, and
we'll use that same idea to detect a win in Phase 3.

## Why a set, not a list

You could store guessed letters in a list. A set is the better fit here for two
reasons:

| | List | Set |
|---|------|-----|
| Duplicate guesses | Keeps both | Ignores the repeat |
| "Have I guessed this?" | Scans the whole list | Instant lookup |

A player will fat-finger the same letter twice. A set absorbs that without you
writing a line of code to handle it. We'll make use of exactly that next.

## Where you are

You have a `show(word, guessed)` function that turns any word plus any set of
guessed letters into a clean masked line. That's the screen of your game. Next we
make a guess actually do something - add a letter, tell the player hit or miss,
and watch the blanks fill in.
