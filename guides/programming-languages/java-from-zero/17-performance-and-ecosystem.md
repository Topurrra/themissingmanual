---
title: "Performance & the Ecosystem - Measure, Then Cut Allocations"
guide: "java-from-zero"
phase: 17
summary: "Java performance is measurement first, algorithm second, allocations third. Profile the real hot path, fix the big-O, cut the short-lived objects that pressure the GC - then meet the ecosystem you're now ready for."
tags: [java, performance, optimization, allocations, garbage-collection, data-structures, ecosystem, spring]
difficulty: advanced
synonyms: ["java performance optimization", "java reduce allocations gc pressure", "java string concatenation stringbuilder", "java choose right collection performance", "when to optimize java", "java ecosystem spring", "java big o data structures"]
updated: 2026-06-22
---

# Performance & the Ecosystem

Here's the thing nobody warns you about when you start chasing speed: most of your code is already fast enough, and most of your guesses about *where* it's slow will be wrong. Performance work isn't clever tricks - it's a discipline. Measure, find the one place that actually matters, fix that, and stop. The discipline is what separates a real speedup from an afternoon of busywork that moved nothing.

This phase caps the deep half of the guide, leaning on two things you already have: the memory model from [Phase 15](15-the-jvm-memory-and-gc.md) (heap, object lifetimes, the garbage collector) and the benchmarking/profiling tools from [Phase 16](16-testing-and-profiling.md) (JFR, JMH). We'll put those to work in the order that pays off: measure, fix the algorithm, cut allocations - then step back and look at where Java takes you next.

## Measure first, always

Your intuition about performance is a liar - not because you're bad at this, but because the JVM, JIT compiler, CPU caches, and garbage collector interact in ways no human predicts reliably. The method you're *sure* is the bottleneck is often a rounding error, while the real cost hides in a string concatenation you never thought twice about. Worse, the JIT may have already optimized away the very thing you were about to "fix." The only way to know is to look.

⚠️ **The number-one rule of optimization: never optimize on a hunch.** Speed something up without a measurement proving it was slow *and* a measurement proving your change helped, and you're gambling - the usual prize is uglier code that runs exactly as fast (or slower, having defeated an optimization the JIT was doing for free). Profile first. Always.

The workflow, from Phase 16, used in anger:

1. Write a benchmark (JMH) or capture a recording (JFR) that exercises the real, representative work.
2. Look at where time - and allocation - actually goes.
3. Fix the single biggest cost.
4. Re-run the benchmark to *prove* the fix helped. Repeat from step 2.

```console
$ java -jar benchmarks.jar -prof gc
Benchmark                       Mode  Cnt    Score    Error  Units
findDuplicates.slow             avgt    5   41.382 ±  1.04   ms/op
findDuplicates.slow:·gc.alloc   avgt    5    0.512 ±  0.02   MB/op
```
*What just happened:* JMH ran the benchmark many times (after warming up the JIT - critical on the JVM, where the first runs are interpreted and misleadingly slow), then reported the average time per operation and, via `-prof gc`, how much memory each operation allocated. That allocation column is a hint we'll return to. (These numbers are from one run on one machine; yours will differ - the *shape*, one operation dominating, is what matters.)

💡 **Key insight.** In almost every program, a tiny fraction of the code accounts for the overwhelming majority of runtime. Your job isn't to make *everything* fast - it's to find that hot 3% and leave the other 97% alone, readable and untouched. Profiling finds the 3%; polishing the rest is wasted effort that only adds risk.

## Algorithmic cost dominates

Before fiddling with a single allocation, ask the bigger question: *is the approach itself right?* The largest performance wins almost never come from micro-tweaks - they come from replacing a fundamentally expensive strategy with a cheaper one, turning an O(n²) nested scan into an O(n) pass with a hash-based lookup. No low-level cleverness rescues a quadratic algorithm; it just makes the cliff arrive slightly later.

If "O(n²)" and "O(n)" feel fuzzy, the dedicated primer [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) walks through exactly what they mean and why they decide who wins as your data grows.

The classic case: find which names in a list appear in a big set of known names. The naive version scans the list for each lookup - `List.contains` walks the whole list every time, so checking `n` names against a list of `m` is O(n·m):

```java
// O(n·m): contains() scans the entire list on every single check.
static List<String> matchSlow(List<String> queries, List<String> known) {
    List<String> hits = new ArrayList<>();
    for (String q : queries) {
        if (known.contains(q)) {   // linear scan of `known` every time
            hits.add(q);
        }
    }
    return hits;
}
```

The `HashSet` version does the same job, but each lookup is roughly constant-time instead of a full scan:

```java
// O(n): a HashSet makes each lookup ~constant-time.
static List<String> matchFast(List<String> queries, Set<String> known) {
    List<String> hits = new ArrayList<>();
    for (String q : queries) {
        if (known.contains(q)) {   // hash lookup - no scan
            hits.add(q);
        }
    }
    return hits;
}
```

*What just happened:* both methods look almost identical at the call site, but the cost curves aren't. `List.contains` walks the list element by element, so checking many queries against a large list grows with the *product* of the two sizes. `HashSet.contains` jumps straight to the slot via the element's hash, so each lookup is roughly constant regardless of how many names are stored - invisible on 10 items, instant-versus-coffee-break on 100,000. (This is why a stray `List.contains` inside a loop is one of the most common accidental performance bugs in Java.)

Benchmark them side by side and the gap is brutal:

```console
$ java -jar benchmarks.jar Match
Benchmark            Mode  Cnt      Score     Error  Units
matchSlow            avgt    5   38_400.0 ± 900.0   us/op
matchFast            avgt    5       21.4 ±   0.6   us/op
```
*What just happened:* against 10,000 queries over a 10,000-element collection, the set-based version is over a thousand times faster (`us/op` = microseconds per operation, lower is better), and that multiplier *grows* with input: double both sizes and the list version quadruples while the set version merely doubles. Algorithm choice dwarfs everything else. (Exact numbers vary by machine and JVM; the order-of-magnitude gap doesn't.)

Play with how each growth curve behaves as `n` climbs - it makes the O(n²)-vs-O(n) gap concrete in a way numbers on a page can't:

```playground-bigo
```

## Allocations & GC pressure - the usual Java bottleneck

Once your algorithm is sound, the most common remaining drag in Java is *heap allocation*. Recall from [Phase 15](15-the-jvm-memory-and-gc.md): every `new` puts an object on the heap, and every heap object is something the garbage collector must later track and reclaim. Java's GC sweeps up short-lived objects cheaply - but "cheaply" isn't "free." Churn out millions of throwaway objects in a hot loop and the GC runs more often, stealing CPU and adding pauses. In Java, "make it faster" very often means "make it allocate less."

📝 **GC pressure** - the rate at which your code creates garbage the collector must clean up. Fewer short-lived objects means less frequent collection: lower CPU overhead *and* steadier, more predictable latency under load. See allocation per operation with JMH's `-prof gc` (the `gc.alloc.rate.norm` line: bytes allocated per op).

The single most famous offender is building a string with `+=` in a loop. Strings are immutable, so each `+=` doesn't grow the string - it allocates a *brand-new* string and copies the entire contents so far. Build a string from `n` pieces this way and you allocate and copy O(n²) characters total:

```java
// Wasteful: each += allocates a new String and copies everything so far.
static String joinSlow(List<String> parts) {
    String out = "";
    for (String p : parts) {
        out += p;          // new String allocated + full copy, every iteration
    }
    return out;
}

// Lean: one growing buffer, no per-iteration copies.
static String joinFast(List<String> parts) {
    StringBuilder sb = new StringBuilder();
    for (String p : parts) {
        sb.append(p);      // appends into the existing buffer
    }
    return sb.toString();  // one final String at the end
}
```

*What just happened:* `joinSlow` creates a fresh `String` every iteration and copies all characters accumulated so far, so the work (and garbage) grows with the *square* of the number of parts. `joinFast` writes into a single `StringBuilder`, a mutable buffer growing in chunks that only materializes one `String` at the end - same output, a fraction of the allocations. (The JIT can rewrite a *simple* `a + b + c` into a `StringBuilder` for you, but not across a loop - reach for `StringBuilder` yourself there.)

```console
$ java -jar benchmarks.jar Join -prof gc
Benchmark                         Mode  Cnt      Score   Units
joinSlow                          avgt    5   2_140.3   us/op
joinSlow:·gc.alloc.rate.norm      avgt    5  10_240_512 B/op
joinFast                          avgt    5      14.7   us/op
joinFast:·gc.alloc.rate.norm      avgt    5      24_576 B/op
```
*What just happened:* joining 1,000 strings, the `StringBuilder` version is roughly a hundred times faster and allocates a few hundred times *less* memory (`B/op` is bytes per operation). The `+=` version churned out megabytes of intermediate strings the GC had to reclaim; the buffer version allocated essentially one buffer. Less garbage, less GC work, a large free speedup. (Numbers vary by machine and JVM version; the direction is rock-solid.)

The same "stop making needless garbage" principle shows up in three other everyday spots:

- **Presize your collections.** `new ArrayList<>()` starts with a small backing array and reallocates a bigger one (copying everything) each time it fills up. Knowing roughly how many elements you'll add, `new ArrayList<>(expectedSize)` (or `HashMap` with an initial capacity) reserves the room up front - one allocation instead of a series of resize-and-copies.
- **Avoid needless autoboxing in hot loops.** Recall from [Phase 15] that `int` is a primitive but `Integer` is a heap object. Summing into a `List<Integer>` or a `Long` accumulator boxes every value - millions of tiny objects in a hot loop. Keep the loop counter and accumulator as primitives (`int`, `long`); let boxing happen only where you genuinely need an object.
- **Reach for primitive arrays when it truly matters.** An `int[]` stores raw ints packed together; an `ArrayList<Integer>` stores *pointers* to boxed `Integer` objects scattered on the heap - far more memory, far worse cache behavior. For large, hot numeric data, a primitive array can be a big win. (Measure first - for most code, `ArrayList<Integer>` is perfectly fine and more convenient.)

## Choosing collections & APIs wisely

A surprising amount of Java performance is picking the right tool from the standard library. The defaults are good; the wrong default in a hot path is not.

- **`ArrayList` vs `LinkedList`.** Reach for `ArrayList` almost always - a contiguous array: fast indexed access, cache-friendly iteration, low overhead. `LinkedList` wins only for frequent insertion/removal *at the ends* via a deque interface, and even then `ArrayDeque` usually beats it (its per-element node objects are pure allocation and cache-miss overhead). If you typed `new LinkedList`, you probably wanted `ArrayList`.
- **`HashMap` vs `TreeMap`.** `HashMap` gives ~O(1) lookup and is the default. Use `TreeMap` only when you genuinely need keys in sorted order (range queries, ordered iteration) - it's O(log n) per operation and slower otherwise. Don't pay for ordering you don't use.
- **Streams vs loops in hot paths.** ⚠️ Streams are readable and almost always fast enough - use them freely for clarity. But a stream pipeline can allocate more than a plain loop (lambdas, intermediate objects, boxing for `Stream<Integer>` vs `IntStream`). In a genuinely hot inner loop profiling flagged, a plain `for` loop (or `IntStream`) sometimes wins. The rule isn't "avoid streams" - it's "measure before rewriting readable stream code into a loop for speed."

The theme: readable defaults everywhere, deliberate exceptions only where a measurement told you to make one.

## Knowing when to stop - and the ecosystem ahead

Optimization has a point of diminishing - then *negative* - returns. Every clever rewrite makes code harder to read, harder to change, easier to break. That cost is real, paid by every future reader, including you in six months. The goal is never "as fast as physically possible" - it's "fast enough for the actual requirement, and no more twisted than it has to be."

💡 **The closing rule of the deep half.** Readable code that's fast enough beats clever code that's unmaintainable, every time. Define "fast enough" up front (a target like "p99 under 50ms" or "processes the batch in under a second"), optimize the *one* measured hot path, re-measure after every change, and revert anything that didn't move the number. Then - the hardest part - stop.

You've reached the top of the mountain. You understand Java from `javac` turning source into bytecode, through the JVM loading and JIT-compiling it, down to how the garbage collector manages memory - and how to make all of it faster on purpose, with evidence instead of guesses.

That foundation is what the **Java ecosystem** is built on. Here's where it takes you next, the landscape Phase 18 maps in full:

- **Spring & Spring Boot** - the dominant backend Java framework. Build web services, APIs, or microservices in Java for a living, and you'll almost certainly build them on Spring Boot, standing on everything you learned about objects, generics, exceptions, and the JVM.
- **Jakarta EE** - the enterprise standard (formerly Java EE): servlets, persistence (JPA), dependency injection, and the specs much of the server-side world is built around.
- **Android** - Java (alongside Kotlin) powers a huge share of the world's mobile apps. Same language; the platform and lifecycle are what you'd learn next.
- **Build & observability tooling** - Maven and Gradle for builds, plus profiling/monitoring tools (JFR, Micrometer, and friends) that make this phase's measurement discipline a permanent part of how you ship.

You don't need to learn these now - just know they exist, and that you're ready for them.

## Recap

1. **Measure first, always.** Never optimize on a hunch. Use JMH and JFR to find the real hot spot; most code is already fast enough, so hunt the 3% that isn't - the JIT may have already optimized what you were about to touch.
2. **Algorithmic cost dominates.** The biggest wins come from a better approach (a `HashMap`/`HashSet` lookup instead of an O(n·m) `List.contains` scan), not micro-tweaks - you can't optimize your way out of the wrong complexity class.
3. **Allocations & GC pressure are the usual Java bottleneck.** Fewer short-lived objects means less GC work, faster and steadier code. Use `StringBuilder` over `+=` in loops, presize collections, avoid needless autoboxing in hot loops, and prefer primitive arrays when it truly matters.
4. **Choose collections and APIs wisely.** `ArrayList` over `LinkedList`, `HashMap` unless you need sorted keys, streams freely for readability - but measure before rewriting a hot stream pipeline into a loop.
5. **Know when to stop.** Define "fast enough" up front, optimize the one measured hot path, re-measure after every change, revert what didn't help. Readable-and-fast-enough beats clever-and-unmaintainable.
6. **You're ready for the ecosystem.** You understand Java from `javac` to the GC - now Spring, Jakarta EE, Android, and build/observability tooling are the natural next steps.

That's the deep half done. The final phase maps the whole landscape and points you at where to go from here.

## Quick check

Test yourself on the discipline that makes performance work actually pay off:

```quiz
[
  {
    "q": "Before changing any code to make a Java program faster, what should you do first?",
    "choices": [
      "Profile with JMH or JFR to find where time and allocation actually go",
      "Replace every ArrayList with a LinkedList",
      "Rewrite the slowest-looking method from memory",
      "Add StringBuilder everywhere a String appears"
    ],
    "answer": 0,
    "explain": "Intuition about bottlenecks is unreliable, and the JIT may already be optimizing what you'd change. Measure first with JMH/JFR so you fix the real hot spot - the small fraction of code that actually dominates runtime - instead of guessing."
  },
  {
    "q": "You need to check 10,000 names against a collection of 10,000 known names. Which single change usually delivers the biggest speedup on large inputs?",
    "choices": [
      "Store the known names in a HashSet so each lookup is ~constant-time instead of a List.contains scan",
      "Switch the result list from ArrayList to LinkedList",
      "Remove all comments from the hot loop",
      "Rename the variables so the JIT optimizes better"
    ],
    "answer": 0,
    "explain": "Algorithmic complexity dominates. List.contains scans linearly, so it's O(n·m); a HashSet lookup is roughly constant-time, turning the work into O(n). That margin grows with input size - no micro-optimization rescues the wrong complexity class."
  },
  {
    "q": "Why does building a string with += inside a loop create so much GC pressure?",
    "choices": [
      "Strings are immutable, so each += allocates a brand-new String and copies all the characters so far",
      "+= secretly calls the garbage collector on every iteration",
      "String concatenation is not allowed inside loops and throws at runtime",
      "Each += converts the string to a byte array and back"
    ],
    "answer": 0,
    "explain": "A String can't be modified in place, so += produces a fresh String and copies the accumulated contents every iteration - O(n²) characters of garbage. A StringBuilder writes into one growing buffer and materializes a single String at the end."
  }
]
```

---

[← Phase 16: Testing, Build & Profiling](16-testing-and-profiling.md) · [Guide overview](_guide.md) · [Phase 18: Where to Go Next →](18-where-to-go-next.md)
