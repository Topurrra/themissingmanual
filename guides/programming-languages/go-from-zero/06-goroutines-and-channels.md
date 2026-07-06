---
title: "Goroutines & Channels - Go's Concurrency"
guide: "go-from-zero"
phase: 6
summary: "A goroutine is a cheap concurrent task you start with the word 'go'; channels are typed pipes that pass values between goroutines and synchronize them, so you share memory by communicating instead of locking it."
tags: [go, golang, goroutines, channels, concurrency, select, waitgroup, deadlock]
difficulty: intermediate
synonyms: ["what is a goroutine", "how do go channels work", "go concurrency explained", "go select statement", "sync waitgroup example", "go deadlock all goroutines are asleep", "goroutine leak"]
updated: 2026-06-19
---

# Goroutines & Channels - Go's Concurrency

Concurrency is where a lot of languages make you feel stupid - threads, locks, mutexes, a race condition you can't reproduce. Go's pitch: two small ideas, designed to fit together, that make this *approachable*.

A **goroutine** is a task running alongside your other tasks, cheap enough to start thousands of. A **channel** is a pipe between tasks: one goroutine puts a value in, another takes it out. The famous Go mantra falls out of those two facts:

> **Don't communicate by sharing memory; share memory by communicating.**

Instead of two tasks poking at the same variable behind a lock (and racing each other), you hand the value down a channel from one to the other. Whoever holds it owns it. No lock, no race.

## Goroutines: a concurrent task, started with one word

A goroutine is a function that runs concurrently with the rest of your program. Put the word `go` in front of a function call to start one - the call returns immediately while the function runs on its own.

📝 **Terminology.** A *goroutine* is not an operating-system thread. It's a lightweight task the Go runtime schedules onto a small pool of real threads. It starts with a tiny stack (a couple of kilobytes) that grows as needed, which is why running thousands is normal and cheap - something you can't do with OS threads. (For what a thread actually is underneath, see [What Happens When Code Runs](/guides/what-happens-when-code-runs).)

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	go fmt.Println("hello from the goroutine")
	fmt.Println("hello from main")
	time.Sleep(10 * time.Millisecond) // give the goroutine a moment to run
}
```
```console
$ go run main.go
hello from main
hello from the goroutine
```
`go fmt.Println(...)` launched that print as a separate task and returned instantly, so `main` printed its own line first, then the goroutine got a turn. The `time.Sleep` is a crude hack: without it, `main` would reach the end and exit *before* the goroutine ever ran (`main` ending kills every goroutine with it). That sleep is a placeholder - channels and `WaitGroup`, below, are the real way to wait.

⚠️ **Gotcha.** When `main` returns, the program exits immediately and takes all goroutines with it, finished or not. A goroutine isn't a promise the work will complete - it's a request to run *alongside*, and you need an explicit way to wait for it.

## Channels: a typed pipe between goroutines

A channel is a pipe you send values into and receive values out of - every channel carries one specific type. A `chan int` carries `int`s; a `chan string` carries `string`s. Make one with `make`, send with `ch <- v`, receive with `v := <-ch`.

**Why this is the heart of it.** A channel does two jobs at once: it *moves a value* from one goroutine to another, and it *synchronizes* them. On a plain (unbuffered) channel, a send blocks until someone is ready to receive, and a receive blocks until someone is ready to send - a handshake. When the value comes out the other end, you *know* the sender reached that point. Coordination for free, no lock needed.

Picture the handshake - one goroutine produces a number, sends it down the channel, and `main` receives it:

```mermaid
sequenceDiagram
  participant M as main
  participant W as worker goroutine
  M->>W: go work(ch)
  W->>W: compute result
  W-->>M: ch <- 42  (send blocks until received)
  M->>M: v := <-ch  (receives 42)
  Note over M,W: the send/receive is one handshake
```

The proper version of "wait for the goroutine," using a channel instead of `time.Sleep`:
```go
package main

import "fmt"

func work(ch chan int) {
	ch <- 42 // send the result into the channel
}

func main() {
	ch := make(chan int) // an unbuffered channel of ints
	go work(ch)
	v := <-ch // blocks here until work() sends
	fmt.Println("got", v)
}
```
```console
$ go run main.go
got 42
```
`main` started `work` as a goroutine, then sat on `<-ch`, blocked, waiting. `work` computed its result and sent `42` into the channel; `main` woke, received the value, and printed it. No `Sleep`, no race - the channel made `main` wait for exactly the right moment. Value and timing, coordinated in one line each.

📝 **Terminology.** An *unbuffered* channel (`make(chan int)`) holds nothing - a send waits for a receiver, hand-to-hand. A *buffered* channel (`make(chan int, 3)`) has room for a few values, so a send only blocks when the buffer is full. Start with unbuffered; reach for a buffer only when you have a reason.

⚠️ **Gotcha - deadlock on an unbuffered channel.** Because an unbuffered send blocks until *someone* receives, sending on a channel that nobody is listening to freezes forever. Go's runtime can often detect when *every* goroutine is stuck and bails out:
```go
func main() {
	ch := make(chan int)
	ch <- 1 // nobody is receiving - this blocks forever
}
```
```console
$ go run main.go
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan send]:
main.main()
	/tmp/main.go:3 +0x28
exit status 2
```
`main` tried to send `1`, but no goroutine was ready to receive, so the send blocked. Since `main` was the only goroutine and now stuck, nothing could progress - the runtime recognized everyone was asleep and reported `deadlock!`. Fix: make sure a receiver exists (start it as a goroutine *before* you send, or use a buffered channel if a send genuinely shouldn't wait).

## Closing a channel and ranging over it

When a sender is done, it can `close(ch)` to signal "no more values are coming." A receiver loops with `for v := range ch` to pull values until the channel is closed and drained, then stops cleanly.

```go
package main

import "fmt"

func main() {
	ch := make(chan int)
	go func() {
		for i := 1; i <= 3; i++ {
			ch <- i
		}
		close(ch) // tell the receiver we're done
	}()

	for v := range ch { // loops until ch is closed and empty
		fmt.Println("received", v)
	}
}
```
```console
$ go run main.go
received 1
received 2
received 3
```
The goroutine sent `1, 2, 3` then `close(ch)`. The `for ... range ch` loop in `main` received each value as it arrived, and when the channel was closed and emptied, the loop ended on its own - no counter, no sentinel value. Closing is how a sender says "that's all"; `range` is how a receiver listens for it.

⚠️ **Gotcha.** Only the *sender* should close a channel, and only once. Closing an already-closed channel, or sending on a closed channel, panics. Rule of thumb: whoever owns the sending end owns the close.

## `select`: waiting on several channels at once

`select` is like a `switch`, but its cases are channel operations. It blocks until *one* case can proceed, then runs it - how a goroutine listens to multiple channels, "whichever speaks first."

A common shape: do some work, but give up if it takes too long.
```go
package main

import (
	"fmt"
	"time"
)

func main() {
	result := make(chan string)
	go func() {
		time.Sleep(2 * time.Second) // pretend this is slow work
		result <- "done"
	}()

	select {
	case r := <-result:
		fmt.Println("got result:", r)
	case <-time.After(1 * time.Second):
		fmt.Println("timed out waiting")
	}
}
```
```console
$ go run main.go
timed out waiting
```
`select` waited on two channels: `result`, and the one returned by `time.After`, which delivers a value after the given delay. The work took 2 seconds but the timeout fired at 1, so the `time.After` case won. `select` is your tool for "wait for whichever happens first" - results, timeouts, cancellation, all at once.

## `sync.WaitGroup`: wait for a batch of goroutines to finish

Sometimes you don't need to pass values back - just launch goroutines and wait until *all* are done. A `sync.WaitGroup` is a counter for that: `Add` how many you're starting, each goroutine calls `Done` when it finishes, and `Wait` blocks until the counter hits zero.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	for i := 1; i <= 3; i++ {
		wg.Add(1) // one more goroutine to wait for
		go func(id int) {
			defer wg.Done() // mark this one done on the way out
			fmt.Println("worker", id, "finished")
		}(i)
	}
	wg.Wait() // block until all three call Done
	fmt.Println("all workers finished")
}
```
```console
$ go run main.go
worker 3 finished
worker 1 finished
worker 2 finished
all workers finished
```
Each iteration called `wg.Add(1)` before launching a worker, and each worker called `wg.Done()` (via `defer`, so it runs no matter how the function exits). `wg.Wait()` held `main` until the counter dropped to zero. Workers ran in whatever order the scheduler picked (here `3, 1, 2`), but `"all workers finished"` is guaranteed to print last, since `Wait` doesn't return until all report in.

💡 **Key point.** `defer wg.Done()` is the safe habit - it guarantees the counter decrements even if the goroutine returns early or panics. Forget a `Done` and `Wait` blocks forever; call it twice and the counter goes negative and panics. One `Add`, one `Done`, per goroutine.

⚠️ **Gotcha - goroutine leaks.** A goroutine that blocks forever never gets cleaned up - it sits holding memory for the life of the program. Usual cause: a goroutine waiting to send on (or receive from) a channel nothing will ever touch again:
```go
func leak() {
	ch := make(chan int)
	go func() {
		val := <-ch // waits forever - nobody ever sends
		fmt.Println(val)
	}()
	// function returns; the goroutine is stranded, blocked, leaked
}
```
`leak` started a goroutine that blocks on `<-ch`, then returned without sending anything. The goroutine can never progress or exit - it's leaked. Unlike the all-stuck case earlier, the runtime *won't* warn you here, since the rest of the program keeps running. Leaks are silent. Fix: always give a blocked goroutine a way out - close the channel, or use a `select` with a cancellation/timeout case.

## Recap

1. **Goroutine** - a cheap concurrent task; start it with `go f()`. Thousands are fine. When `main` exits, they all die, so you need a way to wait.
2. **Channel** - a typed pipe (`make(chan T)`) that both *moves* a value and *synchronizes* the two goroutines. An unbuffered send blocks until a receiver is ready.
3. **close + range** - the sender calls `close(ch)` to say "no more"; the receiver loops with `for v := range ch` until it's drained.
4. **`select`** - wait on several channels at once and act on whichever is ready first; pair with `time.After` for timeouts.
5. **`sync.WaitGroup`** - `Add`, `Done` (via `defer`), `Wait` to block until a batch of goroutines all finish.
6. **The mantra** - share memory by communicating: hand values down channels instead of locking shared variables. ⚠️ Watch for deadlock (send with no receiver) and leaks (a goroutine blocked forever).

You can now run work concurrently and coordinate it safely. Next: handling what goes *wrong* - in Go, errors are ordinary values you pass around, not exceptions thrown from the shadows.

---

[← Phase 5: Modules & Project Layout](05-modules-and-project-layout.md) · [Phase 7: Errors & I/O →](07-errors-and-io.md)
