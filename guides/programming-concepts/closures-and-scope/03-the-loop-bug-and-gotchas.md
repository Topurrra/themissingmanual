---
title: "The Loop Bug and Other Gotchas"
guide: "closures-and-scope"
phase: 3
summary: "The classic trap where every callback created in a loop sees the final value of the loop variable, why it happens - capture is by reference, not by snapshot - and the small fixes in JavaScript and Python."
tags: [closures, loop-bug, var-vs-let, capture-by-reference, late-binding, memory-leak, gotchas]
difficulty: intermediate
synonyms: ["all my callbacks see the last value", "loop variable closure bug", "closure captures variable not value", "var vs let closure", "python closure loop late binding", "default argument closure fix", "closure memory leak", "why does my loop print the same number"]
updated: 2026-07-10
---

# The Loop Bug and Other Gotchas

Now the bug that sends people searching at midnight: the single most common closure mistake, appearing in nearly every language with first-class functions, looking so wrong that people assume the language is broken. It isn't - the behavior follows directly from the one rule you already know: closures capture the *variable*, not a snapshot of its value. Once you see that, the bug becomes inevitable instead of mysterious.

## The bug

You build a list of functions in a loop. Each one should remember the loop counter at its moment of creation. Watch what they actually remember.

```javascript
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(function () {
    console.log(i);
  });
}

funcs[0]();   // 3
funcs[1]();   // 3
funcs[2]();   // 3
```

*What just happened:* You expected `0, 1, 2`. You got `3, 3, 3`. Every function printed the same value - and not even a value any function was "supposed" to see, but the value `i` ended on *after the loop finished*.

The same thing happens in Python:

```python
funcs = []
for i in range(3):
    funcs.append(lambda: print(i))

funcs[0]()   # 2
funcs[1]()   # 2
funcs[2]()   # 2
```

*What just happened:* Three lambdas, all printing `2` - the last value `i` held. Identical bug, identical cause.

## Why it happens

Here's the part that turns confusion into understanding. With `var` in JavaScript (and with any plain loop variable in Python), there is **one** variable `i`, shared by every iteration. The loop doesn't make a new `i` each time around - it reuses the same one, changing its value.

Each closure captured a reference to that *one shared variable*. They didn't each grab a copy of `i`'s value at the instant they were created; they all grabbed a reference to the same box labeled `i`. By the time you actually *call* the functions, the loop is long over and that one box holds its final value. Every closure looks in the same box and sees the same thing.

```text
ONE shared i  ──►  [ 3 ]
                    ▲ ▲ ▲
        func0 ──────┘ │ │   all three closures point
        func1 ────────┘ │   at the same box, read it
        func2 ──────────┘   at call time → all see 3
```

*What just happened:* The closures are working *correctly* - they each read the live value of the variable they captured. The mistake was assuming "capture" means "take a photo now." It means "keep a pointer to the box." This delayed read is sometimes called **late binding**: the value is looked up when the function runs, not when it's defined.

## The fix: give each iteration its own variable

The cure is to stop sharing one variable. Give every iteration a *fresh* variable, so each closure captures a different box.

In JavaScript, this is exactly what `let` does inside a loop - it creates a new binding per iteration:

```javascript
const funcs = [];
for (let i = 0; i < 3; i++) {   // let, not var
  funcs.push(function () {
    console.log(i);
  });
}

funcs[0]();   // 0
funcs[1]();   // 1
funcs[2]();   // 2
```

*What just happened:* With `let`, each pass through the loop gets its own `i`. There are now three separate boxes, and each closure captured a different one - so they print `0, 1, 2`. Changing one keyword fixed it, because the keyword changed how many variables exist.

Python has no per-iteration binding, so the idiomatic fix is to **capture the value explicitly** using a default argument, which is evaluated once, at definition time:

```python
funcs = []
for i in range(3):
    funcs.append(lambda i=i: print(i))   # i=i snapshots the current value

funcs[0]()   # 0
funcs[1]()   # 1
funcs[2]()   # 2
```

*What just happened:* `lambda i=i:` says "make `i` a parameter whose default is the *current* value of the loop's `i`." Default values are computed when the function is defined, so each lambda freezes its own number. You've forced a snapshot instead of relying on a shared reference.

💡 **The lesson in one line.** The bug isn't "closures are weird." It's "closures capture variables, and a plain loop reuses one variable." The fix is always the same idea: make sure each closure captures a *different* variable.

## The other gotcha: closures can hold memory hostage

There's a quieter trap worth knowing. A closure keeps its entire captured environment alive for as long as the closure itself exists. That's the whole point - but it means a long-lived closure can accidentally pin large objects in memory that you assumed were gone.

```javascript
function attach() {
  const hugeData = loadBigThing();        // large object
  document.addEventListener("scroll", function () {
    console.log("scrolled");              // never even uses hugeData
  });
}
```

*What just happened:* The scroll handler is a closure over `attach`'s scope, and as long as that listener stays registered, the whole scope - including `hugeData` - can't be garbage collected, even though the handler never touches it. The listener outlives the function, so its backpack does too. The fix is to scope large data tighter, or remove the listener when you're done with it.

> **In the wild.** This is a real source of memory leaks in long-running front ends and servers: event handlers and callbacks that quietly retain big objects through their captured scope. When a process slowly grows in memory and you can't find why, look for closures that outlive what they captured. For how reachable objects keep memory alive, the underlying mechanism is in [What Happens When Code Runs](/guides/what-happens-when-code-runs).

## Recap

1. **The loop bug** - closures created in a loop all see the loop variable's *final* value, because a plain loop reuses one shared variable and capture is by reference.
2. **Late binding** - a closure reads its captured variable when it *runs*, not when it's *defined*; the loop has finished changing the variable by then.
3. **The fix** - give each iteration its own variable: `let` in JavaScript, a default-argument snapshot (`i=i`) in Python.
4. **Memory** - closures keep their whole captured scope alive; a long-lived closure can pin large objects you thought were freed.

You now have the full model - scope, capture, the patterns, and the traps. The next time a function remembers the wrong thing, you won't guess. You'll know which box it's looking in.

```quiz
[
  {
    "q": "Why do all three functions print 3 in the var version of the loop?",
    "choices": ["The closures each copied i when created", "There is one shared i, and every closure reads its final value at call time", "var resets i to 3 automatically", "Functions in arrays share return values"],
    "answer": 1,
    "explain": "var creates a single i reused across iterations. All closures captured that one variable and read its final value (3) when called - late binding."
  },
  {
    "q": "How does using let instead of var fix the loop bug in JavaScript?",
    "choices": ["let makes the loop run faster", "let creates a new binding for each iteration, so each closure captures a different variable", "let copies the function body", "let disables closures inside loops"],
    "answer": 1,
    "explain": "let gives every iteration its own fresh i. With separate boxes, each closure captures a different one, so they print 0, 1, 2."
  },
  {
    "q": "Why might a long-lived event handler cause a memory leak?",
    "choices": ["Handlers are never garbage collected", "The closure keeps its entire captured scope alive, including large objects it doesn't use", "Each handler copies the whole heap", "Closures double their memory on every call"],
    "answer": 1,
    "explain": "A closure retains its captured environment as long as it exists. A persistent handler can pin large captured objects in memory even if it never references them."
  }
]
```

[← Phase 2: Closures You'll Actually Write](02-closures-you-will-write.md) · [Guide overview](_guide.md)
