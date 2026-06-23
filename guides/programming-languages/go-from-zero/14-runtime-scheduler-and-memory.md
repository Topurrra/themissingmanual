---
title: "The Runtime: Scheduler, Memory & GC — What Go Does for You"
guide: "go-from-zero"
phase: 14
summary: "What's underneath goroutines: why they're cheap, how the GMP scheduler multiplexes them onto threads, where values live (stack vs heap), what escape analysis decides, and how Go's concurrent GC keeps memory clean for you."
tags: [go, golang, runtime, scheduler, gmp, goroutines, stack, heap, escape-analysis, garbage-collection]
difficulty: advanced
synonyms: ["how does the go scheduler work", "go gmp model", "goroutine vs thread", "go stack vs heap", "go escape analysis", "go garbage collector explained", "why are goroutines cheap"]
updated: 2026-06-22
---

# The Runtime: Scheduler, Memory & GC — What Go Does for You

Back in the concurrency phases you spun up goroutines with a single keyword and never thought about what it cost. You typed `go doWork()` a thousand times and your program didn't fall over. That's not luck — it's the Go **runtime**, a chunk of machinery the compiler bakes into every binary that schedules your goroutines, decides where your values live, and quietly cleans up the memory you stop using.

You can write Go for years without opening this hood. But the moment you ask "why are goroutines so cheap?", "why did my memory usage climb and never come back down?", or "why is the compiler putting *this* on the heap?", you're asking runtime questions. This phase gives you the mental model so those questions have answers instead of shrugs. The big idea: **Go trades a little magic you don't control for a lot of work you don't have to do** — and it pays off as long as you understand the few places where it can still bite.

## Why goroutines are cheap

The first thing to unlearn: a goroutine is **not** an operating-system thread. People say "lightweight thread," which is close enough to be dangerous, because it makes you picture the same heavy object with a smaller label. It isn't.

📝 **Goroutine** — a function managed by the Go runtime, not the OS. It starts with a tiny (~2 KB) stack that *grows on demand*, and the runtime — not the kernel — decides when it runs. **OS thread** — a unit of execution the kernel schedules, with a large fixed stack (often ~1–8 MB) and a comparatively expensive context switch handled in kernel space.

Run the numbers and the difference is stark. A thousand OS threads at, say, 1 MB of stack each is a gigabyte of memory reserved before a single line of your code runs. A thousand goroutines at 2 KB each is about 2 MB — and most of that grows only if a goroutine actually needs a deeper stack. That's why "spawn a goroutine per request" is normal Go and "spawn a thread per request" is how you bring a server to its knees.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 100_000; i++ { // a hundred thousand goroutines — no problem
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			_ = n * n
		}(i)
	}
	wg.Wait()
	fmt.Println("all 100,000 goroutines finished")
}
```
```console
$ go run main.go
all 100,000 goroutines finished
```
*What just happened:* We launched a hundred thousand goroutines and the program shrugged. Try that with a hundred thousand OS threads and you'd run out of memory long before they started. Each goroutine began life with a stack measured in kilobytes, and the runtime grew the few that needed more. The kernel never saw 100,000 schedulable things — it saw a handful of threads, which is the whole trick we're about to unpack.

💡 **The insight.** Cheap goroutines aren't free — they're cheap because the runtime keeps the *expensive* resources (OS threads) small in number and reuses them, while the *cheap* things (goroutines) multiply freely. The scheduler is what makes that reuse possible.

## The GMP scheduler

So you have 100,000 goroutines and maybe 8 CPU cores. Something has to decide which goroutine runs on which core, and when. That something is the **GMP scheduler**, and once you know its three letters the whole design clicks.

📝 **G (goroutine)** — one of your goroutines: its stack, instruction pointer, and state. There can be hundreds of thousands. **M (machine)** — an OS thread, the thing the kernel actually schedules onto a CPU. There are few. **P (processor)** — a *logical* processor: a scheduling context that holds a queue of runnable Gs and the resources an M needs to run them. The number of Ps is set by `GOMAXPROCS` (by default, the number of CPU cores).

The shape to hold in your head: an **M must hold a P to run a G**. Ps are the permission slips. You have exactly `GOMAXPROCS` of them, so at most that many goroutines run *truly in parallel* at once — but the runtime cycles thousands of Gs through those few Ps so fast that everything makes progress.

```mermaid
flowchart LR
  G1[G goroutines] --> P1[P run queue]
  G2[G goroutines] --> P1
  G3[G goroutines] --> P2[P run queue]
  P1 --> M1[M OS thread]
  P2 --> M2[M OS thread]
  M1 --> C[CPU cores]
  M2 --> C
```

Two mechanisms keep the cores busy, and they're the part worth remembering:

- **Blocking syscalls don't block the core.** When a goroutine makes a blocking system call (reading a file, waiting on the network), the M it's running on gets stuck in the kernel. Rather than let a precious P sit idle, the runtime **hands that P to another M**, which immediately starts running other goroutines. The blocked M parks until its syscall returns. Your CPU never twiddles its thumbs because one goroutine is waiting on disk.
- **Work-stealing balances the load.** Each P has its own local run queue. When a P empties its queue, instead of going idle it **steals** half the runnable goroutines from another P's queue. This keeps work spread across cores without a single global lock that every scheduler decision has to fight over.

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("GOMAXPROCS (Ps):", runtime.GOMAXPROCS(0)) // 0 = query, don't change
	fmt.Println("CPU cores:      ", runtime.NumCPU())
	go func() {}()
	fmt.Println("goroutines now: ", runtime.NumGoroutine())
}
```
```console
$ go run main.go
GOMAXPROCS (Ps): 8
CPU cores:       8
goroutines now:  2
```
*What just happened:* `GOMAXPROCS(0)` reports how many Ps exist — 8 here, matching the 8 cores, so up to 8 goroutines run in parallel. `NumGoroutine()` shows 2: `main`'s goroutine plus the one we launched (it may or may not have finished). The takeaway is the ratio: a small, fixed number of Ps governing parallelism, with the goroutine count free to balloon independently.

⚠️ **Gotcha — `GOMAXPROCS` is parallelism, not concurrency.** Setting `GOMAXPROCS=1` does *not* break a concurrent program; goroutines still interleave on that single P. It only limits how many run at the literal same instant. Concurrency (structure) and parallelism (simultaneous execution) are different knobs — see [Phase 11: Concurrency Patterns](12-concurrency-patterns.md) for the structure side.

## Stack vs heap — where your values live

The scheduler decides *when* code runs. The other half of the runtime decides *where data lives*, and there are only two answers: the stack or the heap.

📝 **Stack** — a per-goroutine region of memory that grows and shrinks with function calls. When a function returns, its slice of the stack vanishes instantly and for free. Allocation is a pointer bump; deallocation is automatic. **Heap** — a shared pool for values that must outlive the function that created them. The heap is *not* auto-freed when a function returns; reclaiming it is the garbage collector's job.

In many languages you choose: `int x` on the stack, `new Thing()` on the heap. In Go, **you don't choose — the compiler does.** You write `x := Thing{}` and Go figures out whether `x` can live and die on the stack (cheap) or must be promoted to the heap (more expensive, because the GC now has to track it). Stack is always preferable when it's safe: no GC involvement, instant cleanup. The rule the compiler follows is simple to state — *if a value can outlive its function, it must go on the heap* — and the analysis that applies it has a name.

## Escape analysis

📝 **Escape analysis** — the compile-time pass that decides, for each value, whether it can stay on the stack or must "escape" to the heap. A value escapes when the compiler can't prove it's done being used by the time its function returns — most commonly because a pointer to it leaks out.

The classic escape is returning a pointer to a local variable. The local would normally die when the function returns, but you're handing its address to the caller, so it *can't* die — it has to live on the heap instead.

```go
package main

type Point struct{ X, Y int }

// stays: the Point is copied out by value, the local can die on return
func makeValue() Point {
	p := Point{1, 2}
	return p
}

// escapes: we return a pointer, so p must outlive makeValue → heap
func makePointer() *Point {
	p := Point{3, 4}
	return &p
}

func main() {
	_ = makeValue()
	_ = makePointer()
}
```

You don't have to guess what the compiler decided — ask it. The `-gcflags=-m` flag prints escape-analysis decisions:

```console
$ go build -gcflags=-m main.go
./main.go:11:2: moved to heap: p
./main.go:12:9: &p escapes to heap
```
*What just happened:* The compiler reported that `p` inside `makePointer` was **moved to heap** because its address escapes via the `return &p`. It said *nothing* about `makeValue`'s `p` — that one stayed on the stack and vanished for free on return. Same-looking code, two different fates, decided entirely by whether a pointer leaked. (Counter-intuitively, returning a *pointer* can be more expensive than returning a *value* here, precisely because the pointer forces a heap allocation.)

💡 **The insight.** Fewer escapes means fewer heap allocations means less work for the garbage collector. This is *the* lever behind most Go performance tuning: when a hot path is slow, you run `-gcflags=-m`, find the values escaping to the heap inside your tight loop, and restructure to keep them on the stack. You rarely fight the GC directly — you reduce the garbage it has to collect in the first place. (You'll measure exactly this with the profiler in [Phase 15](15-testing-benchmarks-profiling.md).)

## The garbage collector

Everything that escapes to the heap eventually stops being used. Something has to reclaim it, and in Go that something is automatic.

📝 **Garbage collector (GC)** — the runtime component that finds heap memory your program can no longer reach and frees it, so you never call `free()` yourself. Go's GC is a **concurrent, tri-color mark-and-sweep tracing** collector tuned for *low pause times*.

Here's the model, in plain terms. The GC works by **reachability**: starting from the roots (global variables, and everything on every goroutine's stack), it traces every pointer it can follow. Anything it reaches is *live* and kept. Anything it can't reach is unreachable — garbage — and its memory is swept back into the pool. You don't track lifetimes; reachability *is* the lifetime.

The "concurrent, low-pause" part is what makes it pleasant. Older GCs would freeze your entire program ("stop the world") while they did all the marking, causing visible hiccups. Go's GC does the heavy marking work **concurrently, while your program keeps running**, and reserves stop-the-world for two very brief phases at the start and end. In practice those pauses are typically sub-millisecond, even on large heaps — the whole design optimizes for "no big stalls" over "absolute minimum CPU."

You have one main dial: the `GOGC` environment variable (default `100`). It controls the trade-off between memory and CPU: `GOGC=100` lets the heap grow to roughly double the live set before the next collection. Raise it (`GOGC=200`) and the GC runs less often, using more memory but less CPU; lower it (`GOGC=50`) and it runs more often, trimming memory at the cost of more CPU. Most programs never touch it.

Watch the heap grow and the GC reclaim it:

```go
package main

import (
	"fmt"
	"runtime"
)

func heapBytes() uint64 {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return m.HeapAlloc
}

func main() {
	fmt.Printf("before: %d KB\n", heapBytes()/1024)

	junk := make([][]byte, 0, 1000)
	for i := 0; i < 1000; i++ {
		junk = append(junk, make([]byte, 10_000)) // ~10 MB of reachable garbage-to-be
	}
	fmt.Printf("after allocating: %d KB\n", heapBytes()/1024)

	junk = nil      // drop the only reference → all of it is now unreachable
	runtime.GC()    // force a collection (normally you'd never call this)
	fmt.Printf("after GC: %d KB\n", heapBytes()/1024)
}
```
```console
$ go run main.go
before: 96 KB
after allocating: 9863 KB
after GC: 102 KB
```
*What just happened:* Allocating a thousand 10 KB slices pushed the live heap to ~9.8 MB. The instant we set `junk = nil`, nothing in the program could reach those slices anymore — they became unreachable. The next collection traced from the roots, found none of them, and swept the memory back, dropping the heap to near its starting size. We never freed anything by hand. (`runtime.GC()` here is just to make the timing visible; in real code the GC decides when to run, driven by `GOGC`.)

Step through the mark-and-sweep cycle — roots, reachable, and swept — at your own pace:

```playground-gc
```

⚠️ **Gotcha — you can still "leak."** Automatic GC does not mean leak-proof. The GC only frees what's *unreachable*, so if you accidentally keep a reference alive, the memory stays forever — and it looks exactly like a leak. The two classic culprits:

```go
// 1. A goroutine that never exits, holding memory the whole time.
func leakyGoroutine(data []byte) {
	go func() {
		<-make(chan struct{}) // blocks forever; nothing ever sends
		_ = data              // `data` is reachable as long as this goroutine lives
	}()
}

// 2. A global map that only ever grows.
var cache = map[string][]byte{}

func remember(key string, val []byte) {
	cache[key] = val // never deleted → cache (and its memory) grows without bound
}
```
*What just happened:* In the first case, the goroutine blocks on a channel that never receives, so it never returns — and because it closes over `data`, that slice stays reachable and un-collectable forever. A pile of such stuck goroutines is the most common real Go memory leak. In the second, the global `cache` keeps every value reachable for the life of the program; without an eviction policy it grows until you run out of memory. The GC is doing its job perfectly in both cases — the memory genuinely *is* still reachable. The fix isn't a GC setting; it's making sure goroutines can exit (a `context` or a done channel, from [Phase 11](12-concurrency-patterns.md)) and that long-lived maps have a bound.

## Recap

1. A **goroutine is not an OS thread** — it starts at ~2 KB with a growable stack and is scheduled by the runtime, which is why a single program can run hundreds of thousands of them where it could afford only a handful of threads.
2. The **GMP scheduler** multiplexes many **G**s onto few **M**s (OS threads) via **P**s (logical processors, capped by `GOMAXPROCS`). Handing off Ps on blocking syscalls and work-stealing between Ps keep every core busy.
3. Every value lives on the **stack** (cheap, auto-freed on return) or the **heap** (needs the GC). **Escape analysis** — visible via `go build -gcflags=-m` — decides which, and a value escapes when it can outlive its function (e.g. you return a pointer to a local).
4. Go's **garbage collector** is concurrent, low-pause, mark-and-sweep, and reachability-based: it frees what your program can no longer reach, so you never call `free()`. `GOGC` tunes the memory-vs-CPU trade-off.
5. ⚠️ Automatic GC is **not leak-proof** — anything still *reachable* is kept, so stuck goroutines and ever-growing global maps cause real memory growth. Fewer heap escapes and bounded lifetimes, not GC settings, are your main levers.

You now know what happens beneath `go`, `make`, and `&` — the scheduler that runs your goroutines and the collector that cleans up after them. Next we make all of this measurable: testing, benchmarking, and profiling, where you'll watch allocations and CPU time with real tools instead of reasoning about them in the abstract.

## Quick check

Test yourself on the three ideas that matter most — cheap goroutines, the GMP roles, and what "escape" really means:

```quiz
[
  {
    "q": "Why can a Go program run hundreds of thousands of goroutines but not hundreds of thousands of OS threads?",
    "choices": [
      "A goroutine starts with a tiny (~2 KB) growable stack and is scheduled by the runtime, while each OS thread reserves a large fixed stack and is scheduled by the kernel",
      "Goroutines run on the GPU instead of the CPU, which has far more cores",
      "The Go compiler converts goroutines into a single thread, so there's really only ever one",
      "Goroutines don't use memory at all until they finish running"
    ],
    "answer": 0,
    "explain": "A goroutine begins life at roughly 2 KB with a stack that grows on demand and is multiplexed onto a few OS threads by the runtime. OS threads each reserve a large fixed stack (often 1–8 MB) and carry kernel-scheduling overhead, so thousands of them exhaust memory fast."
  },
  {
    "q": "In the GMP scheduler, what is a P?",
    "choices": [
      "A logical processor: a scheduling context with a run queue of goroutines, capped by GOMAXPROCS, that an M must hold to run a G",
      "The pointer to a goroutine's stack",
      "A physical CPU core, exactly one per chip",
      "A 'pending' goroutine that is blocked on a channel"
    ],
    "answer": 0,
    "explain": "G is a goroutine, M is an OS thread, and P is a logical processor — a scheduling context holding a run queue. An M must hold a P to run a G, and the number of Ps (GOMAXPROCS) sets how many goroutines run truly in parallel."
  },
  {
    "q": "According to escape analysis, why does returning `&p` (a pointer to a local) force `p` onto the heap?",
    "choices": [
      "Because p must outlive the function that created it, so it can't die with the stack frame on return",
      "Because pointers are always stored on the heap in every language",
      "Because the garbage collector refuses to track stack memory",
      "Because returning a pointer is a compile error unless the value is heap-allocated"
    ],
    "answer": 0,
    "explain": "A stack-allocated local would vanish when its function returns. Returning its address means the caller can still use it afterward, so the value must outlive the frame — the compiler 'moves it to heap.' Returning the value by copy instead lets it stay on the stack."
  }
]
```

---

[← Phase 13: Error Handling, Deep](13-error-handling-deep.md) · [Guide overview](_guide.md) · [Phase 15: Testing, Benchmarks & Profiling →](15-testing-benchmarks-profiling.md)
