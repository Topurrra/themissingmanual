---
title: "Error Handling, Deep - Result, ?, and Custom Errors"
guide: "rust-from-zero"
phase: 13
summary: "Go past the basics: what ? really does, how the From trait makes errors flow through one operator, hand-rolled error enums, and the thiserror/anyhow split that real Rust projects rely on."
tags: [rust, error-handling, result, option, question-mark-operator, custom-errors, thiserror, anyhow, from-trait]
difficulty: intermediate
synonyms: ["rust error handling best practices", "rust question mark operator", "rust custom error type", "rust thiserror anyhow", "rust result option combinators", "rust From trait error conversion", "rust panic vs result"]
updated: 2026-06-22
---
# Error Handling, Deep - Result, ?, and Custom Errors

Back in [Phase 7](07-errors-and-io.md) you met the two enums that carry failure in Rust - `Result<T, E>` and `Option<T>` - learned to crack them open with `match`, and reached for `?` to bubble errors up without ceremony. That was enough to read a file and survive. But the moment your program grows past a single function, a real question shows up: *one function calls `parse`, which fails with a `ParseIntError`; another reads a file, which fails with an `io::Error`. They're different error types. How does a single `?` deal with both?*

The answer is more elegant than you'd guess, and it's the spine of this whole phase. We're going to look under `?` and find out it has a hidden job - converting errors - then use that to design error types of your own, and finally meet the two crates (`thiserror` and `anyhow`) that nearly every Rust project in the wild reaches for. By the end, errors will stop being a thing you patch around and become something you *design*.

## What `?` really does

You know the surface behavior: `?` on an `Ok` hands you the value and keeps going; `?` on an `Err` returns early. But there's a third move hiding in there.

📝 **The `?` operator, precisely.** When you write `expr?`:
- If `expr` is `Ok(v)` (or `Some(v)`), the whole expression evaluates to `v` and execution continues.
- If `expr` is `Err(e)` (or `None`), `?` **returns from the current function** - but first, for `Result`, it runs the error through `From::from(e)`, converting it into your function's declared error type.

That last clause is the part Phase 7 didn't tell you. `?` is not "return the error." It's "convert the error to my return type's error, *then* return it."

```rust
use std::num::ParseIntError;

fn double_the_input(s: &str) -> Result<i32, ParseIntError> {
    let n = s.parse::<i32>()?;   // parse returns Result<i32, ParseIntError>
    Ok(n * 2)
}

fn main() {
    println!("{:?}", double_the_input("21"));
    println!("{:?}", double_the_input("oops"));
}
```
```console
$ cargo run
Ok(42)
Err(ParseIntError { kind: InvalidDigit })
```
*What just happened:* `s.parse::<i32>()` returns a `Result<i32, ParseIntError>`. On `"21"` the `?` unwrapped `Ok(21)` to `21`, and we doubled it. On `"oops"` the `?` saw `Err(...)` and returned that error straight out of `double_the_input`. Here the error type going *in* (`ParseIntError`) already matches the type coming *out*, so the conversion step did nothing visible. The interesting case is when they *don't* match - which is exactly where `From` earns its keep.

💡 **Key point.** `?` works in any function whose return type is a `Result` (or, separately, an `Option`) - not only in `main`. It's purely a control-flow plus conversion shortcut; there's no magic tied to where you use it. If the function can't carry the error out, the compiler stops you, because `?`'s entire purpose is to *return* that error.

## The `From` trait: how one `?` swallows many error types

Here's the problem `From` solves. Imagine a function that both reads a file *and* parses a number from it. The read can fail with `std::io::Error`; the parse can fail with `ParseIntError`. Two different error types, one function. What error type does the function return?

The Rust answer: define *your own* error type, then teach Rust how to convert each underlying error into it. "Teach Rust how to convert" means implementing the `From` trait - the same trait you met in passing as the engine behind `.into()` and type conversions. Once `From<io::Error>` and `From<ParseIntError>` both exist for your error type, `?` can convert *either* one automatically, and a single error type flows out.

```rust
use std::num::ParseIntError;

#[derive(Debug)]
enum ConfigError {
    Io(std::io::Error),
    Parse(ParseIntError),
}

// Teach `?` how to turn an io::Error into a ConfigError.
impl From<std::io::Error> for ConfigError {
    fn from(e: std::io::Error) -> Self {
        ConfigError::Io(e)
    }
}

// And how to turn a ParseIntError into a ConfigError.
impl From<ParseIntError> for ConfigError {
    fn from(e: ParseIntError) -> Self {
        ConfigError::Parse(e)
    }
}

fn read_port() -> Result<u16, ConfigError> {
    let text = std::fs::read_to_string("port.txt")?;   // io::Error -> ConfigError
    let port = text.trim().parse::<u16>()?;            // ParseIntError -> ConfigError
    Ok(port)
}

fn main() {
    match read_port() {
        Ok(p) => println!("port is {}", p),
        Err(e) => println!("config error: {:?}", e),
    }
}
```
```console
$ cargo run
config error: Io(Os { code: 2, kind: NotFound, message: "The system cannot find the file specified." })
```
*What just happened:* Two `?` operators, two *different* underlying error types, and yet `read_port` declares a single error type: `ConfigError`. The first `?` hit a missing file, so it called `ConfigError::from(io_error)` - which we implemented to wrap it in the `Io` variant - and returned that. Had the file existed but contained `"not-a-number"`, the second `?` would have called `ConfigError::from(parse_error)` and returned the `Parse` variant instead. The conversion is invisible at the call site; it's the `From` impls doing the quiet work.

💡 **This is the glue.** Every time you use `?` against a foreign error type and it "just fits," there's a `From` impl making it fit - either one the standard library wrote, or one you wrote. `From` is the trait that lets `?` stay a single character while juggling a whole zoo of error types underneath. Internalize this and a huge amount of Rust error-handling code stops looking like magic.

## Custom error enums done right

The enum above worked, but printing it with `{:?}` gave us a developer-facing debug dump, not a sentence a human wants to read. A *proper* domain error does three things: it enumerates the failure modes as variants, it implements `Display` so it prints a clean message, and it implements the standard `Error` trait so it slots into the rest of the ecosystem (logging, `Box<dyn Error>`, other people's `?`).

```rust
use std::fmt;

#[derive(Debug)]
enum AppError {
    NotFound,
    Invalid(String),
    Io(std::io::Error),
}

// Display = the human-readable message.
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::NotFound => write!(f, "the requested item was not found"),
            AppError::Invalid(what) => write!(f, "invalid input: {}", what),
            AppError::Io(e) => write!(f, "I/O failure: {}", e),
        }
    }
}

// Opting into the standard Error trait makes this a "real" error type.
impl std::error::Error for AppError {}

fn load(id: i32) -> Result<String, AppError> {
    match id {
        0 => Err(AppError::NotFound),
        n if n < 0 => Err(AppError::Invalid(format!("id {} is negative", n))),
        n => Ok(format!("item #{}", n)),
    }
}

fn main() {
    for id in [-1, 0, 7] {
        match load(id) {
            Ok(item) => println!("loaded {}", item),
            Err(e) => println!("error: {}", e),   // uses Display, not Debug
        }
    }
}
```
```console
$ cargo run
error: invalid input: id -1 is negative
error: the requested item was not found
loaded item #7
```
*What just happened:* `AppError` is an enum with one variant per way the operation can go wrong - and notice `Invalid` and `Io` carry data (the offending input, the underlying I/O error), exactly the "make illegal states unrepresentable" idea from [Phase 9](09-idioms-and-gotchas.md). The `Display` impl turns each variant into a sentence, so printing with `{}` reads like English instead of a struct dump. Implementing `std::error::Error` is the formal handshake that says "this is an error type" - it's what lets `AppError` be returned as `Box<dyn Error>`, logged by libraries, or wrapped by other errors. Callers can still `match` on the variants when they need to react differently to `NotFound` versus `Invalid`.

⚠️ **The boilerplate adds up fast.** That's a lot of hand-written code for one error type: a `Display` arm per variant, the `Error` impl, and - if you want `?` to convert into it - a `From` impl per source error too. Get a few error types in a project and you're writing the same shapes over and over, and every new variant means editing the `Display` match by hand. This pain is exactly why the next section exists.

## `thiserror` and `anyhow`: the two crates everyone reaches for

Almost no real Rust project hand-writes `Display` and `From` impls the way we just did. Two small crates eliminate the boilerplate, and they split along a clear line.

📝 **The rule of thumb.** Use **`thiserror`** when you're writing a **library** (or any code where callers need to *match on specific error variants*) - it derives the clean enum for you. Use **`anyhow`** when you're writing an **application** (a binary, a CLI, a service) that mostly wants to say "something failed, here's some context, propagate it" without defining a bespoke type for every failure.

### `thiserror` - derive the enum, skip the boilerplate

`thiserror` is a derive macro. You write the enum and annotate it; the macro generates the `Display` impl (from your `#[error("...")]` strings) and the `From` impls (from `#[from]`) that we wrote by hand above.

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum AppError {
    #[error("the requested item was not found")]
    NotFound,

    #[error("invalid input: {0}")]
    Invalid(String),

    #[error("I/O failure: {0}")]
    Io(#[from] std::io::Error),   // #[from] also generates From<io::Error>
}

fn load_file(path: &str) -> Result<String, AppError> {
    let text = std::fs::read_to_string(path)?;   // io::Error -> AppError, for free
    if text.is_empty() {
        return Err(AppError::Invalid("file was empty".into()));
    }
    Ok(text)
}

fn main() {
    match load_file("missing.txt") {
        Ok(t) => println!("read {} bytes", t.len()),
        Err(e) => println!("error: {}", e),
    }
}
```
```console
$ cargo run
error: I/O failure: The system cannot find the file specified. (os error 2)
```
*What just happened:* This is the *same* `AppError` as the previous section - same variants, same behavior - but every line of `Display` and `From` boilerplate is gone. The `#[error("...")]` attributes became the `Display` impl (`{0}` interpolates the variant's first field). The `#[from]` on the `Io` variant generated `impl From<std::io::Error> for AppError`, which is why the `?` in `load_file` silently converts the I/O error. You still get a precise, matchable enum that callers can react to variant by variant - `thiserror` just wrote the tedious parts. That's why it's the default for libraries.

### `anyhow` - one error type, easy context

Application code often doesn't care *which* of fifteen error types occurred - it cares that something failed, wants a breadcrumb of context, and wants to print it and move on. `anyhow` gives you a single catch-all error type (`anyhow::Error`) that any standard error converts into automatically, plus a `.context()` method to attach a human note as the error travels up.

```rust
use anyhow::{Context, Result};   // anyhow::Result<T> == Result<T, anyhow::Error>

fn load_settings(path: &str) -> Result<u16> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("reading settings from {}", path))?;
    let port: u16 = text
        .trim()
        .parse()
        .context("settings file must contain a port number")?;
    Ok(port)
}

fn main() -> Result<()> {
    let port = load_settings("settings.txt")?;
    println!("listening on {}", port);
    Ok(())
}
```
```console
$ cargo run
Error: reading settings from settings.txt

Caused by:
    The system cannot find the file specified. (os error 2)
```
*What just happened:* `load_settings` never defines an error type at all - `anyhow::Result<u16>` means "a `u16`, or *any* error." The `?` operators accept the `io::Error` and the `ParseIntError` directly, because `anyhow::Error` absorbs anything that implements the standard `Error` trait (no `From` impls to write). The `.with_context(...)` / `.context(...)` calls attach a readable note, and `anyhow` stitches them into that "Error / Caused by" chain you see in the output - so you get the high-level intent *and* the root cause. This is the ergonomic sweet spot for binaries: maximum signal, near-zero ceremony.

💡 **In practice they pair up.** A common real-world setup: your library crates expose `thiserror` enums (so consumers can match precisely), and your top-level application crate uses `anyhow` to collect all of them, add context, and report. `thiserror` for the people who *handle* your errors; `anyhow` for the program that just needs to *surface* them.

## `Option` combinators, and when a panic is actually fine

Two loose ends from Phase 7's basics, both about choosing the *lightest correct tool*.

First, combinators. You met `Result`/`Option` combinators briefly in [Phase 9](09-idioms-and-gotchas.md); they shine just as much for avoiding "match towers" on `Option`. Instead of nesting `match` after `match` to transform a maybe-value, chain the transformation:

```rust
fn main() {
    let raw = vec!["10", "x", "30"];

    // For each string: parse it (-> Result), turn failure into None, keep going.
    let total: i32 = raw
        .iter()
        .map(|s| s.parse::<i32>().ok())   // Result -> Option
        .map(|opt| opt.unwrap_or(0))      // None -> 0, Some(n) -> n
        .sum();

    // .ok_or turns an Option into a Result with an error of your choosing:
    let first: Result<&&str, &str> = raw.first().ok_or("the list was empty");

    println!("total = {}", total);
    println!("first = {:?}", first);
}
```
```console
$ cargo run
total = 40
first = Ok("10")
```
*What just happened:* No `match` in sight. `.ok()` converts each `Result` into an `Option` (dropping the error), `.unwrap_or(0)` substitutes a default for the `None`s, and `.sum()` adds what's left - so the un-parseable `"x"` quietly became `0` and the total is `40`. Separately, `.ok_or(...)` does the reverse direction: it turns an `Option` into a `Result`, letting you *upgrade* an absence into a real error with a message. The combinators worth knowing: `.map` (transform the value), `.and_then` (chain another fallible step), `.ok_or` (`Option` → `Result`), and `.unwrap_or` / `.unwrap_or_else` (supply a fallback). Reach for these for the simple cases; save `match` for when each branch genuinely does something different.

Second, the panic question. Phase 7 said `.unwrap()` is a landmine in production - true. But "never panic" is the wrong lesson. Panicking is the *right* call in specific places:

⚠️ **When `panic!` / `.unwrap()` / `.expect()` are acceptable.**
- ✅ **Tests.** A failed assumption *should* crash the test - that's the test failing. `.unwrap()` everywhere in test code is idiomatic, not sloppy.
- ✅ **Prototypes and throwaway scripts**, where adding error plumbing would obscure the idea you're sketching.
- ✅ **Truly impossible cases you can prove** - e.g. `"42".parse::<i32>().unwrap()` on a literal you wrote yourself. Even then, prefer `.expect("hard-coded constant, cannot fail")` so the message documents *why* it's safe.
- ✅ **Broken invariants** - a state that means your own logic is wrong (an empty list you guaranteed wouldn't be). A panic here is a loud bug report, which is what you want.
- ❌ **Everything else** - anything that can fail because of the *outside world* (files, network, user input, parsed data) is an *expected* failure. Return a `Result` and let the caller decide. That's not pessimism; it's matching the tool to the kind of failure.

The dividing line is simple: **`Result` for failures you expect, `panic!` for bugs you don't.** A missing config file is expected - return a `Result`. A counter going negative when you proved it can't - that's a bug, panic and find out.

## Recap

1. **`?` does three things, not two:** unwrap on `Ok`/`Some`, return-early on `Err`/`None`, and - for `Result` - convert the error via `From` on the way out. It works in any function whose return type can carry the error.
2. **The `From` trait is the glue.** Implementing `From<SourceError>` for your error type is what lets a single `?` absorb many different underlying error types and funnel them into one.
3. **A proper custom error** is an enum (one variant per failure mode, carrying relevant data) that implements `Display` for a human message and `std::error::Error` to join the ecosystem.
4. **`thiserror` derives all that boilerplate** for libraries (`#[error("...")]` for `Display`, `#[from]` for `From`), giving callers a clean, matchable enum.
5. **`anyhow` is the application default:** one catch-all `anyhow::Error`, automatic conversion from any standard error, and `.context(...)` to attach breadcrumbs. Rule of thumb - `thiserror` for libraries, `anyhow` for apps.
6. **Combinators (`.map`, `.and_then`, `.ok_or`, `.unwrap_or`) beat match towers** for simple transforms; and **`panic!`/`.unwrap()` are fine in tests, prototypes, and proven-impossible cases** - but expected, outside-world failures belong in a `Result`.

## Quick check

Test yourself on the idea that ties this phase together - the hidden conversion inside `?` - and the crate split:

```quiz
[
  {
    "q": "Beyond unwrapping `Ok` and returning early on `Err`, what extra thing does `?` do to the error before returning it?",
    "choices": [
      "Converts it into the function's declared error type via the `From` trait",
      "Logs it to standard error automatically",
      "Wraps it in a `panic!` so the program crashes",
      "Discards the error and substitutes a default value"
    ],
    "answer": 0,
    "explain": "On an `Err`, `?` calls `From::from` on the error to convert it into the current function's error type, then returns it. That conversion is what lets one `?` handle many different underlying error types - as long as a `From` impl exists for each."
  },
  {
    "q": "You're writing a reusable library and want callers to be able to `match` on specific failure variants. Which approach fits best?",
    "choices": [
      "A `thiserror`-derived error enum",
      "`anyhow::Error` everywhere, since it absorbs any error",
      "Return `String` error messages so callers can read them",
      "`.unwrap()` on everything and let the caller catch the panic"
    ],
    "answer": 0,
    "explain": "Libraries should expose a concrete, matchable error type so consumers can react to specific cases. `thiserror` derives the `Display` and `From` boilerplate for such an enum. `anyhow`'s catch-all type is meant for applications, where callers usually just surface the error rather than match on it."
  },
  {
    "q": "Which situation is the *right* place to use `.unwrap()`?",
    "choices": [
      "Parsing a hard-coded literal you wrote yourself, where failure is provably impossible",
      "Reading a config file that a user supplies",
      "Making a network request that could time out",
      "Parsing input typed by the user at runtime"
    ],
    "answer": 0,
    "explain": "`.unwrap()` (ideally `.expect(\"why\")`) is fine when failure is genuinely impossible, such as parsing a constant you control - also in tests and throwaway scripts. The other three involve the outside world (files, network, user input), where failure is expected and should be returned as a `Result` for the caller to handle."
  }
]
```

---

[← Phase 12: Smart Pointers & Interior Mutability](12-smart-pointers.md) · [Guide overview](_guide.md) · [Phase 14: Fearless Concurrency →](14-fearless-concurrency.md)
