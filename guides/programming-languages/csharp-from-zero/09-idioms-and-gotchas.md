---
title: "Idioms & Common Gotchas - Write It Like a C# Dev, Dodge the Traps"
guide: "csharp-from-zero"
phase: 9
summary: "C# idioms that make code read like C# - properties over fields, var when obvious, string interpolation, null-handling operators, nullable reference types - plus a cheat-card for the classics: == vs Equals, NullReferenceException, deferred LINQ, integer division, and async void."
tags: [csharp, idioms, gotchas, null, equality, value-vs-reference, deferred-execution, async-void]
difficulty: intermediate
synonyms: ["c# == vs equals", "c# nullreferenceexception avoid", "c# value vs reference equality", "c# deferred execution ienumerable", "c# async void", "c# string immutability", "c# best practices beginners"]
updated: 2026-06-22
---

# Idioms & Common Gotchas - Write It Like a C# Dev, Dodge the Traps

You can write C# that compiles and runs. This phase covers the gap between *that* and code that looks like a seasoned C# developer wrote it - plus the traps that have caught every C# programmer who ever lived. (Genuinely - `NullReferenceException` alone has cost the industry more debugging hours than anyone wants to count.)

Two halves. First the **idioms** - conventions that make C# code feel coherent instead of arbitrary. The mental model: *C# rewards saying exactly what you mean, and letting the compiler catch your mistakes*. Expose state through properties, not raw fields; let the compiler infer obvious types; ask for "no value" out loud with nullable reference types instead of letting `null` sneak in unannounced.

Then a scannable **gotcha cheat-card** - surprises named *before* they bite, so you recognize them instead of staring at a stack trace. The mental model: *some types copy by value, some by reference, and queries don't run when you think they do*.

## Idioms - the way it's written today

### Use properties, not public fields

**What it actually is.** A *property* looks like a field from the outside (`user.Name`) but is really a pair of accessors you control. A public field hands out raw access to internals with no way to validate, compute, or change the implementation later.

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
*What just happened:* `Name { get; set; }` is an *auto-property* - the compiler generates a hidden backing field, no more typing than a public field, but a real property. The day you need to validate, log, or make it read-only, you change the property body and *no caller has to change*. A public field never grows those abilities without breaking everyone. Properties are also what data-binding and serializers expect - default to them.

💡 **Key point.** Use `{ get; private set; }` (or `{ get; init; }`) when a value should be set once and stay put. Expose *behavior and controlled state*, not raw memory.

### Prefer `var` when the type is obvious

**What it actually is.** `var` tells the compiler to infer the type from the right-hand side. It's still *statically typed* - `var count = 5;` is exactly an `int`, not dynamic - it just saves repeating a type the reader can already see.

```csharp
var names = new List<string>();        // clearly a List<string>
var count = names.Count;               // clearly an int
var user = new User();                 // clearly a User

// When the type ISN'T obvious from the right side, spell it out:
int total = Calculate();               // what does Calculate return? Be explicit.
```
*What just happened:* on the first three lines the type sits right there on the right of `=`, so `var` removes noise without removing clarity. On the last line `Calculate()`'s return type isn't visible, so naming it (`int`) helps. The idiom: *use `var` when the type is already obvious, name it when it isn't*. Clarity is the goal, not brevity.

### String interpolation with `$"..."`

**What it actually is.** Prefixing a string with `$` lets you drop expressions inside it with `{ }`, instead of gluing pieces with `+` or juggling positional `{0}` placeholders.

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
*What just happened:* `$"...{name}..."` substituted `name`'s value where it appears, and `{age + 1}` evaluated a whole expression inline. Compare to `"Hello, " + name + "! You are " + age + ..."` - the interpolated version reads like the sentence it produces, no forgotten space or mismatched `{0}`. The default way to build strings in modern C#.

### Expression-bodied members and `nameof`

**What it actually is.** When a method or property is a single expression, `=>` writes it on one line instead of a full `{ return ...; }` block. `nameof(x)` turns a symbol into its *name as a string* - checked by the compiler, so a rename or typo becomes a build error instead of a stale string.

```csharp
public class Circle
{
    public double Radius { get; init; }

    // Expression-bodied property and method - concise, no braces needed.
    public double Area => Math.PI * Radius * Radius;
    public override string ToString() => $"Circle(r={Radius})";

    public void SetRadius(double r)
    {
        if (r < 0)
            throw new ArgumentOutOfRangeException(nameof(r), "must be >= 0");
    }
}
```
*What just happened:* `Area => ...` and `ToString() => ...` are *expression-bodied members* - `=>` replaces the `{ return ...; }` ceremony for one-liners. In `SetRadius`, `nameof(r)` produced the string `"r"`, but renaming the parameter updates it via your IDE and a typo won't compile. Use `nameof` anywhere you'd otherwise hard-code a name - exception messages, logging, property-change notifications.

### Null-handling operators: `?.`, `??`, `??=`

**What it actually is.** Three operators tame `null`. `?.` (null-conditional) reads a member only if not null, short-circuiting instead of throwing. `??` (null-coalescing) supplies a fallback when the left side is null. `??=` assigns *only if* the target is currently null.

```csharp
string? maybeName = GetName();   // might return null

int? length = maybeName?.Length;          // null if maybeName is null - no crash
string shown = maybeName ?? "(unknown)";  // fallback when null
maybeName ??= "default";                   // assign only if it was null

Console.WriteLine($"{length} / {shown} / {maybeName}");
```
*What just happened:* `maybeName?.Length` would normally throw a `NullReferenceException`, but `?.` short-circuits to `null` instead. `?? "(unknown)"` supplied a default, and `??=` set a value only because the variable was still null. Together these replace towers of `if (x != null)` checks: "read if present," "fall back if missing," "fill in if empty."

⚠️ **Gotcha - `?.` returns a *nullable*.** `maybeName?.Length` is an `int?`, not `int`. The compiler makes you handle that - don't be surprised you can't assign it straight to a plain `int`. Chain `?? 0` for a non-null result.

### Pattern matching

**What it actually is.** `switch` expressions and `is` patterns test an object's *shape* - type, values, properties - and pull data out in the same step, replacing long `if/else` ladders and clumsy casts with a decision table.

```csharp
object value = 42;

// Type pattern with `is` - test and capture in one move.
if (value is int n && n > 10)
    Console.WriteLine($"big int: {n}");

// switch expression - every input maps to a result, no break needed.
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
*What just happened:* `value is int n` checked the type *and* gave a typed variable `n` in one step - no separate cast that might throw. The `switch` expression mapped each shape to a result, `when` adding extra conditions and `_` catching everything else. The compiler even warns if you forget a case. (Deep dive in [Phase 13](13-records-and-modern-csharp.md).)

### Enable nullable reference types

**What it actually is.** A project-level switch (`<Nullable>enable</Nullable>` in `.csproj`) making the compiler track which references *can* be null. `string` means "never null"; `string?` means "might be null" - it warns whenever you might dereference a null without checking.

```csharp
#nullable enable
string name = null;       // ⚠️ compiler warning: assigning null to non-nullable
string? maybe = null;     // fine - the ? says "this can be null"

void Print(string? text)
{
    Console.WriteLine(text.Length);  // ⚠️ warning: text might be null here
    Console.WriteLine(text?.Length); // fine - guarded with ?.
}
```
*What just happened:* with nullable reference types on, the compiler treats `null` as a *visible part of the type*. `string` promises non-null, so assigning `null` earns a warning; `string?` admits it might be null, so the compiler *insists* you guard every use. This turns `NullReferenceException` from a runtime surprise into a compile-time nag. Turn it on in every new project.

### Dispose with `using`, and program to interfaces

**What it actually is.** Anything holding an unmanaged resource - a file, socket, database connection - implements `IDisposable` and must be *closed* when done. `using` guarantees cleanup runs even if an exception is thrown. And as elsewhere, declare variables and parameters by their *interface* (`IEnumerable<T>`, `IList<T>`) rather than the concrete class, so callers depend on the contract, not the implementation.

```csharp
// `using` declaration: the file is closed automatically at the end of scope.
using var reader = new StreamReader("data.txt");
string firstLine = reader.ReadLine();
// reader.Dispose() runs here, even if ReadLine throws - no leak.

// Program to the interface: callers don't care it's really a List.
void PrintAll(IEnumerable<string> items)
{
    foreach (var item in items)
        Console.WriteLine(item);
}
```
*What just happened:* `using var reader = ...` ties the `StreamReader`'s lifetime to its scope - `Dispose()` runs automatically on exit, even on an exception. Forget `using` and you leak handles. Separately, `PrintAll` accepts `IEnumerable<string>` - the most general interface that does the job - so it works with a `List`, array, LINQ query, or anything iterable.

> 💡 The umbrella idiom: make intent explicit and let the compiler help. Properties expose controlled state, `var` removes noise only where the type is clear, nullable reference types make absence visible, `using` makes cleanup automatic, interfaces narrow the contract. Clarity over cleverness.

## The gotcha cheat-card

> **Hit something baffling? Find the symptom here.** These trap *everyone* - recognizing them on sight is most of the battle.

| The trap | What bites you | The fix |
|---|---|---|
| `==` vs `.Equals()` | For classes, `==` compares *references* - two objects with identical data are "not equal" | Override `Equals`/`==`, or use a `record`; note `string` already compares by value |
| `NullReferenceException` | Calling a member on a `null` reference throws at runtime | `?.`, `??`, nullable reference types, explicit null checks |
| Deferred LINQ execution | A query doesn't run when defined - it re-runs on each enumeration, capturing variables *late* | Materialize with `.ToList()` / `.ToArray()` when you need a stable snapshot |
| Integer division | `5 / 2` is `2`, not `2.5` - the fraction is silently discarded | Cast an operand: `5 / 2.0` or `(double)a / b` |
| `async void` | Exceptions vanish unobserved and callers can't await it | Use `async Task` everywhere except event handlers |
| Mutating a collection in `foreach` | Adding/removing during iteration throws `InvalidOperationException` | Loop a copy, use a `for` loop, or collect changes then apply |
| Struct copy semantics | Assigning or passing a `struct` copies it - your edit hits the copy, not the original | Know value vs reference (Phase 2); prefer classes for mutable shared state |

Now the *why* behind the sharpest ones.

### Deferred execution of LINQ

The one that makes people doubt their sanity. A LINQ query like `numbers.Where(...)` doesn't *run* when written - it builds a *recipe*. The work happens later, every time you enumerate it (`foreach`, `.ToList()`, `.Count()`), reading the source variables *at enumeration time*, not definition time.

```csharp
var numbers = new List<int> { 1, 2, 3 };

// This does NOT run yet - it just describes "evens of numbers".
var evens = numbers.Where(n => n % 2 == 0);

numbers.Add(4);   // we change the source AFTER defining the query

Console.WriteLine(string.Join(", ", evens));  // query runs NOW
Console.WriteLine(string.Join(", ", evens));  // ...and runs AGAIN
```
```console
2, 4
2, 4
```
*What just happened:* `evens` captured the *recipe* "give me the even numbers in `numbers`," not a snapshot. Adding `4` *after* defining the query meant the later enumeration saw it. Worse, each `Console.WriteLine` re-ran the whole query; against a database that's extra round-trips. For a stable result, *materialize* it: `var evens = numbers.Where(...).ToList();` runs the query once and freezes the answer.

⚠️ **Gotcha - deferred queries re-run and capture late.** Two classic bites: (1) enumerating the same query repeatedly redoes the work, and (2) a query inside a loop captures the *loop variable's final value*, not each iteration's. When in doubt, `.ToList()` for a snapshot.

### Integer division

Dividing two `int`s gives an `int` - C# discards the remainder rather than producing a fraction. Bites every beginner computing an average or percentage.

```csharp
int total = 5, count = 2;

Console.WriteLine(total / count);            // 2   - fraction discarded!
Console.WriteLine((double)total / count);    // 2.5 - cast first
Console.WriteLine(total / (double)count);    // 2.5 - either operand works
```
```console
2
2.5
2.5
```
*What just happened:* `5 / 2` is integer arithmetic - `2` with the `.5` silently dropped, no error or warning. Casting one operand to `double` forces *floating-point* division: `2.5`. If you want a fractional result, make at least one operand a `double` (or `decimal` for money) *before* the division runs. `(double)(total / count)` is too late - the integer division already happened.

### `==` vs `.Equals()` - value vs reference equality

For most *classes*, `==` asks "are these the *same object* in memory?" - reference equality. `.Equals()` *can* mean value equality, but a plain class defaults to reference equality until overridden. The big exception: `string` overrides both to compare *contents*, behaving like a value type - which lulls beginners into assuming `==` always compares values, until it breaks on their own class.

```csharp
class Point { public int X, Y; }
record PointR(int X, int Y);   // records compare by value, for free

var a = new Point { X = 1, Y = 2 };
var b = new Point { X = 1, Y = 2 };
Console.WriteLine(a == b);              // False - different objects

var p = new PointR(1, 2);
var q = new PointR(1, 2);
Console.WriteLine(p == q);              // True  - record value equality

Console.WriteLine("hi" == "hi");        // True  - string compares contents
```
```console
False
True
True
```
*What just happened:* the two `Point` objects hold identical data, but `==` on a plain class compares *references* - separate objects, `False`. The two `PointR` *records* compare by value automatically (C# generates `Equals`, `==`, `GetHashCode` from the fields), `True`. `"hi" == "hi"` is `True` because `string` overrides equality to compare characters. For value-like data compared by content, use a **`record`** (or override `Equals`/`GetHashCode`/`==`). Don't assume `==` means value equality just because it does for strings.

📝 **The other three, in one line each.** **`async void`** - can't be awaited, exceptions disappear instead of bubbling to the caller; use `async Task` everywhere except UI event handlers. **Mutating during `foreach`** - adding/removing while iterating throws `InvalidOperationException`; iterate a copy, use an index-based `for`, or collect changes and apply after. **Struct copy semantics** - a `struct` is a *value type* (Phase 2), so assigning or passing it copies the whole thing; mutating that copy leaves the original untouched. For shared mutable state, reach for a `class`.

## Recap

1. **Use properties** (`{ get; set; }`), not public fields - same syntax, but you keep control of validation and future change.
2. **Prefer `var` when the type is obvious**, name the type when it isn't; use **`$"..."`** interpolation, **expression-bodied members**, and **`nameof`** for compiler-checked names.
3. **Tame `null`** with `?.`, `??`, `??=`, and turn on **nullable reference types** so the compiler catches `NullReferenceException` before runtime. Dispose with **`using`** and **program to interfaces**.
4. ⚠️ **Deferred LINQ** doesn't run until enumerated, re-runs each time, and captures variables late - `.ToList()` to snapshot it.
5. ⚠️ **The cheat-card** - `==` on a class compares references (use a `record` or override `Equals` for value equality; `string` already compares contents); `5 / 2` is `2` (cast to `double`); `async void` swallows exceptions; mutating a collection in `foreach` throws; structs copy by value.

That's idiomatic C#. You can now read other people's C# and write code that looks like it belongs, having met the traps before they meet you. Next we go deep on **generics**: how `List<T>` really works, constraints, variance, and why the compiler sometimes argues with you about types.

## Quick check

Test yourself on the three traps that catch everyone:

```quiz
[
  {
    "q": "You have two plain-class objects with identical field values: `var a = new Point{X=1,Y=2};` and `var b = new Point{X=1,Y=2};`. What does `a == b` return, and how do you get value equality?",
    "choices": [
      "`False` - `==` compares references for a class; use a `record` or override `Equals`/`==` to compare by value",
      "`True` - C# always compares objects by their field values",
      "`True` - but only because Point has two fields",
      "It throws, because `==` isn't defined for custom classes"
    ],
    "answer": 0,
    "explain": "For a plain class, `==` compares references, so two distinct objects are not equal even with identical data. Use a `record` (which generates value equality) or override `Equals`/`GetHashCode`/`==`. Note `string` is the exception - it compares contents."
  },
  {
    "q": "You write `var evens = numbers.Where(n => n % 2 == 0);`, then `numbers.Add(4);`, then enumerate `evens`. Why does the new `4` show up?",
    "choices": [
      "LINQ is deferred - the query holds a recipe and runs at enumeration time, reading the (now updated) source",
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
      "It's `2.5` already - C# promotes int division to double automatically",
      "It's `3` - C# rounds to the nearest integer",
      "It throws a DivideByZeroException for non-divisible numbers"
    ],
    "answer": 0,
    "explain": "Dividing two ints gives an int, dropping the fraction, so `5 / 2` is `2`. Force floating-point division by making at least one operand a double (or decimal) before the division runs. Casting after, like `(double)(5/2)`, is too late."
  }
]
```

---

[← Phase 8: Projects, NuGet & Tooling](08-projects-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: Generics, Deep →](10-generics-deep.md)
