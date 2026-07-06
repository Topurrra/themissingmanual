---
title: "Performance & the Ecosystem - Measure, Then Cut Allocations"
guide: "csharp-from-zero"
phase: 17
summary: "Performance in C# is measurement first, algorithm second, allocations third. Profile to find the real hot path, fix the big-O, cut GC pressure - then meet the .NET ecosystem you're now ready for."
tags: [csharp, performance, optimization, span, allocations, garbage-collection, ecosystem, aspnet-core]
difficulty: advanced
synonyms: ["c# performance optimization", "c# reduce allocations gc", "c# span memory", "c# stringbuilder vs concat", "c# struct vs class performance", "when to optimize c#", "dotnet ecosystem aspnet"]
updated: 2026-06-22
---

# Performance & the Ecosystem

Most of your code is already fast enough, and most of your guesses about *where* it's slow will be wrong. Performance work isn't a bag of clever tricks - it's a discipline: measure, find the one place that actually matters, fix that, and stop. The tricks are the easy part; the discipline is what separates a real speedup from an afternoon of busywork that moved nothing.

This phase caps the deep half of the guide, leaning on the memory model from [Phase 15](15-the-dotnet-runtime-and-gc.md) and the benchmarking/profiling tools from [Phase 16](16-testing-and-profiling.md). We'll put those to work in the order that pays off: measure, fix the algorithm, then cut allocations. Then we'll point you at the .NET ecosystem you're finally ready for.

## Measure first, always

**The mental model.** Your intuition about performance is a liar - not because you're bad at this, but because modern CPUs, caches, the JIT, and the garbage collector interact in ways no human predicts reliably. The method you're *sure* is the bottleneck is often a rounding error, while the real cost hides in a string concatenation you never thought twice about. The only way to know is to look.

⚠️ **The number-one rule of optimization: never optimize on a hunch.** Every time you "speed something up" without a measurement proving it was slow *and* a measurement proving your change helped, you're gambling - and the usual prize is uglier code that runs the same speed (or slower).

The workflow is the one from Phase 16, used in anger:

1. Write a BenchmarkDotNet benchmark exercising the real, representative work.
2. Run it (and, for sharper detail, a profiler) to find where time and allocations go.
3. Fix the single biggest cost.
4. Re-run to *prove* the fix helped. Repeat from step 2.

```console
$ dotnet run -c Release

| Method          | Mean        | Allocated |
|---------------- |------------:|----------:|
| FindDuplicates  | 31,847.2 us |  1.2 MB   |
| ParseRecords    |    412.0 us |  88.4 KB  |
| FormatOutput    |     19.3 us |   2.1 KB  |
```
*What just happened:* BenchmarkDotNet ranked each method by `Mean` time and `Allocated` bytes. One method, `FindDuplicates`, burns roughly 77x more time than the next and allocates the most - that's your hot spot, and nothing else is worth touching until it's handled. (Numbers vary by machine; the *shape* - one method dominating - is typical.)

💡 **Key insight.** In almost every program, a tiny fraction of the code accounts for the overwhelming majority of the runtime. Your job isn't to make *everything* fast - it's to find that 3% and leave the other 97% alone. Optimizing the rest is wasted effort that only adds risk.

## Algorithmic cost dominates

**The mental model.** Before fiddling with a single allocation, ask: *is the approach itself right?* The largest performance wins almost never come from micro-tweaks - they come from replacing a fundamentally expensive strategy with a cheaper one, turning an O(n²) nested scan into an O(n) pass with a `HashSet` or `Dictionary`. No low-level cleverness rescues a quadratic algorithm; it just makes the cliff arrive slightly later.

If "O(n²)" and "O(n)" feel fuzzy, the dedicated primer [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) walks through exactly what they mean and why they decide who wins as your data grows.

The classic example: find which items in a list appear more than once. The naive version compares every element against every other:

```csharp
// O(n²): for each item, scan all the others looking for a match.
static List<string> FindDuplicatesSlow(List<string> items)
{
    var dups = new List<string>();
    for (int i = 0; i < items.Count; i++)
    {
        for (int j = i + 1; j < items.Count; j++)
        {
            if (items[i] == items[j])
            {
                dups.Add(items[i]);
                break;
            }
        }
    }
    return dups;
}
```

The `HashSet` version makes one pass, remembering what it's already seen:

```csharp
// O(n): one pass, a HashSet remembers what we've already seen.
static List<string> FindDuplicatesFast(List<string> items)
{
    var seen = new HashSet<string>(items.Count);
    var dups = new List<string>();
    foreach (var item in items)
    {
        if (!seen.Add(item))   // Add returns false if it was already there
        {
            dups.Add(item);
        }
    }
    return dups;
}
```

*What just happened:* both methods answer the same question, but the cost curves are nothing alike. The slow version's inner loop means work grows with the *square* of the input - double the items, quadruple the comparisons. The fast version trades a little memory (the `seen` set) for a single linear pass: a `HashSet` lookup is roughly constant-time, so doubling the input only doubles the work. `seen.Add(item)` does double duty, inserting and telling you whether the item was new in one hashed probe. On 10 items the difference is invisible; on 100,000 it's instant versus a coffee break.

Benchmark them side by side and the gap is brutal:

```console
$ dotnet run -c Release

| Method               | Mean         | Allocated |
|--------------------- |-------------:|----------:|
| FindDuplicatesSlow   | 31,847.2 us  |   1.05 MB |
| FindDuplicatesFast   |    233.0 us  |   1.31 MB |
```
*What just happened:* on 10,000 items the `HashSet` version is over a hundred times faster (`us` is microseconds - lower is better), and that multiplier *grows* with the input: at 100,000 items the quadratic version is thousands of times slower. The fast version even allocates a touch more (it builds the `seen` set) and still wins by two orders of magnitude - proof algorithm choice dwarfs allocation tuning. (Exact numbers vary by machine and runtime; the order-of-magnitude gap does not.)

Play with how each growth curve behaves as `n` climbs - it makes the gap concrete in a way numbers on a page can't:

```playground-bigo
```

## Allocations & GC pressure - the usual .NET bottleneck

**The mental model.** Once your algorithm is sound, the most common remaining drag in .NET is *heap allocation*. Recall from [Phase 15](15-the-dotnet-runtime-and-gc.md): every heap object is something the garbage collector must later track and reclaim. Short-lived objects are cheap to create but not free to collect - churn out millions and the GC keeps interrupting your program to clean up. More allocations means more GC work, which steals CPU from your actual code. In C#, "make it faster" very often means "make it allocate less."

📝 **`Allocated` (and Gen 0 collections)** - BenchmarkDotNet's `[MemoryDiagnoser]` reports bytes allocated per run plus how many garbage collections it triggered. Frequently a *better* optimization target than raw time, since cutting allocations cuts GC pressure, lowering time *and* making performance steadier under load.

The single most common waste: building a string by concatenating in a loop. Strings in C# are *immutable* - every `+=` throws away the old string and allocates a brand-new one with the combined contents. Build a string from 10,000 pieces that way and you allocate 10,000 ever-larger strings, nearly all instant garbage.

```csharp
// Wasteful: each += allocates a whole new string and copies everything so far.
static string JoinSlow(string[] parts)
{
    string result = "";
    foreach (var p in parts)
    {
        result += p;   // new string allocated every iteration
    }
    return result;
}

// Lean: StringBuilder writes into one growing buffer, no per-step garbage.
static string JoinFast(string[] parts)
{
    var sb = new StringBuilder();
    foreach (var p in parts)
    {
        sb.Append(p);  // mutates the buffer in place
    }
    return sb.ToString();   // one final string
}
```

*What just happened:* `JoinSlow` allocates a fresh string on every iteration, and since each copies all characters gathered so far, the total work is quadratic *and* the heap fills with discarded strings. `JoinFast` uses a single `StringBuilder` owning one resizable buffer, appending without throwing anything away, producing exactly one string at the end. Same output, a tiny fraction of the garbage.

```console
$ dotnet run -c Release

| Method     | Mean       | Allocated  | Gen0     |
|----------- |-----------:|-----------:|---------:|
| JoinSlow   | 9,214.0 us | 95.4 MB    | 11,000.0 |
| JoinFast   |    38.1 us |  256.2 KB  |     40.0 |
```
*What just happened:* `[MemoryDiagnoser]` added the `Allocated` and `Gen0` columns. The slow version allocated ~95 MB and triggered thousands of Gen 0 collections; the `StringBuilder` version allocated a fraction of that and barely troubled the GC - roughly 240x faster here. (Numbers vary by machine; the direction is reliable.)

The same principle shows up in three other everyday spots:

- **Presize collections you'll fill.** `new List<int>(10_000)` or `new Dictionary<string,int>(capacity)` reserves the backing array once, instead of starting tiny and reallocating a bigger array (copying everything) each time it outgrows itself.
- **Avoid boxing value types.** Storing an `int` (or any `struct`) in an `object`, a non-generic collection, or `params object[]` *boxes* it - a fresh heap allocation per value in a hot loop. Generics (`List<int>`, not `ArrayList`) keep value types unboxed and on the stack.
- **Prefer a `struct` for small, hot, short-lived values.** A small value type used heavily in a tight loop lives on the stack and never touches the GC. (Mind the copy cost - keep structs small and ideally immutable, or the copying outweighs the saving.)

## A taste of `Span<T>` and low-allocation APIs

📝 **`Span<T>`** is a window onto a chunk of existing memory - a slice of an array, a string, or a stack buffer - that you can read and write *without copying or allocating*. `text.AsSpan(0, 5)` gives you the first five characters as a view, not a new string. `Memory<T>` is its heap-storable cousin for holding a slice across an `await`. These, with `ArrayPool<T>` (which lends out reusable arrays so you stop allocating fresh buffers), are the modern high-performance toolkit powering fast .NET libraries and ASP.NET Core itself.

```csharp
ReadOnlySpan<char> line = "2026-06-22T09:30".AsSpan();
ReadOnlySpan<char> date = line.Slice(0, 10);   // "2026-06-22" - no new string
ReadOnlySpan<char> time = line.Slice(11);      // "09:30"      - no new string
Console.WriteLine($"{date} at {time}");
```
*What just happened:* `AsSpan()` viewed the existing string's memory, and `Slice` carved out the date and time as *windows* into that memory - zero new allocations, where `Substring` would have allocated two. Parsing this way in a hot path can erase the allocations entirely.

⚠️ **Reach for these only in measured hot paths.** `Span<T>` carries real constraints (it's a `ref struct` - can't be a class field, can't cross an `await`, can't be boxed), and bending code around them costs readability. In the 97% of your code that isn't a bottleneck, a plain `Substring` or `List<T>` is clearer and plenty fast. Spans are a precision tool for the spot the profiler flagged, not a default style.

## Knowing when to stop - and where to go

**The mental model.** Optimization has a point of diminishing - then *negative* - returns. Every clever rewrite makes code harder to read, harder to change, and easier to break, a cost paid by every future reader, including you in six months. The goal is never "as fast as physically possible" - it's "fast enough for the actual requirement, and no more twisted than it has to be."

The discipline that makes this work:

- **Optimize the measured hot path. Leave the rest clear.** The 3% that profiling flagged earns the right to be clever - `Span<T>`, a pooled buffer, a hand-tuned loop. The other 97% should stay as straightforward as possible; that's where you'll spend your reading and debugging life.
- **Define "fast enough" before you start, then stop when you hit it.** A target ("p99 under 50ms," "10k records in under a second") tells you when you're done. Without one, optimization never ends and you keep paying readability for speed nobody needs.
- **Re-measure after every change.** A change that doesn't move the benchmark isn't an optimization - it's a complication. Revert it.

💡 **The closing rule of the deep half.** Readable code that's fast enough beats clever code that's unmaintainable, every time. Performance is a *measured* requirement, met with the *smallest* change that meets it, in the *one* place that needed it. Measure, fix the algorithm, cut the allocations that matter, and then - the hardest part - stop.

**Where C# goes from here - the ecosystem.** You now understand C# from `dotnet run` to the garbage collector. The language was always the foundation; the reason people reach for .NET is the platform built on it. Phase 18 maps it in full, but here's the lay of the land so the names are familiar:

- **ASP.NET Core** - the dominant framework for web APIs and server apps in .NET, and almost certainly how you'd build a backend in C#. It's also where the `Span<T>`/pooling lessons above pay off most directly - tuned to the bone.
- **Entity Framework Core** - the standard object-relational mapper. Write LINQ queries (Phase 13) against C# objects; EF Core turns them into SQL and maps the rows back.
- **Blazor** - build interactive web UIs in C# instead of JavaScript, running on WebAssembly or the server.
- **.NET MAUI** - one C# codebase for native desktop and mobile apps (Windows, macOS, iOS, Android).
- **Unity** - the leading game engine, scripted in C#. A huge share of the world's games are written in the language you just learned.

## Recap

1. **Measure first, always.** Never optimize on a hunch. Use BenchmarkDotNet and a profiler to find the real hot spot; most code is already fast enough, so hunt the 3% that isn't.
2. **Algorithmic cost dominates.** The biggest wins come from a better approach (an O(n) `HashSet`/`Dictionary` lookup over an O(n²) nested scan), not micro-tweaks - you can't optimize out of the wrong complexity class.
3. **Allocations drive GC pressure.** Fewer short-lived heap objects means less GC work, faster and steadier code. Use `StringBuilder` over `+=` in loops, presize collections, avoid boxing value types, prefer small `struct`s for hot values; watch `Allocated` with `[MemoryDiagnoser]`.
4. **`Span<T>` and friends** (`Memory<T>`, `ArrayPool<T>`) slice and reuse memory without allocating - the modern high-perf toolkit. Reach for them only in measured hot paths; they cost readability everywhere else.
5. **Know when to stop, then step out.** Optimize the measured hot path, define "fast enough" up front, revert anything that didn't move the number. Beyond the language lies the ecosystem - ASP.NET Core, EF Core, Blazor, MAUI, Unity - which Phase 18 maps.

That's the deep half done. You can now reason about how C# runs your code *and* make it faster on purpose, with evidence instead of guesses. The final phase steps back: where C# genuinely shines, and where to go next.

## Quick check

Test yourself on the discipline that makes performance work actually pay off:

```quiz
[
  {
    "q": "Before changing any code to make a C# program faster, what should you do first?",
    "choices": [
      "Profile with BenchmarkDotNet and a profiler to find where time and allocations actually go",
      "Replace every class with a struct",
      "Rewrite the slowest-looking method from memory",
      "Wrap every loop in Span<T>"
    ],
    "answer": 0,
    "explain": "Intuition about bottlenecks is unreliable. Measure first so you optimize the real hot spot - the small fraction of code that actually dominates runtime - instead of guessing and adding risk for no gain."
  },
  {
    "q": "You need to find duplicates in a 100,000-item list. Which change usually delivers the biggest speedup?",
    "choices": [
      "Choosing a better algorithm - an O(n) HashSet pass instead of an O(n²) nested scan",
      "Marking the method as static",
      "Renaming variables so the JIT optimizes better",
      "Removing comments from the inner loop"
    ],
    "answer": 0,
    "explain": "Algorithmic complexity dominates. Turning a quadratic nested scan into a linear HashSet pass wins by a margin that grows with the input - no micro-optimization can rescue the wrong complexity class."
  },
  {
    "q": "Why does building a long string with `+=` in a loop hurt performance in C#?",
    "choices": [
      "Strings are immutable, so each += allocates a brand-new string and copies everything so far - creating heaps of garbage for the GC",
      "The += operator is not supported on strings and throws at runtime",
      "It silently converts the string to a struct, which is slower",
      "Each += blocks the thread until the garbage collector runs"
    ],
    "answer": 0,
    "explain": "C# strings are immutable. Every += discards the old string and allocates a new one with the combined contents, so a loop produces many ever-larger throwaway strings - heavy GC pressure. A single StringBuilder mutates one buffer and allocates once at the end."
  }
]
```

---

[← Phase 16: Testing, Build & Profiling](16-testing-and-profiling.md) · [Guide overview](_guide.md) · [Phase 18: Where to Go Next →](18-where-to-go-next.md)