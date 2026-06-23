---
title: "Lambdas & Functional Interfaces — Functions as Values"
guide: "java-from-zero"
phase: 11
summary: "Lambdas let you pass behavior around like data. Here's the mental model: a lambda is an instance of a functional interface (a SAM), why that target type is required, the built-in vocabulary Streams speaks, and method references."
tags: [java, lambdas, functional-interfaces, method-references, function, predicate, consumer, supplier]
difficulty: intermediate
synonyms: ["java lambda expression", "java functional interface", "java method reference", "java Function Predicate Consumer Supplier", "java SAM interface", "what is functionalinterface annotation", "java lambda vs anonymous class"]
updated: 2026-06-22
---

# Lambdas & Functional Interfaces — Functions as Values

Up to now, the unit of behavior in your Java has been the *method* — something attached to an object, called by name. But every so often you need to hand a *piece of behavior* to another method: "here's how to compare two things, you do the sorting" or "here's what to run when this finishes." Before Java 8 that was painful enough that people avoided it. After Java 8 it became one line, and it quietly rewired how modern Java is written.

This phase is about that rewiring. The mental model to hold the whole time: **a lambda is a value — a chunk of behavior you can store in a variable, pass to a method, and call later.** Once that clicks, the Streams API in the next phase (`.filter(...).map(...)`) stops looking like magic and starts looking like the obvious consequence of "functions are values now." We'll build to it: the problem lambdas solve, what a lambda actually *is* under the hood, the handful of built-in types that everything speaks, and the shorthand that makes it read like English.

## The problem — passing behavior the old way

Sometimes a method doesn't just need *data*, it needs *behavior*. The classic case: sorting. `Collections.sort` knows how to sort, but it can't know whether you want names sorted by length or alphabetically — that's *your* decision. So it asks you for a `Comparator`: a little object whose one job is to compare two items.

Before Java 8, the only way to supply that on the spot was an **anonymous inner class** — a whole class definition, written inline, just to deliver one method.

```java
import java.util.*;

List<String> names = new ArrayList<>(List.of("Charlie", "Bo", "Alexandra"));

// Pre-Java-8: an anonymous class just to say "compare by length".
Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
});

System.out.println(names);
```
```console
[Bo, Charlie, Alexandra]
```
*What just happened:* the actual logic — "compare by length" — is a single expression, `Integer.compare(a.length(), b.length())`. But to deliver it, you wrote five lines of scaffolding: `new Comparator<String>() { @Override public int compare(...) { ... } }`. The class has no name, exists only to be passed once, and yet you typed the type, the method signature, and the braces by hand. The *intent* is buried under ceremony. This is the pain lambdas were invented to remove.

The same ceremony shows up everywhere behavior gets passed around — a `Runnable` for "code to run later," an event listener for "what to do on click." Lots of boilerplate wrapping one small idea.

## Lambdas — anonymous functions, minus the ceremony

📝 **Lambda** — a compact, anonymous function written inline as a value: a parameter list, an arrow `->`, and a body. `(a, b) -> a + b` reads as "given `a` and `b`, produce `a + b`." It has no name and isn't attached to a class — it's just behavior you can hand off.

A lambda is the anonymous-class boilerplate boiled down to its essence. Watch the same sort collapse:

```java
import java.util.*;

List<String> names = new ArrayList<>(List.of("Charlie", "Bo", "Alexandra"));

// Java 8+: the same comparator, as a lambda.
Collections.sort(names, (a, b) -> Integer.compare(a.length(), b.length()));

System.out.println(names);
```
```console
[Bo, Charlie, Alexandra]
```
*What just happened:* identical result, but the scaffolding is gone. `(a, b) -> Integer.compare(a.length(), b.length())` says exactly what the five-line version said — take two strings, compare their lengths — and nothing more. No `new Comparator<String>()`, no `@Override`, no method name, no braces. Notice you didn't even write the parameter types: the compiler already knows `Collections.sort` wants a `Comparator<String>`, so `a` and `b` *must* be strings, and it fills that in for you. The lambda is the behavior, with the noise removed.

A few syntax shapes you'll see, all the same idea:

```java
() -> 42                          // no parameters
x -> x * x                        // one parameter, parens optional
(int x, int y) -> x + y           // explicit types when you want them
(a, b) -> {                       // a block body, when you need statements
    int sum = a + b;
    return sum;                   // a block must return explicitly
}
```
*What just happened:* a single-expression body (`x * x`) is automatically the return value — no `return`, no semicolon. The moment you use `{ }` braces, you're writing a normal method body and must `return` explicitly. With exactly one parameter you can drop the parentheses (`x -> ...`); with zero or more than one, the parentheses are required.

## Functional interfaces — what a lambda *actually is*

Here's the question that unlocks everything: a lambda isn't attached to any class, so **what is its type?** Java is statically typed — every value has a type — so `(a, b) -> a + b` must *be* something. What?

📝 **Functional interface** — an interface with exactly **one abstract method** (a "SAM": *Single Abstract Method*). A lambda is an *instance* of a functional interface. The lambda's parameters and body become the implementation of that one method.

This is the whole secret. When you wrote `(a, b) -> Integer.compare(...)`, the compiler saw that `Collections.sort` wanted a `Comparator<String>` — an interface with one abstract method, `compare`. So it treated your lambda *as* a `Comparator`, plugging the lambda's body in as the `compare` method. The lambda didn't replace the interface; it *implemented* it, invisibly.

And this is **why a lambda always needs a target type.** A lambda by itself is ambiguous — `(a, b) -> a + b` could implement any two-argument interface. Java figures out which one from context: the parameter type you're passing it to, the variable you're assigning it to, the return type of the method it's in. No target type, no lambda.

You can prove all of this by writing your own functional interface:

```java
@FunctionalInterface
interface Calculator {
    int apply(int a, int b);          // exactly one abstract method
}

public class Demo {
    public static void main(String[] args) {
        Calculator add = (a, b) -> a + b;        // lambda IS a Calculator
        Calculator mul = (a, b) -> a * b;

        System.out.println(add.apply(3, 4));     // calls the lambda body
        System.out.println(mul.apply(3, 4));
    }
}
```
```console
7
12
```
*What just happened:* `Calculator` is an interface with one method, `apply`. The lambda `(a, b) -> a + b` becomes the *implementation* of that method — so `add` is a real `Calculator`, and `add.apply(3, 4)` runs the lambda body and returns `7`. The variable's type (`Calculator`) is the target type that tells the compiler what the lambda is. Swap the body to `a * b` and you get a different `Calculator`. The lambda is genuinely an instance of your interface; there's no separate "lambda type" hiding anywhere.

💡 **`@FunctionalInterface`** is an optional annotation, but use it. It does nothing at runtime — it's a promise to the compiler: "this interface should have exactly one abstract method." If someone later adds a second abstract method, the code won't compile, and you'll find out immediately instead of when a lambda mysteriously stops fitting. It documents intent and guards it at the same time.

⚠️ Don't confuse "one *abstract* method" with "one method total." A functional interface can have any number of `default` and `static` methods — those have bodies, so they're not abstract. `Comparator`, for example, is a functional interface (one abstract method, `compare`) even though it carries a dozen `default` helpers like `reversed()` and `thenComparing()`. Only the *abstract* count must be one.

## The built-in functional interfaces — the shared vocabulary

You *could* define a custom functional interface every time, but you almost never need to. The `java.util.function` package ships a small set of general-purpose ones, and the entire modern Java ecosystem — Streams especially — is built to speak them. Learn these names and you can read any modern Java API.

There are four core shapes, distinguished by one question: *does it take an input? does it return an output?*

📝 **`Function<T, R>`** — takes a `T`, returns an `R`. The general "transform one thing into another." Its method is `apply`.

📝 **`Predicate<T>`** — takes a `T`, returns a `boolean`. A yes/no test, the thing you filter with. Its method is `test`.

📝 **`Consumer<T>`** — takes a `T`, returns nothing. A side effect: print it, save it, log it. Its method is `accept`.

📝 **`Supplier<T>`** — takes nothing, returns a `T`. A source of values, often a deferred or lazy producer. Its method is `get`.

One line each makes the shapes concrete:

```java
import java.util.function.*;

Function<String, Integer> length = s -> s.length();      // String in, int out
Predicate<Integer> isEven       = n -> n % 2 == 0;       // int in, boolean out
Consumer<String> shout          = s -> System.out.println(s.toUpperCase());
Supplier<Double> random         = () -> Math.random();   // nothing in, double out

System.out.println(length.apply("hello"));   // 5
System.out.println(isEven.test(4));          // true
shout.accept("hi there");                    // HI THERE
System.out.println(random.get() < 1.0);      // true
```
```console
5
true
HI THERE
true
```
*What just happened:* four lambdas, four different shapes. `length` *transforms* (Function: `apply`), `isEven` *tests* (Predicate: `test`), `shout` *does something with no result* (Consumer: `accept`), and `random` *produces from nothing* (Supplier: `get`). Each is just a lambda assigned to the matching built-in type — no custom interface needed. The method name changes per type (`apply`/`test`/`accept`/`get`), but they're all "call the one abstract method."

There's also **`BiFunction<T, U, R>`** for the two-input case — takes a `T` and a `U`, returns an `R`:

```java
import java.util.function.BiFunction;

BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
System.out.println(add.apply(3, 4));     // 7
```
```console
7
```
*What just happened:* this is the `Calculator` interface you wrote earlier, except you didn't have to write it — `BiFunction<Integer, Integer, Integer>` is the off-the-shelf "two things in, one thing out." (You'll also meet relatives like `BiPredicate`, `UnaryOperator<T>` — a `Function` where input and output are the same type — and `BinaryOperator<T>`. Same idea, just named for common shapes.)

💡 **Why this matters.** These types are the *vocabulary* the Streams API and modern Java APIs speak. When you see `.filter(Predicate)`, `.map(Function)`, `.forEach(Consumer)` in the next phase, you'll already know exactly what each one wants: a test, a transform, a side effect. Streams aren't a new language — they're these four shapes wired together into a pipeline. Learning the vocabulary here is what makes Phase 12 feel like recognition instead of memorization.

## Method references — when a lambda just calls something

Look closely at a lambda like `s -> s.length()` or `s -> System.out.println(s)`. The lambda's *entire job* is to forward its argument to a method that already exists. That's so common Java gives it an even shorter form: the **method reference**.

📝 **Method reference** — shorthand for a lambda that does nothing but call an existing method. Written `Target::methodName`. `s -> s.toUpperCase()` becomes `String::toUpperCase`; `s -> System.out.println(s)` becomes `System.out::println`.

The four kinds, briefly:

- **Static method** — `Integer::parseInt` for `s -> Integer.parseInt(s)`.
- **Instance method of a particular object** — `System.out::println` for `s -> System.out.println(s)`.
- **Instance method of an arbitrary object of a type** — `String::toUpperCase` for `s -> s.toUpperCase()` (the receiver *becomes* the parameter).
- **Constructor** — `Account::new` for `() -> new Account()` (or with args, depending on the target type).

```java
import java.util.*;

List<String> names = new ArrayList<>(List.of("ada", "bo", "cleo"));

names.forEach(System.out::println);            // vs.  s -> System.out.println(s)
names.replaceAll(String::toUpperCase);         // vs.  s -> s.toUpperCase()
System.out.println(names);

List<String> nums = List.of("10", "20", "30");
int total = nums.stream().mapToInt(Integer::parseInt).sum();   // vs. s -> Integer.parseInt(s)
System.out.println(total);
```
```console
ada
bo
cleo
[ADA, BO, CLEO]
60
```
*What just happened:* `System.out::println` is the same `Consumer` as `s -> System.out.println(s)`, just without naming the obvious argument. `String::toUpperCase` is the "arbitrary object" kind — each list element becomes the receiver the method is called on. `Integer::parseInt` is a static reference standing in for `s -> Integer.parseInt(s)`. When a lambda is *only* a call to an existing method, the method reference reads cleaner — you see the verb (`println`, `toUpperCase`, `parseInt`) without the plumbing. When a lambda does anything *more* than a single call, keep it a lambda; forcing a method reference there hurts readability.

⚠️ **Lambdas can only use local variables that are *effectively final*.** A lambda may read local variables from the enclosing scope, but only if they're never reassigned after being set (declared `final`, or just left alone — that's "effectively final"). Try to mutate one and the compiler refuses.

```java
int count = 0;
Runnable r = () -> System.out.println(count);   // OK: count is read-only here
// count = 5;                                    // would break it: count no longer effectively final
r.run();
```
```console
0
```
*What just happened:* the lambda *captured* `count` — it carries the value along so it can run later, possibly on another thread, long after this method returns. That only works if the value can't change out from under it, so Java requires captured locals to be effectively final. Uncomment `count = 5;` and the line `() -> ... count` stops compiling, because `count` is no longer fixed. (The standard workaround when you genuinely need to accumulate is to mutate a field or an object the lambda holds, not the local itself — but for most lambdas, read-only capture is exactly what you want.)

## Recap

1. **Lambdas solve the "passing behavior" problem.** Before Java 8 you handed behavior to a method via a verbose anonymous inner class (a `Comparator`, a `Runnable`); a lambda is the same thing with the ceremony removed.
2. A **lambda** is a compact anonymous function — `(a, b) -> a + b` — that you store, pass, and call. A single-expression body returns automatically; a `{ }` block must `return` explicitly.
3. **A lambda is an instance of a functional interface** — an interface with exactly one abstract method (a SAM). That's *why* every lambda needs a target type: the context decides which interface it implements. `@FunctionalInterface` enforces the one-method rule.
4. **The built-in functional interfaces are the shared vocabulary:** `Function<T,R>` transforms, `Predicate<T>` tests, `Consumer<T>` consumes with no result, `Supplier<T>` produces from nothing, `BiFunction` takes two inputs. The Streams API speaks exactly these.
5. **Method references** (`String::toUpperCase`, `System.out::println`, `Account::new`) are shorthand for a lambda that does nothing but call an existing method — four kinds, cleaner when the lambda is a single call.
6. ⚠️ Lambdas can only **capture effectively-final** local variables, because the captured value must stay fixed for when the lambda runs later.

You can now treat behavior as a value — the prerequisite for everything that follows. Next we put these pieces to work in the **Streams API**, where `Function`, `Predicate`, and `Consumer` chain together into pipelines that filter, transform, and collect whole collections in a few readable lines.

## Quick check

Test yourself on the one insight that powers this whole phase — that a lambda *is* a functional interface:

```quiz
[
  {
    "q": "What is a lambda like `(a, b) -> a + b`, in Java's type system?",
    "choices": [
      "An instance of a functional interface — an interface with exactly one abstract method (a SAM)",
      "A brand-new primitive type built into the language",
      "A special object that has no type at all",
      "A renamed anonymous class that always implements Runnable"
    ],
    "answer": 0,
    "explain": "A lambda is an instance of a functional interface: the compiler uses the target type from context to decide which single-abstract-method interface the lambda implements, and the lambda's body becomes that one method. That's why a lambda always needs a target type."
  },
  {
    "q": "You need to pass behavior that takes a String and returns a boolean (a yes/no test). Which built-in functional interface fits?",
    "choices": [
      "Predicate<String> — it takes a T and returns a boolean, via its test method",
      "Function<String, String> — it transforms one String into another",
      "Consumer<String> — it takes a String and returns nothing",
      "Supplier<String> — it takes nothing and returns a String"
    ],
    "answer": 0,
    "explain": "Predicate<T> is the yes/no test: it takes a T and returns a boolean through test. Function transforms (returns a value of any type), Consumer returns nothing, and Supplier takes no input — none of those match 'String in, boolean out.'"
  },
  {
    "q": "Why must a local variable be 'effectively final' to be used inside a lambda?",
    "choices": [
      "The lambda captures the value to use later (possibly on another thread), so the value must stay fixed and not be reassigned",
      "Lambdas run faster when every variable is marked final",
      "Java forbids lambdas from reading any local variables at all",
      "It prevents the lambda from ever being garbage collected"
    ],
    "answer": 0,
    "explain": "A lambda may run long after the enclosing method returns, so it captures (carries along) the values it uses. For that to be safe, a captured local can't change out from under it — hence 'effectively final.' Reassigning the variable breaks compilation."
  }
]
```

---

[← Phase 10: Generics, Deep](10-generics-deep.md) · [Guide overview](_guide.md) · [Phase 12: The Streams API →](12-streams-api.md)
