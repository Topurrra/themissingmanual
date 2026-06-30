---
title: "Recursion, Finally"
guide: recursion-finally-clicks
phase: 2
summary: "The mental model that makes recursion stop being scary: a base case, a step toward it, and trust — plus when it blows the stack and how to avoid it."
tags: [recursion, base-case, call-stack, stack-overflow, iteration, algorithms]
difficulty: beginner
synonyms: ["how does recursion work", "what is a base case", "recursive function explained", "stack overflow recursion", "recursion vs iteration", "function that calls itself"]
updated: 2026-06-30
---

# Writing recursion that works

You have the model. Now the question that actually trips people at the keyboard: when you sit down to *write* one, where do you start, and how do you keep from getting lost? There is a reliable recipe, and once you follow it a few times it stops feeling like a recipe and starts feeling like how you see the problem.

## The recipe: base case first, always

Write the base case before anything else. This is not a style preference — it is what keeps you from writing an infinite loop. Ask: "what is the smallest input I can answer instantly, without recursing?" Write that, return, done.

Then write the recursive case as if the smaller call already works. Three questions, in order:

1. **What is the smallest case?** Answer it directly. (Base case.)
2. **How do I shrink the input by one step?** (The argument to the recursive call.)
3. **Given the trusted smaller answer, how do I build my answer?** (Combine.)

Let's run the recipe on summing a list:

```python runnable
def sum_list(nums):
    if not nums:                    # 1. smallest case: empty list sums to 0
        return 0
    return nums[0] + sum_list(nums[1:])   # 3. first item + trusted sum of the rest

print(sum_list([4, 2, 7, 1]))   # 14
```

*What just happened:* the empty list is the floor, returning `0`. Every other call peels off `nums[0]`, trusts `sum_list(nums[1:])` to sum the remaining items, and adds them. `[4,2,7,1]` becomes `4 + sum([2,7,1])` becomes `4 + (2 + sum([7,1]))` and so on down to the empty list.

That `nums[1:]` is the shrink step — each call gets a strictly shorter list, so the empty list is guaranteed to arrive. **Every recursive case must move toward the base case.** If your "smaller" input is not actually smaller, you have a bug, not a recursion.

## The call stack: where the in-progress work waits

To trust recursion you do not need to trace it, but to *debug* it you should know what is happening underneath. Every time a function calls another (including itself), the computer saves the current call's state — its variables, its place in the code — onto the **call stack**, and starts the new call. When a call returns, its frame is popped off and the call underneath picks up exactly where it paused.

Here is `factorial(3)` as a stack. Calls pile up on the way down, then unwind on the way back up:

```text
call factorial(3)   ->  needs 3 * factorial(2)   [waiting]
  call factorial(2) ->  needs 2 * factorial(1)   [waiting]
    call factorial(1) -> needs 1 * factorial(0)  [waiting]
      call factorial(0) -> base case, returns 1
    factorial(1) resumes: 1 * 1  = 1   returns
  factorial(2) resumes: 2 * 1    = 2   returns
factorial(3) resumes: 3 * 2      = 6   returns
```

*What just happened:* the calls stack up until the base case (`factorial(0)`) returns a real value with no further calls. Then each paused call wakes up, plugs in the answer from the call above it, and returns its own answer downward. The "waiting" frames are why recursion can do work *after* the recursive call returns.

That last point matters. A loop does its work as it goes. Recursion can also do work on the way *back up* — each frame was paused mid-expression (`3 * ___`) and finishes once the inner answer arrives. That unwinding is the recursion's superpower and, as you will see in phase 3, also where it can run out of room.

## Two calls, one function: branching recursion

Recursion really earns its keep when a problem splits into more than one smaller problem. The classic is walking a tree or any nested structure. Here is summing every number in an arbitrarily nested list:

```python runnable
def deep_sum(items):
    total = 0
    for x in items:
        if isinstance(x, list):     # a sub-list: trust deep_sum to handle it
            total += deep_sum(x)
        else:
            total += x
    return total

print(deep_sum([1, [2, [3, 4], 5], 6]))   # 21
```

*What just happened:* the base case is implicit — a list with no sub-lists never recurses and the loop returns its plain sum. When the loop hits a sub-list, it trusts `deep_sum` to total that branch however deep it goes. You did not write code for "three levels deep"; you wrote code for "one level, and trust the rest," and it handles any depth.

> Try writing iterative code that sums an *arbitrarily* nested list. You can, but you end up manually managing a stack of your own — which is exactly what recursion was doing for you for free. When the structure is nested or branching, recursion is usually the shorter, clearer code.

## In the wild

This shape is everywhere once you spot it. Walking a directory tree to find files: handle this folder's files, recurse into each subfolder. Rendering nested UI components: render this node, recurse into its children. Parsing JSON: a value might contain objects that contain values. All of them lean on the same move — handle one node, trust the function with the rest. Tree and list structures are covered in [data structures explained](/guides/data-structures-explained), and they are recursion's natural home.

```quiz
[
  {
    "q": "When writing a recursive function, what should you write first?",
    "choices": ["The recursive call", "The base case", "A test", "The combine step"],
    "answer": 1,
    "explain": "Writing the base case first ensures the recursion has a place to stop and keeps you from writing an infinite loop."
  },
  {
    "q": "What does the call stack hold while a recursive call is in progress?",
    "choices": ["Only the final answer", "Nothing; recursion uses no memory", "The paused state of each waiting call, to resume after the inner one returns", "A copy of the whole program"],
    "answer": 2,
    "explain": "Each call's variables and position are saved on the stack, then resumed when the call it is waiting on returns."
  },
  {
    "q": "In sum_list, why is nums[1:] essential?",
    "choices": ["It makes the code faster", "It is the shrink step that moves toward the empty-list base case", "It reverses the list", "It copies the list for safety"],
    "answer": 1,
    "explain": "Each call must get a strictly smaller input; passing the rest of the list guarantees the empty list is eventually reached."
  }
]
```

[← Phase 1: The mental model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: When it breaks →](03-when-it-breaks.md)
