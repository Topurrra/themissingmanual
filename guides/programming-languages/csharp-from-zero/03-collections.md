---
title: "Collections - Arrays, Lists, Dictionaries & Sets"
guide: "csharp-from-zero"
phase: 3
summary: "The four containers you'll reach for daily - fixed arrays, growable lists, key-value dictionaries, and unique-only sets - plus the generics mental model and the interfaces (IEnumerable, ICollection, IList) that tie them together."
tags: [csharp, collections, arrays, list, dictionary, hashset, generics, ienumerable]
difficulty: beginner
synonyms: ["c# list vs array", "c# dictionary explained", "c# hashset", "c# generic collections", "c# ienumerable", "c# foreach loop", "c# collection initializer"]
updated: 2026-06-22
---

# Collections - Arrays, Lists, Dictionaries & Sets

Up to now you've held one value in one variable. Real programs deal in *many*: the items in a cart, the
scores in a game, the users by their IDs. C# gives you a small family of containers for that, and the good
news is they're not a confusing pile - they're four shapes you pick between by asking one question: *how do
I need to get my data back out?* Get that question right and the choice makes itself.

The mental model for the whole family: a collection is a box, and the boxes differ by what they're *good at*.
An array is a rigid box with a fixed number of slots. A `List<T>` is a box that grows. A `Dictionary<K,V>`
is a box you reach into by label instead of by position. A `HashSet<T>` is a box that quietly refuses
duplicates. Same idea - hold many things - with different trade-offs. Let's meet them.

## Arrays - the fixed-size box

**What it actually is.** An **array** is a fixed-length sequence of values, all the same type, laid out
back-to-back in memory. "Fixed-length" is the whole personality: you decide the size when you create it, and
that size never changes. Want a fifth slot in a four-slot array? You can't - you make a new array.

```csharp
int[] nums = { 1, 2, 3 };
Console.WriteLine(nums[0]);      // first element - C# counts from 0
Console.WriteLine(nums[2]);      // third element
Console.WriteLine(nums.Length);  // how many slots
```
```console
1
3
3
```
*What just happened:* `int[] nums = { 1, 2, 3 }` declared an array of three integers and filled it in one
go. You read an element by its **index** in square brackets, and like most languages C# counts from zero -
so `nums[0]` is the first item and `nums[2]` is the third. `nums.Length` tells you the size. Reaching past
the end (`nums[3]` here) throws an `IndexOutOfRangeException` at runtime, because there's no slot to read.

⚠️ **Length is a property, not a method.** It's `nums.Length` with no parentheses - arrays expose their size
as a property. (Confusingly, *other* collections you'll meet below use `.Count` instead, and strings use
`.Length` too. The naming isn't consistent; you'll just memorize it.)

💡 **When do you actually use an array?** Reach for one when the size is genuinely fixed and known up front -
the seven days of a week, the RGB channels of a pixel, a lookup table that never grows. The moment you find
yourself wanting to *add* items, you've outgrown arrays. That's the next box.

## The generic collections mental model

Before the growable containers, one idea that unlocks all of them: **generics**.

📝 **Generics.** The `<T>` in `List<T>` is a *type parameter* - a blank you fill in. `List<int>` is "a list
of ints"; `List<string>` is "a list of strings." The collection types in the `System.Collections.Generic`
namespace are **type-safe**: a `List<int>` will only ever hold ints, and the compiler enforces that. Try to
stuff a string in and your code won't compile - the mistake is caught before the program ever runs.

This matters because of what came *before* generics. The old `System.Collections` namespace had types like
`ArrayList` that held `object` - meaning "anything." That sounds flexible, but it was a trap: everything you
pulled out came back as a vague `object` you had to cast, every value type got silently boxed (an extra
allocation), and a `string` accidentally added to your list-of-numbers blew up only at *runtime*.

⚠️ **Avoid the old non-generic collections.** `ArrayList`, `Hashtable`, and friends still exist for backward
compatibility, but in modern C# they're a code smell. Always reach for the generic versions: `List<T>`,
`Dictionary<K,V>`, `HashSet<T>`. If you ever see `ArrayList` in a tutorial, that tutorial is old.

💡 **Program to interfaces where it helps.** The generic collections all implement a layered set of
*interfaces* - names that describe *behavior* rather than a concrete type:

- **`IEnumerable<T>`** - "you can `foreach` over me." The most general; promises nothing but iteration.
- **`ICollection<T>`** - `IEnumerable<T>` plus a `Count` and the ability to `Add`/`Remove`.
- **`IList<T>`** - `ICollection<T>` plus indexed access (`[i]`) and ordering.

You don't need these yet to *use* a list. But when you write a method, accepting the *narrowest interface
that does the job* makes it flexible: a method that only loops should take `IEnumerable<T>`, so a caller can
hand it a list, an array, or anything else iterable. We'll lean on `IEnumerable<T>` heavily once we hit LINQ.

## `List<T>` - the growable box

**What it actually is.** A **`List<T>`** is an ordered, indexable, *growable* sequence. Think of it as an
array that handles its own resizing: you `Add` items and it makes room; you read and write by index just
like an array. It's the collection you'll use more than all the others combined.

```csharp
var fruits = new List<string> { "apple", "banana" };

fruits.Add("cherry");          // grows by one
fruits.Add("date");

Console.WriteLine(fruits.Count);   // how many - note Count, not Length
Console.WriteLine(fruits[1]);      // index like an array

foreach (var fruit in fruits)
{
    Console.WriteLine(fruit);
}
```
```console
4
banana
apple
banana
cherry
date
```
*What just happened:* `new List<string> { "apple", "banana" }` used **collection initializer** syntax -
the `{ ... }` after the constructor seeds the list with starting items, the same convenience the array got.
`Add` appends to the end and the list grows itself, no size declared anywhere. You ask how many it holds with
`.Count` (lists use `Count`; arrays used `Length` - yes, the inconsistency is annoying). You read by index
with `fruits[1]` exactly like an array. And `foreach` walks every element in order, handing you one per pass -
that's the iteration `IEnumerable<T>` promises, working for free.

💡 **`foreach` vs indexing.** Use `foreach` when you just want to visit every item (cleaner, no off-by-one
risk). Use the indexer `list[i]` when you need the *position* - to modify a specific slot, or to walk two
lists in lockstep. Both are fine; pick the one that says what you mean.

## `Dictionary<K,V>` - the box you reach into by label

A list is perfect when you care about *order* and *position*. But often you don't want "the third item" -
you want "the item labeled `bob`." That's a **dictionary**.

**What it actually is.** A **`Dictionary<K,V>`** stores **key → value** pairs and lets you look up a value
*instantly* by its key, no scanning. `Dictionary<string, int>` reads as "keys are strings, values are ints"
- for example, usernames to scores. (Other languages call this a hash map, hash, or associative array; same
idea.)

```csharp
var scores = new Dictionary<string, int>
{
    ["alice"] = 50,
    ["bob"] = 30,
};

scores.Add("carol", 90);        // add a new pair
scores["alice"] = 75;           // indexer overwrites an existing key

Console.WriteLine(scores["bob"]);   // look up by key

// Safe lookup for a key that might not exist:
if (scores.TryGetValue("dave", out int daveScore))
    Console.WriteLine($"dave: {daveScore}");
else
    Console.WriteLine("dave not found");

// Iterate the pairs:
foreach (KeyValuePair<string, int> pair in scores)
{
    Console.WriteLine($"{pair.Key} = {pair.Value}");
}
```
```console
30
dave not found
alice = 75
bob = 30
carol = 90
```
*What just happened:* We built a dictionary with initializer syntax (`["alice"] = 50`), then grew it two
ways: `Add("carol", 90)` for a brand-new key, and `scores["alice"] = 75` where the indexer *overwrote* the
existing value. Reading with `scores["bob"]` returned its value instantly. `TryGetValue("dave", ...)` asked
"is this key here?" - it returned `false` and we printed the fallback, no crash. Finally, `foreach` over a
dictionary hands you each entry as a **`KeyValuePair<K,V>`**, with `.Key` and `.Value` on it.

⚠️ **The indexer throws on a missing key.** Reading `scores["dave"]` when `dave` isn't there does **not**
return zero or null - it throws a `KeyNotFoundException` and stops your program. This bites everyone once.
When a key *might* not exist, use **`TryGetValue`** (or check `ContainsKey` first). The indexer is for keys
you're certain are present; `TryGetValue` is for keys you're hoping are present.

```csharp
// ContainsKey is the other safe check - handy when you don't need the value yet:
if (scores.ContainsKey("alice"))
    Console.WriteLine("alice is on the board");
```
```console
alice is on the board
```
*What just happened:* `ContainsKey` answers a plain yes/no without fetching the value. Prefer `TryGetValue`
when you'll *use* the value right after (it does the lookup once); reach for `ContainsKey` when you only need
the boolean. Both spare you the `KeyNotFoundException`.

## `HashSet<T>` - the box that refuses duplicates

The last container is the specialist. A **`HashSet<T>`** holds a collection of **unique** elements - add the
same value twice and the second add is silently ignored - and it answers "do you contain this?" very fast.

```csharp
var seen = new HashSet<string>();

Console.WriteLine(seen.Add("apple"));   // true - newly added
Console.WriteLine(seen.Add("apple"));   // false - already present, ignored
seen.Add("banana");

Console.WriteLine(seen.Count);          // 2, not 3
Console.WriteLine(seen.Contains("banana"));  // fast membership test
```
```console
True
False
2
True
```
*What just happened:* `Add` returns a `bool` telling you whether the value was actually new - `true` the
first time `"apple"` went in, `false` the second time because the set already had it, so the count stayed at
`2`. `Contains` checks membership quickly. That's the set's whole reason to exist: enforce uniqueness and
test "is this in here?" without scanning every element the way a `List`'s `Contains` would.

💡 **Pick the right box.** This is the takeaway that makes everything above click:

- **`List<T>`** - you need *order* and *access by position*; duplicates are fine. The default workhorse.
- **`Dictionary<K,V>`** - you need *fast lookup by a key* rather than by position.
- **`HashSet<T>`** - you need *uniqueness* and fast "is it in here?" checks; order and position don't matter.
- **`T[]` (array)** - the size is genuinely fixed and known up front.

And underneath all four sits **`IEnumerable<T>`** - every one of them is iterable, which is exactly why a
single `foreach` works on all of them. That same interface is the foundation of **LINQ**, C#'s query
toolkit, where you'll filter and transform any collection with the same handful of operators. We'll get
there in [Phase 12](12-linq.md).

## Recap

1. An **array** (`int[]`) is fixed-size and indexed from `0`; ask its size with `.Length`. Use it only when
   the count is genuinely fixed.
2. **Generics** (`List<T>`, the `<T>`) make collections **type-safe** - a `List<int>` holds only ints, checked
   at compile time. Avoid the old non-generic `ArrayList`/`Hashtable`.
3. **`List<T>`** is the growable, ordered, indexable workhorse: `Add`, `[i]`, `.Count`, and `foreach`. It's
   what you reach for most.
4. **`Dictionary<K,V>`** maps keys to values for instant lookup; ⚠️ the indexer throws on a missing key, so
   use **`TryGetValue`** or **`ContainsKey`** when a key might be absent. Iterate it as `KeyValuePair<K,V>`.
5. **`HashSet<T>`** keeps elements unique and tests membership fast; `Add` returns `false` when the value was
   already present.
6. Pick by *how you read data back out* - position (`List`), key (`Dictionary`), uniqueness (`HashSet`),
   fixed count (array) - and remember all of them are `IEnumerable<T>`, the foundation LINQ builds on.

Next, we put these collections to work: **control flow and methods** - the `if`, `switch`, and loops that
make decisions, and how to package logic into reusable methods.

## Quick check

Test yourself on the choices that matter most - which box to pick, and the dictionary trap:

```quiz
[
  {
    "q": "You need to store users keyed by their unique ID and look one up instantly by that ID. Which collection fits best?",
    "choices": [
      "An array (T[])",
      "A List<T>",
      "A Dictionary<K,V>",
      "A HashSet<T>"
    ],
    "answer": 2,
    "explain": "A Dictionary<K,V> maps keys to values and looks up a value instantly by its key. A List would force you to scan every element to find the matching ID; a dictionary jumps straight to it."
  },
  {
    "q": "What happens when you read `scores[\"dave\"]` from a Dictionary<string,int> and the key \"dave\" doesn't exist?",
    "choices": [
      "It returns 0, the default for int",
      "It returns null",
      "It throws a KeyNotFoundException and stops the program",
      "It silently adds \"dave\" with value 0"
    ],
    "answer": 2,
    "explain": "The dictionary indexer throws KeyNotFoundException on a missing key - it does not return a default or add the key. Use TryGetValue or ContainsKey when a key might be absent."
  },
  {
    "q": "Why prefer the generic `List<T>` over the old non-generic `ArrayList`?",
    "choices": [
      "List<T> is type-safe - the compiler guarantees it holds only one type, catching mistakes before runtime",
      "ArrayList cannot grow, but List<T> can",
      "List<T> is the only one you can foreach over",
      "There is no real difference; they are interchangeable"
    ],
    "answer": 0,
    "explain": "ArrayList holds object (anything), so type errors surface only at runtime and value types get boxed. List<T> is type-safe: a List<int> holds only ints, enforced by the compiler. Both can grow and both are iterable."
  }
]
```

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Methods →](04-control-flow-and-methods.md)