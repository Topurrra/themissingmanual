---
title: "Testing, Build & Profiling - Proving It Works, Finding the Slow Part"
guide: "java-from-zero"
phase: 16
summary: "JUnit 5 tests with the arrange-act-assert shape, parameterized and nested cases, Mockito in moderation, why naive microbenchmarks lie and how JMH fixes them, plus JFR profiling and JaCoCo coverage."
tags: [java, testing, junit, parameterized-tests, jmh, profiling, jfr, code-coverage]
difficulty: intermediate
synonyms: ["java junit 5 tutorial", "java parameterized test", "java jmh benchmark", "java profiling jfr visualvm", "java code coverage jacoco", "java mockito mocking", "how to test java code"]
updated: 2026-06-22
---

# Testing, Build & Profiling - Proving It Works, Finding the Slow Part

Back in [Phase 8](08-packages-and-tooling.md) you met the build tool that compiles, packages, and resolves dependencies - and a promise that "we cover testing in Phase 16." This is that phase. You can write Java that compiles and runs; what you can't yet do is *prove* it works, *measure* how fast it is, or *find* the slow part when it isn't.

The mental model for this phase: a real Java codebase doesn't run on hope. It runs on a test suite that fails loudly when behavior breaks, on measurements instead of guesses about speed, and on a profiler that points at the actual hot spot rather than the one you suspected. The JVM ships a mature toolchain for all of it - JUnit for correctness, JMH for honest benchmarks, Java Flight Recorder for profiling. "Is it correct?" and "is it fast?" stop being arguments in code review and become commands you run.

## JUnit 5 - the basics and the AAA shape

📝 **Unit test** - a small automated test that exercises one method (or class) with a known input and asserts the expected result. It's "unit" because it tests one thing in isolation, not the whole app wired together. It runs in milliseconds, needs no database or network, and fails loudly the moment the behavior it pins down changes. **JUnit 5** is the de facto framework that runs these and reports pass/fail.

Without tests, "it works" means "it worked the one time I ran it by hand." A unit test turns that into a permanent, repeatable claim: run the suite, and every method that ever had a test still behaves. The payoff isn't catching today's bug - it's catching the one you'll introduce six months from now when you refactor and forget an edge case.

A JUnit test is a method annotated `@Test` that calls **assertions** - `assertEquals`, `assertTrue`, `assertThrows` - which fail the test if reality disagrees. The shape that keeps tests readable is **AAA: Arrange, Act, Assert** - set up the inputs, call the thing once, check the result. Say we're testing `Clamp`, which pins a number into a `[min, max]` range:

```java
// Clamp.java
package com.example.mathx;

public class Clamp {
    public static int clamp(int n, int min, int max) {
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }
}
```

```java
// ClampTest.java
package com.example.mathx;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ClampTest {

    @Test
    void clampsValueBelowMinimum() {
        // Arrange
        int n = -3, min = 0, max = 10;
        // Act
        int result = Clamp.clamp(n, min, max);
        // Assert
        assertEquals(0, result);
    }

    @Test
    void throwsIsNotOurJobButWeCanCheckOne() {
        // assertThrows verifies the call raises the exception you expect
        assertThrows(ArithmeticException.class, () -> {
            int x = 1 / 0;
        });
    }
}
```

```console
$ mvn test
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.example.mathx.ClampTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] -------------------------------------------------------
[INFO] BUILD SUCCESS
```

*What just happened:* Each `@Test` method is one independent test JUnit discovers and runs. The first follows AAA exactly - arrange the inputs, act by calling `clamp` once, assert the result equals `0`. `assertEquals(expected, actual)` fails the test (printing both values) if they differ; `assertThrows` is the assertion for the *unhappy* path, running the lambda and passing only if the expected exception is thrown. We ran it with `mvn test` (Gradle's `./gradlew test` is the same idea). ⚠️ Note the `assertEquals(expected, actual)` order: swap them and failure messages read backwards, maddening at 2am.

💡 **Key point.** The AAA shape isn't ceremony - it's what makes a test readable as a *specification*. Anyone can scan "given `-3, 0, 10`, expect `0`" and understand the contract without reading `clamp`'s body. A test that mixes setup, calls, and checks into a tangle is a test nobody trusts.

## Parameterized & nested tests - one method, many cases

You just wrote one test for "below min," but `clamp` has at least four interesting cases: inside the range, below min, above max, exactly on a boundary. Copy-pasting `clampsValueBelowMinimum` four times - changing only the numbers - is exactly the duplication that rots. JUnit's answer is the **parameterized test**: one test method, fed many sets of inputs.

📝 **Parameterized test** - a single `@ParameterizedTest` method JUnit runs once per data row you supply. Inputs come from a source annotation; the method body is the shared assertion logic - Java's version of table-driven testing.

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ClampParamTest {

    // @ValueSource: one parameter per run - every value here is already in range,
    // so clamping should return it unchanged.
    @ParameterizedTest
    @ValueSource(ints = {0, 5, 10})
    void valuesInsideRangePassThrough(int n) {
        assertEquals(n, Clamp.clamp(n, 0, 10));
    }

    // @CsvSource: multiple parameters per run - "input, expected" rows.
    @ParameterizedTest(name = "clamp({0}) -> {1}")
    @CsvSource({
        "-3, 0",    // below min
        "99, 10",   // above max
        "7,  7"     // inside
    })
    void clampsToBounds(int input, int expected) {
        assertEquals(expected, Clamp.clamp(input, 0, 10));
    }
}
```

```console
$ mvn test
[INFO] Running com.example.mathx.ClampParamTest
clamp(-3) -> 0  ✔
clamp(99) -> 10 ✔
clamp(7)  -> 7  ✔
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

*What just happened:* `@ValueSource` fed three single `int` values into one method, so JUnit ran it three times. `@CsvSource` fed three comma-separated rows, each unpacked into `input` and `expected` - the same shared assertion checked all three. Six logical tests, two methods, zero copy-paste. `name = "clamp({0}) -> {1}"` labels each run with the parameter values, so a failure tells you *which row* broke.

💡 The behavior under test is now a *visible list* of cases. A reviewer can scan the rows and ask "where's the case for `min > max`?" - nearly impossible when each scenario hides in its own method.

Two more annotations round this out. **`@DisplayName`** attaches a human sentence to a test or class, so reports read like English instead of method names. **`@Nested`** groups related tests in an inner class - useful for organizing by scenario:

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Clamp")
class ClampNestedTest {

    @Nested
    @DisplayName("when value is out of range")
    class OutOfRange {
        @Test
        @DisplayName("pins values below min up to min")
        void belowMin() {
            assertEquals(0, Clamp.clamp(-5, 0, 10));
        }

        @Test
        @DisplayName("pins values above max down to max")
        void aboveMax() {
            assertEquals(10, Clamp.clamp(50, 0, 10));
        }
    }
}
```

*What just happened:* `@Nested` turns `OutOfRange` into a sub-group, and the `@DisplayName`s make the test report read as a nested outline - "Clamp › when value is out of range › pins values below min up to min." That structure is documentation that can't go stale, since it fails if the behavior it describes breaks.

## Mocking - testing a unit in true isolation

Real methods rarely live alone. An `OrderService` calls a `PaymentGateway`; a `UserService` hits a database. To test the *service* without firing real payments or needing a live database, replace the dependency with a **mock** - a fake stand-in you control. **Mockito** is the standard library for this.

📝 **Mock** - a controllable stand-in for a real dependency. Tell it what to return (`when(...).thenReturn(...)`), exercise the code under test, then verify it called the dependency correctly (`verify(...)`) - testing one unit while its collaborators behave however the scenario needs.

```java
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderServiceTest {

    @Test
    void chargesTheGatewayAndReturnsSuccess() {
        // Arrange: a fake gateway that "succeeds" without touching a real network
        PaymentGateway gateway = mock(PaymentGateway.class);
        when(gateway.charge(100)).thenReturn(true);

        OrderService service = new OrderService(gateway);

        // Act
        boolean ok = service.placeOrder(100);

        // Assert: the result, and that we actually called charge() once with 100
        assertTrue(ok);
        verify(gateway).charge(100);
    }
}
```

*What just happened:* `mock(PaymentGateway.class)` created a fake gateway whose methods do nothing by default. `when(gateway.charge(100)).thenReturn(true)` programmed it: "if asked to charge 100, say success." We injected that fake into `OrderService`, ran `placeOrder`, and checked the returned result plus (via `verify`) that `charge(100)` was called exactly once. No real payment, no network, fully deterministic.

⚠️ **Don't over-mock.** Mocks are for *boundaries you can't or shouldn't hit in a test* - payment gateways, email senders, the network. Mock your own plain value objects and internal helpers, and your tests stop verifying behavior and start verifying that your code calls itself in a particular order - they break on every refactor and prove almost nothing. Mock the edges; use the real thing everywhere else.

## Benchmarking with JMH - why naive timing lies

Correctness is one question; *speed* is another - and here Java sets a trap that catches nearly everyone. The instinct is to wrap your code in `System.nanoTime()` calls and a loop. On the JVM, that number is **a lie**, tying straight back to the JIT compiler from [Phase 15](15-the-jvm-memory-and-gc.md).

⚠️ **You cannot time Java reliably with `System.nanoTime` in a loop.** Two forces sabotage you. **JIT warmup**: the first thousands of iterations run interpreted or half-optimized, and the JIT only compiles your hot loop to native code *after* it's deemed hot - time the whole loop and you average cold and hot together. **Dead-code elimination**: if you compute a result and never use it, the JIT can delete the computation entirely, so you end up benchmarking an empty loop and reporting an impossibly fast "result."

📝 **Why naive microbenchmarks lie.** A hand-rolled `nanoTime` loop measures a moving target (the JIT optimizing mid-run) and an unstable one (the optimizer may delete code whose result you discard). The fix isn't more careful manual timing - it's a framework built to defeat exactly these effects.

That framework is **JMH** (Java Microbenchmark Harness), the official OpenJDK tool. Annotate a method with `@Benchmark`; JMH runs dedicated *warmup* iterations to let the JIT settle, runs your code in a fresh JVM *fork* (so one benchmark can't pollute another's optimization state), and consumes your return values through a `Blackhole` so the optimizer can't delete them. You get an honest number with error bars.

```java
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5)   // let the JIT warm up before measuring
@Measurement(iterations = 5)
@Fork(1)
public class StringBuildBenchmark {

    private final String[] parts = {"a", "b", "c", "d", "e", "f", "g", "h"};

    @Benchmark
    public String concatWithPlus() {
        String s = "";
        for (String p : parts) {
            s += p;   // each += builds a brand-new String
        }
        return s;     // returned, so the JIT can't delete the work
    }

    @Benchmark
    public String concatWithBuilder() {
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            sb.append(p);
        }
        return sb.toString();
    }
}
```

```console
$ java -jar target/benchmarks.jar StringBuildBenchmark
# JMH version: 1.37
# Warmup: 5 iterations, 1 s each
# Measurement: 5 iterations, 1 s each
...
Benchmark                              Mode  Cnt    Score    Error  Units
StringBuildBenchmark.concatWithPlus    avgt    5  118.402 ±  4.211  ns/op
StringBuildBenchmark.concatWithBuilder avgt    5   42.097 ±  1.640  ns/op
```

*What just happened:* JMH ran each `@Benchmark` through 5 discarded warmup iterations (letting the JIT compile the hot path) and 5 measured iterations, in a forked JVM. Output reads in **ns/op** with a `± Error` margin, so you know it's stable, not noise. The numbers: `+=` in a loop (~118 ns) is nearly three times slower than `StringBuilder` (~42 ns), because each `+=` allocates a brand-new `String` (strings are immutable) while the builder mutates one buffer. Returning the result keeps the JIT from deleting the loop - the `+=`-versus-builder lesson you might have *guessed*, now with a defensible number.

💡 **Key point.** Reach for JMH only when genuinely comparing two implementations or chasing a measured hot spot - not to micro-time everything. But when you *do* benchmark, use JMH: a hand-rolled timing loop on the JVM doesn't just give an imprecise answer, it gives a confidently *wrong* one.

## Profiling & coverage - find the real hot spot, map the untested

A benchmark tells you *that* one method is slow when you already suspected it - it won't tell you *where* a whole running application spends its time. For that you need a **profiler**.

📝 **Profiler** - a tool that samples your running program to record where it actually spends CPU time and allocates memory, then shows the answer ranked worst to best. It replaces "I think this function is the bottleneck" with "here is the measured bottleneck."

The JVM has an unusually strong profiling story, all production-grade:

- **Java Flight Recorder (JFR)** - built *into the JVM itself*, low enough overhead to leave on in production. Start a recording (`java -XX:StartFlightRecording=...`) to capture CPU, allocation, lock, and GC events into a `.jfr` file, then open it in **JDK Mission Control (JMC)** for a visual breakdown of hot methods and allocation sources.
- **VisualVM** - a free, friendly graphical profiler for development: attach to a running JVM and watch CPU, heap, and threads live.
- **async-profiler** - a low-overhead sampling profiler popular for *flame graphs*, where each bar's width shows how much total time a call path consumed - great for spotting a hot path at a glance.

```console
$ java -XX:StartFlightRecording=duration=60s,filename=app.jfr -jar myapp.jar
[1.234s][info][jfr] Started recording 1. Will dump to app.jfr after 60 s.
...
$ jfr print --events jdk.ExecutionSample app.jfr | head
# (or open app.jfr in JDK Mission Control for the visual view)
```

*What just happened:* `-XX:StartFlightRecording` told the JVM to record 60 seconds of execution into `app.jfr` while the app ran normally - no code changes, negligible overhead. Opening that file in Mission Control ranks methods by how often the profiler caught them running, so the real CPU hog rises to the top. `jfr print` is the command-line peek at the same data.

💡 **Measure, don't guess.** Every engineer has a confident hunch about the bottleneck, and it's wrong often enough to waste real days: you optimize the method you *suspected*, ship it, and the app is exactly as slow, because the true cost lived somewhere you never looked. Profile first, then optimize what the profile points at - the evidence-gathering step [Phase 17](17-performance-and-ecosystem.md) builds on.

The other side of "did I test enough?" is **code coverage** - how much of your code the test suite actually executed. **JaCoCo** is the standard tool; build tools wire it in and produce a color-coded report:

```console
$ mvn test    # with the jacoco-maven-plugin configured
[INFO] --- jacoco:report ---
[INFO] Analyzed bundle 'mathx' with 3 classes
[INFO] Coverage: 82% of lines, 75% of branches
# open target/site/jacoco/index.html - green = covered, red = never ran
```

*What just happened:* JaCoCo instrumented the code during the test run and tracked which lines and branches executed. The HTML report colors your source: green lines ran during tests, red lines never did. The red is the valuable part - it shows the branches your tests forgot, like the `min > max` case nobody wrote.

⚠️ **Coverage is not correctness.** The trap everyone walks into. Coverage tells you a line *executed* - nothing about whether you *checked the result*, or whether the input that breaks it was ever tried. A test that calls `clamp` once and asserts nothing can light up the whole method green. Treat coverage as a *map of the untested* - chase the red - never as a score to maximize. High coverage with weak assertions is more dangerous than honest medium coverage, because it *feels* safe.

## Recap

1. A **unit test** is a `@Test` method that asserts one method's behavior for a known input. Follow the **Arrange-Act-Assert** shape so the test reads as a spec, run it with `mvn test` / `./gradlew test`, and mind the `assertEquals(expected, actual)` argument order.
2. **`@ParameterizedTest`** with `@ValueSource` / `@CsvSource` runs one method over many input rows - Java's table-driven testing - while `@DisplayName` and `@Nested` make the report read like documentation.
3. **Mockito** replaces a real dependency with a controllable mock (`mock` / `when` / `verify`) so you can test a unit in isolation; ⚠️ mock the boundaries, not your own internals.
4. ⚠️ You **cannot** time Java with a `nanoTime` loop - JIT warmup and dead-code elimination make the number a confident lie. **JMH** (`@Benchmark`) handles warmup, forking, and result-sinking, and reports honest **ns/op** with error bars.
5. **Profilers** - **JFR** + JDK Mission Control, VisualVM, async-profiler - find the real CPU/allocation hot spot. 💡 Measure, don't guess: profile first, then optimize what the profile points at.
6. **JaCoCo** maps which lines and branches your tests ran - chase the red - but ⚠️ coverage is not correctness: an executed line is not a checked one.

You can now prove your Java is correct, measure how fast it is honestly, and find the slow part with evidence instead of instinct. Next: widening the lens to performance patterns and the broader ecosystem that turns those measurements into action.

## Quick check

Test yourself on the ideas that separate "I ran it once" from "I proved it works and measured it":

```quiz
[
  {
    "q": "Why can't you reliably benchmark Java code with a `System.nanoTime()` loop, and what does JMH do about it?",
    "choices": [
      "JIT warmup and dead-code elimination distort the result; JMH adds warmup iterations, JVM forking, and a Blackhole so the numbers are honest",
      "nanoTime() isn't precise enough; JMH uses a higher-resolution clock",
      "Loops are always optimized away in Java; JMH disables the JIT entirely",
      "nanoTime() returns wall-clock time; JMH measures CPU time instead"
    ],
    "answer": 0,
    "explain": "A naive loop averages cold interpreted runs with hot JIT-compiled ones, and the optimizer can delete computations whose results you never use. JMH runs dedicated warmup iterations so the JIT settles, forks a fresh JVM, and consumes return values through a Blackhole so the work can't be eliminated."
  },
  {
    "q": "Your JaCoCo report shows 100% line coverage. What does that actually guarantee?",
    "choices": [
      "Every line executed at least once during the tests - nothing about whether results were asserted",
      "The code has no bugs",
      "Every possible input was tested",
      "Every assertion in the suite passed"
    ],
    "answer": 0,
    "explain": "Coverage only measures which lines ran. A test that calls a method and asserts nothing still marks those lines green. Treat coverage as a map of the untested - chase the red - because high coverage with weak assertions feels safe but proves almost nothing."
  },
  {
    "q": "What is a `@ParameterizedTest` and why prefer it over copy-pasting a `@Test` method four times?",
    "choices": [
      "One test method JUnit runs once per input row, so the cases become a visible, reviewable list instead of duplicated code",
      "A test that automatically generates random inputs to find crashes",
      "A test that runs in parallel across multiple CPU cores",
      "A faster kind of test that skips the JUnit lifecycle"
    ],
    "answer": 0,
    "explain": "A parameterized test feeds many input rows (via @ValueSource or @CsvSource) through one shared assertion. Adding a scenario is a new row, not a new method, and a reviewer can scan the rows to spot a missing case - far harder when each scenario hides in its own copy-pasted method."
  }
]
```

---

[← Phase 15: The JVM: Memory, GC & JIT](15-the-jvm-memory-and-gc.md) · [Guide overview](_guide.md) · [Phase 17: Performance & the Ecosystem →](17-performance-and-ecosystem.md)
