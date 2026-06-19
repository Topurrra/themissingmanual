---
title: "Install & Your First Program"
guide: "rust-from-zero"
phase: 1
summary: "Install the Rust toolchain with rustup, confirm rustc and cargo are there, then create and run your first program with cargo new and cargo run — the workflow you'll use every day."
tags: [rust, rustup, cargo, install, hello-world, toolchain]
difficulty: beginner
synonyms: ["how to install rust", "rustup explained", "first rust program", "cargo new vs rustc", "cargo run hello world", "rust getting started"]
updated: 2026-06-19
---

# Install & Your First Program

Let's get Rust onto your machine and run something real. The goal of this phase is small and concrete: by
the end you'll have the toolchain installed and a working program you ran yourself. We'll also clear up a
question that trips up newcomers right away — there seem to be *two* commands (`rustc` and `cargo`), and
it's not obvious which one you're supposed to use. The short version: you'll use `cargo` almost always,
and this phase shows you why.

## The mental model: a toolchain, managed by `rustup`

**What it actually is.** "Installing Rust" doesn't mean installing one program. It means installing a
*toolchain* — a bundle of tools that work together. The two you'll touch directly are:

- **`rustc`** — the actual *compiler*. It takes your `.rs` source code and turns it into a runnable program.
- **`cargo`** — Rust's *build tool and package manager*. It creates projects, downloads libraries, runs
  the compiler for you, runs your tests, and more. Think of `cargo` as the friendly front desk and `rustc`
  as the machinery in the back.

**Why there's a separate installer.** Rust releases a new stable version every six weeks, and you'll often
need different versions for different projects. So Rust is installed through a small manager called
**`rustup`**, whose whole job is to install and update the toolchain. You install `rustup` once; after
that, `rustup update` keeps everything current.

📝 **Terminology.** A **toolchain** is the set of tools for one Rust version (compiler, standard library,
`cargo`, and friends). **`rustup`** installs and switches between toolchains. **`cargo`** drives your
day-to-day work. **`rustc`** is the compiler underneath.

## Install with `rustup`

Go to [rustup.rs](https://rustup.rs) and follow the instructions there — it's the official installer, and
it gives you the exact command for your operating system.

- **macOS / Linux:** it gives you a one-line command to paste into your terminal. It downloads `rustup`,
  which then installs the stable toolchain.
- **Windows:** it gives you a small installer (`rustup-init.exe`) to download and run. On Windows, Rust
  also needs Microsoft's C++ build tools to link programs; the installer tells you if they're missing and
  points you to them.

Accept the default option when it asks ("1) Proceed with standard installation"). After it finishes, close
and reopen your terminal so it picks up the newly installed tools.

⚠️ **Gotcha.** If your terminal says `rustc: command not found` right after installing, you almost always
just need to **open a fresh terminal window** — the installer adds Rust to your `PATH`, but already-open
terminals don't know about it yet. (`PATH` is the list of places your shell looks for commands; see
[Programming From Zero](/guides/programming-from-zero) if that's a new idea.)

## Confirm it worked

Two quick commands tell you the toolchain is healthy:

```console
$ rustc --version
rustc 1.95.0 (59807616e 2026-04-14)

$ cargo --version
cargo 1.95.0 (f2d3ce0bd 2026-03-21)
```
*What just happened:* Each tool printed its version and build date, which means it's installed and on your
`PATH`. Your numbers will be higher than these — Rust moves fast, and that's fine. The point is
that both commands answer instead of erroring.

## Create your first project with `cargo new`

Now the fun part. Instead of writing a file by hand, let `cargo` scaffold a complete little project:

```console
$ cargo new hello
    Creating binary (application) `hello` package
note: see more `Cargo.toml` keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html
```
*What just happened:* `cargo new hello` created a new folder called `hello` containing everything a Rust
program needs to build and run — source code, a config file, and even a fresh Git repository. "Binary
(application)" means it made a runnable program (as opposed to a library, which is code other programs use).
You didn't have to know any of the layout up front; `cargo` set it up correctly for you.

Step inside and look at what it made:

```console
$ cd hello
$ ls
Cargo.toml  src
```
*What just happened:* There are two things. `Cargo.toml` is the project's **manifest** — a small config
file naming your project and listing the libraries it depends on. `src` is the folder where your code
lives. Open `src/main.rs` and you'll find a complete program already written for you:

```rust
fn main() {
    println!("Hello, world!");
}
```
*What just happened:* This is the smallest real Rust program. `fn main()` defines a function named `main`,
which is the special starting point — when your program runs, execution begins here. `println!` prints a
line of text. (The `!` means `println!` is a *macro*, not a normal function; you don't need to worry about
the distinction yet — for now, read it as "print this line.") We'll unpack functions properly in
[Phase 4](04-control-flow-and-functions.md).

## Run it with `cargo run`

```console
$ cargo run
   Compiling hello v0.1.0 (/home/ada/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.22s
     Running `target/debug/hello`
Hello, world!
```
*What just happened:* One command did three jobs. `cargo run` **compiled** your code (the `Compiling` and
`Finished` lines), then **ran** the resulting program (the `Running` line), and the program printed
`Hello, world!`. The compiled program landed in a `target/` folder that `cargo` manages for you — you
never edit anything in there.

💡 **Key point.** `cargo run` is the command you'll type constantly. It always does the same thing: build,
then run. There's also `cargo build` (build but don't run) and `cargo check` (just check that it compiles,
without producing a program — the fastest way to see if your code is valid).

## Cargo is the workflow — not raw `rustc`

You *could* compile that file directly with `rustc src/main.rs` and then run the program it produces. For
one file with no dependencies, that even works. But the moment your project has more than one file, or
needs a library from the internet, raw `rustc` becomes a chore — you'd be managing build commands and
downloads by hand.

`cargo` exists precisely so you don't. It knows your project layout, fetches and version-locks your
dependencies, compiles everything in the right order, runs your tests, and more — all from short commands.
So in real life: **you talk to `cargo`, and `cargo` talks to `rustc`.** Every later phase in this guide
uses `cargo`.

⚠️ **Gotcha — the first compile feels slow.** The very first `cargo run` (and the first run after adding a
new dependency) can take noticeably longer than you'd expect, because Rust compiles a lot up front to do
its safety checks and produce fast code. This is normal, not a hang. After that first build, `cargo`
caches the work and re-runs are quick — `cargo check` especially is near-instant. Don't let the first slow
build scare you off; it's the price of the speed and safety you get at runtime.

## Recap

1. **`rustup`** installs and updates the Rust toolchain; you install it once from
   [rustup.rs](https://rustup.rs).
2. **`rustc`** is the compiler; **`cargo`** is the build tool and package manager you actually drive.
3. **`cargo new <name>`** scaffolds a complete project (`Cargo.toml` + `src/main.rs`).
4. **`cargo run`** compiles and runs in one step; `cargo check` just checks it compiles (fastest).
5. **Use `cargo`, not raw `rustc`** — it scales to real projects with dependencies and tests.
6. The **first compile is slow**; that's expected, and re-builds are fast.

You have a working toolchain and a program you ran yourself. Next, let's fill that `main` function with
real content: values, the types they come in, and Rust's surprising default — that things can't change
unless you say so.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
