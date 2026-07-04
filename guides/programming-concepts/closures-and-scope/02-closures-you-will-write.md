---
title: "Closures You'll Actually Write"
guide: "closures-and-scope"
phase: 2
summary: "The everyday jobs closures do: private state nothing else can touch, pre-loading an argument so a function carries its own configuration, and callbacks that remember the context they were created in."
tags: [closures, private-state, callbacks, partial-application, encapsulation, scope]
difficulty: intermediate
synonyms: ["private state with closures", "closure counter example", "how to use closures", "closures for callbacks", "preload argument function", "encapsulation without classes", "data hiding with closures"]
updated: 2026-06-30
---

# Closures You'll Actually Write

Phase 1 gave you the model: a function carries a backpack of captured variables. That sounds abstract until you see what it *buys* you. Three patterns cover most of what closures are actually for, and once you recognize them you'll spot them everywhere in real code - and start reaching for them on purpose.

## Pattern 1: private state

A variable inside a function is invisible to the outside world. Combine that with a closure and you get state that *persists* between calls but that nothing else can reach, read, or corrupt. No class, no `private` keyword - the scope itself is the wall.

```javascript
function makeAccount(start) {
  let balance = start;                  // private - only the closures below can touch it

  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) {
      if (amount > balance) return "insufficient funds";
      balance -= amount;
      return balance;
    },
    check() { return balance; }
  };
}

const acct = makeAccount(100);
console.log(acct.deposit(50));   // 150
console.log(acct.withdraw(30));  // 120
console.log(acct.balance);       // undefined - there is no such property
```

*What just happened:* `balance` lives in `makeAccount`'s scope. The three returned functions all share that one `balance` through their backpacks, so they stay coordinated. But there's no way to reach `balance` from outside - `acct.balance` is `undefined` because `balance` was never a property, only a captured variable. The only way to change it is through `deposit` and `withdraw`, exactly as intended.

This is real encapsulation, built from nothing but scope. The data is protected not by a rule the language enforces with a keyword, but by the simple fact that no code outside the closure has any name for the variable.

💡 **Why this matters.** "Private state" usually makes people think of classes. Closures got there first and got there simpler: any time you want some data that a few functions share and outsiders can't reach, a closure does it without ceremony.

## Pattern 2: pre-loading an argument

Sometimes you have a general function and you want a specialized version with one argument already filled in. A closure captures that argument and hands back a smaller, ready-to-use function.

```python
def multiplier(factor):
    def multiply(n):
        return n * factor      # factor is captured from the enclosing call
    return multiply

double = multiplier(2)
triple = multiplier(3)

print(double(10))   # 20
print(triple(10))   # 30
```

*What just happened:* Calling `multiplier(2)` baked `factor = 2` into the `double` closure's backpack; `multiplier(3)` baked `3` into `triple`. Each returned function remembers its own `factor`, so `double` and `triple` are genuinely different functions made from the same template. This pattern - fixing one argument to produce a more specific function - is called **partial application**, and closures are how it's built.

You'll see this constantly: a logger pre-loaded with a category, a fetch helper pre-loaded with a base URL, a validator pre-loaded with a set of rules. One general function becomes a family of tailored ones, each carrying its own configuration.

## Pattern 3: callbacks that remember

This is where closures earn their keep most often. A callback is a function you hand to someone else to call *later* - when a button is clicked, when data arrives, when a timer fires. By the time it runs, the code that created it has long since moved on. The callback needs to remember the context it was born in, and a closure is precisely that memory.

```javascript
function setupButtons(labels) {
  for (const label of labels) {
    const button = createButton(label);
    button.onClick(function () {
      console.log("You clicked:", label);   // each callback remembers its own label
    });
  }
}

setupButtons(["Save", "Cancel", "Delete"]);
```

*What just happened:* Each click handler is created inside the loop body and captures the `label` that existed at that moment. When a click happens much later, the handler reaches into its backpack and finds the right label - "Save", "Cancel", or "Delete" - even though `setupButtons` finished running the instant it was called. The callback carried its context with it.

Notice this works cleanly here because `label` is declared with `const` *inside the loop body*, so each iteration creates a fresh `label`. That detail is doing quiet, critical work - and in Phase 3 you'll see exactly what goes wrong when that detail is missing.

> **For builders.** Callbacks are everywhere async code lives. When you pass a function to `setTimeout`, an event listener, or a promise's `.then`, you're handing off a closure that has to remember what it was working on. The same backpack that makes a counter work makes async callbacks coherent. For how those callbacks get scheduled and run later, see [Async/Await & the Event Loop](/guides/async-await-and-the-event-loop).

## The common thread

All three patterns are the same physics from Phase 1, pointed at different jobs:

- **Private state** - captured variables outlive the function, and outsiders have no name for them.
- **Pre-loading** - a captured argument specializes a general function.
- **Callbacks** - a captured context travels with a function to wherever it's called later.

You don't need three mental models. You need one - *a function carries the variables it was born next to* - and the uses fall out of it.

```quiz
[
  {
    "q": "In makeAccount, why can outside code not directly read or change balance?",
    "choices": ["balance is marked private", "balance is a captured variable with no name outside the closure", "JavaScript freezes returned objects", "balance is stored on the prototype"],
    "answer": 1,
    "explain": "balance is a local variable captured by the closures. Outside code has no name for it, so the only access is through the returned functions."
  },
  {
    "q": "After double = multiplier(2) and triple = multiplier(3), what makes double and triple behave differently?",
    "choices": ["They share one factor variable", "Each closure captured its own factor from a separate call", "Python re-evaluates multiplier on every call", "factor is a global that toggles"],
    "answer": 1,
    "explain": "Each call to multiplier created a new scope with its own factor, and the returned function captured that specific one. double remembers 2, triple remembers 3."
  },
  {
    "q": "Why is a closure the natural fit for a callback that runs later?",
    "choices": ["It runs faster than a named function", "It remembers the context it was created in, even after that code finished", "It prevents the callback from being called twice", "It copies all global variables"],
    "answer": 1,
    "explain": "By the time a callback fires, its creating code is long gone. The closure carries the captured context with it, so the callback still knows what it was working on."
  }
]
```

Watch it animated: [closures](/explainers/Closures.dc.html)

[← Phase 1: Scope and the Backpack](01-scope-and-the-backpack.md) · [Guide overview](_guide.md) · [Phase 3: The Loop Bug and Other Gotchas →](03-the-loop-bug-and-gotchas.md)
