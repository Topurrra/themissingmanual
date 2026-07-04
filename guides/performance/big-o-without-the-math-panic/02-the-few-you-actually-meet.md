---
title: "The Few You Actually Meet"
guide: "big-o-without-the-math-panic"
phase: 2
summary: "In real code you mostly see five Big-O shapes: O(1) constant, O(n) linear, O(n²) quadratic, O(log n) logarithmic, and O(n log n). Here's each one in plain language, with a table for naming them from the code."
tags: [performance, big-o, constant, linear, quadratic, logarithmic, beginner-friendly]
difficulty: beginner
synonyms: ["what does o(1) mean", "what does o(n) mean", "what is o(n squared)", "what is o(log n)", "what is o(n log n)", "common big o complexities", "how to tell big o from code", "nested loop big o"]
updated: 2026-06-19
---

# The Few You Actually Meet

There are infinitely many possible growth shapes, but you don't need them. In day-to-day code, the same
small cast shows up over and over. Learn these five and you can name the Big-O of most things you'll
ever read.

For each one, hold the question from Phase 1 in your head: *double the input - what happens to the work?*

> ⏭️ New here? If `n` and "how work grows" feel fuzzy, read
> [Phase 1](01-its-about-how-things-grow.md) first - it's short, and the rest of this builds on it.

## O(1) - constant: "doesn't care how big the data is"

**What it actually is.** The work is the same no matter how much data you have. Double the input,
triple it, make it a billion - the code does the same fixed amount of work. The `1` doesn't mean "one
step"; it means "a *constant* number of steps that doesn't grow with `n`."

**What it does in real life.** Grabbing one item by its position in a list. Reading a value from a
hash map (a dictionary). Checking whether a number is even. The data could be enormous and these don't
break a sweat.

**A real example.**
```python
def first_item(items):
    return items[0]
```
*What just happened:* Whether `items` has 5 elements or 5 million, `items[0]` jumps straight to the
first one. No looping, no searching. The work doesn't grow with the input - that's `O(1)`.

**Why this saves you later.** When something is `O(1)`, you can stop worrying about it scaling. These
are the operations you *want* in your hot paths. A big part of writing fast code is turning expensive
lookups into `O(1)` ones (more on that in [Phase 3](03-why-it-matters-in-real-life.md)).

## O(n) - linear: "twice the data, twice the work"

**What it actually is.** The work grows in lockstep with the input. Touch every item once. Double the
input and you do twice the work - a straight, honest line.

**What it does in real life.** Looping through a list to add up the numbers, find the biggest one,
print each row, or search an *unsorted* list for a value. If you have to *look at everything*, you're at
least `O(n)`.

**A real example.**
```python
def total(numbers):
    running = 0
    for n in numbers:        # ← visits each number exactly once
        running += n
    return running
```
*What just happened:* The loop runs once per element. 100 numbers → 100 additions; 1,000 numbers →
1,000 additions. Work tracks input one-to-one. That's `O(n)`, and for "I need to see everything," it's
the best you can do.

**Why this saves you later.** `O(n)` is usually fine - it's the baseline cost of actually reading your
data. The thing to watch isn't a single loop; it's a loop *inside another loop*, which is next.

## O(n²) - quadratic: the nested-loop trap

**What it actually is.** For every item, you do work proportional to *all* the items - a loop inside a
loop. Double the input and the work *quadruples*. This is the handshake-at-a-party shape from Phase 1,
and it's the one that quietly kills programs.

**What it does in real life.** Comparing every item to every other item: checking a list for duplicates
the naive way, computing the distance between every pair of points, the classic bubble sort.

**A real example.**
```python
def has_duplicate(items):
    for i in range(len(items)):          # ← outer loop: n times
        for j in range(i + 1, len(items)):   # ← inner loop: ~n times each
            if items[i] == items[j]:
                return True
    return False
```
*What just happened:* For each item, the inner loop walks much of the rest of the list. With 1,000
items that's on the order of a million comparisons; with a million items it's on the order of a
*trillion*. The two stacked loops, each running across the data, is the visual signature of `O(n²)`.

⚠️ **Gotcha: the nested loop you didn't notice.** The dangerous version isn't two obvious `for` loops.
It's a loop that calls something *which itself loops* - like `if x in big_list:` inside a `for` loop,
where `in` quietly scans the whole list every time. It *looks* like one loop. It behaves like two. When
you see a search, a `.index()`, or an `in` check inside a loop, stop and ask whether you've accidentally
built `O(n²)`. (This exact trap gets its own story in
[Phase 3](03-why-it-matters-in-real-life.md).)

**Why this saves you later.** Most "it was instant in testing and now production hangs" disasters are
an accidental `O(n²)`. Learning to spot the nested-loop shape is one of the highest-value habits in this
whole guide.

## O(log n) - logarithmic: "halve the problem each step"

**What it actually is.** Each step throws away *half* of what's left. Because you keep halving,
even gigantic inputs collapse to a tiny number of steps. The work grows *incredibly* slowly: doubling
the input adds just **one** more step.

**What it does in real life.** The flagship example is **binary search** - finding a value in a
*sorted* list by repeatedly checking the middle and discarding the half that can't contain it. Looking
something up in a balanced search tree works the same way.

**A real example.** Searching a sorted phone book of a million names:
```text
   1,000,000 names → check the middle → keep half →   500,000
                                                  →   250,000
                                                  →   125,000
                                                  →    ... and so on
   after ~20 halvings → 1 name left.
```
*What just happened:* Each check cuts the search space in half. A *million* entries are found in about
20 steps. Double it to two million? You need just *one* more step (~21). That's why `O(log n)` lines
look almost flat - they barely rise no matter how far right you go.

📝 **Terminology.** A *logarithm* sounds like math homework, but here it means exactly one homely thing:
*how many times can I halve this before I hit 1?* That count is the log. No calculator required.

**Why this saves you later.** When a lookup is too slow, the dream is often to turn an `O(n)` scan into
an `O(log n)` search - usually by keeping the data *sorted* or *indexed* first. Binary search has its
own full walkthrough in [Data Structures, Explained](/guides/data-structures-explained).

## O(n log n) - the shape of good sorting

**What it actually is.** You do a linear amount of work (`n`), but each piece involves a halving-style
`log n` cost - so you multiply them. It's noticeably more than `O(n)` but *dramatically* better than
`O(n²)`. Think of it as "linear, with a small, well-behaved tax."

**What it does in real life.** This is the speed of every good general-purpose sort - merge sort,
heapsort, and the sorts built into real languages. When you call `sorted()` in Python or `.sort()` in
JavaScript, you're paying `O(n log n)`.

**A real example.**
```python
names = ["Ada", "Linus", "Grace", "Alan", "Margaret"]
ordered = sorted(names)   # ← the built-in sort: O(n log n)
```
*What just happened:* Sorting can't be done by looking at each item just once - items have to be
*compared and moved* relative to each other. Good sorts do that cleverly, in `O(n log n)`, instead of
the `O(n²)` you'd get from comparing every pair. For a million items, that's the difference between
roughly twenty million steps and a *trillion*.

**Why this saves you later.** `O(n log n)` is the practical ceiling for "I need everything in order."
If you find yourself about to write a hand-rolled sort with nested loops (`O(n²)`), stop - the built-in
sort is almost always faster and already `O(n log n)`. And once data is sorted, you unlock that lovely
`O(log n)` binary search.

## Name it from the code

This is your cheat-card. When you're staring at code, match the pattern to the shape:

| You see this in the code… | It's probably… | Doubling the input means… |
|---|---|---|
| Grab one item by index/key; a hash-map lookup | **O(1)** constant | work barely changes |
| One loop over the data | **O(n)** linear | work doubles |
| A loop **inside** a loop, both over the data | **O(n²)** quadratic | work *quadruples* |
| A search/`in`/`.index()` **inside** a loop | **O(n²)** (hidden!) | work *quadruples* |
| Repeatedly **halving** (binary search, balanced tree) | **O(log n)** logarithmic | one extra step |
| Calling a built-in **sort** | **O(n log n)** | a bit more than double |

⚠️ **Read it as the *worst* path, and drop the small stuff.** Big-O describes the *worst case* - the
most work the code might do - so two separate loops one after the other is still `O(n)` (it's `2n`, but
Big-O drops constant multipliers - see [Phase 3](03-why-it-matters-in-real-life.md)). What flips you to
a worse shape is *nesting* - work happening *per item, for every item*.

## Recap

1. **O(1)** - same work regardless of size; the lookups you want everywhere.
2. **O(n)** - touch everything once; the honest baseline.
3. **O(n²)** - a loop inside a loop; double the data, quadruple the work; **the trap**.
4. **O(log n)** - halve each step; gigantic inputs in a handful of steps (binary search).
5. **O(n log n)** - the speed of good sorting; far better than `O(n²)`.
6. The fastest way to spot trouble: **a search or loop nested inside another loop.**

Next, why this isn't academic - the same code that's fine at 100 items and dies at 10 million, and how
your choice of data structure secretly sets your Big-O.

Watch it animated: [Big O notation](/explainers/BigO.dc.html)

---

[← Phase 1: It's About How Things GROW](01-its-about-how-things-grow.md) · [Guide overview](_guide.md) · [Phase 3: Why It Matters in Real Life →](03-why-it-matters-in-real-life.md)

## See it grow

Drag *n* and watch how each complexity class pulls away from the others:

```playground-bigo
```
