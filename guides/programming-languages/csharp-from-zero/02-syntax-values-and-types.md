---
title: "Syntax, Values & Types — Value vs Reference & Static Typing"
guide: "csharp-from-zero"
phase: 2
summary: "C#'s static type system, the value-vs-reference split that decides whether assignment copies or shares, var for inference, nullable types that kill the null-reference crash, and strings done right."
tags: [csharp, types, value-types, reference-types, var, nullable, strings, static-typing]
difficulty: beginner
synonyms: ["c# value vs reference types", "c# struct vs class memory", "c# var keyword", "c# nullable reference types", "c# string interpolation", "c# int double bool", "c# static typing"]
updated: 2026-06-22
---

# Syntax, Values & Types

In Phase 1 you got a program to print and run. That's the warm-up. Real programs hold things — a name, a
count, a price — and the rules C# uses to *store* those things shape almost everything you'll write next.
Two ideas do the heavy lifting: the compiler knows the type of every value before your code runs, and C#
splits all values into two camps — ones that *copy* when you pass them around, and ones that *share*. Get
that split into your head now and a whole category of "why did this change?" bugs never happens to you.

Let's build the mental model first, because the syntax makes far more sense once you see what it's protecting.

## Static typing — the compiler checks before you run

**What it actually is.** C# is **statically typed**: every variable has a fixed type that's locked in when
you declare it, and the compiler verifies every use of it *before the program runs*. A variable that holds
a whole number can never later hold text. Try it, and the build fails — no crash at runtime, just a red
squiggle and a refusal to compile.

📝 **Static** means "checked at compile time," as opposed to *dynamic* ("checked while running"). C# does
the checking up front, so by the time your program runs, the question "what type is this?" is already
answered and can never go wrong.

```csharp
int count = 0;
count = count + 1;     // fine: an int plus an int is an int
count = "hello";       // compile error: cannot convert string to int
```
*What just happened:* `int count = 0;` told the compiler "`count` is an integer, forever." Adding to it is
fine. Assigning the text `"hello"` to it is a contradiction the compiler catches instantly — you'd see
`error CS0029: Cannot implicitly convert type 'string' to 'int'`. That bug can't survive to runtime; it's
dead before the program even starts. That's the safety net static typing gives you: a whole class of "I
thought this was a number but it was text" mistakes cannot ship.

## Value types vs reference types — copy or share?

This is *the* idea in this phase. Internalize it and C# stops surprising you.

📝 C# splits every type into two families:

- **Value types** hold their data *directly*. When you assign or pass one, you get a **copy** — a separate,
  independent value. These include `int`, `double`, `bool`, `char`, every `struct`, and every `enum`.
- **Reference types** hold a *reference* (a pointer) to data that lives elsewhere in memory. When you assign
  or pass one, you copy the *reference*, not the data — so both names now point at the **same** object.
  These include every `class`, plus `string` and arrays.

Why does this split exist? Small, simple values (a number, a flag) are cheapest to just copy. Big or shared
things (an object with many fields, a list everyone needs to see the same version of) are cheapest to pass
by reference. The catch is that copy-vs-share changes *behavior*, not just performance — and that's what
trips people up.

Here's the difference in one breath. A `struct` is a value type; a `class` is a reference type:

```csharp
struct PointVal { public int X; }   // value type
class PointRef  { public int X; }   // reference type

var a = new PointVal { X = 1 };
var b = a;                          // COPY — b is independent
b.X = 99;
// a.X is still 1, b.X is 99

var c = new PointRef { X = 1 };
var d = c;                          // SHARE — d points at the same object as c
d.X = 99;
// c.X is now 99 too — same object
```
```console
PointVal: a.X = 1,  b.X = 99
PointRef: c.X = 99, d.X = 99
```
*What just happened:* `b = a` copied the *whole struct*, so `b` is a separate value — changing `b.X` left
`a` untouched. But `d = c` only copied the *reference*; `c` and `d` are two names for one object, so writing
through `d` changed what `c` sees too. Same line of code (`x = y`), opposite result — and the only
difference is whether the type is a `struct` (value) or a `class` (reference).

⚠️ **The classic surprise: passing to a method.** The same copy-vs-share rule applies when you hand a value
to a method. Pass a struct and the method works on a *copy* — your original is safe. Pass a class and the
method works on *your actual object* — changes leak back out.

```csharp
struct Counter { public int N; }
class  Box     { public int N; }

void BumpStruct(Counter c) { c.N++; }   // bumps a copy
void BumpClass(Box b)      { b.N++; }   // bumps the caller's object

var counter = new Counter { N = 0 };
BumpStruct(counter);
// counter.N is still 0 — the method changed its own copy

var box = new Box { N = 0 };
BumpClass(box);
// box.N is now 1 — the method reached the real object
```
```console
counter.N = 0
box.N = 1
```
*What just happened:* `BumpStruct` received a *copy* of `counter`, incremented that copy, and threw it away
when it returned — so `counter` never changed. `BumpClass` received a copy of the *reference*, which still
pointed at the caller's `box`, so the increment hit the real object and stuck. When a method "didn't change
my data," it's almost always a value type; when it "changed my data behind my back," it's a reference type.
This one detail explains more day-one C# confusion than anything else.

💡 **Key point.** Ask yourself two questions about any type: *Does assigning it copy or share? Does passing
it to a method protect my original or expose it?* Value types copy and protect; reference types share and
expose. `null` only enters the picture for reference types and nullable value types (next), because only a
reference can point at "nothing."

## `var` — let the compiler infer the type

Spelling out the type twice gets old fast: `Dictionary<string, List<int>> map = new Dictionary<string,
List<int>>();` is a mouthful. The `var` keyword lets the compiler **infer** the type from the value on the
right:

```csharp
var name = "Ada";          // compiler sees "Ada" is text → name is a string
var age = 36;              // compiler sees 36 is a whole number → age is an int
var price = 9.99;         // → double
var ready = true;         // → bool
```
*What just happened:* Each `var` told the compiler "figure out the type from the right-hand side." `name` is
*still* a `string` — fully static, fully checked — you just didn't write the word `string`. `var` is not
"any type" and it's not dynamic; it's shorthand for a type the compiler can already see. Try `name = 42;`
afterward and it's the same compile error as before, because `name`'s type was fixed the moment it was
inferred.

💡 **When to use it.** Reach for `var` when the type is obvious from the right side (`var user = new
User();` — clearly a `User`) or genuinely long to spell out. Prefer the explicit type when the value alone
doesn't make it clear (`var result = Process();` — what *is* `result`? hard to say at a glance). The goal is
readability, not saving keystrokes.

## Nullability — the war on NullReferenceException

📝 `null` means "this reference points at nothing." Read a value off a `null` reference and you get a
`NullReferenceException` — historically the single most common crash in C#. Modern C# fights back on two
fronts.

**Nullable value types.** Value types like `int` can't normally be `null` — they always hold a real number.
But sometimes you genuinely need "a number, or nothing yet" (an unanswered survey field, say). Add a `?` to
make a **nullable value type**:

```csharp
int score = 0;            // always a number; cannot be null
int? maybeScore = null;   // a number OR null — note the ?

if (maybeScore.HasValue)
    Console.WriteLine(maybeScore.Value);
else
    Console.WriteLine("no score yet");
```
```console
no score yet
```
*What just happened:* `int` refuses `null` outright. `int?` (shorthand for `Nullable<int>`) adds one extra
state — "nothing" — on top of every number, so it can model "not answered yet" honestly instead of faking
it with `-1` or `0`.

**Nullable reference types.** Reference types have *always* been able to be `null`, which is exactly why
crashes were so common. Modern C# (with `<Nullable>enable</Nullable>` in your project file, the default for
new projects) flips this: now you must *opt in* to nullability. A plain `string` means "never null"; a
`string?` means "might be null" — and the compiler *warns* you whenever you risk dereferencing a possible
`null`.

```csharp
#nullable enable
string name = "Ada";       // promises: never null
string? note = null;       // allowed to be null

Console.WriteLine(name.Length);   // fine — name can't be null
Console.WriteLine(note.Length);   // warning CS8602: possible null dereference
```
*What just happened:* With nullability enabled, `name` is a *non-nullable* `string` — the compiler trusts
it's never `null` and lets you use it freely. `note` is a `string?`, so reading `note.Length` earns a
warning: "this might be `null`, you didn't check." The compiler is moving the `NullReferenceException` from
a 3-a.m. production crash to a squiggle in your editor. ⚠️ These are *warnings*, not errors — they don't
stop the build, so it's tempting to ignore them. Don't. Each one is a real crash the compiler spotted for
you. (We go deep on nullability and the `?.` / `??` operators in [Phase 13](13-records-and-modern-csharp.md).)

## Strings — text done the C# way

Strings earn their own section because they have a couple of quietly important behaviors.

📝 A `string` is a **reference type**, but an **immutable** one: once created, its characters never change.
Every operation that looks like it modifies a string (uppercasing, replacing, concatenating) actually
builds a *brand-new* string and leaves the original alone.

The most useful everyday feature is **string interpolation** — prefix a string with `$` and drop
expressions right inside `{ }`:

```csharp
var name = "Ada";
var age = 36;
var greeting = $"Hello {name}, you are {age} years old.";
Console.WriteLine(greeting);
Console.WriteLine($"Next year: {age + 1}");   // expressions work too
```
```console
Hello Ada, you are 36 years old.
Next year: 37
```
*What just happened:* The `$` turns the string into a template; each `{ ... }` is evaluated and its result
dropped in. `{age + 1}` shows you can put real expressions inside, not just variable names. This is far
cleaner than gluing strings together with `+`, and it's what you'll use almost every time.

⚠️ **The equality gotcha — `==` on strings compares *value*.** Coming from Java, this surprises people. In
Java, `==` on strings compares *references* (are they the same object?), so you need `.equals()`. In C#,
`==` on strings is overloaded to compare the actual *text*:

```csharp
var a = "hello";
var b = "hel" + "lo";       // a different object, same text
Console.WriteLine(a == b);  // True — compares the characters
```
```console
True
```
*What just happened:* `a` and `b` are (potentially) different objects, but `==` on `string` compares their
*contents*, so you get `True`. This is special to `string` — for your *own* classes, `==` compares
references by default (same-object?), not contents, which is a different story we'll tell in
[Phase 9](09-idioms-and-gotchas.md). For now: strings compare by value with `==`, and that's the one
you want.

Two more string forms worth knowing. **Verbatim strings** (`@"..."`) turn off escape sequences, so
backslashes and line breaks are literal — perfect for Windows paths and regex. **Raw string literals**
(`"""..."""`) let you paste multi-line text (JSON, SQL, HTML) without escaping anything:

```csharp
var path = @"C:\Users\Ada\file.txt";          // no doubled backslashes needed
var json = """
    { "name": "Ada", "age": 36 }
    """;                                       // quotes inside need no escaping
Console.WriteLine(path);
Console.WriteLine(json);
```
```console
C:\Users\Ada\file.txt
{ "name": "Ada", "age": 36 }
```
*What just happened:* In a normal string, `"C:\Users"` would treat `\U` as an escape and break. The `@`
prefix says "take this literally," so the backslashes stand as-is. The `"""` raw string holds a block of
text with embedded `"` quotes and newlines, no escaping required — the compiler even strips the leading
indentation up to the closing `"""`. Reach for `@"..."` for paths and `"""..."""` for chunks of structured
text.

## Recap

1. **C# is statically typed** — every variable's type is fixed at declaration and checked at *compile time*,
   so type mismatches fail the build instead of crashing at runtime.
2. **Value vs reference is the big split.** Value types (`int`, `double`, `bool`, `struct`, `enum`) hold data
   directly and **copy** on assignment and method calls. Reference types (`class`, `string`, arrays) hold a
   reference and **share** — both names point at the same object.
3. ⚠️ Passing a **struct** to a method protects your original (it gets a copy); passing a **class** exposes
   it (the method reaches your real object).
4. **`var`** infers the type from the right-hand side — still fully static, just less typing. Use it when
   the type is obvious.
5. **Nullability:** `int?` adds "nothing" to a value type; modern **nullable reference types** make `string`
   non-null and `string?` maybe-null, with compiler warnings to kill `NullReferenceException` early.
6. **Strings** are immutable reference types. Use `$"..."` interpolation; remember `==` compares **value**
   (unlike Java); use `@"..."` for paths and `"""..."""` for multi-line text.

Next, we move from single values to *collections* of them — arrays, the `List<T>` you'll actually use, and
dictionaries for looking things up by key.

## Quick check

Test yourself on the idea that matters most here — copy versus share:

```quiz
[
  {
    "q": "You have a `struct Point` and write `var b = a;` then `b.X = 99;`. What is `a.X`?",
    "choices": [
      "Unchanged — a struct is a value type, so `b = a` made an independent copy",
      "99 — `b` and `a` point at the same object",
      "0 — assigning a struct resets its fields",
      "A compile error — you can't copy a struct"
    ],
    "answer": 0,
    "explain": "A struct is a value type: assignment copies the whole value, so `b` is independent of `a`. Changing `b.X` leaves `a.X` exactly as it was. If `Point` were a `class` (reference type), `b = a` would share the object and `a.X` would become 99 too."
  },
  {
    "q": "With nullable reference types enabled, what's the difference between `string` and `string?`?",
    "choices": [
      "`string` is non-nullable (the compiler warns if it might be null); `string?` is allowed to be null",
      "`string` is a value type and `string?` is a reference type",
      "There is no difference — the `?` is just a style preference",
      "`string?` is faster because it skips null checks"
    ],
    "answer": 0,
    "explain": "Under `<Nullable>enable</Nullable>`, a plain `string` promises it's never null and the compiler warns when you risk dereferencing a possible null. `string?` explicitly permits null. The point is to surface NullReferenceException risks as compile-time warnings instead of runtime crashes."
  },
  {
    "q": "In C#, what does `==` do when both operands are strings?",
    "choices": [
      "Compares the actual text (their characters) for equality",
      "Compares whether they're the same object in memory, like Java",
      "Always returns false unless they're literally the same literal",
      "Throws an exception — you must use `.Equals()` for strings"
    ],
    "answer": 0,
    "explain": "`==` is overloaded for `string` to compare value (the characters), so two different string objects with the same text are equal. This differs from Java, where `==` compares references. Note that for your own classes, `==` compares references by default — string is the special case."
  }
]
```

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
