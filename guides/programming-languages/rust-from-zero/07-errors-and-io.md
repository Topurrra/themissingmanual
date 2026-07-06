---
title: "Errors & I/O - Failure in the Type System"
guide: "rust-from-zero"
phase: 7
summary: "Rust puts failure and absence in the type itself: Result<T, E> for things that can fail and Option<T> for things that can be missing; you handle them with match or the ? operator, reserve panic! for truly unrecoverable bugs, and read files with std::fs."
tags: [rust, result, option, error-handling, question-mark-operator, panic, file-io]
difficulty: intermediate
synonyms: ["rust result vs option", "what is the question mark operator rust", "how to handle errors in rust", "rust read a file", "when to use unwrap rust", "rust panic vs result", "rust no exceptions how"]
updated: 2026-06-19
---
# Errors & I/O - Failure in the Type System

In a lot of languages, errors are a surprise. A function looks like it returns a number, and then one day it throws an exception you never saw coming, unwinding your program through five layers of code you forgot existed. The frightening part isn't that things fail - everything fails sometimes - it's that the failure was *invisible* until it happened.

Rust makes a different bet, and it's the heart of this phase: **failure and absence are written into the type.** If a function can fail, its return type says so, out loud, and the compiler won't let you ignore it. There are no hidden exceptions to ambush you - error handling stops being a chore bolted on at the end and becomes part of how you read code.

## The two types that change how you think

Almost all of Rust's error story is two enums from the standard library. Learn these two shapes and you've learned the mental model.

**`Option<T>` - "a `T`, or nothing."** Use it when a value might legitimately be absent. Exactly two cases:

- `Some(value)` - there's a value, here it is.
- `None` - there's nothing.

This is Rust's answer to `null`. Instead of every value secretly maybe being null (and blowing up when you forget to check), *only* `Option` values can be absent, and the type forces you to handle `None`. The billion-dollar mistake, designed out.

**`Result<T, E>` - "a `T` if it worked, or an error `E` if it didn't."** Use it when an operation can fail. Two cases:

- `Ok(value)` - success, here's the result.
- `Err(error)` - failure, here's what went wrong.

📝 **Terminology.** Both are *enums* - types that are exactly one of a fixed set of variants (enums proper come in [Phase 9](09-idioms-and-gotchas.md)). `<T>` and `<E>` are *generics*: placeholders for "whatever type this holds." `Option<String>` is "a String or nothing"; `Result<u64, std::io::Error>` is "a u64, or an I/O error."

💡 **Key point.** The whole philosophy in one line: **a function's type tells you how it can fail.** You never have to guess or read docs to find out - the return type already told you.

## Handling them with `match`

The most direct way to deal with an `Option` or `Result` is `match`, which forces you to handle *every* case - the compiler won't compile a `match` that forgets one. That exhaustiveness is the safety net.

```rust
fn main() {
    let text = "42";
    let parsed = text.parse::<i32>();   // parse returns Result<i32, _>

    match parsed {
        Ok(n) => println!("got the number {}", n),
        Err(e) => println!("couldn't parse: {}", e),
    }
}
```
```console
$ cargo run
got the number 42
```
*What just happened:* `parse` returns a `Result<i32, ...>`, not a plain `i32`, because the string might not be a number. `match` pulls the value out of whichever case happened: `Ok(n)` binds the parsed number to `n`; `Err(e)` binds the error to `e`. There's no way to use the number without acknowledging parsing could fail.

Change `"42"` to `"oops"` and you'd hit the `Err` arm with a message like `invalid digit found in string`. Same code, both paths handled.

## The `?` operator: handle-or-bubble-up, in one character

Writing a full `match` for every fallible call gets verbose fast, especially when you just want "if this failed, stop and pass the error up to my caller." That's so common Rust gives it a one-character shortcut: **`?`**.

Put `?` after a `Result` (or `Option`) and it means: *if `Ok`, unwrap the value and keep going; if `Err`, return that error from the current function right now.*

```rust
use std::fs;

fn read_config() -> Result<String, std::io::Error> {
    let contents = fs::read_to_string("config.toml")?;   // ? here
    Ok(contents)
}

fn main() {
    match read_config() {
        Ok(text) => println!("config is {} bytes", text.len()),
        Err(e) => println!("could not read config: {}", e),
    }
}
```
```console
$ cargo run
could not read config: The system cannot find the file specified. (os error 2)
```
*What just happened:* `fs::read_to_string` returns a `Result<String, std::io::Error>`. The `?` says "give me the `String` if it worked; otherwise return the `io::Error` from `read_config` immediately." Because the file didn't exist, the error bubbled straight up to `main`, where the `match` printed it. The happy path stays clean: `let contents = fs::read_to_string(...)?;` reads like ordinary code.

⚠️ **`?` needs a compatible return type.** You can only use `?` inside a function that itself returns a `Result` (or `Option`) the error can fit into, because `?`'s job is to *return early* with that error. Use it in a function returning a plain value and you'll get a compile error - that's why `read_config` returns `Result<String, ...>` and not just `String`.

## `panic!` vs. recoverable errors

So far everything has been *recoverable* - the caller gets a `Result` and decides what to do. Rust has a second, blunter mechanism for the other situation: **`panic!`**, for when the program has hit a state with no sane way to continue (a bug, a broken invariant, something that should be *impossible*).

A panic unwinds the current thread, prints a message, and (for a normal program) exits. It's not for "the file wasn't there" - that's expected and recoverable. It's for "I assumed this list had at least one element and it's empty, so my logic is wrong."

The mental split:

- **Recoverable** (caller can reasonably handle it): return a `Result` or `Option`. Missing file, bad input, network timeout.
- **Unrecoverable** (a bug, no sensible recovery): `panic!`. Broken invariant, "this can't happen," an index out of bounds.

## `.unwrap()` - the convenient little landmine

`Result` and `Option` both have an `.unwrap()` method: "give me the value inside, and if it's `Err`/`None`, just **panic**." It's the shortcut everyone learns on day one - genuinely useful, and genuinely dangerous in the wrong place.

```rust
fn main() {
    let f = std::fs::File::open("nope.txt").unwrap();
    println!("{:?}", f);
}
```
```console
$ cargo run
thread 'main' panicked at src/main.rs:2:45:
called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "The system cannot find the file specified." }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```
*What just happened:* The file didn't exist, so `File::open` returned `Err(...)`. `.unwrap()` looked inside, found an `Err`, and did the only thing it knows how: panic and crash the program. The message gives you the exact line and OS error - useful, but your program is *dead*. In a real service, that's an outage.

⚠️ **When `.unwrap()` is okay vs. not.** Be honest with yourself every time you type it:

- ✅ **Fine** in quick experiments, throwaway scripts, examples, and tests, where crashing on failure is exactly what you want and clutter would hurt clarity.
- ✅ **Fine** when failure is *truly* impossible and you can prove it (e.g. parsing a hard-coded constant string you wrote yourself). Even then, prefer `.expect("reason this can't fail")` so the panic message explains your assumption.
- ❌ **Not okay** in real application or library code on anything that can fail in production - file reads, network calls, user input, parsing data from elsewhere. There, every `.unwrap()` is a crash waiting for a bad day. Use `?` to bubble the error up, or `match` to handle it.

🪖 **War story.** A CLI tool shipped with `config.parse().unwrap()` on the user's config file. It worked flawlessly - until a user added a stray comma. Instead of "line 12: unexpected comma," they got a raw panic and a backtrace, and filed a bug saying the tool "randomly crashes." One `.unwrap()` swapped for a `match` turned a scary crash into a friendly message. The failure was always coming; `.unwrap()` just made it ugly.

## Reading a file, the everyday way

You've seen the pieces already; here's the complete, idiomatic shape for "read a file and do something with it," using `?` to keep it clean:

```rust
use std::fs;

fn main() -> Result<(), std::io::Error> {
    let contents = fs::read_to_string("notes.txt")?;
    let lines = contents.lines().count();
    println!("notes.txt has {} lines", lines);
    Ok(())
}
```
```console
$ cargo run
notes.txt has 7 lines
```
*What just happened:* Two details worth noticing. First, `main` returns `Result<(), std::io::Error>` - yes, `main` can return a `Result`, which is what lets us use `?` right inside it. Second, `Ok(())` is how a `Result`-returning function says "success, no meaningful value" - `()` is the empty "unit" type. If the file were missing, `?` would return the `Err` from `main`, exiting with that error printed and a non-zero status - no panic, just a clean failure.

## Recap

1. Failure lives in the type: **`Option<T>`** = "a value or nothing" (Rust's `null` replacement); **`Result<T, E>`** = "a value, or an error."
2. **`match`** forces you to handle every case - the compiler won't let you forget one.
3. **`?`** is the everyday tool: unwrap on `Ok`/`Some`, return-early on `Err`/`None`. It keeps the happy path readable and only works in a function whose return type can carry the error.
4. **`panic!`** is for unrecoverable bugs ("this can't happen"); **`Result`** is for expected, recoverable failures the caller can handle.
5. **`.unwrap()`** panics on failure - fine in tests and proven-impossible cases, a crash-in-waiting in real code. Prefer `?`, `match`, or at least `.expect("why")`.
6. Read files with **`std::fs::read_to_string`**; let `main` return a `Result` so you can use `?` end to end.

---

[← Phase 6: Ownership & Borrowing](06-ownership-and-borrowing.md) · [Phase 8: The Ecosystem & Tooling →](08-ecosystem-and-tooling.md)
