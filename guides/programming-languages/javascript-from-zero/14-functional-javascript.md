---
title: "Functional JavaScript — Functions as Building Blocks"
guide: "javascript-from-zero"
phase: 14
summary: "Treat functions as values you pass around and combine. Pure functions, immutability, higher-order functions, and composition — the small set of ideas that make JavaScript code testable, predictable, and easy to reason about."
tags: [javascript, functional-programming, higher-order-functions, immutability, pure-functions, composition, currying]
difficulty: intermediate
synonyms: ["functional programming javascript", "what is a pure function", "higher order functions javascript", "immutability javascript", "function composition", "currying javascript", "map filter reduce explained"]
updated: 2026-06-19
---

# Functional JavaScript — Functions as Building Blocks

You already use functional JavaScript without naming it. Every time you wrote `nums.map(n => n * 2)` back in [Phase 9](09-idioms-and-gotchas.md), you handed one function to another function. That single move — passing a function as if it were a number or a string — is the seed the whole functional style grows from.

This phase isn't about a new framework or syntax. It's a *way of thinking*: build programs out of small, honest functions and snap them together. The payoff is code you can test in isolation, reason about without tracing the whole program, and change without fear. Five ideas carry the weight: functions as values, purity, higher-order functions, immutability, and composition. Each one builds on the last.

## Functions are first-class values

**What it actually is.** In JavaScript a function is an ordinary value, like a number or a string. You can store it in a variable, put it in an array, pass it as an argument, and return it from another function. This is the mental model that unlocks everything else in the phase — once you see functions as *things you can move around*, the rest follows.

📝 **First-class value** — something the language lets you store in a variable, pass as an argument, and return from a function. In JavaScript, functions qualify; that's what "functions are first-class" means.

```javascript runnable
const double = (n) => n * 2;        // store a function in a variable
const ops = [double, (n) => n + 1]; // put functions in an array

function applyAll(value, fns) {     // accept functions as an argument
  return fns.map((fn) => fn(value));
}

console.log(double(5));
console.log(applyAll(10, ops));
```
```console
10
[ 20, 11 ]
```
*What just happened:* `double` is a function living in a variable — no different from `const x = 5`. We dropped two functions into an array, then passed that array into `applyAll`, which called each one. Nothing here is special syntax; we're treating functions as plain values and that's the whole trick. Hold onto this: passing and returning functions is the foundation the next four sections stand on.

## Pure functions

The most valuable function you can write is one that's *boring and predictable*. That's a **pure function**.

📝 **Pure function** — a function that (1) returns the same output for the same input, every time, and (2) has no side effects: it doesn't change anything outside itself (no mutating shared variables, no writing to the page, no network calls, no `console.log`). Give it `2` and `3`, it gives back `5` — today, tomorrow, on any machine.

**Why this matters.** A pure function is a closed box: to understand it you only read *it*, not the rest of the program. You can test it with nothing but inputs and expected outputs — no setup, no mocks, no database. And it can never surprise a caller by quietly editing something elsewhere. Impure functions, by contrast, depend on or alter the world around them, so understanding one means understanding everything it touches.

```javascript runnable
// PURE: output depends only on inputs; nothing outside changes.
function addPure(a, b) {
  return a + b;
}

// IMPURE: reads and writes a shared variable outside itself.
let total = 0;
function addImpure(n) {
  total += n;          // side effect: mutates outer state
  return total;        // output depends on history, not just input
}

console.log(addPure(2, 3), addPure(2, 3)); // same input -> same output
console.log(addImpure(5), addImpure(5));   // same input -> DIFFERENT output
```
```console
5 5
5 10
```
*What just happened:* `addPure(2, 3)` returned `5` both times — feed it the same inputs, get the same answer, forever. `addImpure(5)` returned `5` the first time and `10` the second, because it secretly leans on `total`, which it also mutates. Same input, different output: that's the hallmark of an impure function, and the reason it's harder to test and trust.

💡 **Push side effects to the edges.** You can't avoid side effects entirely — a real program must eventually read input, draw to the screen, or save a file. The functional move isn't to eliminate them; it's to *concentrate* them. Keep a large core of pure functions that compute results, and do the messy I/O in a thin shell at the boundary. The more of your logic that's pure, the more of your program you can reason about and test in isolation.

## Higher-order functions

Once functions are values, a natural superpower appears: functions that take or return *other* functions.

📝 **Higher-order function** — a function that does at least one of these: takes a function as an argument, or returns a function. `map`, `filter`, and `reduce` from Phase 9 are all higher-order — they take a function. Here you'll also build one that *returns* a function.

A function that returns a function is a **factory**: you give it some configuration and it hands back a brand-new, specialized function with that configuration baked in.

```javascript runnable
// A factory: returns a NEW function specialized by `factor`.
function multiplyBy(factor) {
  return (n) => n * factor;   // the returned function remembers `factor`
}

const triple = multiplyBy(3);
const tenfold = multiplyBy(10);

console.log(triple(5));
console.log(tenfold(5));
console.log([1, 2, 3].map(multiplyBy(2))); // hand the new function to map
```
```console
15
50
[ 2, 4, 6 ]
```
*What just happened:* `multiplyBy(3)` ran and *returned a function* — one that multiplies by 3 because it remembers `factor` from the call that created it (that's a closure, from [Phase 10](10-scope-and-closures.md)). We made two specialized functions, `triple` and `tenfold`, from one factory. The last line shows why this is so useful: `multiplyBy(2)` produces exactly the kind of single-argument function `map` wants, so we build it on the spot and hand it over. Factories let you generate tailored functions instead of writing each one by hand.

Returning functions also lets you *wrap* behavior. A logging wrapper takes any function and returns a new one that does the same job, plus logs:

```javascript runnable
function withLogging(fn) {
  return (...args) => {              // rest gathers all arguments (Phase 9)
    console.log("calling with:", args);
    const result = fn(...args);      // spread them back in
    console.log("got:", result);
    return result;
  };
}

const add = (a, b) => a + b;
const loudAdd = withLogging(add);
loudAdd(2, 3);
```
```console
calling with: [ 2, 3 ]
got: 5
```
*What just happened:* `withLogging` took a function and returned a *new* function that wraps it — running the original via `fn(...args)` but printing before and after. The wrapped `loudAdd` behaves exactly like `add` to its caller, with logging bolted on, and `add` itself never had to change. This "take a function, return an enhanced function" pattern is the heart of decorators, middleware, and a lot of library design.

## Immutability — don't mutate, return new data

Back in Phase 9 you met the reference trap: objects and arrays are held by *reference*, so two variables can point at the same object and a change through one is visible through the other. **Immutability** is the discipline that defuses that trap: instead of changing existing data in place, you produce *new* data and leave the original untouched.

📝 **Immutability** — treating data as read-only. Rather than mutating an array or object (`push`, `splice`, `obj.x = ...`), you build a new one (`map`, `filter`, spread `...`) and leave the original alone.

**Why bother.** Shared mutable state is the source of an enormous share of bugs. When any part of the program can reach in and change an object another part is relying on, behavior depends on *who ran when* — and that's nearly impossible to reason about. If data never changes out from under you, a whole category of "why did this value change?!" bugs can't happen at all. (Pure functions and immutability are siblings: a pure function won't mutate its inputs, so it naturally produces new data.)

Here's the trap and the fix side by side:

```javascript runnable
const original = [1, 2, 3];

// MUTATING approach: push changes `original` in place.
function addItemBad(arr, item) {
  arr.push(item);   // mutates the array passed in!
  return arr;
}

const bad = addItemBad(original, 4);
console.log("after bad:", original); // original was modified — surprise

// IMMUTABLE approach: build a new array, leave the input alone.
const fresh = [10, 20, 30];
function addItemGood(arr, item) {
  return [...arr, item]; // new array; arr is untouched
}

const good = addItemGood(fresh, 40);
console.log("fresh stays:", fresh);
console.log("good is new: ", good);
```
```console
after bad: [ 1, 2, 3, 4 ]
fresh stays: [ 10, 20, 30 ]
good is new:  [ 10, 20, 30, 40 ]
```
*What just happened:* `addItemBad` called `push`, which mutated the very array it was handed — so `original` silently grew a `4`, even though the caller never asked for that. `addItemGood` instead spread the old items into a *new* array with the extra element, so `fresh` stayed exactly as it was and `good` is a separate value. The immutable version can't corrupt its caller's data, which makes it safe to pass around freely.

The same pattern works for objects with spread, and for "removing" items with `filter`:

```javascript runnable
const user = { name: "Ada", role: "user" };

const promoted = { ...user, role: "admin" }; // new object, one field changed
const numbers = [1, 2, 3, 4];
const noTwo = numbers.filter((n) => n !== 2); // new array without the 2

console.log("user unchanged:", user);
console.log("promoted:      ", promoted);
console.log("noTwo:         ", noTwo);
```
```console
user unchanged: { name: 'Ada', role: 'user' }
promoted:       { name: 'Ada', role: 'admin' }
noTwo:          [ 1, 3, 4 ]
```
*What just happened:* `{ ...user, role: "admin" }` copied every field of `user` and overrode `role`, producing a new object while `user` stayed put. `filter` built a new array containing everything except the `2` — it never touched `numbers`. The rule of thumb: reach for `map`, `filter`, and spread (which return new data) instead of `push`, `splice`, and direct property assignment (which mutate). Your data stops changing behind your back.

## Composition (and a taste of currying)

The final idea ties the rest together. **Composition** is building a bigger function by chaining small ones, so the output of each feeds the next. If your functions are pure, this is wonderfully safe: there's no hidden state to trip over, so a pipeline is just "do this, then this, then this."

📝 **Composition** — combining simple functions into a more complex one by feeding each function's output into the next. `pipe(f, g)(x)` means `g(f(x))`: run `f` on `x`, then run `g` on the result.

You can write a tiny `pipe` yourself — it's a higher-order function that takes functions and returns a function:

```javascript runnable
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const exclaim = (s) => s + "!";

const shout = pipe(trim, lower, exclaim); // left-to-right pipeline

console.log(shout("  HELLO  "));
```
```console
hello!
```
*What just happened:* `pipe` gathered the three functions into an array, then returned a new function. When called with `"  HELLO  "`, `reduce` ran them left to right: `trim` produced `"HELLO"`, `lower` turned that into `"hello"`, `exclaim` made `"hello!"`. Each function does one small thing; `pipe` snaps them into a readable left-to-right flow. (Mathematicians write composition right-to-left and call it `compose`; `pipe` is the same idea in reading order, which most people find clearer.)

**A taste of currying.** **Currying** is turning a function that takes several arguments into a chain of functions that each take one. You saw the shape already in `multiplyBy`: call it with one argument now, get a function waiting for the rest. Currying is handy precisely because pipelines and `map` want single-argument functions.

```javascript runnable
// Curried: take `factor` now, return a function waiting for `n`.
const multiply = (factor) => (n) => n * factor;
const add = (amount) => (n) => n + amount;

const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

const transform = pipe(multiply(2), add(10)); // tidy single-arg functions
console.log(transform(5)); // (5 * 2) + 10
```
```console
20
```
*What just happened:* `multiply(2)` returned a function that doubles; `add(10)` returned one that adds ten. Because each is pre-configured down to a single argument, they slot straight into `pipe` and read cleanly as a pipeline: double, then add ten. Currying is what makes small functions easy to combine.

⚠️ **Don't over-engineer.** It's tempting to take this far — deep `pipe` chains, everything curried, "point-free" code with no named intermediate values. Resist it when it hurts readability. The goal of functional style is code that's *easier* to understand, not a puzzle. If a plain `for` loop or a couple of named variables makes the intent obvious, use them. A two-line composition that the next person can read beats a clever one-liner they have to decode. Readability wins.

## Recap

1. **Functions are first-class values** — you can store, pass, and return them. That single fact is the foundation the entire functional style is built on.
2. **Pure functions** return the same output for the same input and cause no side effects, which makes them trivial to test and impossible to surprise you. Push the unavoidable side effects to the edges.
3. **Higher-order functions** take or return functions. Factories (return a function) and wrappers (take and enhance a function) let you generate and extend behavior without rewriting it.
4. **Immutability** means building new data (`map`, `filter`, spread) instead of mutating in place (`push`, `splice`, assignment) — defusing the shared-reference bugs from Phase 9.
5. **Composition** chains small functions into bigger ones (`pipe`), and **currying** pre-configures functions down to single arguments so they snap together cleanly.
6. ⚠️ Use these to make code *clearer*, not cleverer. Readability beats point-free wizardry every time.

## Quick check

Test yourself on the ideas that make functional code predictable:

```quiz
[
  {
    "q": "Which function is pure?",
    "choices": [
      "`function add(a, b) { return a + b; }`",
      "`function add(n) { total += n; return total; }` (total is an outer variable)",
      "`function save(x) { localStorage.setItem('x', x); }`",
      "`function now() { return Date.now(); }`"
    ],
    "answer": 0,
    "explain": "A pure function returns the same output for the same input and has no side effects. `add(a, b)` depends only on its arguments and changes nothing outside itself. The others mutate outer state, write to storage, or return a value that depends on the clock rather than the input."
  },
  {
    "q": "Why prefer `return [...arr, item]` over `arr.push(item)` when adding to an array?",
    "choices": [
      "Spread builds a new array and leaves the original untouched, avoiding shared-reference bugs",
      "`push` is deprecated in modern JavaScript",
      "Spread is always faster than push",
      "`push` cannot add to the end of an array"
    ],
    "answer": 0,
    "explain": "`push` mutates the array in place, so it can silently change data a caller is still relying on (the reference trap). Spreading into a new array leaves the input alone, which is the immutable approach and prevents a whole class of \"why did this change?\" bugs."
  },
  {
    "q": "Given `const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);`, what does `pipe(f, g)(2)` compute?",
    "choices": [
      "`g(f(2))` — run f on 2, then run g on the result",
      "`f(g(2))` — run g first, then f",
      "`f(2) + g(2)` — run both on 2 and add the results",
      "`[f(2), g(2)]` — an array of both results"
    ],
    "answer": 0,
    "explain": "`pipe` runs the functions left to right, feeding each output into the next. So `pipe(f, g)(2)` applies `f` to `2`, then applies `g` to that result: `g(f(2))`. That left-to-right reading order is exactly why `pipe` is often clearer than mathematical right-to-left `compose`."
  }
]
```

---

[← Phase 13: The Event Loop, Deep](13-the-event-loop-deep.md) · [Guide overview](_guide.md) · [Phase 15: Modules & Bundlers, Deep →](15-modules-and-bundlers.md)
