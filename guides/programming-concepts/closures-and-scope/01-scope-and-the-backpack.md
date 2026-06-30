---
title: "Scope and the Backpack"
guide: "closures-and-scope"
phase: 1
summary: "Lexical scope means a function can see the variables around where it was written, and a closure is that function plus the captured variables it carries with it after the surrounding code is gone."
tags: [closures, scope, lexical-scope, capture, environment, first-class-functions]
difficulty: intermediate
synonyms: ["what is lexical scope", "what is a closure exactly", "why can a function see outer variables", "scope chain explained", "function plus environment", "where a function is defined vs called"]
updated: 2026-06-30
---

# Scope and the Backpack

Before closures make sense, one smaller idea has to be solid: **scope** - the set of variables a piece of code is allowed to see. You already use scope every day without naming it. Inside a function, you can read variables declared outside it. Outside that function, you can't reach the variables declared inside. That's scope drawing its lines.

The lines are not random. They follow a rule so reliable you can read them straight off the page, and that rule is the whole foundation.

## Lexical scope: where it's written, not where it's called

Most languages you'll meet use **lexical scope** (also called static scope). "Lexical" means *based on the text* - where a thing is physically written in the source code. A function can see the variables of the region of code it was *written inside*, regardless of where it later gets called from.

Picture nested boxes. Each function draws a box around its code. Inner boxes can see out into the boxes that enclose them; outer boxes cannot see in.

```text
outer box (file / module)
│  name = "Ada"
│
│  ┌─ greet() box ──────────────┐
│  │  can see: name  ✓          │
│  │                            │
│  │  ┌─ shout() box ────────┐  │
│  │  │  can see: name ✓     │  │
│  │  │  can see: greet vars │  │
│  │  └──────────────────────┘  │
│  └────────────────────────────┘
```

*What just happened:* Looking up a variable walks *outward* through the boxes that physically enclose the code - `shout` checks itself, then `greet`, then the file - and stops at the first match. This outward walk is called the **scope chain**, and because it follows the text, you can trace it by eye without running anything.

Here it is in real code:

```python
name = "Ada"

def greet():
    greeting = "Hello"
    print(greeting, name)   # sees greeting (own box) and name (outer box)

greet()
```

*What just happened:* `greet` reads `greeting` from its own scope and `name` from the enclosing module scope. The lookup walked outward and found each name in the nearest box that had it.

The opposite would be **dynamic scope**, where a function sees variables from wherever it was *called*. Almost no mainstream language works that way today, because it makes code impossible to reason about - you'd have to know every call site to know what a function can see. Lexical scope is the sane default, and it's what makes the next idea possible.

## The move that creates a closure

Now do one thing that feels innocent: have a function *return another function*, and let that inner function use a variable from the outer one.

```python
def make_greeter(name):
    def greet():
        print("Hello,", name)   # name comes from make_greeter's scope
    return greet

hi = make_greeter("Ada")
hi()                            # Hello, Ada
```

*What just happened:* `make_greeter` ran, created `greet`, and returned it - then `make_greeter` itself finished and its local `name` would normally vanish. But `hi()` still printed `Ada`. The inner function kept the variable alive.

That is the entire phenomenon. When `greet` was *defined*, it captured a reference to `name` from the box it was born in. When we returned `greet` and `make_greeter` exited, `greet` carried `name` out with it. The function plus the variables it captured is the closure.

💡 **The one-line definition.** A **closure** is a function bundled together with the variables it captured from the scope where it was *defined*. The function is the code; the closure is the code *plus its remembered environment*.

## The backpack

Here's the picture that makes it stick. When a function is created, it packs a backpack with references to the outer variables it uses. Wherever the function travels - returned, stored in a list, passed across the program - the backpack goes with it. Call the function much later, in a completely different part of the code, and it reaches into the backpack and finds those variables exactly as they were left.

```javascript
function makeCounter() {
  let count = 0;
  return function () {     // this function packs `count` in its backpack
    count += 1;
    return count;
  };
}

const next = makeCounter();
console.log(next());   // 1
console.log(next());   // 2
console.log(next());   // 3
```

*What just happened:* `makeCounter` finished after the first line of use, yet `count` survived and kept incrementing. `next` is holding a backpack containing `count`, and each call reaches in, bumps it, and puts it back. The variable lives as long as the closure that holds it does.

One detail that matters for everything ahead: the backpack holds a *reference to the variable*, not a frozen copy of its value. That's why `count` can change between calls. It's the same `count`, not a snapshot taken at creation time. Hold onto that - it's the seed of the famous bug in Phase 3.

## Why this exists at all

Closures aren't an accident of syntax; they're what makes functions genuinely *first-class*. If you can pass a function around like any other value, that function needs to keep working no matter where it lands - and "keep working" means still having access to the data it depended on. Without closures, a returned or stored function would be a half-broken thing, referring to variables that no longer exist. Closures are the mechanism that lets a function be a self-contained, portable unit of behavior *plus* the state it needs.

> **In the wild.** Every event handler, every callback you pass to `map` or `setTimeout`, every decorator, every "remember this config and use it later" helper - all of them lean on closures. You've been using them since your first callback, whether or not anyone named it.

```quiz
[
  {
    "q": "Under lexical scope, what determines which variables a function can see?",
    "choices": ["Where the function is called from", "Where the function is written in the source", "The order functions were defined", "Which thread runs the function"],
    "answer": 1,
    "explain": "Lexical (static) scope is based on the text - a function sees the variables of the region it was physically written inside, not wherever it's later called."
  },
  {
    "q": "What exactly is a closure?",
    "choices": ["Any function that takes another function as an argument", "A function plus the variables it captured from its defining scope", "A function with no parameters", "A copy of a function stored in a variable"],
    "answer": 1,
    "explain": "A closure is the function bundled with the variables it captured from the scope where it was defined - the code plus its remembered environment."
  },
  {
    "q": "In makeCounter, why does count keep increasing across separate calls to the returned function?",
    "choices": ["count is re-created as 0 on every call", "The closure captured a reference to the same count variable, which persists", "count is a global variable", "JavaScript caches return values"],
    "answer": 1,
    "explain": "The backpack holds a reference to count, not a fresh copy. The same variable survives between calls and keeps its value."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Closures You'll Actually Write →](02-closures-you-will-write.md)
