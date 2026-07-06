---
title: "Performance & Optimization - Measure, Then Cut Allocations"
guide: "go-from-zero"
phase: 17
summary: "Performance work in Go is measurement first, algorithm second, allocations third. Find the real hot spot with benchmarks and pprof, fix the big-O, then cut heap churn - and know when good-enough is good enough."
tags: [go, golang, performance, optimization, allocations, sync-pool, escape-analysis, benchmarking, profiling]
difficulty: advanced
synonyms: ["go performance optimization", "go reduce allocations", "go sync.Pool", "go preallocate slice capacity", "go profile guided optimization", "when to optimize go", "go benchmark allocs"]
updated: 2026-06-22
---

# Performance & Optimization

Here's the thing nobody tells you when you start chasing speed: most of your code is already fast enough, and most of your guesses about *where* it's slow will be wrong. Performance work is a discipline: measure, find the one place that matters, fix that, and stop. The tricks are the easy part; the discipline separates a real speedup from hours of busywork that moved nothing.

This phase caps the deep half of the guide, leaning on the runtime model from [Phase 14](14-runtime-scheduler-and-memory.md) (stack, heap, escape analysis, GC) and the tools from [Phase 15](15-testing-benchmarks-profiling.md) (`go test -bench`, `pprof`), in the order that pays off: measure, fix the algorithm, then cut allocations.

## Measure first, always

**The mental model.** Your intuition about performance is a liar - not because you're bad at this, but because modern CPUs, caches, the scheduler, and the GC interact in ways no human predicts reliably. The function you're *sure* is the bottleneck is often a rounding error, while the real cost hides in a string concatenation you never thought twice about. The only way to know is to look.

⚠️ **The number-one rule of optimization: never optimize on a hunch.** Every time you "speed something up" without measurements proving it was slow *and* that your change helped, you're gambling - and the usual prize is uglier code at the same speed. Profile first. Always.

The workflow is the one from Phase 15, used in anger:

1. Write a benchmark that exercises the real, representative work.
2. Run it under the CPU profiler to find where time actually goes.
3. Fix the single biggest cost.
4. Re-run the benchmark to *prove* the fix helped. Repeat from step 2.

```console
$ go test -bench=. -cpuprofile=cpu.prof
$ go tool pprof -top cpu.prof
Showing nodes accounting for 1.84s, 92.0% of 2.00s total
      flat  flat%   sum%        cum   cum%
     1.20s 60.0%  60.0%      1.20s 60.0%  main.findDuplicates
     0.40s 20.0%  80.0%      0.40s 20.0%  runtime.mapassign_faststr
     0.24s 12.0%  92.0%      0.24s 12.0%  runtime.mallocgc
```
*What just happened:* `pprof -top` ranked functions by CPU time burned. Sixty percent sits in one function, `findDuplicates` - your hot spot, nothing else worth touching until it's handled. The `mallocgc` line (allocation) is a hint we'll come back to. (Numbers vary by machine; the *shape* - one function dominating - is typical.)

💡 **Key insight.** In almost every program, a tiny fraction of the code accounts for the overwhelming majority of runtime. Your job is to find that 3% and leave the other 97% alone, readable and untouched. Profiling finds the 3%; optimizing the rest only adds risk.

## Algorithmic cost dominates

**The mental model.** Before fiddling with a single allocation, ask: *is the approach itself right?* The largest wins in practice almost never come from micro-tweaks - they come from replacing an expensive strategy with a cheaper one, turning an O(n²) nested scan into an O(n) pass with a map. No low-level cleverness rescues a quadratic algorithm; it just delays the cliff.

If "O(n²)" and "O(n)" feel fuzzy, the dedicated primer [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) walks through exactly what they mean and why they decide who wins as your data grows.

Here's the classic: finding items in a slice that appear more than once. The naive version compares every element against every other:

```go
// O(n²): for each item, scan all the others looking for a match.
func findDuplicatesSlow(items []string) []string {
	var dups []string
	for i := 0; i < len(items); i++ {
		for j := i + 1; j < len(items); j++ {
			if items[i] == items[j] {
				dups = append(dups, items[i])
				break
			}
		}
	}
	return dups
}
```

The map version makes one pass, remembering what it has seen:

```go
// O(n): one pass, a map remembers what we've already seen.
func findDuplicatesFast(items []string) []string {
	seen := make(map[string]bool, len(items))
	var dups []string
	for _, item := range items {
		if seen[item] {
			dups = append(dups, item)
		}
		seen[item] = true
	}
	return dups
}
```

*What just happened:* both answer the same question, but the cost curves aren't alike. The slow version's inner loop grows with the *square* of the input - double the items, quadruple the comparisons. The fast version trades a little memory (the `seen` map) for a single linear pass: a map lookup is roughly constant-time, so doubling the input only doubles the work. On 10 items the difference is invisible; on 100,000 it's instant versus a coffee break.

Benchmarked side by side, the gap is brutal:

```console
$ go test -bench=Duplicates -benchmem
BenchmarkDuplicatesSlow-8        37    31_847_201 ns/op      analysis on 10k items
BenchmarkDuplicatesFast-8     5_142       233_004 ns/op      analysis on 10k items
```
*What just happened:* at 10,000 items the map-based version is over a hundred times faster (`ns/op` = nanoseconds per operation, lower is better), and the multiplier *grows* with input size: at 100,000 the quadratic version is thousands of times slower. Algorithm choice dwarfs everything else - you cannot micro-optimize your way out of the wrong complexity class.

Play with how each growth curve behaves as `n` climbs - it makes the O(n²)-vs-O(n) gap concrete in a way numbers on a page can't:

```playground-bigo
```

## Allocations are the usual Go bottleneck

**The mental model.** Once your algorithm is sound, the most common remaining drag in Go is *heap allocation*. Recall [Phase 14](14-runtime-scheduler-and-memory.md): values escaping to the heap cost more than stack values, and every heap allocation is something the GC must later track and reclaim. More allocations means more GC work stealing CPU. So "make it faster" often means "make it allocate less."

📝 **`allocs/op`** - the average number of distinct heap allocations one run of a benchmarked operation makes, seen via `-benchmem`. Often a *better* optimization target than raw time, since cutting allocations cuts GC pressure, lowering time *and* steadying performance under load.

The single most common waste: growing a slice from nothing when you already know how big it'll get. Each time `append` runs out of capacity it allocates a *new, larger* backing array and copies everything over, so a slice built one element at a time can allocate many times over its life.

```go
// Wasteful: starts empty, reallocates the backing array as it grows.
func squaresGrowing(n int) []int {
	var out []int
	for i := 0; i < n; i++ {
		out = append(out, i*i) // may reallocate + copy repeatedly
	}
	return out
}

// Lean: one allocation, exactly the right size, up front.
func squaresPrealloc(n int) []int {
	out := make([]int, 0, n) // length 0, capacity n - room reserved
	for i := 0; i < n; i++ {
		out = append(out, i*i) // never reallocates; capacity already there
	}
	return out
}
```

*What just happened:* `squaresGrowing` starts with a `nil` slice and lets `append` discover the size the hard way, grabbing a bigger array and copying old contents in each time capacity runs out. `squaresPrealloc` calls `make([]int, 0, n)`: capacity `n` reserved immediately, so every `append` drops into space that already exists - the whole slice costs exactly *one* allocation. Same output, a fraction of the garbage.

```console
$ go test -bench=Squares -benchmem
BenchmarkSquaresGrowing-8     291_204   4_071 ns/op   16_376 B/op   12 allocs/op
BenchmarkSquaresPrealloc-8    876_553   1_355 ns/op    8_192 B/op    1 allocs/op
```
*What just happened:* `-benchmem` added two columns: `B/op` (bytes allocated per operation) and `allocs/op` (count of allocations). The growing version made 12 separate allocations and churned twice the memory; the preallocated version made exactly 1 - roughly a 3x speedup from one trivially small change.

Two other everyday spots for the same principle:

- **Reuse buffers instead of re-creating them.** Building strings with `+` in a loop allocates a fresh string every concatenation; a `strings.Builder` (or reused `[]byte`) writes into one growing buffer.
- **Avoid needless boxing into `interface{}` or pointers.** Stuffing a value into an empty interface, or passing its address around, is exactly what makes it *escape to the heap* (Phase 14). In a hot loop, passing values directly keeps them on the stack - free to create, nothing for the GC to chase. Let the profiler and `go build -gcflags=-m` tell you what's escaping.

## `sync.Pool` - recycle short-lived temporaries

**The mental model.** Sometimes a hot path *must* allocate a chunky temporary over and over - a scratch buffer, a parser's work area - and each allocation is GC pressure. `sync.Pool` is Go's tool: a free list of already-allocated objects you borrow and return, so a few objects get reused across thousands of operations instead of allocating fresh each time.

📝 **`sync.Pool`** - a concurrency-safe pool of reusable, temporary objects. `Get()` returns one (creating it via `New` only if empty); `Put()` hands it back for the next caller. The point: recycle fungible temporaries and slash allocation churn in hot paths.

```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

// Pool of reusable byte buffers. New runs only when the pool is empty.
var bufPool = sync.Pool{
	New: func() any { return new(bytes.Buffer) },
}

func render(msg string) string {
	buf := bufPool.Get().(*bytes.Buffer) // borrow (type-assert back to *Buffer)
	defer func() {
		buf.Reset()      // wipe contents so the next borrower starts clean
		bufPool.Put(buf) // return it for reuse
	}()

	buf.WriteString("[log] ")
	buf.WriteString(msg)
	return buf.String()
}

func main() {
	fmt.Println(render("started"))
	fmt.Println(render("done"))
}
```
```console
$ go run main.go
[log] started
[log] done
```
*What just happened:* the first `render` call found the pool empty, so `New` made a fresh `bytes.Buffer`. On the way out, `Reset()` cleared it and `Put()` returned it; the *second* call's `Get()` handed back that same buffer instead of allocating a new one. Across a hot path doing this millions of times, you allocate a handful of buffers total - a large cut in GC work. Note `Reset()`: a pooled object carries whatever the last borrower left in it, so clear it before reuse.

⚠️ **`sync.Pool` is not a cache, and doesn't keep your objects alive.** The GC can empty the pool at any collection - an object you `Put` may be gone the next `Get` (`New` just makes a new one, no harm done). Fine for *fungible temporaries*, completely wrong for anything you need to persist, with identity, or expensive to lose. Use it only to relieve measured allocation pressure on interchangeable short-lived objects.

## Knowing when to stop

**The mental model.** Optimization has a point of diminishing - then *negative* - returns. Every clever rewrite makes code harder to read, change, and break, a cost paid by every future reader. The goal is never "as fast as physically possible" - it's "fast enough, and no more twisted than it has to be."

The discipline:

- **Optimize the measured hot path. Leave the rest clear.** The 3% that profiling flagged earns the right to be clever; the other 97% stays as straightforward as possible.
- **Define "fast enough" up front, then stop when you hit it.** A target ("p99 under 50ms") tells you when you're done. Without one, optimization never ends.
- **Re-measure after every change.** A change that doesn't move the benchmark isn't an optimization - revert it.

💡 **The closing rule of the deep half.** Readable code that's fast enough beats clever code that's unmaintainable, every time. Measure, fix the algorithm, cut the allocations that matter, and then - the hardest part - stop.

## Recap

1. **Measure first, always.** Never optimize on a hunch. Use benchmarks plus `pprof` to find the real hot spot; most code is already fast enough, so hunt the 3% that isn't.
2. **Algorithmic cost dominates.** The biggest wins come from a better approach (O(n) map lookup over an O(n²) nested scan), not micro-tweaks - you can't optimize your way out of the wrong complexity class.
3. **Allocations are the usual Go bottleneck.** Fewer heap allocations means less GC pressure means faster, steadier code. Preallocate with `make([]T, 0, n)`, reuse buffers, and avoid needless boxing that escapes to the heap; watch `allocs/op` with `-benchmem`.
4. **`sync.Pool` recycles fungible temporaries** in hot paths to cut allocation churn - but it's not a cache; the GC can empty it anytime, so use it only for interchangeable short-lived objects, and `Reset` before reuse.
5. **Know when to stop.** Optimize the measured hot path and leave the rest clear; define "fast enough" up front, re-measure after every change, and revert anything that didn't move the number.

That's the deep half done. You can now reason about how Go runs your code *and* make it faster on purpose, with evidence instead of guesses. The final phase steps back: where Go genuinely shines, and where to point yourself next.

## Quick check

Test yourself on the discipline that makes performance work actually pay off:

```quiz
[
  {
    "q": "Before changing any code to make a Go program faster, what should you do first?",
    "choices": [
      "Profile with benchmarks and pprof to find where time actually goes",
      "Add sync.Pool everywhere objects are created",
      "Rewrite the slowest-looking function from memory",
      "Switch every slice to a preallocated fixed size"
    ],
    "answer": 0,
    "explain": "Intuition about bottlenecks is unreliable. Measure first with benchmarks and pprof so you optimize the real hot spot - the small fraction of code that actually dominates runtime - instead of guessing."
  },
  {
    "q": "You replace a slow function and want to know if it mattered. Which single change usually delivers the biggest speedup on large inputs?",
    "choices": [
      "Choosing a better algorithm - e.g. an O(n) map lookup instead of an O(n²) nested scan",
      "Renaming variables so the compiler optimizes better",
      "Adding more goroutines to the inner loop",
      "Removing all comments from the hot path"
    ],
    "answer": 0,
    "explain": "Algorithmic complexity dominates. Turning a quadratic approach into a linear one wins by a margin that grows with the input - no micro-optimization can rescue the wrong complexity class."
  },
  {
    "q": "Why is sync.Pool wrong for storing objects you need to keep around?",
    "choices": [
      "The garbage collector can empty the pool at any GC, so a pooled object may vanish",
      "sync.Pool is not safe for concurrent use",
      "Objects in a pool are deep-copied, doubling memory use",
      "Get() always allocates a brand-new object, defeating the purpose"
    ],
    "answer": 0,
    "explain": "sync.Pool is a free list for fungible temporaries, not a cache. The GC can clear it during any collection, so anything you Put may be gone on the next Get. It's only safe for interchangeable short-lived objects where losing one is harmless."
  }
]
```

---

[← Phase 16: The Standard Library as Design](16-standard-library.md) · [Guide overview](_guide.md) · [Phase 18: Where to Go Next →](18-where-to-go-next.md)
