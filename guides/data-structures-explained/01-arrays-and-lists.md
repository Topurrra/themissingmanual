---
title: "Arrays & Lists — Ordered Collections"
guide: "data-structures-explained"
phase: 1
summary: "An array (or list) is an ordered row of numbered slots: jumping to any slot by its index is instant, adding to the end is cheap, but inserting in the middle means shoving everything over."
tags: [data-structures, arrays, lists, index, ordered-collections]
difficulty: beginner
synonyms: ["what is an array", "what is a list in programming", "why is array access fast", "why is inserting in the middle of a list slow", "list index explained"]
updated: 2026-06-19
---

# Arrays & Lists — Ordered Collections

The very first container almost everyone meets is the list. You've probably already used one — a row of
names, a sequence of scores, the lines of a file. It feels simple, and most of the time it is. But there's
a quiet trap inside it: some things you do to a list are basically free, and some things look just as
innocent but get slower and slower as the list grows. By the end of this phase you'll be able to look at a
line of code and *feel* which kind you're doing.

First, let's get the names straight, because they trip people up.

📝 **Terminology.** An **array** is a fixed row of numbered slots laid out one after another in memory. A
**list** is the friendlier, everyday version most languages hand you (Python's `list`, JavaScript's
`Array`) — it grows and shrinks for you and hides the bookkeeping. The mental model below is the same for
both; we'll say "list" from here on, and call out the array detail only where it matters.

## The mental model: a row of numbered slots

**What it actually is.** A list is a row of slots, side by side, each holding one item, and each with a
number called its **index**. Picture a row of lockers:

```text
   index:    0        1        2        3        4
           ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐
   list:   │ Mo │   │ Tu │   │ We │   │ Th │   │ Fr │
           └────┘   └────┘   └────┘   └────┘   └────┘
             ▲                                    ▲
        first item                           last item
```

📝 **Terminology.** The **index** is the slot number. Almost every language starts counting at **0**, not
1 — so the first item is at index `0`, and a list of five items has indexes `0` through `4`. This
off-by-one feeling is completely normal and confuses everybody at first; you stop noticing it within a
week.

**Why the order matters.** A list *remembers the order you put things in*. Monday stays before Tuesday
until you change it. That's the defining feature: a list is for when sequence means something — steps in a
recipe, messages in a chat, rows in a spreadsheet.

## Reaching for an item by index — basically free

**What it does in real life.** Because the slots are laid out in a neat row, the computer can jump
*straight* to any slot just from its number. It doesn't walk past slots 0, 1, 2 to reach slot 3 — it
computes where slot 3 lives and lands on it directly. Slot #3 and slot #3000 cost the same.

```python
days = ["Mo", "Tu", "We", "Th", "Fr"]

print(days[0])   # the first item
print(days[3])   # the fourth item
```
```console
Mo
Th
```
*What just happened:* `days[3]` means "give me whatever is in slot number 3." The computer went straight
there and handed it back. This jump-to-a-slot move is the list's superpower, and it's why lists are the
default container for "I have a bunch of things in order and I want item number N."

💡 **Key point.** Access *by index* is the thing lists are fastest at. If your code spends its life saying
"give me item number N," a list is exactly right.

## Adding to the end — cheap

**What it does in real life.** Sticking a new item onto the *end* of a list is usually quick: there's
almost always room just past the last slot, so the item drops into place and the list's length ticks up by
one.

```python
days = ["Mo", "Tu", "We", "Th", "Fr"]
days.append("Sa")
print(days)
```
```console
['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
```
*What just happened:* `append` put `"Sa"` in the next slot after `"Fr"` and nothing else had to move. The
existing items kept their slots and their indexes. Appending is the natural, cheap way to grow a list, and
it's what you'll do most of the time.

📝 **Terminology.** "Cheap" / "fast" here means *the cost doesn't grow as the list gets bigger* — appending
to a 10-item list and a 10-million-item list feel the same. (Once in a while a growing list has to find a
bigger stretch of memory and copy itself, but averaged out, appending stays cheap. We'll leave that detail
to the future performance guide.)

## Inserting or removing in the *middle* — this is the costly one

Here's the trap. Adding to the *end* is cheap. Adding to the *middle* is not — and the code looks almost
identical, which is exactly why it bites people.

**Why it costs.** Remember the slots are a tight row with no gaps. To squeeze a new item into slot 1,
*every item from slot 1 onward has to shuffle one slot to the right* to make room. The bigger the list, the
more items have to move.

```text
   insert "X" at index 1:

   before:  ┌────┐ ┌────┐ ┌────┐ ┌────┐
            │ A  │ │ B  │ │ C  │ │ D  │
            └────┘ └────┘ └────┘ └────┘
                     │      │      │
                     ▼      ▼      ▼   everything from here shifts right
   after:   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
            │ A  │ │ X  │ │ B  │ │ C  │ │ D  │
            └────┘ └────┘ └────┘ └────┘ └────┘
```

```python
letters = ["A", "B", "C", "D"]
letters.insert(1, "X")   # put "X" at index 1, shove the rest over
print(letters)
```
```console
['A', 'X', 'B', 'C', 'D']
```
*What just happened:* `insert(1, "X")` placed `"X"` at index 1 and quietly moved `B`, `C`, and `D` each one
slot to the right. For four items that's nothing. For a list of a million items where you keep inserting
near the front, all that shuffling adds up to real, noticeable slowness. Removing from the middle has the
same problem in reverse: everything after the gap has to shuffle *left* to close it.

⚠️ **Gotcha.** A list inserting/removing at the *end* is cheap; doing it at the *front or middle* gets
slower as the list grows. They look like the same operation in your code — `append` vs `insert(0, ...)` —
but one is free and the other isn't. If you find yourself constantly inserting at the front of a big list,
that's a signal you might want a different structure (a future guide covers the "queue," which is built
exactly for cheap add/remove at *both* ends).

## Searching for a value — you have to look through them

One more honest limitation. A list is fast at "give me item number N," but it's *not* fast at "is the value
`"We"` in here, and where?" To answer that, the computer has no shortcut — it walks the slots one by one,
checking each, until it finds a match or runs out.

```python
days = ["Mo", "Tu", "We", "Th", "Fr"]
print("We" in days)        # is it present?
print(days.index("We"))    # at which slot?
```
```console
True
2
```
*What just happened:* `"We" in days` made the computer scan from the front, comparing each item, until it
hit `"We"` at slot 2. On a short list that's instant. On a huge list, searching by *value* this way gets
slower the bigger it grows — every item is a potential stop along the walk.

Hold onto that limitation, because it's the exact pain the next phase solves. When your real question is
"do I have this thing, and what's attached to it?" — a list makes you walk the whole row, and there's a
container built to answer that *instantly* instead.

## Recap

1. A **list** is an ordered row of numbered **slots**; the slot number is its **index** (counting from `0`).
2. **Order is preserved** — use a list when sequence matters.
3. **Access by index** (`days[3]`) is basically free, no matter how big the list is.
4. **Appending to the end** is cheap.
5. **Inserting/removing in the middle or front** is costly — everything after has to shuffle over.
6. **Searching by value** (`"We" in days`) means walking the list item by item — fine for small lists,
   slow for big ones.

That last point — slow lookup by value — is the doorway to the next container. Let's open it.

---

[← Guide overview](_guide.md) · [Phase 2: Maps & Sets — Lookup by Key →](02-maps-and-sets.md)
