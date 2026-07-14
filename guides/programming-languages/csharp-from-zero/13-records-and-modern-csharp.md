---
title: "Records, Pattern Matching & Modern C# - Less Boilerplate, More Safety"
guide: "csharp-from-zero"
phase: 13
summary: "Records give you immutable value types in one line. Pattern matching lets you ask 'what shape is this data?' cleanly. Plus init/required members and nullable reference types - the features that make modern C# concise and safe."
tags: [csharp, records, pattern-matching, switch-expressions, nullable-reference-types, init-only, modern-csharp]
difficulty: intermediate
synonyms: ["c# records explained", "c# record vs class", "c# pattern matching switch", "c# nullable reference types", "c# init only properties", "c# with expression", "c# required members"]
updated: 2026-06-22
---

# Records, Pattern Matching & Modern C# - Less Boilerplate, More Safety

Back in [Phase 5](05-classes-and-objects.md) you wrote a `class` by hand: fields, a constructor that copies parameters into them, maybe an overridden `ToString`, and - if you wanted two objects with the same data to count as equal - a pile of equality code you didn't even attempt. A lot of typing for a simple idea: "a little bundle of values."

Modern C# noticed, growing features whose whole purpose is to *delete boilerplate* while making code *safer*. The frame is the same throughout: **here's the old verbose way, and here's the new concise way the compiler now writes for you.**

The two headliners - **records** and **pattern matching** - pair up beautifully. Records let you *define* small immutable data types in a line; pattern matching lets you *ask questions* about that data - "what shape is this? what's inside it?" - without a ladder of `if`/`else`. Together they're C#'s answer to modeling "this value is one of a fixed set of possibilities" cleanly.

## Records - immutable data types in one line

📝 **Record** - a type (class or struct) declared with the `record` keyword, designed for holding data. From a single line, the compiler generates the constructor, the properties, value-based `Equals` and `GetHashCode`, a readable `ToString`, and deconstruction support. You write the *intent*; the compiler writes the ceremony.

Remember the `Account ==` gotcha from Phase 5? Two class objects with identical data were *not* equal, because classes compare by reference rather than by value. Records flip that default - built for exactly the "a point is its X and Y, nothing more" value that *should* compare by contents.

The old way - a hand-written class for a simple point:

```csharp
class PointClass
{
    public int X { get; }
    public int Y { get; }

    public PointClass(int x, int y)
    {
        X = x;
        Y = y;
    }

    public override string ToString() => $"PointClass {{ X = {X}, Y = {Y} }}";

    public override bool Equals(object? obj) =>
        obj is PointClass p && p.X == X && p.Y == Y;

    public override int GetHashCode() => HashCode.Combine(X, Y);
}
```
*What just happened:* Roughly twenty lines to say "a point is two ints, and two points with the same numbers are equal." The constructor copies parameters into properties, `ToString` builds a readable string, and `Equals`/`GetHashCode` do the value comparison by hand - easy to get subtly wrong (forget a field and equality silently breaks).

Now watch it collapse:

```csharp
record Point(int X, int Y);
```
*What just happened:* That one line - a **positional record** - generates *all* of the above. `(int X, int Y)` is the **primary constructor**: it declares two init-only properties `X` and `Y` *and* a constructor that fills them. Value equality, a tidy `ToString`, and deconstruction, for free. Twenty lines became one, and the generated version can't drift out of sync the way hand-written equality does.

```csharp
var a = new Point(1, 2);
var b = new Point(1, 2);

Console.WriteLine(a);          // ToString, generated
Console.WriteLine(a == b);     // value equality, generated
Console.WriteLine(a.X);        // property, generated

var (x, y) = a;                // deconstruction, generated
Console.WriteLine($"x={x}, y={y}");
```
```console
Point { X = 1, Y = 2 }
True
1
x=1, y=2
```
*What just happened:* `a == b` is `True` - the opposite of the class behavior in Phase 5 - because records compare by *contents*. `Console.WriteLine(a)` printed a readable summary instead of the type name, and `var (x, y) = a` pulled the two values straight out (deconstruction), no code written.

**Non-destructive mutation with `with`.** Records are immutable by default - those generated properties are init-only, so you can't change a `Point` after building it. For "the same thing, with one field different," use the `with` expression: it makes a *copy*, changing only what you name, leaving the original untouched.

```csharp
var p1 = new Point(1, 2);
var p2 = p1 with { Y = 99 };   // a copy of p1, but Y is 99

Console.WriteLine(p1);          // unchanged
Console.WriteLine(p2);          // the modified copy
```
```console
Point { X = 1, Y = 2 }
Point { X = 1, Y = 99 }
```
*What just happened:* `p1 with { Y = 99 }` produced a brand-new `Point` carrying `p1`'s `X` and an overridden `Y`. `p1` itself never changed - *non-destructive* mutation: the convenience of "tweak this value" without the bugs of objects mutating under you while other code holds a reference.

💡 **When to reach for a record.** Use records for **data defined by its values** - DTOs, value objects (`Money`, `Coordinate`, `DateRange`), events, query results. Use a regular `class` for things with *identity and behavior* that mutate over their lifetime - a `ShoppingCart`, a database connection, a game's `Player`. Quick test: if "two of these are the same when their contents match," it wants to be a record.

📝 **`record struct`.** `record` defaults to a reference type (a class). Write `record struct Point(int X, int Y);` for the same conveniences on a *value type* - copied on assignment, lives on the stack when local, no heap allocation. One difference to know: a positional `record struct`'s properties are mutable (`get; set;`) by default, so it is *not* immutable like a `record` class; write `readonly record struct Point(int X, int Y);` if you want the same init-only immutability. Reach for it for tiny, short-lived values to avoid heap pressure; plain `record` is the right default until you've measured a reason to switch.

## `init` and `required` members - immutability without a giant constructor

Records bake in init-only properties, but you can use the same tools on any class. You met `init` briefly in Phase 5 - here's why it matters.

📝 **`init` accessor** - like `set`, but it can *only* run during object construction (in a constructor or an object initializer); after that, the property is frozen. **`required` member** - a property the compiler *forces* the caller to set when creating the object, or the code won't compile.

The old tension: object initializers (`new Thing { A = 1, B = 2 }`) read beautifully, but a plain `set` property leaves the object mutable forever, and nothing stops a caller forgetting a field. `init` + `required` resolve both - initializer syntax, guaranteed-set fields, immutability afterward.

```csharp
class Config
{
    public required string Host { get; init; }   // must be set; frozen after
    public int Port { get; init; } = 8080;        // optional, with a default
}

var c = new Config { Host = "localhost", Port = 5432 };
Console.WriteLine($"{c.Host}:{c.Port}");
// c.Host = "other";   // compile error: init-only, can't assign after construction
// var bad = new Config { Port = 1 };  // compile error: required 'Host' not set
```
```console
localhost:5432
```
*What just happened:* `required string Host` made the compiler refuse any `new Config { ... }` that doesn't set `Host` - a compile error instead of a runtime `null`. Both properties are `init`, so once `c` is built its values are locked - readability of object initializers plus safety of immutability, no sprawling constructor.

## Pattern matching - asking "what shape is this data?"

**Pattern matching** is C#'s way of testing a value's *shape* - its type, contents, structure - and pulling pieces out of it in one concise expression. It replaces tall stacks of `if (x is SomeType) { var y = (SomeType)x; if (y.Prop > 5) ... }`.

**The `is` pattern.** The simplest form tests a type *and* binds a variable in one move:

```csharp
object o = "hello";

if (o is string s)                 // is it a string? if so, call it s
    Console.WriteLine(s.Length);   // s is already typed as string here
```
```console
5
```
*What just happened:* `o is string s` did two jobs at once: checked whether `o` is a `string`, and if so assigned it to a properly-typed variable `s` you can use immediately - no separate cast, no second declaration. The old way was a type check followed by an explicit `(string)o` cast; this fuses them.

**`switch` expressions with patterns.** The real power shows up in the `switch` *expression* (produces a value, distinct from the older `switch` statement): it matches a value against a series of patterns and returns the arm that fits.

```csharp
static string Classify(object value) => value switch
{
    int n when n < 0      => "negative int",
    int n                 => $"int: {n}",          // type pattern, binds n
    string { Length: 0 }  => "empty string",        // property pattern
    string s              => $"string of {s.Length}",
    null                  => "null",
    _                     => "something else"       // _ is the catch-all
};

Console.WriteLine(Classify(42));
Console.WriteLine(Classify(-3));
Console.WriteLine(Classify("hi"));
Console.WriteLine(Classify(""));
Console.WriteLine(Classify(null));
Console.WriteLine(Classify(3.14));
```
```console
int: 42
negative int
string of 2
empty string
null
something else
```
*What just happened:* The `switch` expression tested `value` top to bottom and returned the first matching arm. `int n` is a **type pattern** binding the matched value to `n`. `when n < 0` adds a **guard** - an extra condition. `string { Length: 0 }` is a **property pattern**: matches a string *and* checks its `Length` is 0. `_` is the discard, the catch-all. Compare this to a nest of `if`/`else if` with manual casts: same logic, a fraction of the noise, and the compiler warns if you've left a case unhandled.

**Relational and logical patterns.** Inside a pattern you can use `<`, `>`, `<=`, `>=` and combine patterns with `and`, `or`, `not` - reading like the math you'd say out loud:

```csharp
static string Grade(int score) => score switch
{
    < 0 or > 100 => "invalid",
    >= 90        => "A",
    >= 80        => "B",
    >= 70        => "C",
    _            => "F"
};

Console.WriteLine(Grade(95));
Console.WriteLine(Grade(72));
Console.WriteLine(Grade(150));
```
```console
A
C
invalid
```
*What just happened:* `< 0 or > 100` is a **logical pattern** combining two **relational patterns**. The arms below lean on order: once `>= 90` fails, `>= 80` only sees scores under 90, so you don't repeat the upper bound - clearer than `if (score < 0 || score > 100)` chains.

**Property and positional patterns - matching deep into data.** Property patterns shine on records; you can match nested fields, and because records support deconstruction you can also use **positional patterns** that match by position:

```csharp
record Person(string Name, int Age);

static string Describe(Person p) => p switch
{
    { Age: > 64 }            => $"{p.Name} is a senior",
    { Age: >= 18 and < 65 }  => $"{p.Name} is an adult",
    ("Sam", _)               => "Hi Sam, whatever your age",   // positional pattern
    { Age: < 0 }             => "invalid age",
    _                        => $"{p.Name} is a minor"
};

Console.WriteLine(Describe(new Person("Ada", 70)));
Console.WriteLine(Describe(new Person("Bo", 30)));
Console.WriteLine(Describe(new Person("Sam", 5)));
Console.WriteLine(Describe(new Person("Kit", 10)));
```
```console
Ada is a senior
Bo is an adult
Hi Sam, whatever your age
Kit is a minor
```
*What just happened:* `{ Age: > 64 }` is a **property pattern** reaching into the record's `Age`. `{ Age: >= 18 and < 65 }` combines a property pattern with a logical-relational pattern. `("Sam", _)` is a **positional pattern**: it deconstructs the `Person` by position (`Name`, `Age`), matching when the first slot is `"Sam"` and the second is anything (`_`).

💡 **Why this pairing matters.** Records + pattern matching is how C# models "this value is one of a fixed set of cases" - a shape that's an `Empty`, a `Circle`, or a `Rectangle`; a result that's a `Success` or a `Failure`. Define the cases as records, then `switch` over them with type and property patterns; the compiler can tell you when you've forgotten a case.

## Nullable reference types - the compiler hunts your null bugs

📝 **Nullable reference types (NRT)** - a compiler feature (on by default in new projects via `<Nullable>enable</Nullable>` in the `.csproj`) that splits reference types into two: `string` means "never null," `string?` means "might be null." The compiler then *warns* you wherever you might dereference something that could be null.

You met this in [Phase 2](02-syntax-values-and-types.md). The single most common crash in C# history is the `NullReferenceException` - calling `.Length` or `.Name` on something that turned out to be `null`. NRT's goal: move that discovery from *3 a.m. in production* to *right now, as a squiggle in your editor*.

```csharp
// With <Nullable>enable</Nullable>:
string name = "Ada";       // non-null: the compiler guarantees it
string? maybe = null;      // nullable: explicitly allowed to be null

Console.WriteLine(name.Length);    // fine - name can't be null

// Console.WriteLine(maybe.Length);   // WARNING: 'maybe' may be null here

if (maybe is not null)             // once you check...
    Console.WriteLine(maybe.Length);   // ...the warning is gone - compiler knows it's safe
```
```console
3
```
*What just happened:* `string name` is non-nullable, so the compiler lets you use `name.Length` freely. `string? maybe` is nullable, so dereferencing it without a check earns a *compile-time warning*. After `if (maybe is not null)`, the compiler's **flow analysis** understands `maybe` can't be null inside that block, so the warning disappears.

**The null-forgiving operator `!`.** Occasionally you know more than the compiler - certain a value isn't null even though it can't prove it. The `!` operator says "trust me, this isn't null" and silences the warning:

```csharp
string? maybe = GetItMaybe();
string definitely = maybe!;        // 'I promise this isn't null'
```
*What just happened:* `maybe!` tells the compiler to treat the value as non-null and drop the warning. ⚠️ Use this *rarely*, only when genuinely certain - it's a promise *you* make, not a check. If you're wrong, you get the very `NullReferenceException` the feature was meant to prevent, safety net deliberately switched off.

⚠️ **NRT is compile-time analysis, not a runtime guarantee.** `string` (non-nullable) is a *promise the compiler tries to verify*, not a wall enforced when the program runs. A `null` can still sneak in - from older code compiled without NRT, JSON deserialization, reflection, a library that ignores the annotations. NRT makes nulls *visible* and *much rarer*, not *impossible* - treat the warnings as an early-warning system, not a force field.

## Other modern niceties - small wins that add up

A grab-bag of recent features that quietly trim noise from everyday code, together making modern C# read cleaner than a few years ago.

**Target-typed `new()`.** When the type is already obvious from the left side, you don't repeat it on the right:

```csharp
// old: type written twice
List<string> names1 = new List<string>();

// new: the compiler infers it from the declared type
List<string> names2 = new();
Dictionary<string, int> counts = new();
Point origin = new(0, 0);
```
*What just happened:* `new()` fills in the type from the variable's declared type on the left - unambiguous, shorter, no `List<string>` echoed twice.

**`using` declarations.** Phase 11's `using` statement needed braces and an extra indent. A `using` *declaration* drops both - the resource is disposed automatically at the end of the enclosing scope:

```csharp
// old: using statement, extra braces and nesting
using (var reader = new StreamReader("data.txt"))
{
    Console.WriteLine(reader.ReadLine());
}

// new: using declaration - disposed at end of the method, no braces
using var reader2 = new StreamReader("data.txt");
Console.WriteLine(reader2.ReadLine());
```
*What just happened:* `using var reader2 = ...` schedules `reader2.Dispose()` for the end of the current scope, exactly like the block form, minus the braces and indentation.

**File-scoped namespaces.** Declare the namespace once with a semicolon and skip the wrapping braces that indented your whole file:

```csharp
// old: braces wrap (and indent) the entire file
namespace MyApp
{
    class Thing { }
}

// new: file-scoped - one line, no indentation tax
namespace MyApp;

class Thing { }
```
*What just happened:* `namespace MyApp;` applies to the entire file, so everything below sits at the left margin instead of indented inside braces - the modern default, since almost every file has exactly one namespace.

**Top-level statements (recap).** As seen in Phase 1, a simple program doesn't need `class Program { static void Main() { ... } }` scaffolding - write executable statements straight in `Program.cs`, and the compiler generates `Main` for you.

## Recap

1. **Records** (`record Point(int X, int Y);`) generate the constructor, properties, value equality, `ToString`, and deconstruction from one line. They compare by *contents* (fixing the Phase 5 `==` gotcha), are immutable by default, and support `with` for non-destructive copies. Use for DTOs and value objects; `record struct` for tiny value-type versions.
2. **`init` and `required`** give object-initializer syntax with immutability: `init` freezes a property after construction, `required` forces callers to set it - "forgot a field" becomes a compile error.
3. **Pattern matching** - `is` patterns, `switch` expressions, and type/property/relational/logical/positional patterns - tests a value's *shape* and extracts its parts declaratively, replacing tall `if`/cast ladders.
4. **Nullable reference types** split `string` (non-null) from `string?` (nullable) and warn at compile time about possible null dereferences; `!` silences a warning when certain (use rarely). ⚠️ Compile-time analysis, **not** a runtime guarantee - nulls can still slip in.
5. **Modern niceties** - target-typed `new()`, `using` declarations, file-scoped namespaces, top-level statements - each delete a bit of repetition.
6. 💡 **Records + pattern matching together** model "one of a fixed set of cases" - define the cases as records, `switch` over them by shape.

You can now write modern C# that's both shorter and safer than the verbose style - less boilerplate to maintain, more bugs caught before you run. Next: **async/await and Tasks**, the feature that lets your programs do many things at once without freezing.

## Quick check

Test yourself on the two ideas that define this phase - records' value equality and pattern matching:

```quiz
[
  {
    "q": "You define `record Point(int X, int Y);`, then create `var a = new Point(1, 2);` and `var b = new Point(1, 2);`. What does `a == b` return, and why?",
    "choices": [
      "True - records compare by value (their contents), so two points with the same X and Y are equal",
      "False - like all C# types, == compares whether they're the same object in memory",
      "A compile error, because you can't use == on a record",
      "True, but only because they were created in the same method"
    ],
    "answer": 0,
    "explain": "Records generate value-based equality, so `a == b` is True when their contents match - the opposite of a plain class, where == compares object identity. This is exactly why records suit DTOs and value objects."
  },
  {
    "q": "What does the pattern `{ Age: >= 18 and < 65 }` match in a switch expression over a record?",
    "choices": [
      "A value whose Age property is at least 18 and less than 65 (a property pattern combined with relational/logical patterns)",
      "A value that equals the literal 18 or 65",
      "Any record that has a property named Age, regardless of its value",
      "A list of ages between 18 and 65"
    ],
    "answer": 0,
    "explain": "It's a property pattern (`{ Age: ... }`) reaching into the record's Age, combined with relational patterns (`>= 18`, `< 65`) joined by the logical pattern `and`. It matches when Age is in the range 18 to 64 inclusive."
  },
  {
    "q": "Under `<Nullable>enable</Nullable>`, what does declaring a variable as `string` (no `?`) actually give you?",
    "choices": [
      "A compile-time promise the compiler tries to verify (warning you about possible null dereferences) - not a runtime guarantee that it can never be null",
      "A runtime guarantee that the value can never, under any circumstances, be null",
      "Exactly the same behavior as `string?` - the `?` is purely cosmetic",
      "A value that automatically converts null into an empty string"
    ],
    "answer": 0,
    "explain": "Nullable reference types are compile-time flow analysis: `string` means 'intended non-null' and the compiler warns where a null might slip through. But it's not enforced at runtime - nulls can still arrive from deserialization, reflection, or older code, so a NullReferenceException remains possible."
  }
]
```

---

[← Phase 12: LINQ](12-linq.md) · [Guide overview](_guide.md) · [Phase 14: async/await & Tasks →](14-async-await-and-tasks.md)
