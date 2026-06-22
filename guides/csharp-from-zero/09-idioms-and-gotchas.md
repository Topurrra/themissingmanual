---
title: "Idioms & Common Gotchas — Write It Like a C# Dev, Dodge the Traps"
guide: "csharp-from-zero"
phase: 9
summary: "C# idioms that make code read like C# — properties over fields, var when obvious, string interpolation, null-handling operators, nullable reference types — plus a cheat-card for the classics: == vs Equals, NullReferenceException, deferred LINQ, integer division, and async void."
tags: [csharp, idioms, gotchas, null, equality, value-vs-reference, deferred-execution, async-void]
difficulty: intermediate
synonyms: ["c# == vs equals", "c# nullreferenceexception avoid", "c# value vs reference equality", "c# deferred execution ienumerable", "c# async void", "c# string immutability", "c# best practices beginners"]
updated: 2026-06-22
---

# Idioms & Common Gotchas — Write It Like a C# Dev, Dodge the Traps

You can write C# that compiles and runs. This phase is about the gap between *that* and code that looks like a seasoned C# developer wrote it — plus the short list of traps that have caught every C# programmer who ever lived. (Genuinely. The `NullReferenceException` alone has cost the industry more debugging hours than anyone wants to count. You're about to skip past it.)

Two halves, like a good knife. First the **idioms** — the conventions that make C# code feel coherent instead of arbitrary. The mental model there: *C# rewards saying exactly what you mean, and letting the language and compiler catch your mistakes for you*. You expose state through properties, not raw fields; you let the compiler infer obvious types; you ask for "no value" out loud with nullable reference types instead of letting `null` sneak in unannounced.

Then a scannable **gotcha cheat-card** — the surprises named *before* they bite, so when you hit one you'll recognize it instead of staring at a stack trace. The mental model there: *some types copy by value, some by reference, and queries don't run when you think they do*. Almost every trap below is one of those two ideas behaving exactly as designed but not as you assumed.

## Idioms — the way it's written today

### Use properties, not public fields

**What it actually is.** A *property* looks like a field from the outside (`user.Name`) but is really a pair of accessors — a getter and a setter — that you control. Exposing a public field hands out raw access to your object's internals with no way to validate, compute, or change the implementation later.

```csharp
// Idiomatic: a property. Auto-implemented, but you can add logic anytime.
public class User
{
    public string Name { get; set; }
    public int Age { get; private set; }   // settable only from inside
}

// Not idiomatic: a public field. No validation, no encapsulation, ever.
public class UserBad
{
    public string Name;
}
```
*What just happened:* `Name { get; set; }` is an *auto-property* — the compiler generates a hidden backing field for you, so it's no more typing than a public field, but it's a real property. The day you need to validate the name, log writes, or make it read-only, you change the property body and *no caller has to change*. A public field can never grow those abilities without breaking everyone who used it. Properties are also what data-binding, serializers, and most of the .NET ecosystem expect. Default to properties; reach for a public field essentially never.

💡 **Key point.** Use `{ get; private set; }` (or `{ get; init; }`) when a value should be set once and then stay put. The rule of thumb: expose *behavior and controlled state*, not raw memory.

### Prefer `var` when the type is obvious

**What it actually is.** `var` tells the compiler "infer the type from the right-hand side." It's still *statically typed* — `var count = 5;` is exactly an `int`, not a dynamic any-type. It just saves you from repeating a type the reader can already see.

```csharp
var names = new List<string>();        // clearly a List<string>
var count = names.Count;               // clearly an int
var user = new User();                 // clearly a User

// When the type ISN'T obvious from the right side, spell it out:
int total = Calculate();               // what does Calculate return? Be explicit.
```
*What just happened:* on the first three lines the type is sitting right there on the right of the `=`, so `var` removes noise without removing clarity. On the last line the return type of `Calculate()` isn't visible, so naming the type (`int`) helps the reader. The idiom isn't "always `var`" or "never `var`" — it's *use `var` when the type is already obvious, name the type when it isn't*. Clarity is the goal, not brevity for its own sake.

### String interpolation with `$"..."`

**What it actually is.** Prefixing a string with `$` lets you drop expressions straight inside it with `{ }`, instead of gluing pieces together with `+` or juggling positional `{0}` placeholders in `string.Format`.

```csharp
string name = "Ada";
int age = 36;

string greeting = $"Hello, {name}! You are {age} years old.";
string math = $"Next year you'll be {age + 1}.";   // full expressions allowed
Console.WriteLine(greeting);
Console.WriteLine(math);
```
```console
Hello, Ada! You are 36 years old.
Next year you'll be 37.
```
*What just happened:* `$"...{name}..."` substituted the value of `name` right where it appears, and `{age + 1}` evaluated a whole expression inline. Compare it to `"Hello, " + name + "! You are " + age + ..."` — the interpolated version reads like the sentence it produces, and you can't accidentally forget a space or mismatch a `{0}`. This is the default way to build strings in modern C#.

### Expression-bodied members and `nameof`

**What it actually is.** When a method or property is a single expression, `=>` lets you write it on one line instead of a full `{ return ...; }` block. And `nameof(x)` turns a symbol into its *name as a string* — `"x"` — but checked by the compiler, so a rename or typo becomes a build error instead of a stale string.

```csharp
public class Circle
{
    public double Radius { get; init; }

    // Expression-bodied property and method — concise, no braces needed.
    public double Area => Math.PI * Radius * Radius;
    public override string ToString() => $"Circle(r={Radius})";

    public void SetRadius(double r)
    {
        if (r < 0)
            throw new ArgumentOutOfRangeException(nameof(r), "must be >= 0");
    }
}
```
*What just happened:* `Area => ...` and `ToString() => ...` are *expression-bodied members* — the `=>` replaces the `{ return ...; }` ceremony for one-liners. In `SetRadius`, `nameof(r)` produced the string `"r"`, but unlike a hand-typed `"r"`, if you rename the parameter your IDE updates it and a typo won't compile. Use `nameof` anywhere you'd otherwise hard-code a member or parameter name — exception messages, logging, property-change notifications.

### Null-handling operators: `?.`, `??`, `??=`

**What it actually is.** Three small operators that tame `null`. `?.` (null-conditional) reads a member only if the thing isn't null, short-circuiting to `null` instead of throwing. `??` (null-coalescing) supplies a fallback when the left side is null. `??=` assigns *only if* the target is currently null.

```csharp
string? maybeName = GetName();   // might return null

int? length = maybeName?.Length;          // null if maybeName is null — no crash
string shown = maybeName ?? "(unknown)";  // fallback when null
maybeName ??= "default";                   // assign only if it was null

Console.WriteLine($"{length} / {shown} / {maybeName}");
```
*What just happened:* `maybeName?.Length` would normally throw a `NullReferenceException` when `maybeName` is null — but `?.` short-circuits to `null` instead. `?? "(unknown)"` then supplied a default, and `??=` set a value only because the variable was still null. Together these three replace whole towers of `if (x != null)` checks with a few characters, and they say your intent out loud: "read if present," "fall back if missing," "fill in if empty."

⚠️ **Gotcha — `?.` returns a *nullable*.** `maybeName?.Length` isn't an `int`, it's an `int?` (it can be null). The compiler will make you handle that, which is the point — but don't be surprised when you can't assign it straight to a plain `int`. Chain a `?? 0` when you need a non-null result.

### Pattern matching

**What it actually is.** `switch` expressions and `is` patterns let you test an object's *shape* — its type, its values, its properties — and pull data out in the same step. It replaces long `if/else` ladders and clumsy casts with something that reads top to bottom like a decision table.

```csharp
object value = 42;

// Type pattern with `is` — test and capture in one move.
if (value is int n && n > 10)
    Console.WriteLine($"big int: {n}");

// switch expression — every input maps to a result, no break needed.
string describe(object x) => x switch
{
    null            => "nothing",
    int i when i < 0 => "negative",
    int              => "an int",
    string s        => $"text of length {s.Length}",
    _               => "something else"     // _ is the catch-all
};
Console.WriteLine(describe("hi"));
```
```console
big int: 42
text of length 2
```
*What just happened:* `value is int n` checked the type *and* gave you a typed variable `n` in one step — no separate cast that might throw. The `switch` expression then mapped each possible shape to a result, with `when` adding extra conditions and `_` catching everything else. The compiler even warns you if you forget a case. (We go deep on patterns in [Phase 13](13-records-and-modern-csharp.md) — for now, recognize the style.)

### Enable nullable reference types

**What it actually is.** A project-level switch (`<Nullable>enable</Nullable>` in your `.csproj`) that makes the compiler track which references *can* be null. `string` means "never null"; `string?` means "might be null." Then it warns you whenever you might dereference a null without checking.

```csharp
#nullable enable
string name = null;       // ⚠️ compiler warning: assigning null to non-nullable
string? maybe = null;     // fine — the ? says "this can be null"

void Print(string? text)
{
    Console.WriteLine(text.Length);  // ⚠️ warning: text might be null here
    Console.WriteLine(text?.Length); // fine — guarded with ?.
}
```
*What just happened:* with nullable reference types on, the compiler treats `null` as a *visible part of the type*. `string` promises non-null, so assigning `null` to it earns a warning; `string?` admits it might be null, so the compiler then *insists* you guard every use. This turns the dreaded `NullReferenceException` from a runtime surprise into a compile-time nag you can fix before shipping. Turn it on in every new project — it's the single biggest defense against the #1 C# bug.

### Dispose with `using`, and program to interfaces

**What it actually is.** Anything holding an unmanaged resource — a file, a network socket, a database connection — implements `IDisposable` and must be *closed* when you're done. A `using` statement guarantees that cleanup runs even if an exception is thrown. And just like other ecosystems, you declare variables and parameters by their *interface* (`IEnumerable<T>`, `IList<T>`) rather than the concrete class, so callers depend on the contract, not the implementation.

```csharp
// `using` declaration: the file is closed automatically at the end of scope.
using var reader = new StreamReader("data.txt");
string firstLine = reader.ReadLine();
// reader.Dispose() runs here, even if ReadLine throws — no leak.

// Program to the interface: callers don't care it's really a List.
void PrintAll(IEnumerable<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}
```
*What just happened:* the `using var reader = ...` declaration ties the `StreamReader`'s lifetime to its scope — when execution leaves the block, `Dispose()` runs automatically and the file handle is released, even on an exception. Forget the `using` and you leak handles until something breaks. Separately, `PrintAll` accepts `IEnumerable<string>` — the most general interface that does the job — so it works with a `List`, an array, a LINQ query, or anything iterable. Flexible on the outside, specific on the inside.

> 💡 The umbrella idiom: make intent explicit and let the compiler help you. Properties expose controlled state, `var` removes noise only where the type is already clear, nullable reference types make absence visible, `using` makes cleanup automatic, and interfaces narrow the contract. Clarity over cleverness, and a green build over a runtime surprise.

## The gotcha cheat-card

> **Hit something baffling? Find the symptom here, then read the note below.** These trap *everyone* — recognizing them on sight is most of the battle.

| The trap | What bites you | The fix |
|---|---|---|
| `==` vs `.Equals()` | For classes, `==` compares *references* — two objects with identical data are "not equal" | Override `Equals`/`==`, or use a `record`; note `string` already compares by value |
| `NullReferenceException` | Calling a member on a `null` reference throws at runtime | `?.`, `??`, nullable reference types, explicit null checks |
| Deferred LINQ execution | A query doesn't run when defined — it re-runs on each enumeration, capturing variables *late* | Materialize with `.ToList()` / `.ToArray()` when you need a stable snapshot |
| Integer division | `5 / 2` is `2`, not `2.5` — the fraction is silently discarded | Cast an operand: `5 / 2.0` or `(double)a / b` |
| `async void` | Exceptions vanish unobserved and callers can't await it | Use `async Task` everywhere except event handlers |
| Mutating a collection in `foreach` | Adding/removing during iteration throws `InvalidOperationException` | Loop a copy, use a `for` loop, or collect changes then apply |
| Struct copy semantics | Assigning or passing a `struct` copies it — your edit hits the copy, not the original | Know value vs reference (Phase 2); prefer classes for mutable shared state |

Now the *why* behind the sharpest ones.

### Deferred execution of LINQ

This is the one that makes people doubt their sanity. A LINQ query like `numbers.Where(...)` doesn't *run* when you write it — it builds a *recipe*. The work happens later, every time you enumerate it (a `foreach`, a `.ToList()`, a `.Count()`). And it reads the source variables *at enumeration time*, not at definition time.

```csharp
var numbers = new List<int> { 1, 2, 3 };

// This does NOT run yet — it just describes "evens of numbers".
var evens = numbers.Where(n => n % 2 == 0);

numbers.Add(4);   // we change the source AFTER defining the query

Console.WriteLine(string.Join(", ", evens));  // query runs NOW
Console.WriteLine(string.Join(", ", evens));  // ...and runs AGAIN
```
```console
2, 4
2, 4
```
*What just happened:* `evens` captured the *recipe* "give me the even numbers in `numbers`," not a snapshot of the values. So when you added `4` *after* defining the query, the later enumeration saw it — the query re-read the (now longer) list. Worse, each `Console.WriteLine` ran the whole query again from scratch; if the source were a database call, that's two round-trips. The fix when you want a stable, one-time result is to *materialize* it: `var evens = numbers.Where(...).ToList();` runs the query once, right there, and freezes the answer.

⚠️ **Gotcha — deferred queries re-run and capture late.** The two classic bites: (1) enumerating the same query repeatedly does the work repeatedly (slow, or worse against a DB), and (2) a query defined inside a loop captures the *loop variable's final value*, not the value at each iteration. When in doubt, `.ToList()` to take a snapshot.

### Integer division

Dividing two `int`s gives an `int` — C# throws away the remainder rather than producing a fraction. This bites every beginner computing an average or a percentage.

```csharp
int total = 5, count = 2;

Console.WriteLine(total / count);            // 2   — fraction discarded!
Console.WriteLine((double)total / count);    // 2.5 — cast first
Console.WriteLine(total / (double)count);    // 2.5 — either operand works
```
```console
2
2.5
2.5
```
*What just happened:* `5 / 2` is integer arithmetic, so the result is `2` with the `.5` silently dropped — no error, no warning, just a wrong number. Casting one operand to `double` forces *floating-point* division and you get `2.5`. The rule: if you want a fractional result, make sure at least one operand is a `double` (or `decimal` for money) *before* the division runs. `(double)(total / count)` is too late — the integer division already happened, and you'd just be turning `2` into `2.0`.

### `==` vs `.Equals()` — value vs reference equality

For most *classes*, `==` asks "are these the *same object* in memory?" — reference equality. `.Equals()` *can* mean value equality, but for a plain class it also defaults to reference equality until you override it. The big exception that trips people: `string` overrides both to compare *contents*, so it behaves like a value type. That lulls beginners into thinking `==` always compares values — then they try it on their own class and it breaks.

```csharp
class Point { public int X, Y; }
record PointR(int X, int Y);   // records compare by value, for free

var a = new Point { X = 1, Y = 2 };
var b = new Point { X = 1, Y = 2 };
Console.WriteLine(a == b);              // False — different objects

var p = new PointR(1, 2);
var q = new PointR(1, 2);
Console.WriteLine(p == q);              // True  — record value equality

Console.WriteLine("hi" == "hi");        // True  — string compares contents
```
```console
False
True
True
```
*What just happened:* the two `Point` objects hold identical data, but `==` on a plain class compares *references* — they're separate objects, so `False`. The two `PointR` *records* compare by value automatically (C# generates `Equals`, `==`, and `GetHashCode` for you from the fields), so `True`. And `"hi" == "hi"` is `True` because `string` overrides equality to compare characters. The lesson: for value-like data you want compared by content, use a **`record`** (or override `Equals`/`GetHashCode`/`==` yourself). Don't assume `==` means value equality just because it does for strings.

📝 **The other three, in one line each.** **`async void`** — an `async void` method can't be awaited and its exceptions disappear into the void instead of bubbling to the caller; use `async Task` everywhere except UI event handlers (the one place the signature is required). **Mutating during `foreach`** — adding to or removing from a collection while iterating it throws `InvalidOperationException`; iterate a copy (`foreach (var x in list.ToList())`), use an index-based `for` loop, or collect the changes and apply them after. **Struct copy semantics** — a `struct` is a *value type* (Phase 2), so assigning it or passing it to a method copies the whole thing; mutating that copy leaves the original untouched, which surprises people expecting reference behavior. For shared mutable state, reach for a `class`.

## Recap

1. **Use properties** (`{ get; set; }`), not public fields — same syntax, but you keep control of validation and future change.
2. **Prefer `var` when the type is obvious**, name the type when it isn't; use **`$"..."`** interpolation, **expression-bodied members**, and **`nameof`** for compiler-checked names.
3. **Tame `null`** with `?.`, `??`, `??=`, and turn on **nullable reference types** so the compiler catches `NullReferenceException` before runtime. Dispose with **`using`** and **program to interfaces**.
4. ⚠️ **Deferred LINQ** doesn't run until enumerated, re-runs each time, and captures variables late — `.ToList()` to snapshot it.
5. ⚠️ **The cheat-card** — `==` on a class compares references (use a `record` or override `Equals` for value equality; `string` already compares contents); `5 / 2` is `2` (cast to `double`); `async void` swallows exceptions; mutating a collection in `foreach` throws; structs copy by value.

That's idiomatic C#. You can now read other people's C# and write code that looks like it belongs — and you've met the traps before they meet you. Next we go deep on **generics**: how `List<T>` really works, constraints, variance, and why the compiler sometimes argues with you about types.

## Quick check

Test yourself on the three traps that catch everyone:

```quiz
[
  {
    "q": "You have two plain-class objects with identical field values: `var a = new Point{X=1,Y=2};` and `var b = new Point{X=1,Y=2};`. What does `a == b` return, and how do you get value equality?",
    "choices": [
      "`False` — `==` compares references for a class; use a `record` or override `Equals`/`==` to compare by value",
      "`True` — C# always compares objects by their field values",
      "`True` — but only because Point has two fields",
      "It throws, because `==` isn't defined for custom classes"
    ],
    "answer": 0,
    "explain": "For a plain class, `==` compares references, so two distinct objects are not equal even with identical data. Use a `record` (which generates value equality) or override `Equals`/`GetHashCode`/`==`. Note `string` is the exception — it compares contents."
  },
  {
    "q": "You write `var evens = numbers.Where(n => n % 2 == 0);`, then `numbers.Add(4);`, then enumerate `evens`. Why does the new `4` show up?",
    "choices": [
      "LINQ is deferred — the query holds a recipe and runs at enumeration time, reading the (now updated) source",
      "`.Where` made a copy of the list, so it tracks changes automatically",
      "Adding to a list always re-runs every query that referenced it",
      "It's a bug; the query should have captured the original three values"
    ],
    "answer": 0,
    "explain": "A LINQ query is deferred: it doesn't run when defined, it runs each time you enumerate it, reading the source then. Since you added 4 before enumerating, the query sees it. Call `.ToList()` at definition time to freeze a snapshot."
  },
  {
    "q": "What does `5 / 2` evaluate to in C#, and how do you get `2.5`?",
    "choices": [
      "It's `2` (integer division discards the remainder); cast an operand to double, e.g. `5 / 2.0` or `(double)5 / 2`",
      "It's `2.5` already — C# promotes int division to double automatically",
      "It's `3` — C# rounds to the nearest integer",
      "It throws a DivideByZeroException for non-divisible numbers"
    ],
    "answer": 0,
    "explain": "Dividing two ints gives an int, dropping the fraction, so `5 / 2` is `2`. Force floating-point division by making at least one operand a double (or decimal) before the division runs. Casting after, like `(double)(5/2)`, is too late."
  }
]
```

---

[← Phase 8: Projects, NuGet & Tooling](08-projects-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: Generics, Deep →](10-generics-deep.md)
