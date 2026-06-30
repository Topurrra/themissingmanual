---
title: "Syntax, Values & Types"
guide: "rust-from-zero"
phase: 2
summary: "let binds values and they're immutable by default (mut makes them changeable); Rust is statically typed but infers most types; meet i32, f64, bool, char, &str and String, plus shadowing."
tags: [rust, let, mut, types, immutability, shadowing, inference]
difficulty: beginner
synonyms: ["rust let vs mut", "rust immutable by default", "rust basic types", "rust i32 f64 bool char", "rust type inference", "rust shadowing explained", "rust integer overflow panic"]
updated: 2026-06-19
---

# Syntax, Values & Types

Now we give `main` something to work with: named values. This phase is where Rust's personality starts to
show. Two things will surprise you if you're coming from almost any other language: values **can't change
by default**, and the compiler **knows the exact type of everything** even when you don't write the types
down. Neither is there to annoy you - both exist to catch bugs early. Let's see them in action.

## `let` binds a value - and it's immutable by default

**What it actually is.** `let` creates a named value (a *variable*). The surprise: in Rust, a value you
bind with `let` **cannot be changed afterward**. It's read-only unless you opt out.

```rust
fn main() {
    let x = 5;
    println!("{x}");
}
```
*What just happened:* `let x = 5;` bound the name `x` to the value `5`, and `println!("{x}")` printed it.
The `{x}` inside the string is a placeholder that gets filled with the value of `x` - Rust prints `5`.

Now watch what happens if you try to change `x`:

```rust
fn main() {
    let x = 5;
    x = 6;
    println!("{x}");
}
```
```console
$ cargo run
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:3:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
3 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut x = 5;
  |         +++
```
*What just happened:* The compiler **refused to build the program.** It saw you bind `x` to `5`, then try
to overwrite it with `6`, and stopped you - because `let` values are immutable. Notice how good the error
is: it points at both lines, explains the problem in plain English, and even shows the exact fix
(`let mut x`). Rust's errors are some of the best in any language; read them, don't fear them.

## `mut` - opt in to changing a value

If you *want* a value to change, say so with `mut` ("mutable"):

```rust
fn main() {
    let mut x = 5;
    x = 6;
    println!("{x}");
}
```
```console
$ cargo run
6
```
*What just happened:* Adding `mut` told Rust "this one is allowed to change," so reassigning `x` to `6` is
fine now, and it printed `6`.

💡 **Key point.** Immutable-by-default flips the habit you have from other languages. There, everything can
change and you mark the rare constant. In Rust, *nothing* changes unless you write `mut`. The payoff: when
you read `let total = ...` with no `mut`, you know for certain `total` is never modified later - you don't
have to scan the rest of the function to be sure. That guarantee removes a whole category of "wait, where
did this value get changed?" bugs.

⚠️ **Gotcha for newcomers.** The first dozen times, you'll write `let count = 0;`, then try to do
`count += 1;` in a loop, and the compiler will stop you. That's not a bug in your logic - you just forgot
`mut`. The fix is always the same: change it to `let mut count = 0;`. After a week this becomes automatic.

## Static types, with inference

**What it actually is.** Rust is **statically typed**: every value has a fixed type known at compile time
(a whole number, a decimal, text, a true/false, …), and you can't accidentally mix them. But - and this is
why the examples above had no types written on them - Rust has **type inference**: the compiler figures out
the type from how you use the value, so you usually don't have to spell it out.

```rust
fn main() {
    let count = 10;       // Rust infers: i32 (a 32-bit integer)
    let price = 4.99;     // Rust infers: f64 (a 64-bit decimal)
    let active = true;    // Rust infers: bool
    println!("{count} {price} {active}");
}
```
```console
$ cargo run
10 4.99 true
```
*What just happened:* You wrote no types, but each value still *has* one - Rust deduced `count` is an
integer, `price` a decimal, and `active` a boolean from their values. You get the safety of static types
with much of the brevity of a dynamic language.

When you *do* want to be explicit (or when the compiler can't tell), you annotate with a colon:

```rust
let count: i64 = 10;
```
*What just happened:* The `: i64` says "treat this as a 64-bit integer." You'll write annotations on
function arguments (always required there) and occasionally to pick a specific type; most local `let`s
need none.

## The basic types you'll meet first

📝 **Terminology.** A **type** is the kind of thing a value is - what it can hold and what you can do with
it. These are the ones you'll use constantly:

| Type | What it is | Example |
|---|---|---|
| `i32` | A signed integer (whole number, +/−). The default integer. | `let n: i32 = -7;` |
| `u32` | An *unsigned* integer (whole number, 0 and up - no negatives). | `let age: u32 = 30;` |
| `f64` | A 64-bit floating-point number (a decimal). The default float. | `let pi: f64 = 3.14159;` |
| `bool` | A boolean - `true` or `false`. | `let ready: bool = true;` |
| `char` | A single character, in **single** quotes. | `let letter: char = 'R';` |
| `&str` | A string slice - borrowed, read-only text. Literals like `"Ada"` are `&str`. | `let name = "Ada";` |
| `String` | An owned, growable string you can build and modify. | `let mut s = String::new();` |

```rust
fn main() {
    let pi: f64 = 3.14159;
    let ready: bool = true;
    let letter: char = 'R';
    let name = "Ada";
    println!("{pi} {ready} {letter} {name}");
}
```
```console
$ cargo run
3.14159 true R Ada
```
*What just happened:* Four different types, each printed with the `{}` placeholder. Note `'R'` uses single
quotes (it's one `char`) while `"Ada"` uses double quotes (it's text, a `&str`).

> ⏭️ The `&str`-vs-`String` distinction confuses *everybody* at first, and it deserves real space. We give
> it that in [Phase 3: Collections](03-collections.md). For now, just know they're two different ways of
> holding text.

## Shadowing - reuse a name with a new value (or type)

Rust lets you write `let` *again* with the same name. This isn't mutation - it creates a brand-new value
that happens to reuse the name. It's called **shadowing**, and it's genuinely useful:

```rust
fn main() {
    let spaces = "   ";        // spaces is text (&str)
    let spaces = spaces.len(); // now spaces is a number (how many characters)
    println!("{spaces}");
}
```
```console
$ cargo run
3
```
*What just happened:* The second `let spaces` made a *new* `spaces` - and it's even a different type
(a number instead of text). The old one is shadowed (hidden) from that point on. This is handy when you
want to transform a value through a couple of steps and keep one clear name, instead of inventing
`spaces_str`, `spaces_count`, and so on.

⚠️ **Don't confuse shadowing with `mut`.** `mut` changes the *same* value in place (and the type must stay
the same). Shadowing makes a *new* value with `let` (and the type can change). Reassigning without `mut`
(`spaces = ...`) is the error you saw earlier; re-binding with `let` (`let spaces = ...`) is shadowing and
is allowed.

## The integer-overflow gotcha

Here's one that catches people, and it's worth meeting now. Integers have a fixed size, so they have a
maximum. A `u8` (8-bit unsigned integer) can hold `0` through `255` - and nothing larger. What happens if
you push past it?

```rust
fn main() {
    let mut x: u8 = 250;
    for _ in 0..10 {
        x += 1;
        println!("{x}");
    }
}
```
```console
$ cargo run
251
252
253
254
255

thread 'main' panicked at src/main.rs:4:9:
attempt to add with overflow
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```
*What just happened:* `x` climbed to `255` (the max for a `u8`), and the next `+= 1` had nowhere to go - so
the program **panicked**: it stopped immediately with the message `attempt to add with overflow`. A
**panic** is Rust's "I hit an unrecoverable problem, stopping now" - the program exits rather than
continuing with a wrong value.

📝 **Terminology.** A **panic** is a controlled crash: Rust detected something it refuses to continue past
(here, an arithmetic overflow) and halts with a message and a line number instead of silently producing
garbage.

⚠️ **The subtle part: this only panics in debug builds.** When you `cargo run` (a *debug* build), Rust adds
overflow checks so you catch these during development. In an optimized *release* build (`cargo run
--release`), those checks are off for speed, and the value "wraps around" instead (255 + 1 becomes 0). The
lesson isn't to fear arithmetic - it's to pick an integer type big enough for your values (`i32`/`i64` for
general counting, which are huge), and to know that "attempt to add with overflow" means a number outgrew
its type.

## Recap

1. **`let` binds a value, immutable by default.** Reassigning it is a compile error.
2. **`mut` opts in to changing** a value (`let mut x = 5;`).
3. **Rust is statically typed with inference** - every value has a type, but you rarely have to write it.
4. The **basic types**: `i32`/`u32` (integers), `f64` (decimals), `bool`, `char` (single quotes), `&str`
   and `String` (text).
5. **Shadowing** re-binds a name with `let` (new value, type may change) - different from `mut`.
6. **Integer overflow panics in debug builds** with "attempt to add with overflow"; pick a big-enough type.

You can hold single values now. Next, we hold *many* values at once - lists, maps, and the two kinds of
text Rust makes you choose between.

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
