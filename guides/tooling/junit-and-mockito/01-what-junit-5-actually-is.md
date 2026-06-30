---
title: "What JUnit 5 actually is"
guide: junit-and-mockito
phase: 1
summary: "The Java testing duo: JUnit 5 for structuring and running tests with assertions and lifecycle, and Mockito for mocking the collaborators you want to isolate."
tags: [junit, mockito, java, testing, unit-tests, mocking, jupiter]
difficulty: intermediate
synonyms: ["junit 5 tutorial", "mockito mock example", "java unit testing", "junit jupiter", "when thenReturn mockito", "verify mockito", "beforeeach junit", "parameterized test junit"]
updated: 2026-06-30
---

# What JUnit 5 actually is

Here's the reality you're starting from: a test in Java is not a special language feature. It's an ordinary method in an ordinary class. The only thing that makes it a *test* is an annotation that tells a test runner "call this method, and if it throws, that's a failure." That's the whole trick. JUnit is the machinery that finds those annotated methods, runs them in a predictable order, and reports which ones blew up.

JUnit 5 is the current generation, and it's actually three pieces wearing one name. **Jupiter** is the API you write against (`@Test`, `@BeforeEach`, assertions). The **platform** is the engine that discovers and launches tests - it's what your build tool and IDE talk to. And there's a **vintage** engine that runs old JUnit 4 tests so legacy suites don't have to be rewritten overnight. When someone says "JUnit 5," they almost always mean *writing Jupiter tests*. That's what you'll do here.

## The smallest test that exists

A test class is a normal class. A test method is a method annotated `@Test` that contains an assertion - a statement that throws if reality doesn't match expectation.

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculatorTest {

    @Test
    void addsTwoNumbers() {
        Calculator calc = new Calculator();
        int result = calc.add(2, 3);
        assertEquals(5, result);   // expected first, actual second
    }
}
```

*What just happened:* the runner found `addsTwoNumbers` because of `@Test`, called it, and `assertEquals` compared `5` (expected) against `result` (actual). They matched, so nothing threw, so the test passed. Note the argument order - `assertEquals(expected, actual)`. Reverse it and your failure messages read backwards, which costs you minutes every time something breaks.

Test methods don't need to be `public` in JUnit 5 (they did in JUnit 4). Package-private is the convention. They also return `void` and take no arguments - unless you ask for them, which Phase 2 gets into with mocks.

## Assertions: the part that does the judging

An assertion is the line that decides pass or fail. JUnit gives you a focused set, all static methods on `Assertions`:

```java
assertEquals(expected, actual);          // values match
assertTrue(condition);                   // condition is true
assertNull(value);                       // value is null
assertThrows(IllegalArgumentException.class,
             () -> service.parse("oops")); // the call throws that type
```

*What just happened:* each line is a small contract. The first three check a value; `assertThrows` is the one people forget exists - it asserts that the lambda *does* throw the given exception type, and it returns the caught exception so you can assert on its message too. Testing the unhappy path this way is far cleaner than wrapping things in `try/catch` and a manual `fail()`.

One habit worth building early: **one logical thing per test**. Not literally one assertion, but one behavior. A test named `addsTwoNumbers` that also checks subtraction is a test that, when it fails, can't tell you which half broke.

## Lifecycle: setup without copy-paste

Most tests need a fresh object to work on. Writing `new Calculator()` at the top of every method works until you have twenty methods. The lifecycle annotations fix that.

```java
class OrderServiceTest {

    private OrderService service;

    @BeforeEach
    void setUp() {
        service = new OrderService();   // runs before EVERY @Test
    }

    @Test
    void startsEmpty() {
        assertEquals(0, service.itemCount());
    }

    @Test
    void countsAddedItems() {
        service.add("widget");
        assertEquals(1, service.itemCount());
    }
}
```

*What just happened:* `@BeforeEach` ran `setUp` once before *each* test method, handing both tests a brand-new `service`. That freshness is the point - `countsAddedItems` adding an item can't leak into `startsEmpty`, because the second test never sees the first one's object. Test isolation is non-negotiable; the day two tests share mutable state is the day "run them in a different order and they fail" enters your life.

The family: `@BeforeEach` / `@AfterEach` run around every test; `@BeforeAll` / `@AfterAll` run once for the whole class (and must be `static`, because there's no instance yet). Reach for `@BeforeAll` only for genuinely expensive shared setup - JUnit creates a fresh test-class instance per method by default precisely to keep tests independent.

## Parameterized tests: same logic, many inputs

When you'd otherwise copy a test five times with different numbers, that's the signal for a parameterized test. One method body, many runs.

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@ParameterizedTest
@ValueSource(strings = {"racecar", "level", "noon"})
void detectsPalindromes(String word) {
    assertTrue(Palindrome.isPalindrome(word));
}
```

*What just happened:* `@ParameterizedTest` replaces `@Test`, and `@ValueSource` fed the method three strings - so this ran three separate times, once per word, each reported individually. If `"level"` fails, you see *that* input named in the failure, not a vague "the palindrome test broke." For pairs of inputs and expected outputs, `@CsvSource({"2, 3, 5", "0, 0, 0"})` gives you `(a, b, expected)` columns.

> **For builders:** parameterized tests are where bugs hide and die. Edge cases - empty string, zero, negative, the boundary value - are cheap to add as one more row, and each row is a named, independent failure. The marginal cost of testing one more input is one line.

## How it actually runs

You rarely invoke JUnit by hand. Your build tool drives the platform, which discovers your Jupiter tests and runs them.

```bash
$ mvn test
[INFO] Running com.example.OrderServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.example.CalculatorTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

*What just happened:* `mvn test` (Gradle's equivalent is `gradle test`) told Maven to compile and run everything under `src/test/java`. Maven handed the platform the test classes, the platform asked the Jupiter engine to run them, and you got a tally. "Failures" are failed assertions; "Errors" are unexpected exceptions - a distinction that tells you whether your code did the wrong thing or fell over entirely.

```quiz
[
  {
    "q": "What makes an ordinary Java method into a test JUnit will run?",
    "choices": ["It must be public and named test*", "The @Test annotation", "It must return a boolean", "It must live in a class ending in Test"],
    "answer": 1,
    "explain": "JUnit's runner discovers methods by the @Test annotation. Naming and the Test suffix are conventions, not requirements, and JUnit 5 methods need not be public."
  },
  {
    "q": "Why does @BeforeEach matter for test isolation?",
    "choices": ["It runs the slowest tests first", "It gives every test method a freshly built object so state can't leak between tests", "It runs only once for the whole class", "It marks a method as a parameterized test"],
    "answer": 1,
    "explain": "@BeforeEach runs before each test, rebuilding shared fixtures so one test's mutations can't bleed into another. @BeforeAll is the once-per-class one."
  },
  {
    "q": "What is the correct argument order for assertEquals?",
    "choices": ["actual, then expected", "expected, then actual", "order doesn't matter", "message, expected, actual only"],
    "answer": 1,
    "explain": "assertEquals(expected, actual). Reversing it produces backwards failure messages that waste debugging time."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Mocking with Mockito →](02-mocking-with-mockito.md)
