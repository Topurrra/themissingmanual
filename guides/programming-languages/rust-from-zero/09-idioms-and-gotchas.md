---
title: "Idioms & Common Gotchas - Writing Rust Like a Rustacean"
guide: "rust-from-zero"
phase: 9
summary: "The handful of patterns that make code feel like real Rust - enums with exhaustive match, traits for shared behavior, iterator combinators (map/filter/collect), Option/Result combinators, and borrowing over cloning - plus a cheat-card of the gotchas that bite every newcomer."
tags: [rust, enums, traits, iterators, combinators, idioms, gotchas, string-vs-str]
difficulty: intermediate
synonyms: ["rust enums and match", "what are traits in rust", "rust iterators map filter collect", "rust string vs str difference", "common rust mistakes", "rust idioms for beginners", "rust integer overflow panic"]
updated: 2026-06-19
---
# Idioms & Common Gotchas - Writing Rust Like a Rustacean

There's a moment, a few weeks into Rust, when your code stops being "C with extra punctuation" and starts being *Rust* - you stop fighting the language and start leaning on it. This phase is a shortcut to that moment: the small set of patterns that make code feel native, plus a cheat-card of the gotchas that trip up everyone so they don't have to trip up you.

None of this is mandatory to write working programs, but these are the idioms you'll see in every real codebase (including [this project's Rust backend](08-ecosystem-and-tooling.md)) - idiomatic precisely because they make the compiler do more of the work for you.

## Enums + exhaustive `match`: model your data honestly

**What it actually is.** An enum is a type that is *exactly one of several variants*, and in Rust, each variant can carry its own data - far more powerful than the integer-constants "enum" in many languages. It lets you say "a shape is a circle *with a radius*, or a rectangle *with a width and height*," making any other possibility impossible.

```rust
#[derive(Debug)]
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
}

fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
    }
}

fn main() {
    let shapes = [Shape::Circle(1.0), Shape::Rectangle(2.0, 3.0)];
    for s in &shapes {
        println!("{:?} area {:.2}", s, area(s));
    }
}
```
```console
$ cargo run
Circle(1.0) area 3.14
Rectangle(2.0, 3.0) area 6.00
```
*What just happened:* `match` looks at which variant `s` is and pulls its data out in one move - `Shape::Circle(r)` binds the radius to `r`. (`Option` and `Result` from [Phase 7](07-errors-and-io.md) are themselves just enums, why `match` works on them too.)

Now the superpower: add a variant - say `Triangle` - and forget to handle it, and the compiler stops you cold.

```console
$ cargo build
error[E0004]: non-exhaustive patterns: `&Shape::Triangle(_, _)` not covered
 --> src/main.rs:8:11
  |
8 |     match s {
  |           ^ pattern `&Shape::Triangle(_, _)` not covered
```
*What just happened:* `match` must be **exhaustive** - cover every variant. The compiler noticed `Triangle` had no arm and refused to build. One of Rust's quietest, most valuable features: add a case to your data model and the compiler hands you a to-do list of every place that needs updating. No silent "fell through the cracks" bug.

💡 **Key point.** Enums + exhaustive `match` mean "make illegal states unrepresentable, and impossible to forget to handle." Reach for an enum whenever a value is "one of a fixed set of things," especially when each thing carries different data.

## Traits: shared behavior without inheritance

**What it actually is.** A trait is a set of methods a type promises to provide - "anything that implements `Display` knows how to print itself nicely." It's how Rust does shared behavior in place of class inheritance: define a trait, implement it for any types you like, and functions can accept "anything that implements this trait."

```rust
trait Greet {
    fn greeting(&self) -> String;
}

struct Dog;
struct Robot;

impl Greet for Dog {
    fn greeting(&self) -> String {
        "Woof".to_string()
    }
}
impl Greet for Robot {
    fn greeting(&self) -> String {
        "BEEP BOOP".to_string()
    }
}

fn announce(thing: &impl Greet) {
    println!("{}", thing.greeting());
}

fn main() {
    announce(&Dog);
    announce(&Robot);
}
```
```console
$ cargo run
Woof
BEEP BOOP
```
*What just happened:* `Dog` and `Robot` share no common parent, but both implement `Greet`, so both can be passed to `announce(thing: &impl Greet)` - "give me a reference to anything that can `greeting`." How Rust gets polymorphism without inheritance hierarchies. You've already used traits without knowing it: `#[derive(Debug)]` implements `Debug`, which is what lets `{:?}` print your type.

## Iterator combinators: describe the transformation, skip the loop

**What they actually are.** Instead of writing an explicit `for` loop with a mutable accumulator, chain *combinators* - `.map()`, `.filter()`, `.collect()`, and friends - that describe *what* you want done to each element. The result reads top-to-bottom like a sentence, and it's just as fast as a hand-written loop (the compiler optimizes the chain away).

```rust
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6];

    let evens_squared: Vec<i32> = nums
        .iter()
        .filter(|&&n| n % 2 == 0)   // keep the even ones
        .map(|&n| n * n)            // square each
        .collect();                 // gather into a Vec

    println!("{:?}", evens_squared);
}
```
```console
$ cargo run
[4, 16, 36]
```
*What just happened:* Read it as a pipeline: start with the numbers, *filter* down to evens, *map* each to its square, then *collect* into a `Vec`. `.iter()` starts the chain (borrowing each element); `.collect()` ends it by building the final collection. The `&&n` looks odd at first - pattern-matching through two layers of reference - but you'll stop noticing it. No index variable, no off-by-one, no mutable accumulator to get wrong.

⚠️ **Iterators are lazy.** `.filter()` and `.map()` don't do anything by themselves - they just describe work. Nothing happens until a *consumer* like `.collect()`, `.sum()`, or a `for` loop pulls the values through. Forget the consuming step and your "transformation" silently does nothing.

## Option/Result combinators: handle the maybe without a `match`

The same combinator style works on `Option` and `Result`, letting you transform a maybe-value without a full `match` for the simple cases:

```rust
fn main() {
    let input = "42";

    // parse() gives Result; .ok() turns it into Option; map adjusts the value;
    // unwrap_or supplies a fallback if it was None.
    let doubled = input.parse::<i32>().ok().map(|n| n * 2).unwrap_or(0);

    println!("{}", doubled);
}
```
```console
$ cargo run
84
```
*What just happened:* `parse()` returned `Ok(42)`; `.ok()` converted that to `Some(42)`; `.map(|n| n * 2)` turned it into `Some(84)`; `.unwrap_or(0)` pulled out `84` (and would give `0` if anything had been `None`). That "parse, double if it worked, else default to zero" story is one readable line. For simple "transform or fall back" cases, combinators like `.map()`, `.unwrap_or()`, `.and_then()`, and `.unwrap_or_else()` beat a `match` - save `match` for genuinely different cases.

## Prefer borrowing over cloning

This is less a single trick and more a habit, the one that most separates comfortable Rust from "I `.clone()` everything to make the borrow checker stop." Remember from [Phase 6](06-ownership-and-borrowing.md): `.clone()` makes a full, independent copy. Sometimes you need that; often you reached for it just to dodge a move error, quietly adding a needless copy.

The idiomatic default: **functions should borrow (`&T`) what they only need to read, and take `&str` instead of `String`, `&[T]` instead of `Vec<T>`.** That way callers can pass what they already have without giving it up or copying it.

```rust
// Idiomatic: borrows, doesn't take ownership, accepts &str
fn shout(message: &str) -> String {
    message.to_uppercase()
}

fn main() {
    let owned = String::from("hello");
    println!("{}", shout(&owned));   // pass a borrow
    println!("{}", shout("world"));  // a literal &str works too
    println!("still have: {}", owned);  // owned wasn't moved or cloned
}
```
```console
$ cargo run
HELLO
WORLD
still have: hello
```
*What just happened:* `shout` takes `&str`, so it accepts a borrow of a `String` *and* a plain string literal, without either caller losing ownership or copying. `owned` is still usable afterward. Rule of thumb: borrow unless you have a real reason to own the value.

## The gotcha cheat-card

The things that bite every newcomer, with the calm fix for each. Skim it now, come back when one bites you.

| The gotcha | What's going on | The fix |
|---|---|---|
| **`String` vs `&str`** | `String` is an owned, growable string (heap). `&str` is a borrowed *view* into string data (a slice). Literals like `"hi"` are `&str`. | Take `&str` in function parameters (most flexible); use `String` when you need to own or grow it. Convert with `.to_string()` / `&s`. |
| **Clone overuse** | Sprinkling `.clone()` to silence the borrow checker quietly copies data everywhere. | Borrow (`&`) instead. Clone only when you truly need a second independent copy. |
| **"Fighting the borrow checker"** | An error feels unfair, so you push harder against it. | It's almost always flagging a real lifetime/aliasing issue. Restructure (borrow, narrow a scope, finish one borrow before the next) rather than forcing it. See [Phase 6](06-ownership-and-borrowing.md). |
| **Lifetime anxiety** (`'a`) | The `'a` syntax looks like deep wizardry. | It's just "how long this reference is valid." The compiler infers it 95% of the time; you only annotate when it asks. Don't let it scare you off. |
| **`.unwrap()` panics** | `.unwrap()` crashes the program on `Err`/`None`. Fine in tests, a landmine in real code. | Use `?` to bubble the error, or `match`/combinators to handle it. Reserve `.unwrap()`/`.expect()` for proven-impossible cases. See [Phase 7](07-errors-and-io.md). |
| **Integer overflow in debug** | In **debug** builds, `a + b` that overflows *panics*; in **release** builds it silently wraps around. So a bug can vanish in release. | Be intentional: use `.checked_add()` (returns `Option`), `.saturating_add()` (clamps), or `.wrapping_add()` (explicitly wraps) when overflow is possible. |

That last one surprises people, so let's see it. With a runtime value (so the check isn't caught at compile time), a debug build catches the overflow the moment it happens:

```rust
fn main() {
    let values: Vec<u8> = vec![255];
    let x = values[0];   // a u8, max value 255
    let y = x + 1;       // 256 doesn't fit in a u8
    println!("{}", y);
}
```
```console
$ cargo run
thread 'main' panicked at src/main.rs:4:13:
attempt to add with overflow
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```
*What just happened:* `255 + 1` doesn't fit in a `u8` (tops out at 255), and the debug build's overflow check caught it and panicked with a precise message. This is a *feature*: in many languages this would silently wrap to `0` and corrupt your logic with no warning. ⚠️ The catch: a `--release` build turns this check off for speed and *does* silently wrap - so when overflow is genuinely possible, don't rely on the debug panic; reach for `.checked_add()` and handle the `None`.

## Recap

1. **Enums + exhaustive `match`**: model "one of a fixed set" honestly; the compiler forces you to handle every variant (`error[E0004]` when you don't).
2. **Traits**: shared behavior without inheritance - implement a trait for any type, then accept `&impl Trait`.
3. **Iterator combinators** (`.iter().filter().map().collect()`): describe the transformation instead of writing the loop - readable *and* fast. Remember they're lazy until consumed.
4. **`Option`/`Result` combinators** (`.map`, `.ok`, `.unwrap_or`, `.and_then`): handle the simple maybe-cases without a full `match`.
5. **Borrow over clone**: take `&T` / `&str` / `&[T]` to read; clone only when you truly need a second copy.
6. **The cheat-card** covers the six that bite everyone - `String` vs `&str`, clone overuse, borrow-checker fights, lifetime anxiety, `.unwrap()` panics, and debug-only integer-overflow panics.

---

[← Phase 8: The Ecosystem & Tooling](08-ecosystem-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: Lifetimes & the Borrow Checker →](10-lifetimes-and-borrowing.md)
