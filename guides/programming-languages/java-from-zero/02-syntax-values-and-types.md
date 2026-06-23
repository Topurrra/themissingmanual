---
title: "Syntax, Values & Types — Primitives, Objects & Static Typing"
guide: "java-from-zero"
phase: 2
summary: "How Java thinks about values: a compiler-checked type on every variable, the deep split between primitives and objects, wrapper types and autoboxing, the var keyword, and why you never compare strings with =="
tags: [java, types, primitives, var, static-typing, strings, autoboxing]
difficulty: beginner
synonyms: ["java primitive vs object types", "java var keyword", "java static typing", "java int double boolean", "java string vs char", "java autoboxing", "java integer vs int"]
updated: 2026-06-22
---

# Syntax, Values & Types — Primitives, Objects & Static Typing

A program that only prints a fixed greeting is a dead end. Real programs hold values — a name, a count, a
price — and do things with them. In Java, every value has a **type**, and the language is strict about it
in a way that feels like extra paperwork at first and turns into a safety net fast. Let's build the mental
model before the syntax, because the syntax makes a lot more sense once you see what Java is protecting
you from — and where it hides a couple of sharp edges.

The one idea that organizes this whole phase: Java draws a hard line between two kinds of values. A small
set of **primitives** that hold a raw number or true/false directly, and **objects** (everything else)
that live elsewhere and are reached through a reference. Almost every surprise in this phase traces back
to which side of that line you're standing on.

## What "statically typed" actually means

**What it is.** Java is **statically typed**: every variable has a fixed type that's written down and
checked when your code is *compiled*, before it ever runs. A variable declared to hold a whole number can
never later hold a piece of text. The compiler verifies all of this up front and refuses to build a
program where the types don't line up.

**Why people get this wrong.** Coming from Python or JavaScript, you might expect a variable to be a box
you can drop anything into. In Java it's a box with a *declared shape* — number-shaped, text-shaped — and
the compiler checks that everything you put in fits. A whole category of bugs ("I thought this held a
number but it held the text `"42"`") cannot survive to runtime; they get caught while you build.

📝 **Static typing** — the type of every variable is known and checked at *compile time* (when `javac`
turns your code into bytecode), not while the program runs. "Static" is the opposite of "dynamic," where
types are only checked as the code executes. Java does the checking early, so a running Java program never
has to wonder what type something is.

You declare a variable by writing its type, then its name, then optionally an initial value:

```java
int count = 0;
count = count + 5;   // fine: an int going into an int box
count = "hello";     // compile error: incompatible types
```

*What just happened:* `int count = 0;` reads as "declare a variable named `count` of type `int` (a whole
number), starting at `0`." The second line is fine — a number going into a number box. The third line
never compiles: the compiler sees you trying to put text into a box declared for whole numbers and stops
you cold with `incompatible types: String cannot be converted to int`. That error is the safety net doing
its job at build time instead of letting a confused value blow up later.

## Primitives vs objects — the split that explains everything

This is the most important distinction in the phase, so let's slow down for it.

📝 **Primitive** — a value that holds its data *directly*: the actual number or true/false sits right in
the variable. **Object** (also called a *reference type*) — a value that lives elsewhere in memory; the
variable holds a *reference* (a pointer-like handle) to it, not the thing itself.

Java has exactly **eight** primitive types, and they're the only types that work this way. The ones you'll
actually reach for:

- **`int`** — a whole number (`-3`, `0`, `42`). Your default for counting.
- **`double`** — a number with a decimal point (`3.14`, `-0.5`). Your default for fractional numbers.
- **`boolean`** — a truth value, `true` or `false`. Named after George Boole.
- **`char`** — a single character, written in *single* quotes (`'A'`, `'7'`).
- **`long`** — a whole number with extra room, for values too big for `int` (write the literal with an `L`:
  `9_000_000_000L`).

(The other three — `byte`, `short`, `float` — exist for specific low-level needs; you can ignore them
while learning.)

**Everything that isn't one of those eight is an object.** `String`, arrays, `Scanner`, and every class
you'll ever write are reference types. Their variables hold a reference to data that lives somewhere else.

**Why this distinction earns its keep.** Two concrete reasons:

1. **Performance.** A primitive is tiny and lives right where it's declared — no indirection, no extra
   allocation. Operating on an `int` is about as cheap as computing gets. Objects carry more overhead.
2. **`null`.** A reference can point at *nothing* — the special value `null`. A primitive *cannot*; an
   `int` is always some number, never "missing." That single difference is the root of Java's most famous
   crash, the `NullPointerException`, which we'll properly meet in [Phase 9](09-idioms-and-gotchas.md).
   For now, just file away: primitives can't be `null`; objects can.

💡 **Mental model.** A primitive variable *is* the value. An object variable is a *label on a box that's
stored elsewhere* — and that label can be left pointing at nothing (`null`). When something in Java
surprises you, the first question to ask is "primitive or object?"

## Wrapper types & autoboxing — the object versions of primitives

Sometimes you need a primitive to behave like an object — most commonly because a collection (a list, a
map) can only hold objects, never raw primitives. For that, every primitive has an **object twin** called
a **wrapper type**: `int` ↔ `Integer`, `double` ↔ `Double`, `boolean` ↔ `Boolean`, `char` ↔ `Character`,
and so on.

📝 **Wrapper type** — an object that holds a single primitive value. `Integer` is an object wrapping an
`int`; `Double` wraps a `double`. Because it's an object, a wrapper can be stored where only objects are
allowed — and, unlike its primitive, it can be `null`.

The convenient part is **autoboxing**: Java converts between a primitive and its wrapper automatically, so
you rarely write the conversion by hand.

```java
Integer boxed = 42;     // autoboxing: int 42 wrapped into an Integer
int unboxed = boxed;    // auto-unboxing: Integer back to int
```

*What just happened:* `Integer boxed = 42;` looks like you assigned an `int` to an `Integer`, and you did —
Java silently *boxed* the primitive `42` into an `Integer` object for you. The reverse line *unboxed* it
back to a raw `int`. You get to write the natural-looking code, and the compiler inserts the conversion.

That convenience hides two traps worth knowing now.

⚠️ **A wrapper can be `null`, so unboxing can crash.** Because `Integer` is an object, it can be `null`.
And auto-unboxing a `null` wrapper doesn't give you `0` — it throws a `NullPointerException`.

```java
Integer maybe = null;   // perfectly legal — it's an object
int n = maybe;          // NullPointerException at runtime when unboxing null
```

*What just happened:* `maybe` is an `Integer`, so `null` is a valid value for it. But the next line tries
to unbox it into a plain `int`, and there's no number inside to hand over — so Java throws a
`NullPointerException`. A plain `int` could never have gotten you here; this is the `null` risk from the
previous section, made concrete.

⚠️ **`==` on wrappers compares references, not values.** This one bites everyone exactly once. On
primitives, `==` compares the actual numbers. On *objects* (and wrappers are objects), `==` asks "are these
the same object in memory?" — which is a different question, and often gives a surprising answer.

```java
Integer a = 1000;
Integer b = 1000;
boolean sameValue = (a == b);            // false! comparing two distinct objects
boolean reallySame = a.equals(b);        // true — equals() compares the values
```

*What just happened:* `a` and `b` both wrap the number `1000`, but they're two *separate* `Integer`
objects, so `a == b` asks "same object?" and the answer is `false`. To compare the values you call
`.equals()`, which checks the numbers inside. (Java caches small `Integer`s from -128 to 127, so the same
test with `127` would confusingly print `true` — which is exactly why you should never rely on `==` for
wrappers.) We'll return to this `==`-vs-`.equals()` divide in [Phase 9](09-idioms-and-gotchas.md); the
rule for now: **use `.equals()` to compare objects, save `==` for primitives.**

## `var` — let the compiler infer the type

Writing the type twice — `ArrayList<String> names = new ArrayList<String>();` — gets tedious when the type
is already obvious from the right-hand side. Modern Java (10+) lets you write **`var`** instead, and the
compiler *infers* the type from the value you assign.

```java
var name = "Ada";        // compiler infers: String
var count = 0;           // compiler infers: int
var price = 9.99;        // compiler infers: double
```

*What just happened:* `var name = "Ada";` declares `name` and lets the compiler look at `"Ada"`, see it's
text, and decide `name` is a `String`. The variable is *exactly* as statically typed as if you'd written
`String name` — `var` is shorthand, not a change in how typing works. Try `name = 5;` afterward and you
still get a compile error, because `name`'s type was fixed to `String` the moment it was inferred.

💡 **When to reach for `var`.** Use it when the type is plainly visible on the right side — especially to
avoid repeating a long type. Two limits to remember: `var` only works for **local variables** inside
methods (not fields or method parameters), and it needs an initial value to infer *from*, so `var x;` on
its own won't compile. When the right side is vague (`var result = compute();`), spelling the type out
keeps the code readable.

## Strings — objects, immutable, and never compared with `==`

You've used `String` since Phase 1, but a few facts about it will save you real grief.

**A `String` is an object, not a primitive.** Despite getting friendly syntax (double quotes, the `+`
operator), `String` is a reference type — which is why everything from the objects section applies to it.

**A `String` is immutable.** Once created, its characters never change. Operations that look like they
modify a string actually build and hand back a *new* one, leaving the original untouched. You concatenate
with `+`:

```java
String first = "Ada";
String full = first + " " + "Lovelace";   // builds a brand-new String
System.out.println(full);
System.out.println(first);                // unchanged
```
```console
$ java Strings.java
Ada Lovelace
Ada
```

*What just happened:* `first + " " + "Lovelace"` didn't alter `first`; it assembled a *new* `String`,
`"Ada Lovelace"`, and stored it in `full`. The original `first` is still just `"Ada"`, because strings
can't be mutated in place. Every "string change" in Java is really "make a new string."

⚠️ **Never compare strings with `==`.** Since `String` is an object, `==` compares *references* (same
object?), not the text. Two strings with identical characters can live at different memory addresses, so
`==` may say `false` even when they read the same. Always use `.equals()` to compare the *contents*:

```java
String a = "hello";
String b = new String("hello");   // forces a distinct object
System.out.println(a == b);        // false — different objects
System.out.println(a.equals(b));   // true  — same characters
```
```console
$ java Compare.java
false
true
```

*What just happened:* `a` and `b` hold the same text but are two separate `String` objects (the
`new String(...)` guarantees a fresh one). So `a == b` compares object identity and reports `false`, while
`a.equals(b)` compares the actual characters and reports `true`. This is the single most common beginner
trap in Java: **`.equals()` for "do these say the same thing?", never `==`.** It's the same rule you just
met for wrappers, because the cause is the same — both are objects.

**Text blocks for multi-line strings.** When you need a string that spans several lines, the triple-quote
**text block** (Java 15+) saves you from a mess of `\n` escapes:

```java
String message = """
    Dear Ada,
    Welcome to Java.
    """;
System.out.print(message);
```
```console
$ java Block.java
Dear Ada,
Welcome to Java.
```

*What just happened:* The `"""..."""` text block let you write the message exactly as it should appear,
newlines and all, with no `\n` escapes. Java strips the common leading indentation (measured from the
closing `"""`), so the text lines up cleanly in your source *and* in the output. It's the same immutable
`String` type as always — just a far more readable way to write a long or multi-line one.

## Recap

1. Java is **statically typed**: every variable has a declared type the compiler checks at build time, so
   type mistakes are caught before the program runs.
2. The big split is **primitives vs objects**. The eight primitives (`int`, `double`, `boolean`, `char`,
   `long`, …) hold their value directly and are cheap; everything else is an **object** reached by
   reference — and only objects can be `null`.
3. **Wrapper types** (`Integer`, `Double`, …) are the object twins of primitives; **autoboxing** converts
   between them automatically. ⚠️ A wrapper can be `null` (unboxing it crashes), and `==` on wrappers
   compares references, not values — use `.equals()`.
4. **`var`** lets the compiler infer a local variable's type from its initializer. It's still fully static
   — just less typing — and works only for locals with an initial value.
5. **`String` is an immutable object.** Concatenate with `+` (it builds a new string); write multi-line
   text with `"""` text blocks.
6. ⚠️ **Never compare strings (or any objects) with `==`** — that checks identity. Use `.equals()` to
   compare contents.

Next, we move from single values to *collections* of them: arrays, the `List` and `Map` you'll actually
reach for every day, and how Java's generics keep them type-safe.

## Quick check

Test yourself on the idea that drives this whole phase — which side of the primitive/object line you're on:

```quiz
[
  {
    "q": "What's the key difference between a primitive like `int` and an object like `Integer`?",
    "choices": [
      "An `int` holds its value directly and can never be null; an `Integer` is an object reference that can be null",
      "There is no difference — `int` and `Integer` are two names for the same thing",
      "An `Integer` is faster because it's stored directly in the variable",
      "A primitive can be null but an object cannot"
    ],
    "answer": 0,
    "explain": "A primitive holds its data directly and is always some value — an `int` is never \"missing.\" `Integer` is a wrapper object reached by reference, so it can be `null`, which is exactly why unboxing a null `Integer` throws a NullPointerException."
  },
  {
    "q": "You have two `String` variables holding the same text. How should you check whether their contents match?",
    "choices": [
      "Use `a.equals(b)`, because `==` compares object references, not the characters",
      "Use `a == b`, which always compares the text of two strings",
      "Either works — `==` and `.equals()` do the same thing for strings",
      "Convert both to `int` first, then compare with `==`"
    ],
    "answer": 0,
    "explain": "`String` is an object, so `==` asks \"is this the same object in memory?\" — which can be false even when the text is identical. `.equals()` compares the actual characters, which is what you almost always want."
  },
  {
    "q": "What does `var name = \"Ada\";` do?",
    "choices": [
      "Declares a local variable whose type the compiler infers as `String` — still fully static, just less typing",
      "Declares a variable with no type, so it can later hold any kind of value",
      "Makes `name` dynamically typed, like a Python variable",
      "Only works for fields, not for local variables inside methods"
    ],
    "answer": 0,
    "explain": "`var` infers the type from the initializer — here `String` — and locks it in. It's pure shorthand: the variable is exactly as statically typed as if you'd written `String name`, and it works only for local variables that have an initial value."
  }
]
```

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
