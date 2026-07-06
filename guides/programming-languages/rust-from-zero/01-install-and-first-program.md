---
title: "Install & Your First Program"
guide: "rust-from-zero"
phase: 1
summary: "Install the Rust toolchain with rustup, confirm rustc and cargo are there, then create and run your first program with cargo new and cargo run - the workflow you'll use every day."
tags: [rust, rustup, cargo, install, hello-world, toolchain]
difficulty: beginner
synonyms: ["how to install rust", "rustup explained", "first rust program", "cargo new vs rustc", "cargo run hello world", "rust getting started"]
updated: 2026-06-19
---

# Install & Your First Program

Let's get Rust onto your machine and run something real. By the end you'll have the toolchain installed
and a working program you ran yourself. We'll also clear up a question that trips up newcomers right away:
there seem to be *two* commands, `rustc` and `cargo`, and it's not obvious which to use. Short version:
`cargo` almost always - this phase shows you why.

## The mental model: a toolchain, managed by `rustup`

**What it actually is.** "Installing Rust" doesn't mean installing one program - it means installing a
*toolchain*, a bundle of tools that work together. The two you'll touch directly are:

- **`rustc`** - the actual *compiler*. Turns your `.rs` source code into a runnable program.
- **`cargo`** - Rust's *build tool and package manager*. Creates projects, downloads libraries, runs the
  compiler for you, runs your tests, and more. Think of `cargo` as the front desk and `rustc` as the
  machinery in back.

**Why there's a separate installer.** Rust releases a new stable version every six weeks, and different
projects often need different versions. So Rust installs through a small manager, **`rustup`**, whose
whole job is installing and updating the toolchain. Install it once; `rustup update` keeps things current.

📝 **Terminology.** A **toolchain** is the set of tools for one Rust version (compiler, standard library,
`cargo`, and friends). **`rustup`** installs and switches between toolchains. **`cargo`** drives your
day-to-day work. **`rustc`** is the compiler underneath.

## Install with `rustup`

Go to [rustup.rs](https://rustup.rs) and follow the instructions there - the official installer gives you
the exact command for your OS.

- **macOS / Linux:** a one-line command to paste into your terminal. It downloads `rustup`, which then
  installs the stable toolchain.
- **Windows:** a small installer (`rustup-init.exe`) to download and run. Windows also needs Microsoft's
  C++ build tools to link programs; the installer tells you if they're missing and points you to them.

Accept the default option when it asks ("1) Proceed with standard installation"), then close and reopen
your terminal so it picks up the newly installed tools.

⚠️ **Gotcha.** If your terminal says `rustc: command not found` right after installing, just **open a
fresh terminal window** - the installer adds Rust to your `PATH`, but already-open terminals don't know
about it yet. (`PATH` is the list of places your shell looks for commands; see
[Programming From Zero](/guides/programming-from-zero) if that's a new idea.)

## Confirm it worked

Two quick commands tell you the toolchain is healthy:

```console
$ rustc --version
rustc 1.95.0 (59807616e 2026-04-14)

$ cargo --version
cargo 1.95.0 (f2d3ce0bd 2026-03-21)
```
*What just happened:* Each tool printed its version, meaning it's installed and on your `PATH`. Your
numbers will be higher - Rust moves fast - but what matters is both commands answer instead of erroring.

## Create your first project with `cargo new`

Now the fun part: instead of writing a file by hand, let `cargo` scaffold a complete little project.

```console
$ cargo new hello
    Creating binary (application) `hello` package
note: see more `Cargo.toml` keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html
```
*What just happened:* `cargo new hello` created a folder called `hello` containing everything a Rust
program needs to build and run - source code, a config file, and a fresh Git repository. "Binary
(application)" means a runnable program (versus a library, which other programs use). `cargo` set up the
layout correctly without you needing to know it up front.

Step inside and look at what it made:

```console
$ cd hello
$ ls
Cargo.toml  src
```
*What just happened:* `Cargo.toml` is the project's **manifest** - a small config file naming your project
and listing the libraries it depends on. `src` is the folder where your code lives. Open `src/main.rs` and
you'll find a complete program already written for you:

```rust
fn main() {
    println!("Hello, world!");
}
```
*What just happened:* This is the smallest real Rust program. `fn main()` defines the special starting
point where execution begins. `println!` prints a line of text. (The `!` means it's a *macro*, not a
normal function - read it as "print this line" for now.) Functions get unpacked properly in
[Phase 4](04-control-flow-and-functions.md).

## Run it with `cargo run`

```console
$ cargo run
   Compiling hello v0.1.0 (/home/ada/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.22s
     Running `target/debug/hello`
Hello, world!
```
*What just happened:* One command did three jobs: `cargo run` **compiled** your code (`Compiling` and
`Finished`), **ran** the resulting program (`Running`), and printed `Hello, world!`. The compiled program
landed in a `target/` folder that `cargo` manages - never edit anything there.

💡 **Key point.** `cargo run` is the command you'll type constantly: build, then run, always. There's also
`cargo build` (build but don't run) and `cargo check` (just check it compiles, without producing a
program - the fastest way to see if your code is valid).

## Cargo is the workflow - not raw `rustc`

You *could* compile that file directly with `rustc src/main.rs` and run the program it produces - fine for
one file with no dependencies. But once your project has more than one file, or needs a library from the
internet, raw `rustc` becomes a chore of managing build commands and downloads by hand.

`cargo` exists so you don't: it knows your project layout, fetches and version-locks dependencies, compiles
everything in order, runs your tests, and more - all from short commands. **You talk to `cargo`, and
`cargo` talks to `rustc`.** Every later phase uses `cargo`.

⚠️ **Gotcha - the first compile feels slow.** The first `cargo run` (and the first run after adding a
dependency) takes noticeably longer than you'd expect, because Rust compiles a lot up front for its safety
checks and fast code. That's normal, not a hang - `cargo` caches the work afterward, so re-runs are quick
and `cargo check` is near-instant. It's the price of the speed and safety you get at runtime.

## Recap

1. **`rustup`** installs and updates the Rust toolchain; you install it once from
   [rustup.rs](https://rustup.rs).
2. **`rustc`** is the compiler; **`cargo`** is the build tool and package manager you actually drive.
3. **`cargo new <name>`** scaffolds a complete project (`Cargo.toml` + `src/main.rs`).
4. **`cargo run`** compiles and runs in one step; `cargo check` just checks it compiles (fastest).
5. **Use `cargo`, not raw `rustc`** - it scales to real projects with dependencies and tests.
6. The **first compile is slow**; that's expected, and re-builds are fast.

You have a working toolchain and a program you ran yourself. Next: fill `main` with real content - values,
their types, and Rust's default that things can't change unless you say so.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
