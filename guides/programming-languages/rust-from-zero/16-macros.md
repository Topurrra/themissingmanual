---
title: "Macros & Metaprogramming - Code That Writes Code"
guide: "rust-from-zero"
phase: 16
summary: "Why println! has a bang, how macros run at compile time and expand into ordinary Rust, writing a small macro_rules!, when a declarative macro earns its keep, and the derive/procedural macros you'll actually use."
tags: [rust, macros, macro-rules, declarative-macros, derive-macros, procedural-macros, metaprogramming]
difficulty: intermediate
synonyms: ["rust macros explained", "rust macro_rules", "rust declarative vs procedural macros", "rust derive macro", "what does the exclamation mark mean in rust", "rust metaprogramming", "why does println have a bang"]
updated: 2026-06-22
---
# Macros & Metaprogramming - Code That Writes Code

You've been using macros since Phase 1, every time you typed `println!`. That `!` has probably sat there as a small unexplained mystery - punctuation you copy without knowing why. This phase clears it up, and the answer turns out to be one of the more elegant ideas in Rust.

Macros intimidate people, with a reputation for arcane wizard stuff. The truth is gentler: a macro is a tool that writes ordinary Rust code *for* you, before your program is compiled. Once you have that model, the mystery dissolves - and you'll realize you'll spend far more time *using* macros than ever writing them.

📝 **Macro** - a piece of code that runs at **compile time** and expands into ordinary Rust source. By the time the compiler actually compiles your program, every macro call has been replaced by the plain code it generated. A macro is not a function; it's a code generator.

## Why the `!`

Every `!` you've typed marks a macro call, not a function call: `println!`, `vec!`, `panic!`, `format!`, `assert!`. The bang is Rust's way of saying "this isn't a function - it expands into code before compilation." That distinction is the whole point of this phase.

Why can't these be plain functions? Two reasons, and `println!` shows both:

```rust
fn main() {
    let name = "Ada";
    let count = 3;

    println!("hello");                          // zero extra args
    println!("hello {}", name);                 // one
    println!("{} sent {} messages", name, count); // two
}
```
```console
$ cargo run
hello
hello Ada
Ada sent 3 messages
```
*What just happened:* The same `println!` accepted zero, one, and two trailing arguments. A normal Rust function has a *fixed* number of parameters with *fixed* types - there's no way to write one `fn` that takes "a format string plus however many values you feel like." A macro can, because instead of a signature it has *patterns* it matches against whatever you hand it.

The more impressive reason: `println!` checks your format string **at compile time**. Forget an argument and the program won't even build:

```rust
fn main() {
    println!("{} and {}", "only one");  // string has two {} but one value
}
```
```console
$ cargo build
error: 1 positional argument in format string, but there is 1 argument
 --> src/main.rs:2:14
```
*What just happened:* The macro read your literal `"{} and {}"` *during compilation*, counted two placeholders, saw one value, and refused to build. A regular function receives its arguments at runtime and can't see inside a string literal like that. Because a macro runs at compile time with your source code in hand, it catches the mistake before your program ever runs - the superpower the `!` is announcing.

## Declarative macros (`macro_rules!`)

The most common kind of macro you can write yourself is the **declarative macro**, built with `macro_rules!`. The mental model: a tiny pattern-matching engine, a lot like `match` from [Phase 9](09-idioms-and-gotchas.md) - except instead of matching on *values*, it matches on the *shape of code* you pass it, and instead of returning a value, it produces *new code*.

A small example: `max!` takes two expressions and expands into an `if` that picks the larger:

```rust
macro_rules! max {
    ($a:expr, $b:expr) => {
        if $a > $b { $a } else { $b }
    };
}

fn main() {
    let biggest = max!(3 + 1, 10);
    println!("{}", biggest);
}
```
```console
$ cargo run
10
```
*What just happened:* Read the macro as a rule. The left side, `($a:expr, $b:expr)`, is the **matcher** - "I expect two things, each an expression; call them `$a` and `$b`." `:expr` is a *fragment specifier* telling Rust what kind of code to capture. The right side, between `=>` and `;`, is the **expansion** - the code to generate, with `$a` and `$b` slotted in. So `max!(3 + 1, 10)` expanded, at compile time, into `if 3 + 1 > 10 { 3 + 1 } else { 10 }`, and the compiler compiled *that* ordinary code.

Now the feature that makes macros genuinely powerful: **repetition**. A matcher can say "zero or more of these," which is how `vec!` accepts any number of elements. Let's build our own:

```rust
macro_rules! my_vec {
    ( $( $x:expr ),* ) => {
        {
            let mut v = Vec::new();
            $( v.push($x); )*
            v
        }
    };
}

fn main() {
    let nums = my_vec![10, 20, 30];
    println!("{:?}", nums);
}
```
```console
$ cargo run
[10, 20, 30]
```
*What just happened:* The matcher `$( $x:expr ),*` reads as "a comma-separated list of expressions" - `$( ... )` wraps the repeating part, `,` is the separator, `*` means "zero or more." For `my_vec![10, 20, 30]`, that captured `$x` three times. In the expansion, `$( v.push($x); )*` repeats the `v.push($x);` line once per captured expression, so the macro generated a fresh `Vec`, pushed `10`, `20`, and `30`, and handed it back - essentially how the real `vec!` works.

💡 **Key point.** A `macro_rules!` matcher captures *fragments of code* (`$x:expr`) and the expansion stamps them into a template, optionally repeating with `$( ... )*`. Because this all happens before compilation, the generated code is just as fast as if you'd written it by hand - zero runtime cost.

## When a declarative macro earns its keep

A fair question after writing `max!`: why not a function? For `max!`, you absolutely should use a function (or `std::cmp::max`) - it'd be clearer. Macros earn their keep only when ordinary tools *can't* do the job. The classic case is generating genuinely repetitive code that functions and generics can't express - most often, implementing the same trait across many types:

```rust
trait Describe {
    fn describe(&self) -> String;
}

macro_rules! impl_describe {
    ($($t:ty),*) => {
        $(
            impl Describe for $t {
                fn describe(&self) -> String {
                    format!("a {} with value {}", stringify!($t), self)
                }
            }
        )*
    };
}

impl_describe!(i32, f64, bool);

fn main() {
    println!("{}", 42.describe());
    println!("{}", 3.5.describe());
    println!("{}", true.describe());
}
```
```console
$ cargo run
a i32 with value 42
a f64 with value 3.5
a bool with value true
```
*What just happened:* `impl_describe!(i32, f64, bool)` matched a comma-separated list of *types* (`$t:ty`), and `$( ... )*` stamped out three separate `impl Describe for ...` blocks - one per type - at compile time. Writing those by hand would be tedious and easy to get out of sync; the macro keeps them in lockstep. (`stringify!` is itself a macro that turns the token `i32` into the string `"i32"`.) This is the sweet spot: boilerplate that varies only by type, which a plain generic function can't generate because each `impl` is a separate language construct.

⚠️ **Gotcha - macros are harder to read and debug than functions.** That `max!` evaluates `$a` and `$b` *twice* in the expansion, so `max!(expensive(), 0)` would call `expensive()` twice - a subtle bug a function would never have. Macro errors point at the *expanded* code, not your source, which can be baffling. Reach for a macro only when ordinary code genuinely can't do the job; when in doubt, write the function.

## Derive macros

Here's the macro feature you'll use constantly - and you've already met it. Remember `#[derive(Debug)]` from way back? That's a macro - specifically a **procedural macro**: a code generator the compiler runs on your type to write `impl` blocks *for* you.

📝 **Declarative vs procedural.** A **declarative** macro (`macro_rules!`) is pattern-based - you write matchers and templates, as above. A **procedural** macro is a small Rust program that receives your code as input and *computes* the output code with ordinary Rust logic. `#[derive(...)]` is the most common procedural macro.

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a.clone();              // Clone gave us .clone()
    println!("{:?}", a);           // Debug gave us {:?}
    println!("equal? {}", a == b); // PartialEq gave us ==
}
```
```console
$ cargo run
Point { x: 1, y: 2 }
equal? true
```
*What just happened:* That one line, `#[derive(Debug, Clone, PartialEq)]`, ran three procedural macros at compile time, each generating a full `impl` block for `Point`: `Debug` wrote the code that prints `Point { x: 1, y: 2 }`, `Clone` wrote the field-by-field `.clone()`, and `PartialEq` wrote the `==` comparison. You'd have written dozens of lines by hand; `derive` generated them from the struct definition alone.

## Procedural macros, briefly

Custom `#[derive(...)]` is one of three kinds of procedural macro. You don't need to write any of these to be productive, but you'll meet them constantly in libraries:

- **Custom derive** - `#[derive(Serialize)]` from the `serde` crate generates JSON (de)serialization code for your struct. This is how serialization in Rust feels effortless.
- **Attribute macros** - `#[tokio::main]` on your `main` function rewrites it to set up an async runtime, and `#[test]` marks a function as a test. They wrap or transform the item they're attached to.
- **Function-like macros** - they look like `macro_rules!` calls (`name!(...)`) but are backed by a full Rust program; `sqlx::query!` checks your SQL against a real database at compile time.

All three operate on the **token stream** - the raw sequence of tokens making up your code - using `proc_macro` machinery. They're powerful enough to inspect and rewrite arbitrary code, which is why they must live in their own dedicated crate. Writing one is an advanced topic involving crates like `syn` and `quote`, a deep dive we won't take here.

💡 **You'll *use* far more macros than you *write*.** The macros powering `serde`, `tokio`, `clap`, and `sqlx` represent enormous engineering effort, and you get all of it from a single `#[derive(...)]` or `#[tokio::main]` line. For the vast majority of Rust you'll write, "knowing macros" means knowing *which* ones to reach for, not authoring your own. That's a feature, not a gap.

## Recap

1. Every `!` (`println!`, `vec!`, `panic!`) marks a **macro** call. Macros run at **compile time** and expand into ordinary Rust code before your program is compiled - that's why they can take any number of arguments and check format strings before the program runs.
2. **Declarative macros** (`macro_rules!`) pattern-match on the *shape of code*: matchers capture fragments like `$x:expr` or `$t:ty`, and `$( ... )*` repeats the expansion once per captured item - exactly how `vec!` accepts any number of elements.
3. A declarative macro **earns its keep** only when functions and generics can't, such as implementing one trait across many types. ⚠️ Macros are harder to read and debug, so prefer a plain function when one will do.
4. **Derive macros** like `#[derive(Debug, Clone, PartialEq)]` are **procedural** macros that generate whole `impl` blocks from your type - the macro feature you'll use on nearly every struct.
5. **Procedural macros** come in three flavors (custom derive, attribute, function-like), operate on the token stream, live in their own crate, and power libraries like `serde` and `tokio`. You'll *use* them far more than you'll ever *write* them.

## Quick check

One quick pass to lock in the core idea - that a macro is compile-time code generation:

```quiz
[
  {
    "q": "Why does `println!` have a `!`, and why can't it be a plain function?",
    "choices": [
      "The `!` marks it as a macro that expands at compile time, letting it take any number of arguments and check the format string before the program runs",
      "The `!` means the function can panic, which regular functions are forbidden from doing",
      "The `!` is just Rust's required syntax for any function that prints to the screen",
      "The `!` makes the call faster by skipping argument type checks"
    ],
    "answer": 0,
    "explain": "The `!` marks a macro call. Because a macro expands into code at compile time rather than being called at runtime, it can accept a variable number of arguments and inspect the format-string literal to catch mistakes before the program ever runs - neither of which a fixed-signature function can do."
  },
  {
    "q": "In `macro_rules! my_vec { ( $( $x:expr ),* ) => { ... } }`, what does `$( $x:expr ),*` match?",
    "choices": [
      "A comma-separated list of zero or more expressions, captured as `$x`",
      "Exactly one expression named `$x`",
      "A single string literal split on commas",
      "Two expressions separated by a comma, no more and no fewer"
    ],
    "answer": 0,
    "explain": "The `$( ... ),*` is a repetition: `$( )` wraps the repeating part, `,` is the separator, and `*` means zero or more. So it captures a comma-separated list of expressions, each bound to `$x`, which the expansion then stamps out one at a time."
  },
  {
    "q": "What is `#[derive(Debug, Clone, PartialEq)]` actually doing to your struct?",
    "choices": [
      "Running procedural macros at compile time that generate full `impl` blocks (for `{:?}`, `.clone()`, and `==`) from the struct definition",
      "Importing three traits from the standard library at runtime",
      "Marking the struct as one whose fields can never change",
      "Telling the compiler to skip type-checking those three traits"
    ],
    "answer": 0,
    "explain": "`derive` invokes procedural macros that read your struct and generate the corresponding trait `impl` blocks at compile time - `Debug` produces the `{:?}` formatting code, `Clone` the `.clone()` method, and `PartialEq` the `==` comparison. It's the everyday face of metaprogramming in Rust."
  }
]
```

---

[← Phase 15: Closures, Iterators & Zero-Cost Abstractions](15-closures-and-iterators.md) · [Guide overview](_guide.md) · [Phase 17: Performance, Unsafe & the Ecosystem →](17-performance-and-unsafe.md)
