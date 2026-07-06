---
title: "Closures, Iterators & Zero-Cost Abstractions - Expressive and Fast"
guide: "rust-from-zero"
phase: 15
summary: "Closures capture their environment, the Fn/FnMut/FnOnce traits decide how, and the Iterator trait turns one tiny method into a whole pipeline - all compiling down to the same machine code as a hand-written loop, for free."
tags: [rust, closures, iterators, fn-traits, iterator-adapters, zero-cost-abstractions, lazy-evaluation, functional]
difficulty: intermediate
synonyms: ["rust closures explained", "rust fn fnmut fnonce", "rust iterator adapters", "rust map filter collect", "rust zero cost abstractions", "rust lazy iterators", "rust functional programming"]
updated: 2026-06-22
---
# Closures, Iterators & Zero-Cost Abstractions - Expressive and Fast

Back in [Phase 9](09-idioms-and-gotchas.md) you got a taste of `.iter().filter().map().collect()` - the chain that reads like a sentence. It looked clean, maybe a little magical. This phase turns the magic into a mental model: why those chains work, what the funny `|x| ...` syntax actually is, and the claim that makes the whole thing remarkable - that this high-level, readable code runs *exactly* as fast as the low-level loop you'd dread writing by hand.

That claim has a name - **zero-cost abstraction** - and it's close to the heart of Rust's pitch. Most languages make you choose: write expressive code that's slow, or fast code that's ugly. Rust says you shouldn't have to. By the end of this phase you'll understand the three pieces that make it true: closures, the function traits, and the iterator protocol.

## Closures - functions that remember where they came from

**What it actually is.** A closure is an anonymous function you can write inline - but with a superpower a plain function doesn't have: it can *capture* variables from the surrounding scope and carry them along. The syntax: pipes for the parameters, then the body - `|x| x + 1`.

📝 **Closure** - an anonymous function value that can capture (remember) variables from the environment where it was defined. "Closure" because it *closes over* the surrounding variables, keeping them alive inside the function.

```rust
fn main() {
    let add_one = |x: i32| x + 1;       // a closure, stored in a variable
    println!("{}", add_one(5));

    let offset = 100;                   // a variable in the surrounding scope
    let add_offset = |x: i32| x + offset; // the closure captures `offset`
    println!("{}", add_offset(5));
}
```
```console
$ cargo run
6
105
```
*What just happened:* `add_one` is a function with no name, written where it's used. `add_offset` is the interesting one - it mentions `offset`, a variable from outside the closure, and Rust quietly *captures* it so the value travels with the closure. A plain `fn` can't do that; it has no access to local variables around it.

By default a closure borrows what it captures. But sometimes you need it to *own* its captures - to hand the closure to another thread (Phase 14) or return it from a function. The `move` keyword forces capture *by value*:

```rust
fn main() {
    let name = String::from("Ada");

    // `move` takes ownership of `name` into the closure
    let greet = move || println!("Hello, {}", name);

    greet();
    // println!("{}", name);  // ERROR: `name` was moved into the closure
}
```
```console
$ cargo run
Hello, Ada
```
*What just happened:* Without `move`, the closure would borrow `name`. With `move`, it took ownership - `name` now lives *inside* `greet`, and using it afterward would be a compile error, exactly like the moves from [Phase 6](06-ownership-and-borrowing.md). Use `move` when the closure needs to outlive the scope it was born in.

## `Fn`, `FnMut`, `FnOnce` - how a closure treats its captures

Here's the question Rust must answer for every closure: when it uses a captured variable, does it just *read* it, *mutate* it, or *consume* it entirely? The answer determines how many times you can call the closure and where you're allowed to use it. Rust encodes it as three traits, and a closure automatically implements whichever fit.

📝 **`FnOnce`** - a closure that *consumes* its captures (e.g. moves a value out). It can be called **once**, because after that the captured values are gone. Every closure is at least `FnOnce`.

📝 **`FnMut`** - a closure that *mutably borrows* its captures, so it can change them. Callable many times, but it needs mutable access while it runs.

📝 **`Fn`** - a closure that only *immutably borrows* its captures (reads them). Callable many times, freely, even from multiple places at once.

These nest from most-restrictive to most-permissive: every `Fn` is also an `FnMut`, and every `FnMut` is also an `FnOnce`. **You almost never write these by hand** - the compiler picks the most permissive trait that fits your closure's body. Your job is mostly to know what they mean when they show up in signatures.

And they show up constantly, because a function that *accepts* a closure is generic over one of these traits. `impl Fn(i32) -> i32` means "give me anything callable like this, that only reads its captures":

```rust
// Accepts any closure that takes an i32 and returns an i32, reading its captures.
fn apply_twice(f: impl Fn(i32) -> i32, start: i32) -> i32 {
    f(f(start))   // called twice - so it must be Fn, not FnOnce
}

fn main() {
    let bump = 10;
    let result = apply_twice(|x| x + bump, 5);  // closure captures `bump` by read
    println!("{}", result);
}
```
```console
$ cargo run
25
```
*What just happened:* `apply_twice` calls `f` twice, so it demands `impl Fn` - a closure it can call repeatedly. We passed `|x| x + bump`, which only *reads* `bump`, so the compiler certifies it as `Fn` and the call typechecks. Had `apply_twice` asked for `impl FnOnce` instead, calling `f` a second time would fail to compile, since `FnOnce` only promises one call. This is how the borrow rules from [Phase 6](06-ownership-and-borrowing.md) extend to functions-as-values: the trait *is* the contract for how the closure touches its captures.

💡 **Key point.** Read `impl Fn(...)` as "a callable that reads its captures, usable many times." `FnMut` is "callable many times, but mutates." `FnOnce` is "callable exactly once." You rarely choose which one your closure is - the compiler does - but reading them tells you instantly how a function intends to use the closure you hand it.

## The `Iterator` trait - one method to rule them all

Now the centerpiece. Every loop, every `.map()`, every `for` you've written in Rust runs on a single, almost comically small trait.

📝 **`Iterator`** - a trait with one required method, `fn next(&mut self) -> Option<Self::Item>`. Call `next()` and it hands you `Some(value)` for the next item, or `None` when there's nothing left. *Everything else* - `map`, `filter`, `sum`, the works - is a default method built on `next`.

That tiny contract has a profound consequence: **iterators are lazy**. Calling `next` is the *only* thing that produces a value. Until something calls it, an iterator is an inert recipe.

You'll usually get iterators from collections (`.iter()`, `.into_iter()`), but implementing the trait yourself is the best way to see there's no magic. Here's a counter that yields the numbers below a limit:

```rust
struct Counter {
    count: u32,
    max: u32,
}

impl Iterator for Counter {
    type Item = u32;                    // what each item is

    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)            // hand out the next value
        } else {
            None                        // signal "we're done"
        }
    }
}

fn main() {
    let counter = Counter { count: 0, max: 3 };
    for n in counter {                  // the `for` loop calls next() for us
        println!("{}", n);
    }
}
```
```console
$ cargo run
1
2
3
```
*What just happened:* We implemented exactly one method, `next`. Each call bumps `count`, returns `Some(count)`, and returns `None` once we hit `max`. The `for` loop does nothing fancier than calling `next()` over and over and stopping the instant it sees `None` - the same protocol the Python guide describes for [`StopIteration`](/guides/python-from-zero), only here the "we're done" signal is `Option`'s `None`. Define `next`, and your type drops straight into every `for` loop and adapter in the standard library.

## Iterator adapters - building pipelines, lazily

Because everything is built on `next`, the standard library offers a huge toolbox of methods that take an iterator and return a *new* iterator. These are **adapters**, and they're lazy - they wrap your iterator in another layer of "recipe" without running anything. The methods that actually drive the iterator and produce a final value are **consumers**, and they're eager.

A useful way to hold the two apart:

- **Adapters (lazy, return an iterator):** `map` (transform each item), `filter` (keep some items), `take` (stop after N), `zip` (pair two iterators together), `enumerate` (attach an index to each item).
- **Consumers (eager, return a value):** `collect` (gather into a collection), `sum` (add them up), `fold` (reduce with an accumulator), `for_each` (run a side effect per item).

The pattern is always: chain adapters to describe the transformation, then end with one consumer to make it happen.

```rust
fn main() {
    let names = ["alice", "bob", "carol", "dave"];

    let result: Vec<String> = names
        .iter()
        .enumerate()                          // (0, "alice"), (1, "bob"), ...
        .filter(|(i, _)| i % 2 == 0)          // keep even indices
        .map(|(i, name)| format!("{}: {}", i, name))
        .take(5)                              // at most 5 (we have fewer)
        .collect();                           // <-- the consumer fires it all

    for line in &result {
        println!("{}", line);
    }

    let total: u32 = (1..=5).sum();           // a one-shot consumer
    println!("sum 1..=5 = {}", total);
}
```
```console
$ cargo run
0: alice
2: carol
sum 1..=5 = 15
```
*What just happened:* Read the chain top to bottom as a pipeline: number each name with `enumerate`, keep the even-indexed ones with `filter`, format each survivor with `map`, cap the count with `take`, then `collect` pulls every value through and builds the `Vec`. None of `enumerate`/`filter`/`map`/`take` did any work when written; they only described layers. `collect()` is what called `next` enough times to run the whole thing. The `(1..=5).sum()` line shows a range is also an iterator, consumed in one shot.

⚠️ **Adapters do nothing until a consumer runs.** This is the single most common iterator mistake. Write `names.iter().map(|n| println!("{}", n));` with no consumer, and *nothing prints* - you built a recipe and threw it away. The compiler even warns you: `iterators are lazy and do nothing unless consumed`.

## Zero-cost abstractions - readable *and* fast, not one or the other

So we have closures and a deeply layered iterator system. In most languages, layering like that costs you: each adapter would be an object with virtual method calls, heap allocations, the works - and the pretty pipeline would run measurably slower than a blunt `for` loop. Rust's twist: **it doesn't.**

📝 **Zero-cost abstraction** - a high-level construct that compiles down to the same machine code you'd have written by hand at the low level, with no runtime penalty for the abstraction. You don't pay for the niceness.

Three things from earlier phases combine to make this real. **Monomorphization** ([Phase 11's generics](11-traits-and-generics.md)): because `apply_twice` and every adapter are generic, the compiler stamps out a specialized version for your exact closure and type - no dynamic dispatch. **Inlining:** small closures and `next` calls get inlined directly into the loop, collapsing the layers of "recipe" into flat code. And the **ownership model** ([Phase 6](06-ownership-and-borrowing.md)) often lets the compiler prove indices are in bounds, eliding the array bounds-checks a naive loop might keep.

The upshot: this pipeline...

```rust
fn main() {
    let nums: Vec<u64> = (1..=1_000).collect();

    // High-level: reads like a sentence.
    let sum_of_even_squares: u64 = nums
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .sum();

    println!("{}", sum_of_even_squares);
}
```

...compiles to essentially the same instructions as this hand-rolled version:

```rust
fn main() {
    let nums: Vec<u64> = (1..=1_000).collect();

    // Low-level: the loop you'd write to avoid "overhead."
    let mut sum_of_even_squares: u64 = 0;
    for &n in &nums {
        if n % 2 == 0 {
            sum_of_even_squares += n * n;
        }
    }

    println!("{}", sum_of_even_squares);
}
```
```console
$ cargo run
166666500
```
*What just happened:* Both versions produce `166666500`, and after the optimizer runs, both produce nearly identical machine code - no extra allocations, no closure objects on the heap, no virtual calls. The `filter` and `map` closures were inlined into one tight loop. The choice between them is purely about *which you'd rather read and maintain* - the performance is the same.

💡 **You don't trade readability for speed.** That's the whole pitch of this phase, and arguably of Rust. In many languages the iterator chain is the "elegant but slower" option you avoid in hot loops. In Rust it's the idiomatic default precisely *because* it costs nothing. Reach for the chain first; drop to a manual loop only when profiling gives you a concrete reason, which is rare.

## Recap

1. A **closure** is an anonymous function written inline (`|x| x + 1`) that can **capture** variables from its surrounding scope. By default it borrows them; `move` makes it take ownership - needed for threads or returning the closure.
2. **`Fn` / `FnMut` / `FnOnce`** describe how a closure treats its captures: `Fn` reads (callable many times), `FnMut` mutates (callable many times), `FnOnce` consumes (callable once). The compiler picks the right one; a function accepting a closure is generic over these traits, e.g. `impl Fn(i32) -> i32`.
3. The **`Iterator`** trait requires one method, `next() -> Option<Item>`. Everything else is built on it, and that means iterators are **lazy** - no value exists until something calls `next`.
4. **Adapters** (`map`, `filter`, `take`, `zip`, `enumerate`) are lazy and return iterators; **consumers** (`collect`, `sum`, `fold`, `for_each`) are eager and produce a value. ⚠️ Adapters do nothing until a consumer runs - forget the consumer and you get the "unused iterator" warning and no output.
5. **Zero-cost abstraction**: thanks to monomorphization, inlining, and the borrow checker, an iterator chain compiles to the same machine code as a hand-written loop. You get readable *and* fast - you don't trade one for the other.

## Quick check

Test yourself on the three ideas that make this phase tick - capturing, laziness, and zero cost:

```quiz
[
  {
    "q": "What distinguishes a closure like `|x| x + offset` from a plain `fn`?",
    "choices": [
      "It can capture variables from the surrounding scope (like `offset`), carrying them along",
      "It always runs faster than a named function",
      "It can only ever be called once",
      "It cannot take any parameters"
    ],
    "answer": 0,
    "explain": "A closure closes over its environment - it can capture and remember variables from where it was defined, which a plain `fn` cannot. By default it borrows them; `move` makes it take ownership."
  },
  {
    "q": "You write `names.iter().map(|n| println!(\"{}\", n));` and nothing prints. Why?",
    "choices": [
      "`map` is a lazy adapter - without a consumer like `collect`, `for_each`, or a `for` loop, nothing pulls the values through",
      "`println!` doesn't work inside a closure",
      "`.iter()` returns an empty iterator for arrays",
      "The closure needs the `move` keyword to run"
    ],
    "answer": 0,
    "explain": "Iterator adapters are lazy: they build a recipe but do no work until a consumer calls `next`. With no consumer, the chain is dropped unused - the compiler even warns 'iterators are lazy and do nothing unless consumed.'"
  },
  {
    "q": "Why does an idiomatic `.iter().filter(...).map(...).sum()` chain run as fast as a hand-written `for` loop in Rust?",
    "choices": [
      "Monomorphization and inlining collapse the adapters and closures into the same machine code as the manual loop - a zero-cost abstraction",
      "The chain secretly skips most of the elements to save time",
      "Rust runs iterator chains on a separate optimized thread",
      "It doesn't - the chain is always noticeably slower, so you should avoid it"
    ],
    "answer": 0,
    "explain": "The generic adapters get specialized (monomorphized) for your exact types and the small closures get inlined, so the layers collapse into one tight loop with no heap allocations or virtual calls. Readable and fast - that's the zero-cost promise."
  }
]
```

---

[← Phase 14: Fearless Concurrency](14-fearless-concurrency.md) · [Guide overview](_guide.md) · [Phase 16: Macros & Metaprogramming →](16-macros.md)
