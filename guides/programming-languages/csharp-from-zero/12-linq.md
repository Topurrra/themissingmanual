---
title: "LINQ - Querying Anything, Declaratively"
guide: "csharp-from-zero"
phase: 12
summary: "LINQ lets you ask collections, databases, and XML what you want instead of writing the loop that gets it. Method vs query syntax, the deferred-execution trap, and the operators you'll lean on."
tags: [csharp, linq, query-syntax, method-syntax, deferred-execution, ienumerable, iqueryable, select-where]
difficulty: advanced
synonyms: ["c# linq explained", "c# linq query vs method syntax", "c# linq deferred execution", "c# select where groupby", "c# linq tolist", "c# iqueryable vs ienumerable", "c# linq lambda"]
updated: 2026-06-22
---

# LINQ - Querying Anything, Declaratively

In [Phase 11](11-delegates-and-lambdas.md) you learned that a lambda like `n => n > 2` is just a value you can pass around - a packet of behavior wearing a `Func` delegate. That was the warm-up. This phase is the payoff, one of the things C# programmers genuinely brag about: **LINQ** (Language-Integrated Query). Once it clicks, you'll stop writing half the loops you used to write.

The shift in thinking: wanting "the even numbers, doubled" used to mean a loop - make a result list, walk the source, test each item, transform the survivors, append. You described *how* to get the answer, step by step. LINQ flips that: you describe *what* you want - "where it's even, select it doubled" - and let the machinery handle the stepping. That's **imperative** (a recipe of steps) versus **declarative** (a statement of intent).

## The mental model - describe the result, not the steps

📝 **LINQ** - a set of query operators, built into C#, that let you filter, transform, sort, and group *any* sequence using one consistent vocabulary. The same `Where`/`Select`/`OrderBy` words work on an in-memory `List<T>`, a database table, an XML document, or a CSV stream.

Put the two styles side by side on the same task: take a list of numbers, keep the ones greater than 2, and double each. The hand-written loop:

```csharp
var numbers = new List<int> { 1, 2, 3, 4 };

var result = new List<int>();
foreach (var n in numbers)
{
    if (n > 2)
    {
        result.Add(n * 10);
    }
}
// result is now { 30, 40 }
```

*What just happened:* You spelled out every mechanical step - allocate a list, loop, test, transform, append. It works, but the *intent* ("the ones over 2, times ten") is buried under bookkeeping. A reader has to mentally run the loop to see what you meant.

The LINQ version of the exact same thing:

```csharp
var numbers = new List<int> { 1, 2, 3, 4 };

var result = numbers
    .Where(n => n > 2)      // keep the ones over 2
    .Select(n => n * 10)    // transform each survivor
    .ToList();              // gather into a list
// result is now { 30, 40 }
```

*What just happened:* No loop, no temporary list, no manual `Add`. You named the *what* - filter with `Where`, transform with `Select` - and LINQ did the stepping. The two lambdas are exactly the `Func` values from Phase 11: `Where` takes a `Func<int, bool>` (keep-or-not), `Select` a `Func<int, int>` (the new value). LINQ is delegates all the way down.

💡 **The reading test.** The loop says "do this, then this, then this." The LINQ chain says "what I want is this." When the *what* matters more than the *how*, declarative wins.

## Method syntax - the workhorse

The form you just saw is **method syntax**: a chain of method calls, each taking a lambda. This is the one you'll write 90% of the time.

📝 **Method syntax** - calling LINQ operators as extension methods on a sequence, passing lambdas to say what each step does: `source.Where(...).Select(...).OrderBy(...)`. Each returns a new sequence, so they chain like a pipeline.

```csharp
using System.Linq;

var words = new List<string> { "apple", "fig", "banana", "kiwi", "cherry" };

var shortUpper = words
    .Where(w => w.Length <= 5)        // keep short words
    .Select(w => w.ToUpper())         // shout them
    .ToList();

foreach (var w in shortUpper)
    Console.WriteLine(w);
```

```console
APPLE
FIG
KIWI
```

*What just happened:* Read the chain top to bottom as a pipeline. `Where(w => w.Length <= 5)` let through `apple`, `fig`, and `kiwi` (the others are too long); `Select(w => w.ToUpper())` transformed each survivor to uppercase; `ToList()` collected the results. ⚠️ Note the `using System.Linq;` at the top - LINQ's operators are extension methods living in that namespace, invisible without it. Forget it and the compiler insists `List<T>` has no method called `Where`.

## Query syntax - the SQL-flavored sugar

C# offers a second way to write the same queries, and if you've touched SQL it'll look eerily familiar. It's called **query syntax**, and reads like a sentence:

📝 **Query syntax** - keyword-based query expressions (`from`, `where`, `select`, `orderby`, `group`) that the compiler translates into the exact same method-syntax calls under the hood. Pure syntactic sugar: nothing it does is impossible in method syntax.

The first example - keep numbers over 2, double them - written both ways so you can see they're the same query:

```csharp
var numbers = new List<int> { 1, 2, 3, 4 };

// Query syntax - reads like SQL
var viaQuery = from n in numbers
               where n > 2
               select n * 10;

// Method syntax - the same thing the compiler turns the above into
var viaMethod = numbers.Where(n => n > 2).Select(n => n * 10);

Console.WriteLine(string.Join(", ", viaQuery));
Console.WriteLine(string.Join(", ", viaMethod));
```

```console
30, 40
30, 40
```

*What just happened:* Both produce `30, 40` because they *are* the same query - the compiler rewrites `from n in numbers where n > 2 select n * 10` into precisely the `Where(...).Select(...)` chain below it. They're interchangeable; pick by readability. Query syntax shines with joins, grouping, or multiple `from` clauses; method syntax wins for simple chains and for operators - like `Count()`, `First()`, `ToList()` - that query syntax has no keyword for. Most C# code leans on method syntax.

## Deferred execution - the gotcha that bites everyone once

The single most important idea in this phase, and the one that catches every C# developer exactly once: a LINQ query is **lazy**. Writing it doesn't *run* it - it builds a description of work, a recipe, and does nothing until something asks it to produce values.

📝 **Deferred execution** - a LINQ query (the `IEnumerable<T>` you get from `Where`, `Select`, etc.) is not a result; it's a *plan* for computing one. The plan only executes when you **enumerate** it: a `foreach`, or a "consumer" like `ToList()`, `Count()`, `First()`, or `Sum()`. Until then, nothing has happened.

This is the same laziness you'd meet in Python's generators or Rust's iterators - adapters describe, consumers fire. In C# it produces a genuinely surprising result:

```csharp
var source = new List<int> { 1, 2, 3 };

// Build a query - note: this does NOT run yet.
var query = source.Where(n => n > 1);

source.Add(4);   // change the source AFTER defining the query

// NOW enumerate it.
foreach (var n in query)
    Console.WriteLine(n);
```

```console
2
3
4
```

*What just happened:* The `4` showed up even though you added it *after* writing the query, because the query didn't run when you wrote it - it ran when the `foreach` enumerated it, and by then the source list already had `4`. The query is a live recipe pointed at `source`, not a snapshot taken at definition time.

⚠️ **And it re-runs every single time you enumerate it.** A deferred query is not a cached result. Loop over it twice and the whole pipeline executes twice - every `Where` test, every `Select` transform, fresh. If those lambdas hit a database or do real work, you've silently paid for it twice (or N times).

```csharp
int calls = 0;
var numbers = new List<int> { 1, 2, 3 };

var query = numbers.Where(n =>
{
    calls++;                 // count how often the filter actually runs
    return n > 1;
});

var firstCount  = query.Count();   // enumeration #1
var secondCount = query.Count();   // enumeration #2

Console.WriteLine($"filter ran {calls} times for {firstCount} results");
```

```console
filter ran 6 times for 2 results
```

*What just happened:* Three items, two enumerations - so the filter lambda ran *six* times, not three. Each `Count()` walked the entire pipeline again from scratch: wasteful here, dangerous when the lambda is expensive. Fix it by **materializing** the query once into a real collection with `ToList()` (or `ToArray()`), which forces a single enumeration and stores the results.

```csharp
int calls = 0;
var numbers = new List<int> { 1, 2, 3 };

// .ToList() forces the query to run ONCE, right here, and stores the results.
var results = numbers.Where(n => { calls++; return n > 1; }).ToList();

var firstCount  = results.Count;   // just reads the stored list - no re-run
var secondCount = results.Count;

Console.WriteLine($"filter ran {calls} times for {firstCount} results");
```

```console
filter ran 3 times for 2 results
```

*What just happened:* `ToList()` executed the pipeline exactly once - one pass over all three source items, so the filter ran three times and let two through. Now `results` is concrete data, not a recipe - `results.Count` just reads the stored length, and the filter never runs again. Rule of thumb: enumerating more than once, or needing results to reflect the source *as it is now*, means ending the chain with `.ToList()`.

## The powerful operators - a realistic query

You've met `Where` and `Select`. Here's the rest of the toolkit you'll reach for, then a realistic example chaining several together.

- **`OrderBy` / `OrderByDescending`** - sort by a key (`ThenBy` for tie-breakers).
- **`GroupBy`** - bucket items by a key; you get groups you can loop over, each with its own `Key`.
- **`First` / `FirstOrDefault`** - grab the first item (optionally matching a condition).
- **`Any` / `All`** - does *any* item match? do *all* of them?
- **`Sum` / `Count` / `Average` / `Max`** - the aggregates, computed in one pass.
- **`SelectMany`** - flatten a sequence-of-sequences into one flat sequence.

Group a list of orders by customer and total each customer's spend - the kind of thing you'd otherwise write fifteen lines of loop for:

```csharp
var orders = new[]
{
    new { Customer = "Ada",  Amount = 30 },
    new { Customer = "Lin",  Amount = 50 },
    new { Customer = "Ada",  Amount = 20 },
    new { Customer = "Lin",  Amount = 10 },
    new { Customer = "Ada",  Amount = 15 },
};

var summary = orders
    .GroupBy(o => o.Customer)                       // bucket by customer
    .Select(g => new { Name = g.Key, Total = g.Sum(o => o.Amount) })
    .OrderByDescending(x => x.Total)               // biggest spender first
    .ToList();

foreach (var row in summary)
    Console.WriteLine($"{row.Name}: {row.Total}");
```

```console
Ada: 65
Lin: 60
```

*What just happened:* `GroupBy(o => o.Customer)` split the five orders into two buckets keyed by name - Ada's three and Lin's two. `Select` turned each bucket `g` into a summary object using `g.Key` (the customer name) and `g.Sum(o => o.Amount)` (that bucket's total). `OrderByDescending` sorted so the biggest spender leads, and `ToList()` froze the answer. Grouping, aggregation, and sorting in four readable lines.

⚠️ **`First` throws; `FirstOrDefault` doesn't.** A constant source of crashes: `First()` on a sequence with no match throws an `InvalidOperationException` ("Sequence contains no matching element"). When a miss is possible - most real queries - use `FirstOrDefault()`, which returns the type's default (`null` for reference types, `0` for `int`) instead, then check for it.

```csharp
var names = new List<string> { "Ada", "Lin" };

var found   = names.FirstOrDefault(n => n.StartsWith("L"));  // "Lin"
var missing = names.FirstOrDefault(n => n.StartsWith("Z"));  // null, not a crash

Console.WriteLine(found ?? "(none)");
Console.WriteLine(missing ?? "(none)");
```

```console
Lin
(none)
```

*What just happened:* The first call found "Lin." The second matched nothing, and because it's `FirstOrDefault`, it calmly returned `null` instead of throwing; `?? "(none)"` handled the null gracefully. Plain `First(n => n.StartsWith("Z"))` would have crashed on that line.

💡 **The same LINQ can run against a database.** A `List<T>` in memory means **LINQ to Objects** - `IEnumerable<T>`, lambdas running as C# code. A database table via an ORM like Entity Framework means an `IQueryable<T>` - the *identical* `Where`/`Select`/`GroupBy` syntax gets **translated into SQL** and run by the database engine. Same words, different engine: `users.Where(u => u.Age > 18)` filters a `List` in RAM or generates `WHERE Age > 18` against Postgres depending only on what `users` is. ⚠️ Not every C# expression translates to SQL (a call to your own helper method has no SQL equivalent), so `IQueryable` queries have rules `IEnumerable` ones don't - a story for the Entity Framework guide.

## Recap

1. **LINQ is declarative**: describe the result you want (`Where`/`Select`/`OrderBy`) instead of hand-writing the loop. One vocabulary queries lists, databases, XML, and more.
2. **Method syntax** (`.Where(...).Select(...)`) is the everyday workhorse, built on `Func` lambdas from Phase 11. **Query syntax** (`from ... where ... select ...`) is SQL-flavored sugar the compiler rewrites into method syntax - pick whichever reads better.
3. ⚠️ **Deferred execution** is the big trap: a query is a recipe, not a result. It does nothing until enumerated (`foreach`, `ToList`, `Count`, `First`), reads its source *late*, and **re-runs every enumeration**. Call `.ToList()` to materialize it once and stop the surprises.
4. The toolkit: `OrderBy`, `GroupBy`, `First`/`FirstOrDefault`, `Any`/`All`, `Sum`/`Count`/`Average` - chained together they replace whole loops, grouping and totaling in a few readable lines.
5. ⚠️ `First` throws on no match; prefer **`FirstOrDefault`** (returns `null`/`0`) whenever a miss is possible, then check the default.
6. 💡 The same LINQ runs on `IEnumerable` (in memory, as C#) or `IQueryable` (a database, translated to SQL) - same syntax, different engine.

You can now query collections the way you'd describe them to a colleague. Next: **records and modern pattern matching** - features that make the *data* you query just as concise as the queries themselves.

## Quick check

Test yourself on the idea that trips up everyone - laziness - plus the two operators most likely to bite you:

```quiz
[
  {
    "q": "You write `var q = list.Where(n => n > 1);` and then add an item to `list` before looping over `q`. The new item appears in the loop. Why?",
    "choices": [
      "Deferred execution - the query is a recipe that only runs when enumerated, so it reads `list` as it is at loop time, not at definition time",
      "LINQ automatically copies the list when you call Where, then keeps it in sync",
      "Where always re-reads the source from disk on every call",
      "It's a bug; the new item should not appear"
    ],
    "answer": 0,
    "explain": "A LINQ query is lazy. Defining it builds a plan but runs nothing; the plan executes when you enumerate (here, the foreach), reading the source at that moment. Since the item was added before enumeration, it's included. Call .ToList() at definition time if you want a snapshot."
  },
  {
    "q": "What's the practical difference between `Where(...).Count()` called twice and `Where(...).ToList()` called once?",
    "choices": [
      "The deferred query re-runs the entire pipeline on each Count(); ToList() executes it once and stores the results, so later reads don't re-run anything",
      "There is no difference; both run the filter exactly once",
      "ToList() is slower because lists use more memory than queries",
      "Count() caches its result, so the second call is free, unlike ToList()"
    ],
    "answer": 0,
    "explain": "A deferred query is not cached - each enumeration (each Count()) re-executes every Where and Select from scratch. ToList() forces a single execution and materializes a real collection, so subsequent reads are just reading stored data with no re-run."
  },
  {
    "q": "You query a list for the first name starting with 'Z', but none exist. Which call avoids crashing?",
    "choices": [
      "FirstOrDefault(n => n.StartsWith(\"Z\")) - it returns null instead of throwing",
      "First(n => n.StartsWith(\"Z\")) - it returns null when nothing matches",
      "Both throw, so you must wrap either one in try/catch",
      "Any(n => n.StartsWith(\"Z\")) - it returns the first match or null"
    ],
    "answer": 0,
    "explain": "First throws InvalidOperationException when no element matches. FirstOrDefault returns the type's default (null for a string) instead, so it's the safe choice whenever a miss is possible - just remember to check for that default afterward."
  }
]
```

---

[← Phase 11: Delegates, Lambdas & Events](11-delegates-and-lambdas.md) · [Guide overview](_guide.md) · [Phase 13: Records, Pattern Matching & Modern C# →](13-records-and-modern-csharp.md)
