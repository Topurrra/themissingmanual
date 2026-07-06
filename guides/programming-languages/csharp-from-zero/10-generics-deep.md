---
title: "Generics, Deep - Type Safety Without Duplication"
guide: "csharp-from-zero"
phase: 10
summary: "Generics let you write code once that works for many types - with compile-time safety and no boxing. Generic methods and classes, constraints, covariance/contravariance, and why C# generics are reified, not erased like Java's."
tags: [csharp, generics, type-parameters, constraints, covariance, contravariance, generic-methods]
difficulty: advanced
synonyms: ["c# generics explained", "c# generic constraints where", "c# generic method", "c# covariance contravariance in out", "c# generic class", "c# default(T)", "c# generics vs java erasure"]
updated: 2026-06-22
---

# Generics, Deep - Type Safety Without Duplication

Back in [Phase 3](03-collections.md) you used `List<T>` the way everyone first meets generics: you wrote `List<string>`, it held strings, and the compiler stopped you shoving an `int` in - you took the `<T>` on faith. This phase covers what that angle-bracket actually *is*.

The mental model: a generic is **code with a hole in it where a type goes**. You write the logic once, leave the type as a blank labeled `T`, and the compiler fills that blank - `string`, `int`, `User`, whatever - when you use it. Write it *once*, keep full *compile-time type safety*, pay *zero runtime cost*.

## Why generics exist - the bad old days of `object`

Before generics, a list that could hold *anything* meant using `object` - the type every other type inherits from. It compiles fine. It's also a trap.

```csharp
// Pre-generics: a list of `object` holds anything... which is the problem.
var things = new System.Collections.ArrayList();
things.Add(42);
things.Add("not a number");   // compiler is fine with this - uh oh

int first = (int)things[0];   // cast back: works
int second = (int)things[1];  // cast back: BOOM at runtime
```
```console
Unhandled exception. System.InvalidCastException: Unable to cast object
of type 'System.String' to type 'System.Int32'.
```
*What just happened:* `ArrayList` stores everything as `object`, so it happily accepted both an `int` and a `string` - the compiler had no idea the second item wasn't a number. The mistake surfaced only at runtime, when the cast on `things[1]` blew up *in production*. There's a quieter cost too: stuffing `42` into an `object` slot **boxes** it - wraps it in a heap-allocated object - and casting it back **unboxes** it, an allocation and a copy for every value-type item.

Generics fix both problems at once: `List<int>` knows its contents are `int`s, so the mistake becomes a *compile error* and the boxing never happens - the `int`s are stored raw.

```csharp
var numbers = new List<int>();
numbers.Add(42);
numbers.Add("not a number");   // ⚠️ compile error - caught before you run
int first = numbers[0];        // no cast, no boxing
```
```console
error CS1503: Argument 1: cannot convert from 'string' to 'int'
```
*What just happened:* `List<int>` carries its element type in the type itself, so `Add("not a number")` is rejected at *compile time* - the bug can never reach a user. Because the list genuinely holds `int`s, not boxed `object`s, reading `numbers[0]` needs no cast and no heap allocation. **`object` gives you flexibility by throwing away type information; generics give you flexibility while keeping it.**

## Generic methods and classes - write the logic once

A generic puts a *type parameter* - conventionally `T` - into a method or class signature. Inside, `T` stands in for "whatever type the caller used"; the compiler checks the body against that placeholder and substitutes the real type at each call.

📝 **Type parameter** - a named placeholder for a type, written in angle brackets (`<T>`), filled in by the caller or the compiler's inference. By convention single letters: `T` for "type," `TKey`/`TValue` for paired roles, `TResult` for a return.

A generic *method* - "give me the first item" works for a list of anything:

```csharp
// <T> declares the placeholder; it then appears in the parameter and return types.
T First<T>(List<T> items)
{
    return items[0];
}

var words = new List<string> { "alpha", "beta" };
var sizes = new List<int> { 10, 20, 30 };

string w = First(words);   // T inferred as string - note: no First<string>(...) needed
int n = First(sizes);      // T inferred as int
Console.WriteLine($"{w}, {n}");
```
```console
alpha, 10
```
*What just happened:* `First<T>` is one method that works for any element type. You didn't write `First<string>(words)` - the compiler performed **type inference**, saw `words` was a `List<string>`, deduced `T` must be `string`, and filled it in, so `w` comes back a real `string` with no cast needed.

A generic *class* - a little box that holds one value of whatever type you choose:

```csharp
class Box<T>
{
    private T _value;

    public Box(T value) => _value = value;

    public T Get() => _value;

    // default(T): the "zero" value for whatever T is.
    public bool IsDefault() => EqualityComparer<T>.Default.Equals(_value, default(T));
}

var boxedInt = new Box<int>(0);
var boxedName = new Box<string>("Ada");
Console.WriteLine($"{boxedInt.IsDefault()} / {boxedName.Get()}");
```
```console
True / Ada
```
*What just happened:* `Box<T>` is a class with a type-shaped hole - `new Box<int>(0)` stamps out a box holding an `int`; `new Box<string>("Ada")` a box holding a `string`. The interesting bit is `default(T)`: every type has a *default value* - `0` for `int`, `false` for `bool`, `null` for reference types - and `default(T)` gives you that value generically, without knowing what `T` is. We used it to check whether the box holds its type's "zero."

💡 **Key point.** `default(T)` matters because inside a generic you often need a starting value but can't write a literal - you don't know if `T` is a number, a string, or a struct. Modern C# lets you shorten `default(T)` to just `default` wherever the target type is already known.

## Constraints - telling the compiler what `T` can do

There's a catch in `First<T>` and `Box<T>`: the compiler assumes `T` could be *literally any type*, so it only lets you do things every type supports - store it, pass it around, call `.ToString()`. Try `a > b`, `new T()`, or `a.SomeMethod()` and it refuses, since not every type has those.

The fix is a **constraint**: a `where` clause that narrows what `T` is allowed to be, which in turn *unlocks* the operations that narrower set of types supports.

📝 **Constraint** - a `where T : ...` clause restricting which types can be used for `T`. A two-way promise: you limit the callers' choices, and in exchange the compiler lets you use the capabilities all allowed types are guaranteed to have.

The common constraints:

| Constraint | Means "T must be…" | Unlocks |
|---|---|---|
| `where T : class` | a reference type | comparing to `null`, `null` defaults |
| `where T : struct` | a value type (non-nullable) | value semantics; `T` is never null |
| `where T : new()` | a type with a public parameterless constructor | calling `new T()` |
| `where T : IComparable<T>` | a type implementing that interface | calling `.CompareTo(...)` |
| `where T : SomeBaseClass` | that class or a subclass | that base's members |

Without a constraint you can't write a generic "max" - the compiler can't assume `T` is comparable. Add `where T : IComparable<T>` and it works:

```csharp
// IComparable<T> guarantees a.CompareTo(b) exists, which is what unlocks the comparison.
T Max<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) >= 0 ? a : b;
}

Console.WriteLine(Max(3, 9));          // works for int (int : IComparable<int>)
Console.WriteLine(Max("apple", "pear")); // works for string too
```
```console
9
pear
```
*What just happened:* `a.CompareTo(b)` returns a number - negative if `a` is smaller, positive if bigger, zero if equal. That method exists only because we *promised*, via `where T : IComparable<T>`, that every `T` implements it. `int` and `string` both do, so both calls compile. Drop the `where` clause and the compiler rejects `a.CompareTo(b)` outright - `T` might otherwise be a type that can't be compared at all.

The `new()` constraint lets a generic *manufacture* instances:

```csharp
// new() promises T has a parameterless constructor, so `new T()` is allowed.
T MakeOne<T>() where T : new()
{
    return new T();
}

var freshList = MakeOne<List<int>>();   // calls new List<int>()
Console.WriteLine(freshList.Count);
```
```console
0
```
*What just happened:* `new T()` is normally forbidden in a generic - the compiler can't know `T` even *has* a usable constructor. The `where T : new()` constraint guarantees it does, so `new T()` becomes legal.

When a caller violates a constraint, the error lands at compile time:

```csharp
class NoDefaultCtor
{
    public NoDefaultCtor(int required) { }   // only constructor needs an argument
}

var bad = MakeOne<NoDefaultCtor>();   // ⚠️ no parameterless constructor
```
```console
error CS0310: 'NoDefaultCtor' must be a non-abstract type with a public
parameterless constructor in order to use it as parameter 'T' in 'MakeOne<T>()'
```
*What just happened:* `NoDefaultCtor` only has a constructor that *requires* an argument, so it fails the `new()` constraint. The compiler refuses the call and tells you why - `T` doesn't meet the promise the method depends on.

## Covariance and contravariance - the genuinely tricky bit

A `Cat` is an `Animal`. So a `List<Cat>` is a `List<Animal>`… right? In C#, **no** - and the reason matters.

⚠️ The intuition is *half* true. Whether `Something<Cat>` can stand in for `Something<Animal>` depends on whether that "something" only ever *hands values out* or also *takes values in*.

Imagine the substitution were always allowed - you hand your `List<Cat>` to code that thinks it has a `List<Animal>`:

```csharp
List<Cat> cats = new List<Cat> { new Cat() };
List<Animal> animals = cats;   // PRETEND this were allowed...
animals.Add(new Dog());        // ...a Dog, into a list that's really all Cats. Corruption.
Cat c = cats[0];               // your "list of cats" now contains a Dog
```
*What just happened (in this hypothetical):* if `List<Cat>` could masquerade as `List<Animal>`, code holding the `List<Animal>` view could legally `Add` a `Dog` - because a `Dog` *is* an `Animal`. But the underlying list is genuinely all `Cat`s, so you've smuggled a `Dog` into it. That's why C# forbids the assignment: `List<T>` lets you *write* into it, and writing is where widening goes wrong.

Now flip it: a type that only ever *produces* values can widen safely - a thing that hands you `Cat`s can be treated as a thing that hands you `Animal`s, since every `Cat` it gives out *is* an `Animal`. That's **covariance**, and `IEnumerable<T>` (read-only iteration) is declared this way with the keyword `out`:

```csharp
IEnumerable<Cat> cats = new List<Cat> { new Cat(), new Cat() };
IEnumerable<Animal> animals = cats;   // ALLOWED - IEnumerable<out T> is covariant

foreach (Animal a in animals)         // every Cat handed out is, indeed, an Animal
    Console.WriteLine(a.GetType().Name);
```
```console
Cat
Cat
```
*What just happened:* `IEnumerable<T>` is declared `IEnumerable<out T>` - `out` marks `T` as **covariant**, "this type only ever *produces* `T`, never consumes one." Because iteration only *reads* items out, treating an `IEnumerable<Cat>` as an `IEnumerable<Animal>` is safe: every value pulled is a `Cat`, which is an `Animal`, and there's no `Add` to corrupt anything.

The mirror image is **contravariance**: a type that only ever *consumes* values can be treated as one that accepts a *narrower* type. `Action<in T>` (a function taking a `T`, returning nothing) is the classic case:

```csharp
// A consumer of Animals: it can handle ANY animal handed to it.
Action<Animal> describe = a => Console.WriteLine($"an {a.GetType().Name}");

// We need something that consumes Cats. An Animal-consumer qualifies - it eats cats too.
Action<Cat> describeCat = describe;   // ALLOWED - Action<in T> is contravariant
describeCat(new Cat());
```
```console
an Cat
```
*What just happened:* `Action<T>` is declared `Action<in T>` - `in` marks `T` as **contravariant**, "this type only ever *consumes* `T`." We needed something that consumes `Cat`s; `describe` consumes *any* `Animal`, so it handles a `Cat` fine. Consumers can safely *narrow*.

One sentence covers it: **`out` = produces-only = can widen (covariant); `in` = consumes-only = can narrow (contravariant); both = invariant, no substitution.** `List<T>` does both, which is why it's invariant and the first example was illegal.

⚠️ **Gotcha - arrays are unsafely covariant, a historical wart.** Arrays *do* allow `Animal[] a = new Cat[2];`, even though arrays are writable. C# inherited this from early .NET (before generics existed) for compatibility, and it's a known design mistake: every array write carries a hidden *runtime* type check, and writing the wrong type throws `ArrayTypeMismatchException` instead of failing at compile time. Generics learned from this - `List<T>` is invariant so the same bug can't happen. Treat array covariance as a trap, not a feature.

## C# generics are reified - a real edge over Java

Java implements generics by **type erasure**: `List<String>` and `List<Integer>` are *the same type at runtime* - the `<String>` is a compile-time fiction deleted before the program runs. That's why Java can't do `new T()`, can't ask `T.class`, and boxes every `int` into an `Integer`.

C# made the opposite choice: generics are **reified**, the type information is *real at runtime*, baked into the actual type.

📝 **Reified generics** - generic type information that survives to runtime, rather than being erased after compilation. In C#, `List<int>` and `List<string>` are genuinely *distinct types* at runtime, and `T` is a real, queryable type inside generic code.

💡 **Key point.** Three consequences fall out of reification, each impossible under Java's erasure:
- **`typeof(T)` works** - ask, at runtime, "what type is `T` right now?" and get a real answer.
- **`new T()` works** (with the `new()` constraint) - the runtime knows what `T` is, so it can construct one.
- **Value types avoid boxing** - `List<int>` stores raw `int`s, not boxed `Integer`-style objects. Java *must* box, since erased generics can't hold a primitive.

```csharp
void Inspect<T>() where T : new()
{
    T instance = new T();              // reification: runtime can build a T
    Console.WriteLine($"T is {typeof(T).Name}");   // and tell you what T is
    Console.WriteLine($"made: {instance}");
}

Inspect<List<int>>();

// And distinct runtime types - not the case in Java:
Console.WriteLine(typeof(List<int>) == typeof(List<string>));
```
```console
T is List`1
made: System.Collections.Generic.List`1[System.Int32]
```
*What just happened:* inside `Inspect<T>`, both `typeof(T)` and `new T()` work because the runtime genuinely *knows* what `T` is. The final comparison prints `False`: `List<int>` and `List<string>` are different runtime types. (``List`1`` is .NET's name for "a generic List with 1 type parameter.") Under Java's erasure, `T` would be unknowable, `new T()` impossible, `List<Integer>`/`List<String>` indistinguishable.

## Recap

1. **Why generics:** the old `object`-and-cast approach pushed type errors to *runtime* and boxed every value type. Generics keep type information, so mistakes become *compile errors* and value types stay unboxed.
2. **Generic methods and classes** (`T First<T>(...)`, `class Box<T>`) write logic once for many types; the compiler **infers** `T` from arguments, and `default(T)` / `default` gives a generic "zero" value when you can't write a literal.
3. **Constraints** (`where T : class / struct / new() / IComparable<T> / SomeBase`) narrow what `T` can be and *unlock* operations - like `a.CompareTo(b)` or `new T()` - those types are guaranteed to support. Violations fail at compile time.
4. **Covariance (`out`) and contravariance (`in`)**: a *producer-only* type (`IEnumerable<out T>`) can safely widen; a *consumer-only* type (`Action<in T>`) can safely narrow. `List<T>` reads *and* writes, so it's invariant. Arrays are unsafely covariant - a historical wart that throws at runtime.
5. **Reified generics:** C# keeps type info at runtime, so `typeof(T)`, `new T()`, and `List<int>` ≠ `List<string>` all work, and value types avoid boxing - an advantage over Java's erasure.

You can now write code with type-shaped holes the compiler fills safely and for free. Next: **delegates, lambdas, and events** - functions as values, the engine behind LINQ and most of the .NET event model.

## Quick check

Test yourself on the three ideas that matter most - constraints, variance, and reification:

```quiz
[
  {
    "q": "Why does `T Max<T>(T a, T b)` need the `where T : IComparable<T>` constraint?",
    "choices": [
      "Without it, the compiler can't guarantee `T` supports `.CompareTo(...)`, so the comparison in the body wouldn't be allowed",
      "It makes the method run faster by skipping a runtime type check",
      "It forces `T` to be a value type so it can be stored on the stack",
      "It's optional - the method compiles fine with no constraint at all"
    ],
    "answer": 0,
    "explain": "A constraint both restricts which types `T` may be and unlocks that capability inside the body. `IComparable<T>` provides `.CompareTo(...)`; without the constraint, `T` could be a non-comparable type, so the call would be rejected at compile time."
  },
  {
    "q": "Why does C# allow `IEnumerable<Animal> a = someIEnumerableOfCat;` but forbid the same assignment for `List<T>`?",
    "choices": [
      "`IEnumerable<out T>` only produces values (covariant), so widening is safe; `List<T>` also writes, so widening could smuggle a wrong type in",
      "`IEnumerable` is a class and `List` is an interface, and only classes support variance",
      "It's an arbitrary compiler rule with no real reason behind it",
      "`List<T>` is covariant too - the assignment actually is allowed"
    ],
    "answer": 0,
    "explain": "Covariance (`out`) is safe only for producer-only types: every value handed out is a Cat, which is an Animal. `List<T>` reads AND writes, so treating a `List<Cat>` as `List<Animal>` would let code Add a Dog into it - which is why `List<T>` is invariant."
  },
  {
    "q": "What does C#'s 'reified generics' (vs Java's type erasure) let you do that Java cannot?",
    "choices": [
      "Use `typeof(T)` and `new T()` at runtime, and store value types like `int` without boxing - because the type info survives to runtime",
      "Write generic methods with type parameters at all - Java has no generics",
      "Run generic code faster by deleting type information before execution",
      "Make `List<int>` and `List<string>` the same runtime type for compatibility"
    ],
    "answer": 0,
    "explain": "C# keeps generic type info at runtime (reification), so `typeof(T)` and `new T()` work and `List<int>` holds raw unboxed ints. Java erases generics, making T unknowable at runtime, forbidding `new T()`, and forcing boxing of primitives."
  }
]
```

---

[← Phase 9: Idioms & Common Gotchas](09-idioms-and-gotchas.md) · [Guide overview](_guide.md) · [Phase 11: Delegates, Lambdas & Events →](11-delegates-and-lambdas.md)
