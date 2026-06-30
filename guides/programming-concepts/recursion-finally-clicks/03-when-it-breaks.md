---
title: "Recursion, Finally"
guide: recursion-finally-clicks
phase: 3
summary: "The mental model that makes recursion stop being scary: a base case, a step toward it, and trust — plus when it blows the stack and how to avoid it."
tags: [recursion, base-case, call-stack, stack-overflow, iteration, algorithms]
difficulty: beginner
synonyms: ["how does recursion work", "what is a base case", "recursive function explained", "stack overflow recursion", "recursion vs iteration", "function that calls itself"]
updated: 2026-06-30
---

# When it breaks: the stack, and when to use a loop instead

Recursion is elegant until the day it isn't. You run your function and instead of an answer you get an angry wall of red text mentioning a "maximum recursion depth" or a "stack overflow." This phase is the production reality: the two ways recursion fails, how to read the error, and how to decide when a plain loop is the better tool.

## Failure one: no base case (or you never reach it)

The call stack is not infinite. Every paused call takes memory, and that memory is finite. If your recursion never hits its base case, the calls pile up forever until the space runs out and the program dies.

```python
def countdown(n):
    print(n)
    countdown(n - 1)    # forgot the base case!

countdown(3)
```

*What just happened:* this prints `3, 2, 1, 0, -1, -2, ...` and keeps going. There is no `if n == 0: return`, so nothing ever stops the descent. Python eventually raises `RecursionError: maximum recursion depth exceeded`. The fix is not subtle — add the base case back.

The sneakier version of this bug *has* a base case but never reaches it, because the recursive call does not actually shrink toward it:

```python
def countdown(n):
    if n == 0:
        return
    print(n)
    countdown(n)        # bug: passes n, not n - 1
```

*What just happened:* the base case exists, but `n` never changes, so `n == 0` is never true for a call that started above zero. Same crash. The lesson: a base case is necessary but not sufficient — **every recursive call must move strictly closer to it.** When you debug a stack overflow, check both: is there a base case, and does each call genuinely get smaller?

## Failure two: correct, but too deep

This one is meaner because the code is *right*. Sometimes a perfectly correct recursion goes deeper than the stack allows. Summing a list one element per call works fine for 100 items and explodes for 100,000:

```python
def sum_list(nums):
    if not nums:
        return 0
    return nums[0] + sum_list(nums[1:])

sum_list(list(range(100_000)))   # RecursionError
```

*What just happened:* this is the exact correct function from phase 2, but it needs one stack frame per element. Many language runtimes cap recursion depth (Python's default limit is in the low thousands) specifically to turn a silent memory blowout into a clean error. The function is not buggy — it is merely too deep for a linear walk. The right move here is not "recurse harder"; it is to use a loop.

> Raising the recursion limit (for example, Python's `sys.setrecursionlimit`) is almost always the wrong fix. You are not solving the depth problem, you are moving the cliff edge a little further out — and risking a real, uncatchable crash if you overshoot the actual stack memory. If depth is the problem, change the algorithm.

## Recursion versus iteration

Here is the honest truth: any recursion can be rewritten as a loop, and any loop can be rewritten as recursion. They are equally powerful. The choice is about which one makes the code clearer and which one fits in memory.

The same countdown, as a loop:

```python runnable
def countdown(n):
    while n > 0:        # the loop condition IS the base case, inverted
        print(n)
        n -= 1          # the same shrink step, just in place
    print("liftoff")

countdown(3)
```

*What just happened:* identical behavior, no stack growth. The `while` condition plays the role of the base case, and `n -= 1` plays the role of the shrink step. Notice the parts did not disappear — they are the same two ideas, written as a loop instead of as calls. A loop uses one stack frame no matter how many times it runs, so it never overflows on depth.

So when do you reach for which?

- **Prefer a loop** when the work is a straight linear walk — summing, counting, scanning a flat list. It is clearer to most readers and it cannot overflow.
- **Prefer recursion** when the structure is itself nested or branching — trees, nested data, "this thing contains smaller versions of this thing." Forcing that into a loop means hand-managing your own stack, which is more code and more bugs.
- **If recursion is the clear fit but depth is a risk** (a very deep tree), you can convert to an iterative version with an explicit list acting as the stack — you do by hand what the call stack did for free, but you control the memory.

```text
linear, flat data          -> loop        (clear, no overflow)
nested / branching data     -> recursion   (matches the shape)
nested data, but very deep  -> explicit stack loop (control the memory)
```

*What just happened:* this is the decision in three lines. Match the tool to the shape of the data first; only reach for the explicit-stack version when a naturally-recursive problem is also dangerously deep.

## For builders

In day-to-day code, most recursion you write is shallow and safe — walking a config tree, a DOM, a modest folder hierarchy. The depth limit only bites when the structure can grow without bound (user-supplied nesting, a linked list of every event ever) or when you accidentally recurse over a flat collection that should have been a loop. When you read a `RecursionError` in production, your first two questions are always the same: *is the base case ever reached*, and *is this depth legitimate or should this have been a loop?* That diagnosis covers nearly every case you will hit.

```quiz
[
  {
    "q": "A recursive function has a correct base case but still crashes with a stack overflow. What is the most likely cause?",
    "choices": ["The base case returns the wrong value", "The recursive call does not move the input closer to the base case", "Recursion is disabled in the language", "The function name is misspelled"],
    "answer": 1,
    "explain": "A base case only helps if every call shrinks toward it; if the input never changes, the base case is never reached."
  },
  {
    "q": "A correct recursive sum works on a small list but raises RecursionError on a list of 100,000 items. The best fix is:",
    "choices": ["Raise the recursion limit as high as possible", "Rewrite it as a loop", "Add a second base case", "Call it twice"],
    "answer": 1,
    "explain": "The function is fine but too deep; a loop uses one stack frame regardless of length and cannot overflow on depth."
  },
  {
    "q": "When is iteration (a loop) generally the better choice over recursion?",
    "choices": ["For walking trees and nested structures", "For a straight linear walk over flat data", "Whenever the input is large and nested", "Never; recursion is always better"],
    "answer": 1,
    "explain": "Loops are clearer and overflow-proof for linear work; recursion shines when the data itself is nested or branching."
  }
]
```

[← Phase 2: Writing recursion that works](02-writing-recursion-that-works.md) | [Overview](_guide.md)
