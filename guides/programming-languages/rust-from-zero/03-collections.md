---
title: "Collections"
guide: "rust-from-zero"
phase: 3
summary: "Hold many values: Vec<T> is the growable list you'll use daily, arrays are fixed-size, HashMap stores key-value pairs - plus the String vs &str distinction that confuses everyone, finally explained."
tags: [rust, vec, array, string, str, hashmap, collections, iteration]
difficulty: beginner
synonyms: ["rust vec explained", "rust string vs str", "rust hashmap example", "rust arrays vs vectors", "rust iterate over vec", "what is the difference between String and &str"]
updated: 2026-06-19
---

# Collections

A single value is rarely enough. You'll want a *list* of scores, a *table* of users by name, a *line* of
text you build up piece by piece. This phase covers the containers you'll reach for every day - and it
tackles the single most confusing thing for Rust newcomers head-on: why there are two kinds of string,
`String` and `&str`, and which one to use when. If you've stared at a Rust error about mismatched string
types and felt lost, this phase is for you.

## `Vec<T>` - the growable list you'll actually use

**What it actually is.** A `Vec` (say "vector") is a list that can grow and shrink. The `<T>` means "a Vec
of some type `T`" - `Vec<i32>` is a list of integers, `Vec<String>` a list of strings. Every element is
the same type. This is the workhorse collection; reach for it by default.

```rust
fn main() {
    let mut scores = vec![10, 20, 30];
    scores.push(40);
    println!("{:?}", scores);
    println!("first: {}", scores[0]);
}
```
```console
$ cargo run
[10, 20, 30, 40]
first: 10
```
*What just happened:* `vec![10, 20, 30]` is a handy macro that builds a `Vec` with three starting values.
`scores.push(40)` added a fourth - which is why it's `mut`; growing the list changes it. `scores[0]` reads
the first element (counting starts at `0`). And `{:?}` is a new placeholder: where `{}` prints a value for
*humans*, `{:?}` prints it for *debugging* - handy for whole collections, which don't have a "pretty" human
form. (`{:?}` works on anything that knows how to debug-print itself, which most standard types do.)

📝 **Terminology.** `{}` is **Display** formatting (clean, for users). `{:?}` is **Debug** formatting (for
you, the programmer). When Rust complains a type "doesn't implement `Display`," try `{:?}` instead.

## Iterating - `for ... in`

To do something with each element, loop over a *reference* to the collection with `for ... in`:

```rust
fn main() {
    let scores = vec![10, 20, 30, 40];
    for s in &scores {
        println!("score: {s}");
    }
}
```
```console
$ cargo run
score: 10
score: 20
score: 30
score: 40
```
*What just happened:* `for s in &scores` walked through the list, binding each element to `s` in turn. The
`&` means "borrow the list to read it, don't consume it" - so `scores` is still usable afterward. (Why the
`&` matters is the heart of [Phase 6: Ownership](06-ownership-and-borrowing.md); for now, the habit is:
loop over `&collection` when you just want to read.)

## Arrays - fixed size, known up front

**What it actually is.** An array is like a `Vec`, but its length is fixed when you write it and can never
change. You'll use these less than `Vec`, but they show up for small, known-size groups of data.

```rust
fn main() {
    let days = [1, 2, 3];
    println!("{:?}", days);
}
```
```console
$ cargo run
[1, 2, 3]
```
*What just happened:* `[1, 2, 3]` is an array of exactly three integers - its size is part of its type
(`[i32; 3]`). You can't `push` to it. **Rule of thumb:** if the number of elements can change, use `Vec`;
if it's truly fixed and small, an array is fine. When in doubt, `Vec`.

## `String` vs `&str` - the confusion, finally cleared up

This is the one. Two types for text, and beginners can never remember which is which. Here's the mental
model that makes it stick:

- **`String` is an owned, growable buffer of text** - *you* own it, it lives on the heap, and you can
  modify and grow it. Think of it as a notebook you bought: it's yours, and you can keep writing in it.
- **`&str` (a "string slice") is a borrowed *view* into text someone else owns** - read-only, fixed. Think
  of it as a window looking at text: you can read what's there, but you don't own it and can't change it
  through the window. A string literal like `"Ada"` is a `&str` (it's baked into your program, and you're
  just viewing it).

📝 **Terminology.** **Owned** means "this value is responsible for its data and will clean it up."
**Borrowed** (the `&`) means "a temporary reference to data owned elsewhere." This owned-vs-borrowed split
runs through all of Rust - strings are just where you meet it first. [Phase 6](06-ownership-and-borrowing.md)
makes it the main event.

Here's both in one place:

```rust
fn main() {
    let mut owned = String::from("Hello"); // owned, growable
    owned.push_str(", world");             // we can grow it
    println!("{owned}");

    let slice: &str = "literal";           // borrowed view, read-only
    println!("{slice}");
}
```
```console
$ cargo run
Hello, world
literal
```
*What just happened:* `String::from("Hello")` made an owned `String` we can extend - `push_str` appended
to it. The literal `"literal"` is a `&str`, a fixed read-only view we can print but not grow. `owned` is a
notebook; `slice` is a window.

### Why two types? And the rule that ends the confusion

Rust splits them because they answer different questions. When you're *building* text - concatenating,
reading user input, assembling a message - you need ownership and growth, so you use `String`. When you
just need to *look at* some text - pass it to a function that reads it, compare it, print it - you don't
need ownership, so `&str` is lighter and more flexible.

That leads to the rule that solves 90% of the confusion in real code:

💡 **Key point.** **Take `&str` as a function parameter; return / store `String`.** A function that only
*reads* text should accept `&str`, because then it accepts *both* a borrowed slice and a borrow of an owned
`String` - the most flexible choice. Watch:

```rust
fn greet(name: &str) {        // accepts a view into any text
    println!("Hello, {name}!");
}

fn main() {
    let owned = String::from("Hello, world");
    greet("typed inline"); // a &str literal - works
    greet(&owned);         // &owned borrows the String *as* a &str - also works
}
```
```console
$ cargo run
Hello, world!
Hello, typed inline!
```
*What just happened:* `greet` asks for `&str`, and it happily took both a literal *and* `&owned` (a borrow
of a `String`). That's the payoff of accepting `&str`: callers can hand you either kind of text. If `greet`
had demanded a `String`, the literal call wouldn't compile and callers would be forced to allocate. So:
**read with `&str`, own with `String`.**

⚠️ **Gotcha.** You can't add a `&str` to a `String` with `+` the way you might guess from other languages,
and you can't compare a `String` to a `&str` without care. Until ownership clicks, lean on the methods:
`my_string.push_str("more")` to append, `String::from("text")` to make one, and `&my_string` to pass it
where a `&str` is wanted. These cover almost everything early on.

## `HashMap` - look things up by key

**What it actually is.** A `HashMap<K, V>` stores **key → value** pairs and lets you look up a value by its
key fast. It's the "dictionary" / "associative array" you may know from other languages: store an age by a
person's name, a price by a product code, a count by a word.

Unlike `Vec`, `HashMap` isn't in scope automatically - you bring it in with a `use` line at the top of the
file (more on `use` in [Phase 5](05-modules-and-project-layout.md)):

```rust
use std::collections::HashMap;

fn main() {
    let mut ages: HashMap<String, i32> = HashMap::new();
    ages.insert(String::from("Ada"), 36);
    ages.insert(String::from("Linus"), 54);

    match ages.get("Ada") {
        Some(age) => println!("Ada is {age}"),
        None => println!("Ada not found"),
    }
}
```
```console
$ cargo run
Ada is 36
```
*What just happened:* We created an empty map from `String` keys to `i32` values, inserted two pairs, then
looked one up. The interesting bit is `ages.get("Ada")` - it doesn't return an age directly. It returns an
`Option`: either `Some(age)` if the key exists, or `None` if it doesn't. Rust makes you handle the
"missing key" case right there with `match`, so you can never accidentally use a value that wasn't found.

> ⏭️ `Option`, `Some`, `None`, and `match` are coming up properly: `match` in
> [Phase 4](04-control-flow-and-functions.md), and `Option`'s "no null in Rust" story in
> [Phase 7](07-errors-and-io.md). For now: `get` returns `Some(value)` or `None`, and you handle both.

⚠️ **Gotcha - HashMaps have no order.** If you iterate a `HashMap`, the pairs come out in an unpredictable
order, and it can differ run to run. That's by design (it's what makes lookups fast). If you need a stable
order, sort the keys yourself, or reach for `BTreeMap` (a sorted map) instead.

## Recap

1. **`Vec<T>`** is the growable list - your default container; `vec![...]` builds one, `.push()` grows it.
2. **`for x in &collection`** iterates by borrowing (so the collection survives the loop).
3. **Arrays** (`[1, 2, 3]`) are fixed-size; use `Vec` when the count can change.
4. **`String`** is owned and growable; **`&str`** is a borrowed, read-only view. **Read with `&str`, own
   with `String`.**
5. **`HashMap<K, V>`** stores key → value; `.get(key)` returns `Some(value)` or `None`, and it has no
   guaranteed order.
6. **`{}`** prints for humans (Display); **`{:?}`** prints for debugging (Debug) - use the latter for whole
   collections.

You can store data now. Next, we make decisions about it and bundle logic into functions - where you'll
meet `match`, the feature Rust programmers love most.

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Functions →](04-control-flow-and-functions.md)
