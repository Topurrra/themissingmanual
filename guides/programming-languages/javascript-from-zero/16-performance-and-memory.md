---
title: "Performance & Memory - How V8 Runs Your Code"
guide: "javascript-from-zero"
phase: 16
summary: "How V8's JIT turns hot JavaScript into fast machine code, why consistent object shapes matter, why algorithmic cost beats micro-optimizing, how garbage collection reclaims memory, and how leaks still sneak in."
tags: [javascript, performance, memory, v8, garbage-collection, memory-leaks, jit, optimization]
difficulty: advanced
synonyms: ["how does v8 run javascript", "javascript garbage collection explained", "javascript memory leaks", "javascript performance optimization", "hidden classes v8", "jit compilation javascript", "when to optimize javascript"]
updated: 2026-06-19
---

# Performance & Memory - How V8 Runs Your Code

You've trusted the engine to make your JavaScript fast. This phase pulls back that curtain - not to make you micro-optimize every line (mostly a trap), but to give you an accurate **mental model**, turning "fast vs. slow" from folklore into something you can reason about.

Two ideas drive this phase. First: V8 (the engine inside Chrome and Node) *watches* your code and rewrites hot parts into machine code rather than plodding through line by line. Second: memory you stop using gets cleaned up automatically - until, through a few classic mistakes, it doesn't.

## How V8 actually runs your code

The naive story - "JavaScript is interpreted, so the engine reads each line and does what it says, every time" - is half true at startup and wrong for code that runs a lot.

📝 **JIT (Just-In-Time) compiler** - a compiler that runs *while your program runs*: it interprets quickly at first, watches which functions get called over and over ("hot" code), then compiles those into optimized machine code on the fly - so the parts that matter run at near-native speed.

The real flow: source is parsed and handed to a fast interpreter (Ignition) so the program starts immediately, no waiting for a full compile. V8 counts how often each function is called and what types it sees; once hot, the optimizing compiler (TurboFan) compiles a specialized, fast version *based on the types observed so far*.

```mermaid
flowchart LR
  A[Source code] --> B[Parse]
  B --> C["Interpret<br/>(Ignition) - fast start"]
  C -->|function gets hot| D["Optimize<br/>(TurboFan) - fast machine code"]
  D -->|types stop matching| E[Deoptimize - back to C]
  E --> C
```

That last arrow is the catch. TurboFan's fast code is built on an *assumption* - "this function always gets numbers" (or objects shaped a certain way). Break that assumption and V8 throws away the optimized code and falls back to the interpreter: a **deoptimization**, and the opposite of free.

```javascript runnable
function add(a, b) {
  return a + b;
}

// "Warm up" add() with consistent number types, then time many calls.
function timeAdd(prep) {
  prep();                                    // force whatever types we want
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < 5_000_000; i++) acc += add(i, i + 1);
  return performance.now() - start;
}

const monomorphic = timeAdd(() => { for (let i = 0; i < 100; i++) add(i, i); });
const chaotic     = timeAdd(() => { add(1, 2); add("a", "b"); add({}, []); add(true, 1); });

console.log("steady numbers (ms):", monomorphic.toFixed(1));
console.log("mixed types   (ms):", chaotic.toFixed(1));
```
```console
steady numbers (ms): 9.4
mixed types   (ms): 18.7
```
*What just happened:* Both loops call the same `add` with the same arithmetic. The first warmed `add` with only numbers, so V8 compiled a tight number-only version; the second fed it strings, objects, and booleans first, so it compiled a more defensive, slower version (or kept deoptimizing). Same code, measurably different speed. (Timings vary by machine and engine version, and a clever engine may even optimize this toy away - the *direction* is the lesson, not the exact numbers.)

💡 **Practical takeaway:** you don't need to think about TurboFan day to day - just keep hot functions *predictable*, with consistent types and object shapes. "Monomorphic" (one shape) code is what the optimizer loves; chaotic, shape-shifting code forces it to give up.

## Hidden classes - why object shape matters

V8 craves the same predictability with *objects*. They feel like loose bags of key-value pairs you can reshape at will, but V8 quietly assigns every object a **hidden class** (a "shape" or "map") describing its layout: which properties, in which order, at which memory offsets.

📝 **Hidden class / shape** - V8's internal record of an object's properties and their order. Two objects built the *same way* share one hidden class, letting V8 generate fast, direct property access instead of a slow dictionary lookup.

Objects sharing a hidden class let V8 compile a property read like `point.x` down to "grab the value at offset 0" - one instruction. *Different* shapes flowing through the same code force a much slower dictionary-style lookup instead.

The trap: you can change an object's shape without realizing it, and **the order you add properties is part of the shape**.

```javascript runnable
// Same fields, different insertion order → two different hidden classes.
function makeA() { const o = {}; o.x = 1; o.y = 2; return o; }
function makeB() { const o = {}; o.y = 2; o.x = 1; return o; }

// Consistent shape: build the object with all fields at once.
function makeFast() { return { x: 1, y: 2 }; }

const a = makeA();
const b = makeB();
console.log("same keys & values:", a.x === b.x && a.y === b.y); // true
console.log("but V8 sees A and B as different shapes internally");
console.log("makeFast gives every object the same shape:", makeFast());
```
```console
same keys & values: true
but V8 sees A and B as different shapes internally
makeFast gives every object the same shape: { x: 1, y: 2 }
```
*What just happened:* `a` and `b` hold identical data, but `makeA` added `x` then `y` while `makeB` added `y` then `x`, so V8 built two separate hidden classes - any function processing both sees *two* shapes and can't fully specialize. `makeFast` sidesteps this by creating every field in one literal, so every object it returns is the same shape.

⚠️ **Gotcha - reshaping objects after creation forces slow paths.** Adding properties in different orders, adding fields conditionally (`if (x) obj.z = ...`), or `delete obj.key` all create new hidden classes or knock an object into slow "dictionary mode." `delete` is especially nasty: it can permanently demote an object even after it's only used for reads.

💡 **The fix is a habit, not a tool:** initialize objects with *all* fields up front, in a consistent order, even if some start as `null` or `0`. Instead of adding `obj.error` only when something fails, declare `error: null` from the start.

## Algorithmic cost dominates micro-optimizations

The most important performance lesson here has nothing to do with V8 internals: **the algorithm you choose almost always matters more than how cleverly you write the lines.**

Beginners obsess over shaving operations - "is `for` faster than `forEach`? Should I cache `arr.length`?" - but these differences are usually noise. A single `O(n²)` loop hiding in your code dwarfs every micro-optimization once data grows. The classic culprit: searching inside a loop.

```javascript runnable
// Find which of `needles` exist in `haystack`.
const haystack = Array.from({ length: 20000 }, (_, i) => i);
const needles  = Array.from({ length: 20000 }, (_, i) => i * 2);

// Approach 1: nested lookup with .includes() - O(n²).
let t0 = performance.now();
let found1 = 0;
for (const n of needles) {
  if (haystack.includes(n)) found1++;   // .includes scans the whole array each time
}
const slow = performance.now() - t0;

// Approach 2: build a Set once, then look up - O(n).
let t1 = performance.now();
const set = new Set(haystack);          // one pass to build
let found2 = 0;
for (const n of needles) {
  if (set.has(n)) found2++;             // O(1) average lookup
}
const fast = performance.now() - t1;

console.log("includes() in a loop (ms):", slow.toFixed(1), "found", found1);
console.log("Set lookup          (ms):", fast.toFixed(1), "found", found2);
console.log("speedup:", (slow / fast).toFixed(0) + "x");
```
```console
includes() in a loop (ms): 412.0 found 10000
Set lookup          (ms): 2.3 found 10000
speedup: 179x
```
*What just happened:* Both versions get the identical answer, but the first calls `haystack.includes(n)` inside a loop, and `includes` itself scans the array - roughly 20,000 × 20,000 = 400 million comparisons. The second builds a `Set` once, so each `set.has(n)` is near-instant. Not 10% faster - *orders of magnitude* faster, and the gap widens as data grows; no loop-tuning could rescue the first approach. (Exact timings vary by machine; the ratio is what matters.)

Play with how operation counts explode as input grows - the intuition that makes you reach for a `Map` or `Set` reflexively:

```playground-bigo
```

💡 **The order of operations for performance work:** pick the right data structure and algorithm first (turn `O(n²)` into `O(n)`); only *then*, if you've measured and it's still too slow, worry about constant-factor tweaks. Micro-optimizing before fixing a bad algorithm is polishing a part you're about to throw away.

## Garbage collection - memory you stop using comes back

In languages like C, you ask the system for memory and must hand it back yourself; forget to, and you leak. JavaScript has a **garbage collector** that finds unused memory and reclaims it automatically. You allocate by creating objects; you "free" by *letting go* of them.

📝 **Garbage collection (GC)** - the engine automatically reclaiming memory that your program can no longer reach. You never call `free()`. When nothing references an object anymore, it becomes eligible to be collected.

The mental model that matters is **reachability**. Start from the "roots" - global variables, the current call stack, things actively in scope - and follow every reference. Anything reachable from a root is *alive*; anything you *can't* reach is garbage, free for the collector to reclaim. It doesn't matter whether you "meant" to keep it - only whether a chain of references still leads to it.

```javascript runnable
function makeBigThing() {
  // A chunky object. While someone references it, it stays alive.
  return { data: new Array(100_000).fill("x"), id: Math.random() };
}

let ref = makeBigThing();        // `ref` is a root → the object is reachable
console.log("alive, id:", ref.id.toFixed(4));

ref = null;                      // dropped the only reference → now unreachable
console.log("ref is now:", ref, "→ the big object is eligible for GC");
// You can't force collection from JS, but the engine will reclaim it later.
```
```console
alive, id: 0.7321
ref is now: null → the big object is eligible for GC
```
*What just happened:* `makeBigThing()` allocated a sizable object, and `ref` pointed at it, making it reachable and keeping it alive. Setting `ref = null` cut the only reference: now unreachable, it's garbage, and the collector reclaims it whenever it next runs. You never freed anything - you just stopped referencing it, and that's the whole job.

Watch reachability and collection play out visually - see objects go from rooted, to orphaned, to swept away:

```playground-gc
```

💡 V8's collector is *generational*: it assumes most objects die young (a temporary object inside a function call, gone the moment the call returns) and collects that "young generation" cheaply and often. Survivors get promoted to an "old generation" scanned less frequently. Upshot: short-lived temporary objects are cheap - don't fear creating them.

## Memory leaks in a garbage-collected language

If memory is reclaimed automatically, how can you leak it? The collector only reclaims what's **unreachable**. A JavaScript leak isn't forgetting to free - it's *accidentally keeping a reference alive* so the collector thinks the object is still needed. Memory grows, nothing gets reclaimed, and eventually the tab freezes or the Node process gets killed.

Three classic ways it happens:

- **Forgotten timers and listeners.** A `setInterval`, or an `addEventListener` never removed, keeps a reference to its callback - and the callback keeps everything it closes over.
- **Growing global caches.** A module-level `Map` or array you keep pushing into but never trim is reachable forever (it's a root), so everything inside lives forever too.
- **Closures capturing big objects.** A closure holds every variable it references; a long-lived function capturing a huge object it doesn't need prevents that object's collection.

Here's the most common one - a cache that only grows - plus the fix:

```javascript runnable
// LEAK: a cache that never forgets. Every key lives forever.
const leakyCache = new Map();
function getLeaky(key) {
  if (!leakyCache.has(key)) leakyCache.set(key, { data: new Array(1000).fill(key) });
  return leakyCache.get(key);
}
for (let i = 0; i < 5000; i++) getLeaky(i);     // 5000 entries, all retained
console.log("leaky cache size:", leakyCache.size); // grows without bound

// FIX: bound the cache - evict the oldest entry past a limit.
const MAX = 100;
const boundedCache = new Map();
function getBounded(key) {
  if (!boundedCache.has(key)) {
    boundedCache.set(key, { data: new Array(1000).fill(key) });
    if (boundedCache.size > MAX) {
      const oldest = boundedCache.keys().next().value; // Maps keep insertion order
      boundedCache.delete(oldest);                     // let the old entry be collected
    }
  }
  return boundedCache.get(key);
}
for (let i = 0; i < 5000; i++) getBounded(i);
console.log("bounded cache size:", boundedCache.size); // capped at MAX
```
```console
leaky cache size: 5000
bounded cache size: 100
```
*What just happened:* `leakyCache` is a module-level `Map` - a root - so every entry is reachable forever, even once you'll never use that key again: a steady upward memory creep until something dies. `boundedCache` fixes it by capping the size - once full, adding a new entry deletes the oldest, dropping the only reference so the collector *can* reclaim it. Same idea for timers (`clearInterval` when done) and listeners (`removeEventListener` when the element goes away).

⚠️ **Measure before you optimize - guessing wastes time.** Don't *assume* where a leak or slowdown is: use the browser DevTools **Memory** tab (heap snapshots over time, watch for objects that keep growing) and the **Performance** tab to profile what's actually slow. Engineers burn staggering hours "optimizing" code that was never the bottleneck - profile first, fix the real thing, then verify the number moved.

For a deeper, math-free tour of why `O(n²)` and `O(n)` diverge the way they do, see [Big-O without the math panic](/guides/big-o-without-the-math-panic).

## Recap

1. **V8 uses a JIT compiler:** it starts by interpreting, watches for *hot* code, and compiles it to fast machine code based on types seen so far. **Consistent types** keep hot functions fast; mixed types force a **deoptimization**.
2. **Object shape matters.** V8 assigns each object a **hidden class** based on its properties *and their order*. Build objects with all fields up front, in a consistent order; avoid `delete` and conditional property-adding on hot objects.
3. **Algorithm beats micro-optimization.** Turning an `O(n²)` nested scan into an `O(n)` `Set`/`Map` lookup can be 100×+ faster - far more than any line-level tweak. Fix the algorithm first.
4. **Garbage collection is automatic**, based on **reachability**: an object lives as long as a chain of references reaches it from a root. You "free" memory by *letting go* of references, never by calling `free()`.
5. **Leaks still happen** when you accidentally keep references alive - forgotten timers/listeners, unbounded global caches, closures holding big objects. Fix: *drop* the reference (clear the timer, bound the cache, remove the listener).
6. **Measure, don't guess.** Use DevTools' Memory and Performance tabs to find the real bottleneck before optimizing, and verify the fix actually helped.

## Quick check

Test yourself on the ideas that change how you write code - predictable shapes, algorithmic cost, and reachability:

```quiz
[
  {
    "q": "Why does calling the same function with consistently typed arguments tend to run faster in V8?",
    "choices": [
      "V8's JIT can compile a specialized, optimized version based on the types it observes; mixing types forces it to deoptimize to slower, defensive code",
      "Consistent types use less memory, so the garbage collector runs less often",
      "V8 caches the function's return value when the arguments have the same type",
      "Typed arguments skip the parser entirely"
    ],
    "answer": 0,
    "explain": "The JIT optimizes hot functions based on the types it has seen. Stable (monomorphic) types let it keep the fast machine-code version; feeding it varied types breaks its assumptions and triggers deoptimization back to the slower interpreter."
  },
  {
    "q": "You need to check membership repeatedly while looping over a large list. Which is the bigger win?",
    "choices": [
      "Replacing `array.includes(x)` inside the loop with a `Set` built once and `set.has(x)` - turning O(n²) into O(n)",
      "Caching `array.length` in a variable before the loop",
      "Switching the `for...of` loop to a plain indexed `for` loop",
      "Using `let` instead of `const` for the loop counter"
    ],
    "answer": 0,
    "explain": "Algorithmic cost dominates. `includes` in a loop is O(n²) because it rescans the array each time; a `Set` lookup is O(1) average, making the whole thing O(n). That can be 100×+ faster - the other options are constant-factor noise by comparison."
  },
  {
    "q": "In a garbage-collected language like JavaScript, how does a memory leak typically happen?",
    "choices": [
      "You accidentally keep an object reachable - e.g. an unbounded global cache or a timer that's never cleared - so the collector never reclaims it",
      "You forget to call free() on objects you allocated",
      "You create too many short-lived temporary objects inside functions",
      "The garbage collector has a bug and skips certain objects"
    ],
    "answer": 0,
    "explain": "GC reclaims only unreachable memory. A leak means something still references the object - a growing global Map, a forgotten setInterval, a closure holding a big value - so it stays 'alive.' The fix is to drop the reference. Short-lived temporaries are cheap and fine."
  }
]
```

---

[← Phase 15: Modules & Bundlers, Deep](15-modules-and-bundlers.md) · [Guide overview](_guide.md) · [Phase 17: Types & the Road to TypeScript →](17-types-and-typescript.md)
