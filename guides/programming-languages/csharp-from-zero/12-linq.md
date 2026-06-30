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

In [Phase 11](11-delegates-and-lambdas.md) you learned that a lambda like `n => n > 2` is just a value you can pass around - a little packet of behavior wearing a `Func` delegate. That was the warm-up. This phase is the payoff, and it's one of the things C# programmers genuinely brag about. It's called **LINQ** (Language-Integrated Query), and once it clicks, you'll stop writing half the loops you used to write.

Here's the shift in thinking. For your whole career so far, when you wanted "the even numbers, doubled," you wrote a loop: make a result list, walk the source, test each item, transform the survivors, append. You described *how* to get the answer, step by step. LINQ flips that. You describe *what* you want - "where it's even, select it doubled" - and let the machinery handle the stepping. That's the difference between **imperative** (a recipe of steps) and **declarative** (a statement of intent), and it's the mental model that carries this whole phase.

## The mental model - describe the result, not the steps

📝 **LINQ** - a set of query operators, built into C#, that let you filter, transform, sort, and group *any* sequence using one consistent vocabulary. The same `Where`/`Select`/`OrderBy` words work on an in-memory `List<T>`, a database table, an XML document, or a CSV stream. Learn the vocabulary once; query everything.

Let's put the two styles side by side on the same task: take a list of numbers, keep the ones greater than 2, and double each.

The way you've done it until now - the hand-written loop:

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

*What just happened:* You spelled out every mechanical step - allocate a list, loop, test, transform, append. It works, but the *intent* ("the ones over 2, times ten") is buried under bookkeeping. A reader has to mentally run the loop to figure out what you meant.

Now the LINQ version of the exact same thing:

```csharp
var numbers = new List<int> { 1, 2, 3, 4 };

var result = numbers
    .Where(n => n > 2)      // keep the ones over 2
    .Select(n => n * 10)    // transform each survivor
    .ToList();              // gather into a list
// result is now { 30, 40 }
```

*What just happened:* No loop, no temporary list, no manual `Add`. You named the *what* - filter with `Where`, transform with `Select` - and LINQ did the stepping for you. The two lambdas are exactly the `Func` values from Phase 11: `Where` takes a `Func<int, bool>` (give it an item, get back keep-or-not), and `Select` takes a `Func<int, int>` (give it an item, get back the new one). LINQ is delegates all the way down.

💡 **The reading test.** The loop says "do this, then this, then this." The LINQ chain says "what I want is this." When the *what* matters more than the *how* - which is most of the time - declarative wins, because it's the intent written down directly.

## Method syntax - the workhorse

The form you just saw is **method syntax**: a chain of method calls, each taking a lambda. This is the one you'll write 90% of the time, so it's worth getting comfortable.

📝 **Method syntax** - calling LINQ operators as extension methods on a sequence, passing lambdas to say what each step does: `source.Where(...).Select(...).OrderBy(...)`. Each method returns a new sequence, so they chain end to end like a pipeline.

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

*What just happened:* Read the chain top to bottom as a pipeline. `Where(w => w.Length <= 5)` let through `apple`, `fig`, and `kiwi` (the others are too long); `Select(w => w.ToUpper())` transformed each survivor to uppercase; `ToList()` collected the results. Each operator takes the sequence from the one above it and hands a new sequence to the one below. ⚠️ Note the `using System.Linq;` at the top - LINQ's operators are extension methods that live in that namespace, and they're invisible without it. Forget it and the compiler insists `List<T>` has no method called `Where`.

## Query syntax - the SQL-flavored sugar

C# offers a second way to write the same queries, and if you've ever touched SQL it'll look eerily familiar. It's called **query syntax**, and it reads like a sentence:

📝 **Query syntax** - keyword-based query expressions (`from`, `where`, `select`, `orderby`, `group`) that the compiler translates into the exact same method-syntax calls under the hood. It's pure syntactic sugar: nothing query syntax does is impossible in method syntax.

Here's our first example - keep numbers over 2, double them - written both ways so you can see they're the same query:

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

*What just happened:* Both produce `30, 40` because they *are* the same query - the compiler rewrites `from n in numbers where n > 2 select n * 10` into precisely the `Where(...).Select(...)` chain below it. They're interchangeable; pick by readability. Query syntax shines when you have joins, grouping, or multiple `from` clauses (it reads cleaner there). Method syntax wins for simple one- or two-step chains and for the many operators - like `Count()`, `First()`, `ToList()` - that query syntax has no keyword for. Most C# code leans on method syntax and reaches for query syntax on the gnarlier queries.

## Deferred execution - the gotcha that bites everyone once

Now the single most important idea in this phase, and the one that catches every C# developer exactly once. A LINQ query is **lazy**: writing it doesn't *run* it. It builds a description of work - a recipe - and does absolutely nothing until something asks it to produce values.

📝 **Deferred execution** - a LINQ query (the `IEnumerable<T>` you get from `Where`, `Select`, etc.) is not a result; it's a *plan* for computing a result. The plan only executes when you **enumerate** it: a `foreach`, or a "consumer" like `ToList()`, `Count()`, `First()`, or `Sum()`. Until then, nothing has happened.

This is the exact same laziness you'd meet in Python's generators or Rust's iterators - adapters describe, consumers fire. And in C# it produces a genuinely surprising result. Watch:

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

*What just happened:* The `4` showed up even though you added it *after* writing the query - because the query didn't run when you wrote it. It ran when the `foreach` enumerated it, and by then the source list already had `4` in it. The query is a live recipe pointed at `source`, not a snapshot taken at definition time. This is the heart of deferred execution: the work, and the reading of captured variables and sources, happens *late* - at enumeration, not at definition.

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

*What just happened:* Three items, two enumerations - so the filter lambda ran *six* times, not three. Each `Count()` walked the entire pipeline again from scratch. That's wasteful here and dangerous when the lambda is expensive. The fix is to **materialize** the query once into a real collection with `ToList()` (or `ToArray()`): that forces a single enumeration, stores the results, and from then on you're looping over a plain `List<T>` with no surprise re-runs.

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
filter ran 2 times for 2 results
```

*What just happened:* `ToList()` executed the pipeline exactly once and captured the survivors into a real list. Now `results` is concrete data, not a recipe - `results.Count` just reads the stored length, and the filter never runs again no matter how many times you touch it. The rule of thumb: if you'll enumerate a query more than once, or you need the results to reflect the source *as it was now* rather than whenever-it's-read-later, end the chain with `.ToList()` to nail it down.

## The powerful operators - a realistic query

You've met `Where` and `Select`. Here's the rest of the toolkit you'll actually reach for, and then a realistic example that chains several together.

- **`OrderBy` / `OrderByDescending`** - sort by a key (`ThenBy` for tie-breakers).
- **`GroupBy`** - bucket items by a key; you get groups you can loop over, each with its own `Key`.
- **`First` / `FirstOrDefault`** - grab the first item (optionally matching a condition).
- **`Any` / `All`** - does *any* item match? do *all* of them?
- **`Sum` / `Count` / `Average` / `Max`** - the aggregates, computed in one pass.
- **`SelectMany`** - flatten a sequence-of-sequences into one flat sequence.

Let's group a list of orders by customer and total each customer's spend - the kind of thing you'd otherwise write fifteen lines of loop for:

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

*What just happened:* `GroupBy(o => o.Customer)` split the five orders into two buckets keyed by name - Ada's three and Lin's two. `Select` turned each bucket `g` into a tidy summary object, using `g.Key` (the customer name) and `g.Sum(o => o.Amount)` to total that bucket. `OrderByDescending` sorted the summaries so the biggest spender leads, and `ToList()` ran the whole pipeline and froze the answer. That's grouping, aggregation, and sorting in four readable lines - the declarative payoff in full.

⚠️ **`First` throws; `FirstOrDefault` doesn't.** A constant source of crashes: `First()` on a sequence with no match throws an `InvalidOperationException` ("Sequence contains no matching element"). When a miss is *possible* - which is most real queries - use `FirstOrDefault()`, which returns the type's default (`null` for reference types, `0` for `int`) instead of throwing. Then check for that default.

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

*What just happened:* The first call found "Lin." The second matched nothing - and because it's `FirstOrDefault`, it calmly returned `null` instead of throwing. The `?? "(none)"` then handled the null gracefully. Had you used plain `First(n => n.StartsWith("Z"))`, the program would have crashed on that line. Reach for `FirstOrDefault` whenever "no match" is a real possibility, and handle the default it hands back.

💡 **The same LINQ can run against a database.** Here's the quietly amazing part. When your source is a `List<T>` in memory, you're using **LINQ to Objects** - it's `IEnumerable<T>`, and the lambdas run as C# code. But when your source is a database table via an ORM like Entity Framework, the source is an `IQueryable<T>` - and the *identical* `Where`/`Select`/`GroupBy` syntax gets **translated into SQL** and run by the database engine, not by your C#. Same words, different engine: `users.Where(u => u.Age > 18)` filters a `List` in RAM or generates `WHERE Age > 18` against Postgres depending only on what `users` is. ⚠️ The catch is that not every C# expression can be translated to SQL (a call to your own helper method, for instance, has no SQL equivalent), so `IQueryable` queries have rules `IEnumerable` ones don't - but that's a story for the Entity Framework guide. For now, just hold the mental model: LINQ is one query language pointed at many engines.

## Recap

1. **LINQ is declarative**: you describe the result you want (`Where`/`Select`/`OrderBy`) instead of hand-writing the loop that builds it. One vocabulary queries lists, databases, XML, and more.
2. **Method syntax** (`.Where(...).Select(...)`) is the everyday workhorse, built on the `Func` lambdas from Phase 11. **Query syntax** (`from ... where ... select ...`) is SQL-flavored sugar the compiler rewrites into method syntax - pick whichever reads better.
3. ⚠️ **Deferred execution** is the big trap: a query is a recipe, not a result. It does nothing until enumerated (`foreach`, `ToList`, `Count`, `First`), it reads its source *late*, and it **re-runs every enumeration**. Call `.ToList()` to materialize it once and stop the surprises.
4. The toolkit you'll lean on: `OrderBy`, `GroupBy`, `First`/`FirstOrDefault`, `Any`/`All`, `Sum`/`Count`/`Average`. Chained together, they replace whole loops - grouping and totaling in a few readable lines.
5. ⚠️ `First` throws on no match; prefer **`FirstOrDefault`** (which returns `null`/`0`) whenever a miss is possible, then check the default.
6. 💡 The same LINQ runs on `IEnumerable` (in memory, as C#) or `IQueryable` (a database, translated to SQL) - same syntax, different engine.

You can now query collections the way you'd describe them to a colleague. Next, we look at **records and modern pattern matching** - newer C# features that make the *data* you query just as concise and expressive as the queries themselves.

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
