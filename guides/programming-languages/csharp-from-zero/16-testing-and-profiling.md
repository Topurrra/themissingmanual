---
title: "Testing, Build & Profiling — Proving It Works, Finding the Slow Part"
guide: "csharp-from-zero"
phase: 16
summary: "Prove C# correct with xUnit facts and theories, isolate units with Moq, measure honestly with BenchmarkDotNet (because Stopwatch loops lie), and find real hotspots with dotnet-trace and coverlet."
tags: [csharp, testing, xunit, theory, benchmarkdotnet, profiling, code-coverage, moq]
difficulty: intermediate
synonyms: ["c# xunit tutorial", "c# theory inlinedata parameterized test", "c# benchmarkdotnet", "c# profiling dotnet-trace", "c# code coverage coverlet", "c# moq mocking", "how to test c# code"]
updated: 2026-06-22
---

# Testing, Build & Profiling — Proving It Works, Finding the Slow Part

Back in [Phase 8](08-projects-and-tooling.md) I told you `dotnet test` exists and runs your tests, then promised the real treatment later. This is later. You can now organize a project, pull in packages, and ship a build — but a project you can't *prove* works is a project you're shipping on faith, and a project you *think* is slow but never measured is a project you're about to optimize in the wrong place.

Here's the mental model to carry through this whole phase, and it's the same one good engineers reach for everywhere: **stop operating on vibes.** "It works" becomes a test you can run. "It's slow" becomes a number you can measure. "This function is the bottleneck" becomes a profile that points at the actual hotspot — which, more often than your ego would like, is somewhere you never suspected. C# and the .NET toolchain are unusually good at all three, and once you wire them in, correctness and performance stop being arguments and start being commands you run.

## xUnit basics — your first real test

📝 **Unit test.** A small, automated check that exercises one piece of your code — usually one method — with known inputs and asserts the output is what you expect. "Unit" because it tests a unit in isolation, not the whole app wired together. You write it once; it runs forever, catching the day someone (often future-you) breaks that behavior.

.NET has three mainstream test frameworks — **xUnit**, **NUnit**, and **MSTest** — and they're more alike than different. NUnit is older and very capable; MSTest ships from Microsoft; **xUnit is the de-facto default for new projects**, and it's what most open-source .NET code you'll read uses. We'll use it. You scaffold a test project with `dotnet new xunit`, and it shows up as its own `.csproj` referencing the project under test.

A test is a plain method tagged `[Fact]` — "a fact that should always be true." Inside, you follow the **AAA shape**: **Arrange** the inputs, **Act** by calling the thing, **Assert** the result. Say we're testing this method:

```csharp
namespace Mathx;

public static class Calc
{
    public static int Clamp(int n, int min, int max)
    {
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    public static int Divide(int a, int b) => a / b;
}
```

```csharp
using Xunit;
using Mathx;

public class CalcTests
{
    [Fact]
    public void Clamp_BelowMin_ReturnsMin()
    {
        // Arrange
        int n = -5, min = 0, max = 10;

        // Act
        int result = Calc.Clamp(n, min, max);

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public void Divide_ByZero_Throws()
    {
        Assert.Throws<DivideByZeroException>(() => Calc.Divide(10, 0));
    }
}
```

```console
$ dotnet test
Passed!  - Failed: 0, Passed: 2, Skipped: 0, Total: 2, Duration: 12 ms
  CalcTests.Clamp_BelowMin_ReturnsMin [PASS]
  CalcTests.Divide_ByZero_Throws [PASS]
```

*What just happened:* Each `[Fact]` method is one test the runner discovers automatically — you never register them. `Clamp_BelowMin_ReturnsMin` arranged its inputs, called `Clamp`, and used `Assert.Equal(expected, actual)` to demand the answer be `0`. The second test used `Assert.Throws<T>`, which *expects* an exception: it runs the lambda, passes if the right exception type is thrown, and **fails if no exception comes** — that's how you test error paths without a `try/catch` of your own. `dotnet test` built the project, found both tests, ran them, and reported. The method names read like sentences (`Method_Scenario_Expectation`) on purpose: when one fails, the name alone tells you what broke.

💡 **Key point.** A good assertion failure tells you *what* was wrong without you opening a debugger. `Assert.Equal(0, result)` prints `Expected: 0, Actual: 5` on failure. That one line is the whole reason tests beat manually eyeballing output — they tell you, precisely and forever, the moment reality diverges from intent.

## Parameterized tests — one method, many cases

You'll quickly notice that `Clamp` needs more than one case: below min, above max, inside the range, exactly on a boundary. Copy-pasting `[Fact]` four times with different numbers is the obvious move and the wrong one — four near-identical methods that drift apart over time. xUnit's answer is the **`[Theory]`**: C#'s flavor of table-driven testing.

📝 **Theory.** A test method that runs *once per data row*. You tag it `[Theory]` instead of `[Fact]`, give the method parameters, and feed rows of arguments with `[InlineData(...)]`. Each row is an independent test case with its own pass/fail.

```csharp
public class ClampTheoryTests
{
    [Theory]
    [InlineData(5, 0, 10, 5)]    // inside range
    [InlineData(-3, 0, 10, 0)]   // below min
    [InlineData(99, 0, 10, 10)]  // above max
    [InlineData(0, 0, 10, 0)]    // exactly on min
    public void Clamp_PinsIntoRange(int n, int min, int max, int expected)
    {
        int result = Calc.Clamp(n, min, max);
        Assert.Equal(expected, result);
    }
}
```

```console
$ dotnet test
Passed!  - Failed: 0, Passed: 4, Skipped: 0, Total: 4, Duration: 9 ms
  ClampTheoryTests.Clamp_PinsIntoRange(n: 5, min: 0, max: 10, expected: 5) [PASS]
  ClampTheoryTests.Clamp_PinsIntoRange(n: -3, min: 0, max: 10, expected: 0) [PASS]
  ClampTheoryTests.Clamp_PinsIntoRange(n: 99, min: 0, max: 10, expected: 10) [PASS]
  ClampTheoryTests.Clamp_PinsIntoRange(n: 0, min: 0, max: 10, expected: 0) [PASS]
```

*What just happened:* One method body, four runs. Each `[InlineData]` supplied a row of arguments matched positionally to the method's parameters, and xUnit treated every row as its own test — note how the runner prints the actual values, so a failure tells you *exactly which row* broke, not just "the theory failed." Adding a fifth scenario is one new `[InlineData]` line, not a new method. The behavior under test is now a *visible list* a reviewer can scan and ask "where's the case for `min > max`?"

💡 **`[MemberData]` for non-constant cases.** `[InlineData]` only takes compile-time constants — numbers, strings, `true`. When your cases need real objects (a `DateTime`, a custom type, a computed value), switch to `[MemberData(nameof(Source))]`, which pulls rows from a static property or method returning `IEnumerable<object[]>`. Same one-method-many-cases idea; it just sources the table from code instead of attributes. Reach for it the moment `[InlineData]` won't compile your case.

## Mocking — isolating the unit under test

Real code has dependencies: a method you want to test calls a database, an HTTP API, a clock, a payment gateway. You don't want your *unit* test hitting a live database — it'd be slow, flaky, and testing the database instead of your logic. The fix is a **mock**: a fake stand-in for the dependency that you control completely, so the only real code in the test is the thing you're actually testing.

In .NET the common tools are **Moq** and **NSubstitute** (both NuGet packages; pick one per project). The pattern with Moq: create a `Mock<T>` of the dependency's *interface*, use `.Setup(...)` to script what its methods return, inject it into your class, and afterward use `.Verify(...)` to assert it was called the way you expected.

```csharp
using Moq;
using Xunit;

public interface IPriceFeed { decimal GetPrice(string symbol); }

public class Portfolio
{
    private readonly IPriceFeed _feed;
    public Portfolio(IPriceFeed feed) => _feed = feed;

    public decimal ValueOf(string symbol, int shares)
        => _feed.GetPrice(symbol) * shares;
}

public class PortfolioTests
{
    [Fact]
    public void ValueOf_MultipliesPriceByShares()
    {
        // Arrange: a fake feed that always returns 10.00 for "ACME"
        var feed = new Mock<IPriceFeed>();
        feed.Setup(f => f.GetPrice("ACME")).Returns(10.00m);
        var portfolio = new Portfolio(feed.Object);

        // Act
        decimal value = portfolio.ValueOf("ACME", 3);

        // Assert
        Assert.Equal(30.00m, value);
        feed.Verify(f => f.GetPrice("ACME"), Times.Once);
    }
}
```

*What just happened:* `new Mock<IPriceFeed>()` created a controllable fake of the `IPriceFeed` interface. `.Setup(f => f.GetPrice("ACME")).Returns(10.00m)` scripted its behavior: "when someone asks for ACME's price, hand back 10.00 — no real feed involved." We passed `feed.Object` (the actual fake instance) into `Portfolio`, so the only genuine logic running is `Portfolio.ValueOf`'s multiplication. `Verify(..., Times.Once)` then asserted the feed was queried exactly once — useful when *whether and how* a dependency gets called is itself part of correct behavior. Note `Portfolio` depends on the *interface*, not a concrete class — that's what makes it mockable, and it's a big reason interfaces matter.

⚠️ **Don't over-mock.** Mocking is for slow, external, or non-deterministic dependencies — networks, databases, clocks, the file system. When you mock your *own* simple classes, your test stops verifying real behavior and starts verifying that your code calls methods in the order you said it would — which breaks the instant you refactor, even when nothing's actually wrong. A test suite that's all mocks is a suite that passes while the app is broken. Mock at the boundaries; use the real thing inside them.

## Benchmarking with BenchmarkDotNet — measuring honestly

Now the speed question. Your instinct will be to wrap the code in a `Stopwatch`, loop it a million times, and print the elapsed milliseconds. ⚠️ **That number will lie to you**, and understanding *why* ties straight back to the runtime internals from [Phase 15](15-the-dotnet-runtime-and-gc.md).

A naive `Stopwatch` loop is wrong for three runtime reasons at once. First, **JIT warmup**: the first call to a method is *interpreted or freshly compiled*, far slower than steady state — your loop's early iterations measure compilation, not execution. Second, **tiered compilation**: the JIT initially produces quick-but-unoptimized code, then *recompiles hot methods* into fast code partway through your loop, so the method literally changes speed mid-measurement. Third, **the GC**: a garbage collection can fire in the middle of your timing window and charge its pause to whatever code happened to be running. Add dead-code elimination (the JIT may delete a result you never use) and your hand-rolled benchmark measures noise.

**BenchmarkDotNet** is the NuGet library that handles all of this for you. You tag methods with `[Benchmark]`; it runs warmup iterations until the JIT has settled, runs enough measured iterations for statistical confidence, isolates runs, prevents dead-code elimination, and — with one attribute — reports memory allocations too.

```csharp
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using System.Text;

[MemoryDiagnoser] // adds the allocation columns
public class StringBuildBench
{
    private readonly string[] _parts = { "a", "b", "c", "d", "e", "f", "g", "h" };

    [Benchmark(Baseline = true)]
    public string Concat()
    {
        string s = "";
        foreach (var p in _parts) s += p;   // re-allocates the whole string each time
        return s;
    }

    [Benchmark]
    public string Builder()
    {
        var sb = new StringBuilder();
        foreach (var p in _parts) sb.Append(p);
        return sb.ToString();
    }
}

// In Program.cs:
// BenchmarkRunner.Run<StringBuildBench>();
```

```console
$ dotnet run -c Release
| Method  | Mean      | Ratio | Allocated | Alloc Ratio |
|-------- |----------:|------:|----------:|------------:|
| Concat  | 142.6 ns  |  1.00 |     360 B |        1.00 |
| Builder |  61.3 ns  |  0.43 |     200 B |        0.56 |
```

*What just happened:* BenchmarkDotNet ran each method through warmup-then-measure, reporting **Mean** (average time per call) and, because of `[MemoryDiagnoser]`, **Allocated** (bytes of heap garbage per call). `[Benchmark(Baseline = true)]` made `Concat` the reference, so **Ratio** reads directly: `Builder` runs at `0.43` — under half the time — and allocates `0.56` of the garbage. The story the numbers force on you: `s += p` in a loop re-allocates the entire string every iteration (strings are immutable, remember), generating garbage that the GC must later collect, while `StringBuilder` grows one buffer. ⚠️ Note `dotnet run -c Release` — benchmarking a Debug build measures unoptimized code and is its own kind of lie.

💡 **Watch allocations, not just time.** The `Allocated` column is often the one to fix first. Every byte allocated is future work for the garbage collector ([Phase 15](15-the-dotnet-runtime-and-gc.md)), and GC pauses are what wreck a server's tail latency under load. A change that shaves nanoseconds but doubles allocations can be a *net loss* in production even though the microbenchmark looks faster.

## Profiling & coverage — measure, don't guess

A benchmark tells you *that* a method is slow. It doesn't tell you *where the time goes* across a whole running program — which method, called from where, is eating the CPU or churning the heap. For that you profile.

📝 **Profiler.** A tool that watches your program *as it runs* and records where it actually spends time (CPU) or memory (allocations), then ranks the results so you can see the true hotspots instead of guessing. The .NET toolbox:

- **`dotnet-trace`** — captures CPU/event traces from a running process; the cross-platform CLI workhorse.
- **`dotnet-counters`** — live dashboard of runtime metrics (CPU, GC frequency, allocation rate, thread-pool queue) — your first "what's it doing right now?" look.
- **`dotnet-gcdump`** — snapshots the managed heap so you can see *what's holding memory* (chasing leaks and bloat).
- **Visual Studio Profiler** and **PerfView** — rich GUI analyzers (PerfView is the deep, free, Windows-focused one the .NET team itself uses).

You install the CLI tools as global .NET tools and point them at a process:

```bash
dotnet tool install -g dotnet-trace
dotnet-trace collect --process-id 12345 --duration 00:00:30
# produces trace.nettrace — open it in Visual Studio, PerfView, or Speedscope
```

*What just happened:* `dotnet-trace collect` attached to a live process by PID and sampled 30 seconds of execution into a `.nettrace` file. Opened in an analyzer, that file ranks methods by time spent — and the ranking is the entire point. The function you were *sure* was the bottleneck routinely isn't; the profile shows you the one that actually is, often something boring like JSON serialization or a chatty database call in a loop.

💡 **Measure, don't guess — this is the whole discipline.** Every engineer has a confident hunch about the slow part, and that hunch is wrong often enough to waste real days. You optimize the function you suspected, ship it, and the app is exactly as slow as before because the cost was somewhere you never looked. Profile *first*, then optimize the thing the profile points at. (This is the evidence-gathering step; [Phase 17](17-performance-and-ecosystem.md) is about what to *do* once the profile has spoken.)

**Coverage** answers a different question: how much of your code did the tests actually run? In .NET the standard tool is **coverlet**, which plugs into `dotnet test`:

```bash
dotnet test --collect:"XPlat Code Coverage"
# writes a coverage.cobertura.xml report; turn it into HTML with ReportGenerator
```

*What just happened:* coverlet instrumented the build, tracked which lines executed while the tests ran, and wrote a coverage report. Fed to a viewer, it color-codes your source: green lines ran, red lines never did. The *red* is the useful part — it's a map of the branches your tests forgot.

⚠️ **Coverage is not correctness.** This trap catches everyone. Coverage tells you a line *executed* — it says nothing about whether you *checked the result*. A test that calls `Clamp` and asserts nothing lights the whole method green. Treat coverage as a map of the untested (chase the red), never as a score to maximize. High coverage with weak assertions is *more* dangerous than honest medium coverage, because it feels safe while proving almost nothing.

## Recap

1. **xUnit** is the common default (NUnit/MSTest also exist). A `[Fact]` is one test in **Arrange-Act-Assert** shape; `Assert.Equal` checks values and `Assert.Throws<T>` checks error paths. Run everything with `dotnet test`.
2. **`[Theory]` + `[InlineData]`** is C#'s table-driven testing: one method, many cases, each row an independent pass/fail. Use **`[MemberData]`** when cases need non-constant values.
3. **Mocking** (Moq/NSubstitute) replaces a real dependency with a controllable fake — `Mock<T>`, `.Setup`, `.Verify` — so you test *your* unit in isolation. ⚠️ Mock at the boundaries (network, DB, clock); over-mocking tests your wiring, not your behavior.
4. **BenchmarkDotNet** (`[Benchmark]`) measures honestly because ⚠️ a `Stopwatch` loop can't account for JIT warmup, tiered recompilation, and GC pauses ([Phase 15](15-the-dotnet-runtime-and-gc.md)); `[MemoryDiagnoser]` adds allocation columns — often the number to fix first.
5. **Profilers** (`dotnet-trace`, `dotnet-counters`, `dotnet-gcdump`, Visual Studio, PerfView) find the *real* hotspot. The discipline: 💡 measure, don't guess — profile first, optimize second.
6. **Coverage** via coverlet maps which lines ran. ⚠️ Coverage ≠ correctness: it proves a line executed, not that you checked the result. Chase the red; never chase the score.

You can now prove your C# is correct, measure how fast it really is, and find the slow part with evidence instead of instinct. Next we turn that evidence into action — performance techniques and a tour of the ecosystem you'll lean on for the rest of your C# life.

## Quick check

Test yourself on the ideas that separate "I ran it once and it looked fine" from "I measured it":

```quiz
[
  {
    "q": "Why use `[Theory]` with `[InlineData]` instead of writing four separate `[Fact]` methods?",
    "choices": [
      "One method runs once per data row — each row is an independent case, and adding a scenario is one new line, not a new method",
      "`[Theory]` runs faster than `[Fact]` because it skips the assertion step",
      "`[Theory]` is required whenever a test method has more than one parameter",
      "It automatically generates random inputs to fuzz the method"
    ],
    "answer": 0,
    "explain": "A `[Theory]` runs the same method body once per `[InlineData]` row, each as its own pass/fail with the actual values printed. The behavior under test becomes a visible list, and adding a case is a single line rather than a whole new copy-pasted method."
  },
  {
    "q": "Why can't you trust a `Stopwatch` wrapped around a million-iteration loop to benchmark .NET code?",
    "choices": [
      "JIT warmup, tiered recompilation, and GC pauses distort the timing — BenchmarkDotNet handles warmup and isolation so the number is meaningful",
      "Stopwatch only has millisecond resolution, which is always too coarse",
      "Loops are optimized away entirely, so the code never actually runs",
      "Stopwatch measures wall-clock time instead of CPU time, which is never useful"
    ],
    "answer": 0,
    "explain": "The first calls are JIT-compiled (slow), hot methods get recompiled to faster code mid-loop (tiered compilation), and a GC can fire inside your timing window. BenchmarkDotNet runs warmup until the JIT settles, then enough measured iterations for confidence, and prevents dead-code elimination."
  },
  {
    "q": "Your test suite reports 95% code coverage. What does that actually guarantee?",
    "choices": [
      "That 95% of lines executed during the tests — nothing about whether the results were checked",
      "That 95% of possible bugs have been found",
      "That every method has at least one assertion",
      "That the code is 95% likely to be correct"
    ],
    "answer": 0,
    "explain": "Coverage only measures which lines ran. A test that calls a method and asserts nothing still marks those lines green. Treat coverage as a map of the untested code (chase the red); high coverage with weak assertions feels safe but proves almost nothing about correctness."
  }
]
```

---

[← Phase 15: The .NET Runtime: Memory, GC & JIT](15-the-dotnet-runtime-and-gc.md) · [Guide overview](_guide.md) · [Phase 17: Performance & the Ecosystem →](17-performance-and-ecosystem.md)
